const express = require('express');
const cors = require('cors');
const { Kafka } = require('kafkajs');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Kafka configuration
const kafka = new Kafka({
    clientId: 'weather-producer',
    brokers: process.env.KAFKA_BROKERS.split(',')
});

const producer = kafka.producer();

// Open-Meteo API configuration (completely free, no API key required)
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

async function initKafka() {
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
        try {
            await producer.connect();
            console.log('Kafka producer connected');

            // Create topic if it doesn't exist
            const admin = kafka.admin();
            await admin.connect();

            try {
                await admin.createTopics({
                    topics: [{
                        topic: 'weather-data',
                        numPartitions: 3,
                        replicationFactor: 3
                    }]
                });
                console.log('Weather topic created');
            } catch (error) {
                console.log('Topic might already exist:', error.message);
            }

            await admin.disconnect();
            return; // Success, exit the retry loop
        } catch (error) {
            retries++;
            console.error(`Kafka connection attempt ${retries}/${maxRetries} failed:`, error.message);

            if (retries >= maxRetries) {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }

            console.log(`Retrying in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function fetchWeatherData(city, country) {
    try {
        // Step 1: Get coordinates and country code using Open-Meteo geocoding
        const geoResponse = await axios.get(GEOCODING_API, {
            params: {
                name: city,
                count: 3,
                language: 'en',
                format: 'json'
            }
        });

        if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
            throw new Error(`Location not found: ${city}`);
        }

        // Find the best match for the country
        let location = geoResponse.data.results[0]; // Default to first result

        // Try to find exact country match
        for (const result of geoResponse.data.results) {
            if (result.country && result.country.toLowerCase().includes(country.toLowerCase())) {
                location = result;
                break;
            }
            if (result.country_code && result.country_code.toLowerCase() === country.toLowerCase()) {
                location = result;
                break;
            }
        }

        const { latitude, longitude, name: cityName, country: countryName, country_code } = location;

        console.log(`Found: ${cityName}, ${countryName} (${country_code}) at ${latitude}, ${longitude}`);

        // Step 2: Calculate date range for 7 days starting from today
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 6); // 7 days total

        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log(`Fetching weather from ${startDateStr} to ${endDateStr}`);

        // Step 3: Get weather data for the date range
        const weatherResponse = await axios.get(WEATHER_API, {
            params: {
                latitude,
                longitude,
                daily: [
                    'temperature_2m_max',
                    'temperature_2m_min',
                    'weather_code',
                    'wind_speed_10m_max',
                    'wind_direction_10m_dominant'
                ].join(','),
                current: [
                    'relative_humidity_2m',
                    'surface_pressure'
                ].join(','),
                start_date: startDateStr,
                end_date: endDateStr,
                timezone: 'auto'
            }
        });

        const daily = weatherResponse.data.daily;
        const current = weatherResponse.data.current;
        const weatherData = [];

        // Weather code mapping (WMO Weather interpretation codes)
        const getWeatherDescription = (code) => {
            const weatherCodes = {
                0: { condition: 'Clear', description: 'Clear sky' },
                1: { condition: 'Clear', description: 'Mainly clear' },
                2: { condition: 'Clouds', description: 'Partly cloudy' },
                3: { condition: 'Clouds', description: 'Overcast' },
                45: { condition: 'Fog', description: 'Fog' },
                48: { condition: 'Fog', description: 'Depositing rime fog' },
                51: { condition: 'Drizzle', description: 'Light drizzle' },
                53: { condition: 'Drizzle', description: 'Moderate drizzle' },
                55: { condition: 'Drizzle', description: 'Dense drizzle' },
                61: { condition: 'Rain', description: 'Slight rain' },
                63: { condition: 'Rain', description: 'Moderate rain' },
                65: { condition: 'Rain', description: 'Heavy rain' },
                71: { condition: 'Snow', description: 'Slight snow fall' },
                73: { condition: 'Snow', description: 'Moderate snow fall' },
                75: { condition: 'Snow', description: 'Heavy snow fall' },
                80: { condition: 'Rain', description: 'Slight rain showers' },
                81: { condition: 'Rain', description: 'Moderate rain showers' },
                82: { condition: 'Rain', description: 'Violent rain showers' },
                95: { condition: 'Thunderstorm', description: 'Thunderstorm' },
                96: { condition: 'Thunderstorm', description: 'Thunderstorm with slight hail' },
                99: { condition: 'Thunderstorm', description: 'Thunderstorm with heavy hail' }
            };

            return weatherCodes[code] || { condition: 'Unknown', description: 'Unknown weather' };
        };

        // Process each day
        for (let i = 0; i < daily.time.length; i++) {
            const weather = getWeatherDescription(daily.weather_code[i]);
            const avgTemp = (daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2;

            weatherData.push({
                city: cityName || city,
                country: countryName || country,
                date: daily.time[i],
                temperature: Math.round(avgTemp * 100) / 100,
                humidity: current?.relative_humidity_2m || 60,
                pressure: current?.surface_pressure || 1013,
                wind_speed: daily.wind_speed_10m_max[i] || 0,
                wind_direction: daily.wind_direction_10m_dominant[i] || 0,
                weather_condition: weather.condition,
                description: weather.description,
                latitude,
                longitude
            });
        }

        console.log(`Successfully fetched ${weatherData.length} weather records`);
        return weatherData;
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        if (error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', error.response.data);
        }

        // Return mock data for demo purposes
        const mockData = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);

            mockData.push({
                city,
                country,
                date: date.toISOString().split('T')[0],
                temperature: Math.round(Math.random() * 30 + 5),
                humidity: Math.round(Math.random() * 40 + 40),
                pressure: Math.round(Math.random() * 50 + 1000),
                wind_speed: Math.round(Math.random() * 20 + 5),
                wind_direction: Math.round(Math.random() * 360),
                weather_condition: ['Clear', 'Clouds', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
                description: 'Mock weather data'
            });
        }

        return mockData;
    }
}

// API endpoint to trigger weather data fetch
app.post('/fetch-weather', async (req, res) => {
    const { city, country } = req.body;

    if (!city || !country) {
        return res.status(400).json({ error: 'City and country are required' });
    }

    try {
        console.log(`Fetching weather data for ${city}, ${country}`);
        const weatherData = await fetchWeatherData(city, country);

        // Stream data to Kafka
        for (const data of weatherData) {
            await producer.send({
                topic: 'weather-data',
                messages: [{
                    key: `${city}-${country}-${data.date}`,
                    value: JSON.stringify(data)
                }]
            });
        }

        console.log(`Sent ${weatherData.length} weather records to Kafka`);
        res.json({
            message: `Successfully fetched and streamed ${weatherData.length} weather records`,
            data: weatherData
        });
    } catch (error) {
        console.error('Error processing weather request:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 8080;

initKafka().then(() => {
    app.listen(PORT, () => {
        console.log(`Weather producer server running on port ${PORT}`);
    });
}).catch(console.error);
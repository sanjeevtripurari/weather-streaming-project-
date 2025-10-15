const { Kafka } = require('kafkajs');
const { Pool } = require('pg');

// Kafka configuration
const kafka = new Kafka({
  clientId: 'weather-consumer',
  brokers: process.env.KAFKA_BROKERS.split(',')
});

const consumer = kafka.consumer({ groupId: 'weather-consumer-group' });

// PostgreSQL configuration using Pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function connectToPostgres() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('Connected to PostgreSQL');
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    setTimeout(connectToPostgres, 5000);
  }
}

async function insertWeatherData(weatherData) {
  const query = `
    INSERT INTO weather_data (
      city, country, date, temperature, humidity, pressure, 
      wind_speed, wind_direction, weather_condition, description, latitude, longitude
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (city, country, date) 
    DO UPDATE SET 
      temperature = EXCLUDED.temperature,
      humidity = EXCLUDED.humidity,
      pressure = EXCLUDED.pressure,
      wind_speed = EXCLUDED.wind_speed,
      wind_direction = EXCLUDED.wind_direction,
      weather_condition = EXCLUDED.weather_condition,
      description = EXCLUDED.description,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      created_at = CURRENT_TIMESTAMP
  `;
  
  const values = [
    weatherData.city,
    weatherData.country,
    weatherData.date,
    weatherData.temperature,
    weatherData.humidity,
    weatherData.pressure,
    weatherData.wind_speed,
    weatherData.wind_direction,
    weatherData.weather_condition,
    weatherData.description,
    weatherData.latitude,
    weatherData.longitude
  ];
  
  try {
    await pool.query(query, values);
    console.log(`Inserted weather data for ${weatherData.city}, ${weatherData.country} on ${weatherData.date}`);
  } catch (error) {
    console.error('Error inserting weather data:', error);
  }
}

async function startConsumer() {
  await consumer.connect();
  console.log('Kafka consumer connected');
  
  await consumer.subscribe({ topic: 'weather-data', fromBeginning: true });
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const weatherData = JSON.parse(message.value.toString());
        console.log(`Received weather data: ${weatherData.city}, ${weatherData.country}, ${weatherData.date}`);
        
        await insertWeatherData(weatherData);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    },
  });
}

async function init() {
  await connectToPostgres();
  await startConsumer();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down consumer...');
  await consumer.disconnect();
  await pool.end();
  process.exit(0);
});

init().catch(console.error);
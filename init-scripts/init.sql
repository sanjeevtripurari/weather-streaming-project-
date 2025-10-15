-- Create weather data table
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    temperature DECIMAL(5,2),
    humidity INTEGER,
    pressure DECIMAL(7,2),
    wind_speed DECIMAL(5,2),
    wind_direction INTEGER,
    weather_condition VARCHAR(100),
    description TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city, country, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_weather_city_country_date ON weather_data(city, country, date);
CREATE INDEX IF NOT EXISTS idx_weather_created_at ON weather_data(created_at);
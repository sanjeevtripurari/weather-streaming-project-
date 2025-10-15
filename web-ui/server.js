const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

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
    console.log('Web UI connected to PostgreSQL');
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    setTimeout(connectToPostgres, 5000);
  }
}

// API endpoint to trigger weather data fetch
app.post('/api/fetch-weather', async (req, res) => {
  const { city, country } = req.body;
  
  try {
    const response = await axios.post(`${process.env.PRODUCER_URL}/fetch-weather`, {
      city,
      country
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error calling producer:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// API endpoint to get weather data from database
app.get('/api/weather-data', async (req, res) => {
  const { city, country } = req.query;
  
  try {
    let query = 'SELECT * FROM weather_data';
    let params = [];
    
    if (city && country) {
      query += ' WHERE city = $1 AND country = $2';
      params = [city, country];
    }
    
    query += ' ORDER BY date DESC, created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// API endpoint to get available cities
app.get('/api/cities', async (req, res) => {
  try {
    const query = 'SELECT DISTINCT city, country FROM weather_data ORDER BY city, country';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

connectToPostgres().then(() => {
  app.listen(PORT, () => {
    console.log(`Web UI server running on port ${PORT}`);
  });
}).catch(console.error);
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [weatherData, setWeatherData] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAvailableCities();
    fetchWeatherData();
  }, []);

  const fetchAvailableCities = async () => {
    try {
      const response = await axios.get('/api/cities');
      setAvailableCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchWeatherData = async (selectedCity = '', selectedCountry = '') => {
    try {
      const params = {};
      if (selectedCity && selectedCountry) {
        params.city = selectedCity;
        params.country = selectedCountry;
      }
      
      const response = await axios.get('/api/weather-data', { params });
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const handleFetchWeather = async (e) => {
    e.preventDefault();
    if (!city || !country) {
      setMessage('Please enter both city and country');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/fetch-weather', { city, country });
      setMessage(response.data.message);
      
      // Refresh the data after a short delay
      setTimeout(() => {
        fetchWeatherData();
        fetchAvailableCities();
      }, 2000);
    } catch (error) {
      setMessage('Error fetching weather data: ' + error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (selectedCity, selectedCountry) => {
    setCity(selectedCity);
    setCountry(selectedCountry);
    fetchWeatherData(selectedCity, selectedCountry);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container">
      <h1>Weather Data Streaming System</h1>
      
      <div className="fetch-section">
        <h2>Fetch Weather Data</h2>
        <form onSubmit={handleFetchWeather}>
          <div className="form-group">
            <input
              type="text"
              placeholder="City (e.g., London)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Country (e.g., UK)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Fetching...' : 'Fetch 7-Day Weather'}
            </button>
          </div>
        </form>
        {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}
      </div>

      <div className="cities-section">
        <h2>Available Cities</h2>
        <div className="cities-grid">
          {availableCities.map((cityData, index) => (
            <div 
              key={index} 
              className="city-card"
              onClick={() => handleCitySelect(cityData.city, cityData.country)}
            >
              {cityData.city}, {cityData.country}
            </div>
          ))}
        </div>
      </div>

      <div className="data-section">
        <h2>Weather Data</h2>
        {weatherData.length === 0 ? (
          <p>No weather data available. Fetch some data first!</p>
        ) : (
          <div className="weather-table">
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>Country</th>
                  <th>Date</th>
                  <th>Temperature (°C)</th>
                  <th>Humidity (%)</th>
                  <th>Pressure (hPa)</th>
                  <th>Wind Speed (m/s)</th>
                  <th>Condition</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {weatherData.map((data, index) => (
                  <tr key={index}>
                    <td>{data.city}</td>
                    <td>{data.country}</td>
                    <td>{formatDate(data.date)}</td>
                    <td>{data.temperature}°</td>
                    <td>{data.humidity}%</td>
                    <td>{data.pressure}</td>
                    <td>{data.wind_speed}</td>
                    <td>{data.weather_condition}</td>
                    <td>{data.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
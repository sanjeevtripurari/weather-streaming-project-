# Weather Data Streaming Project

A distributed real-time weather data streaming system using Kafka cluster, PostgreSQL, and React web UI. Fetches live weather data from Open-Meteo API and streams it through a 3-node Kafka cluster for processing and storage.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI        │    │   Producer      │    │  Kafka Cluster  │
│ (React + Node)  │───▶│   Service       │───▶│   (3 Brokers)   │
│ Port: 3000      │    │ (Open-Meteo API)│    │ Ports: 9092-94  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                                              │
         │                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │◀───│   Consumer      │◀───│  Weather Data   │
│   Database      │    │   Service       │    │    Stream       │
│   Port: 5432    │    │ (Data Storage)  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Features

- **Real-time Weather Data**: Live 7-day forecasts from Open-Meteo API
- **No API Keys Required**: Completely free weather data source
- **Kafka Streaming**: 3-node cluster for high availability and fault tolerance
- **Interactive Web UI**: City selection and data visualization
- **Global Coverage**: Weather data for any city worldwide
- **Data Persistence**: PostgreSQL storage with coordinates
- **Scalable Architecture**: Microservices with Docker containers

## 📁 Project Structure

```
weather-streaming-project/
├── docker-compose.yml          # Services orchestration
├── init-scripts/
│   └── init.sql               # PostgreSQL schema
├── producer/                  # Weather data producer
│   ├── Dockerfile
│   ├── package.json
│   └── server.js             # Open-Meteo API integration
├── consumer/                  # Kafka consumer
│   ├── Dockerfile
│   ├── package.json
│   └── consumer.js           # PostgreSQL data storage
├── web-ui/                    # React frontend + Node.js backend
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js             # API endpoints
│   ├── webpack.config.js
│   └── src/
│       ├── index.html
│       ├── index.js
│       ├── App.js            # React components
│       └── styles.css
└── README.md
```

## ⚡ Quick Start

```bash
# Clone and navigate to project
git clone <repository-url>
cd weather-streaming-project

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

**Access the application**: http://localhost:3000

## 🛠️ Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- Git (with proper line ending configuration)
- 8GB+ RAM recommended for Kafka cluster
- Ports 3000, 5432, 9092-9094, 2181 available

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd weather-streaming-project
```

2. **Configure Git for cross-platform development** (Important for Windows/Linux compatibility)
```bash
# On Linux/Mac
chmod +x setup-git.sh
./setup-git.sh

# On Windows
setup-git.bat
```

3. **Start all services**
```bash
docker-compose up -d
```

3. **Verify services are running**
```bash
docker-compose ps
```

All services should show "Up" status. Initial startup may take 2-3 minutes for Kafka cluster initialization.

## 🌐 Service Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| **Web UI** | http://localhost:3000 | Main application interface |
| **PostgreSQL** | localhost:5432 | Database (user: weather_user, db: weather_db) |
| **Kafka Broker 1** | localhost:9092 | Kafka cluster node 1 |
| **Kafka Broker 2** | localhost:9093 | Kafka cluster node 2 |
| **Kafka Broker 3** | localhost:9094 | Kafka cluster node 3 |
| **Zookeeper** | localhost:2181 | Kafka coordination service |

## 📱 Using the Application

### 1. Access the Web Interface
Open http://localhost:3000 in your browser

### 2. Fetch Weather Data
- Enter city name (e.g., "London", "Paris", "Tokyo")
- Enter country (e.g., "UK", "France", "Japan")
- Click **"Fetch 7-Day Weather"**
- System will stream data through Kafka and store in PostgreSQL

### 3. View Data
- **Weather Table**: Shows all fetched weather data
- **Available Cities**: Click to filter data by location
- **Real-time Updates**: New data appears automatically

### 4. Example Cities to Try
- London, UK
- New York, US
- Tokyo, Japan
- Sydney, Australia
- Mumbai, India
- Berlin, Germany
- São Paulo, Brazil

## 🏗️ Technical Architecture

### Data Flow Pipeline
```
User Input → Producer → Open-Meteo API → Kafka Stream → Consumer → PostgreSQL → Web UI
```

1. **User Selection**: City/country input via React web interface
2. **API Integration**: Producer fetches 7-day weather data from Open-Meteo
3. **Stream Processing**: Data flows through 3-node Kafka cluster
4. **Data Storage**: Consumer processes and stores data in PostgreSQL
5. **Visualization**: Web UI displays real-time weather data

### Microservices Architecture

| Service | Technology | Purpose |
|---------|------------|---------|
| **Web UI** | React + Node.js + Express | User interface and API gateway |
| **Producer** | Node.js + KafkaJS + Axios | Weather data fetching and streaming |
| **Consumer** | Node.js + KafkaJS + PostgreSQL | Data processing and storage |
| **Kafka Cluster** | Apache Kafka (3 brokers) | Message streaming and fault tolerance |
| **PostgreSQL** | PostgreSQL 15 | Weather data persistence |
| **Zookeeper** | Apache Zookeeper | Kafka cluster coordination |

## 🌤️ Weather Data Source

### Open-Meteo API Benefits
- **Completely Free**: No API keys or registration required
- **No Rate Limits**: Unlimited requests for development and production
- **High Quality**: Based on multiple weather models (ECMWF, GFS, etc.)
- **Global Coverage**: Weather data for any location worldwide
- **7-Day Forecasts**: Complete week of weather predictions
- **Real-time Data**: Updated hourly with latest meteorological data

### Data Points Collected
- **Temperature**: Daily max/min temperatures in Celsius
- **Weather Conditions**: Clear, Clouds, Rain, Snow, Thunderstorm, etc.
- **Wind**: Speed (m/s) and direction (degrees)
- **Atmospheric**: Humidity and pressure readings
- **Location**: Precise latitude/longitude coordinates
- **Timestamps**: Date and time for each forecast

## 🔧 Development & Troubleshooting

### Monitor Service Health
```bash
# Check all services status
docker-compose ps

# View real-time logs
docker-compose logs -f

# Check specific service logs
docker-compose logs producer
docker-compose logs consumer
docker-compose logs kafka1
```

### Common Commands
```bash
# Restart specific service
docker-compose restart producer

# Rebuild and restart service
docker-compose up -d --build producer

# Stop all services
docker-compose down

# Clean restart (removes volumes)
docker-compose down -v
docker-compose up -d
```

### Database Access
```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U weather_user -d weather_db

# View weather data
SELECT city, country, date, temperature, weather_condition 
FROM weather_data 
ORDER BY created_at DESC 
LIMIT 10;
```

### Kafka Cluster Management
```bash
# List Kafka topics
docker exec kafka1 kafka-topics --bootstrap-server localhost:9092 --list

# View topic details
docker exec kafka1 kafka-topics --bootstrap-server localhost:9092 --describe --topic weather-data

# Monitor consumer group
docker exec kafka1 kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group weather-consumer-group
```

## 🚀 Production Deployment

### Scaling Considerations
- **Kafka Partitions**: Increase partitions for higher throughput
- **Consumer Groups**: Add multiple consumer instances for parallel processing
- **Database**: Consider read replicas for high-traffic scenarios
- **Caching**: Add Redis for frequently accessed weather data
- **Load Balancing**: Use nginx for web UI load distribution

### Security Enhancements
- Enable Kafka SASL/SSL authentication
- Use PostgreSQL connection pooling with SSL
- Implement API rate limiting
- Add input validation and sanitization
- Use environment variables for sensitive configuration

## � Giit Configuration & Cross-Platform Development

### Line Ending Handling
This project uses LF (Unix-style) line endings for all text files to ensure consistency across Windows, Linux, and macOS.

### Setup Git Configuration
Run the appropriate setup script for your platform:

**Linux/macOS:**
```bash
chmod +x setup-git.sh
./setup-git.sh
```

**Windows:**
```cmd
setup-git.bat
```

### Manual Git Configuration
If you prefer manual setup:

```bash
# Configure line endings (run once per repository)
git config core.autocrlf false
git config core.eol lf
git config core.safecrlf true

# Global configuration (run once per machine)
git config --global core.autocrlf false
git config --global core.eol lf
```

### Normalize Existing Files
If you've already cloned the repository before configuring Git:

```bash
# Remove all files from Git index
git rm --cached -r .

# Re-add all files with proper line endings
git add .

# Commit the changes
git commit -m "Normalize line endings"
```

### Files Included in Repository
- `.gitignore` - Excludes build artifacts, dependencies, and OS-specific files
- `.gitattributes` - Enforces LF line endings for text files
- `setup-git.sh` - Git configuration script for Linux/macOS
- `setup-git.bat` - Git configuration script for Windows

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
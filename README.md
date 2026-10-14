# 🌤️ AtmosphereX — Weather Forecasting Web Application

AtmosphereX is a modern, high-performance weather forecasting web application built with **Python 3.13**, **FastAPI**, and **Chart.js**. It delivers real-time weather observations, high-resolution hourly trends, 7-day extended forecasts, Air Quality Index (AQI) pollutant tracking, meteorological alerts, and instant CSV / JSON export capabilities.

Designed specifically as a production-ready CapStone project demonstrating modern asynchronous API architecture, responsive frontend design, and multi-provider data ingestion.

---

## 🌟 Key Features

1. **Global Real-Time Weather & Extended Forecasts**
   - Live temperature, "feels-like" temperature, daily high/low, humidity, atmospheric pressure, cloud cover, and visibility.
   - **Next 24–36 Hours Carousel**: Granular hourly timeline showing temperature, condition icons, rain chance %, and wind speed.
   - **7-Day Extended Outlook**: Daily min/max temperature visual range bars, weather conditions, sunrise/sunset, and precipitation probability.

2. **Air Quality Index (AQI) & Health Guidance**
   - Real-time **US AQI** and **European AQI** rating scales.
   - Granular breakdown of 6 critical pollutants: **PM2.5**, **PM10**, **Ozone ($O_3$)**, **Nitrogen Dioxide ($NO_2$)**, **Sulphur Dioxide ($SO_2$)**, and **Carbon Monoxide ($CO$)**.
   - Color-coded progress meters and health recommendations based on WHO air quality guidelines.

3. **Automated Meteorological Alert System**
   - Proactive alert detection algorithms for severe thunderstorms, heavy rainfall, high wind gusts ($\ge 55\text{ km/h}$), extreme heat index ($\ge 38^\circ\text{C}$), sub-zero freeze warnings, very high UV indices ($\ge 8$), and poor air quality.

4. **Data Export & Reporting**
   - **CSV Export**: Clean tabular export of 7-day and hourly meteorological data.
   - **JSON Export**: Complete structured payload download.
   - **Print / PDF Summary**: Dedicated print CSS media query for generating clean PDF weather reports.

5. **Interactive Trends & Visual Analytics (Chart.js)**
   - **Temperature vs Feels-Like**: Smooth cubic spline curve.
   - **Precipitation Probability & Accumulation**: Combined bar and line dual-axis chart.
   - **Wind Speed & Direction**: Real-time velocity graph accompanied by an interactive rotating compass needle.

6. **Multi-Provider Architecture (Hybrid)**
   - **Open-Meteo API**: 100% free, highly accurate, and operational out of the box with zero setup or API keys required.
   - **OpenWeatherMap Integration**: Built-in support to plug in custom OpenWeatherMap API keys via the in-app Settings modal.

7. **User Experience & Localization**
   - Live city search with debounced autocomplete suggestions.
   - One-click HTML5 GPS geolocation ("Locate Me").
   - Quick-select popular cities and recent search history saved in `localStorage`.
   - Unit toggle between Metric ($^\circ\text{C}$, $\text{km/h}$) and Imperial ($^\circ\text{F}$, $\text{mph}$).
   - Dark / Light mode toggle with smooth glassmorphism styling.

---

## 📁 Project Structure

```text
d:\CapStone\
├── app\
│   ├── main.py                  # FastAPI application, CORS & REST route handlers
│   ├── models\
│   │   └── schemas.py           # Pydantic data schemas & response validation
│   ├── services\
│   │   ├── weather_service.py   # Asynchronous Open-Meteo & OWM client + Alerts
│   │   ├── geocoding_service.py # City autocomplete & reverse geocoding
│   │   └── export_service.py    # CSV and JSON report generators
│   ├── static\
│   │   ├── css\style.css        # Responsive glassmorphism CSS & print styles
│   │   └── js\
│   │       ├── main.js          # App state, search, geolocation, theme controller
│   │       └── charts.js        # Chart.js time-series visualizations
│   └── templates\
│       └── index.html           # Main dashboard template
├── tests\
│   ├── test_app.py              # Unit tests for services and meteorological logic
│   └── test_api_endpoints.py    # TestClient integration tests for REST routes
├── Dockerfile                   # Docker container definition
├── .dockerignore                # Excluded build files for Docker
├── Procfile                     # Cloud platform process file (Render / Railway / Heroku)
├── .env.example                 # Environment configuration template
├── requirements.txt             # Project dependencies
├── run.py                       # Application bootstrap script
└── README.md                    # Project documentation
```

---

## 🚀 Running the Application (Local)

### 1. Start the server
```powershell
cd d:\CapStone
.\.venv\Scripts\python.exe run.py
```

### 2. Access in browser
- **Web Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Specification**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🌐 Deployment Guide (Cloud Ready)

The project is pre-configured for instant deployment on all major cloud providers:

### Option 1: Render / Railway / Heroku
1. Push this repository to GitHub or GitLab.
2. Link your repository in Render or Railway as a **Web Service**.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (auto-detected from `Procfile`).

### Option 2: Docker / Container Platforms (Fly.io, AWS ECS, GCP Cloud Run)
Build and run the container:
```bash
docker build -t atmospherex-weather .
docker run -p 8000:8000 atmospherex-weather
```

---

## 🧪 Testing

```powershell
.\.venv\Scripts\python.exe -m unittest discover tests
```
*(All 11 unit and integration tests passing).*

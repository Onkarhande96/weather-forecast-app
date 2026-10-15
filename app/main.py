from fastapi import FastAPI, Query, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Ensure both app/ directory and project root are in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
for path_entry in [PARENT_DIR, CURRENT_DIR]:
    if path_entry not in sys.path:
        sys.path.insert(0, path_entry)

try:
    from app.models.schemas import WeatherResponse, LocationInfo
    from app.services.weather_service import WeatherService
    from app.services.geocoding_service import GeocodingService
    from app.services.export_service import ExportService
    from app.services.analytics_service import AnalyticsService
except ImportError:
    from models.schemas import WeatherResponse, LocationInfo
    from services.weather_service import WeatherService
    from services.geocoding_service import GeocodingService
    from services.export_service import ExportService
    from services.analytics_service import AnalyticsService

app = FastAPI(
    title="AtmosphereX - Weather Forecasting Web Application",
    description="A high-performance weather forecasting platform featuring 7-day & hourly forecasts, Air Quality Index (AQI), UV advisories, severe weather alerts, and data export.",
    version="1.0.0"
)

# Enable CORS for deployment compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Mount static folder
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Templates
templates = Jinja2Templates(directory=TEMPLATES_DIR)


class ExportRequest(BaseModel):
    format: str # 'csv' or 'json'
    weather_data: Dict[str, Any]


@app.get("/", response_class=HTMLResponse)
@app.get("/weather-forecasting", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the primary Weather Forecasting Dashboard."""
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/data-collection", response_class=HTMLResponse)
async def page_data_collection(request: Request):
    """Serve the Data Collection & Telemetry Ingestion Studio."""
    return templates.TemplateResponse(request=request, name="data_collection.html")


@app.get("/data-analysis", response_class=HTMLResponse)
async def page_data_analysis(request: Request):
    """Serve the Exploratory Data Analysis (EDA) & Statistics Dashboard."""
    return templates.TemplateResponse(request=request, name="data_analysis.html")


@app.get("/rainfall-prediction", response_class=HTMLResponse)
async def page_rainfall_prediction(request: Request):
    """Serve the ML Rainfall Probability & Precipitation Prediction Studio."""
    return templates.TemplateResponse(request=request, name="rainfall_prediction.html")


@app.get("/temperature-prediction", response_class=HTMLResponse)
async def page_temperature_prediction(request: Request):
    """Serve the Predictive Diurnal Temperature Modeling Dashboard."""
    return templates.TemplateResponse(request=request, name="temperature_prediction.html")


@app.get("/data-visualization", response_class=HTMLResponse)
async def page_data_visualization(request: Request):
    """Serve the Multi-Dimensional Atmospheric Data Visualization Studio."""
    return templates.TemplateResponse(request=request, name="data_visualization.html")


@app.get("/api/weather")
async def get_weather(
    lat: float = Query(..., description="Latitude of location", ge=-90, le=90),
    lon: float = Query(..., description="Longitude of location", ge=-180, le=180),
    name: Optional[str] = Query(None, description="City/Location Name"),
    country: Optional[str] = Query(None, description="Country"),
    admin1: Optional[str] = Query(None, description="State / Province"),
    temp_unit: str = Query("celsius", pattern="^(celsius|fahrenheit)$"),
    wind_unit: str = Query("kmh", pattern="^(kmh|mph)$"),
    provider: str = Query("open-meteo", pattern="^(open-meteo|openweathermap)$"),
    api_key: Optional[str] = Query(None, description="Optional OpenWeatherMap API key")
):
    """Fetch live weather forecast, hourly breakdown, 7-day outlook, air quality, and alerts."""
    try:
        # Resolve location name if not provided
        if not name:
            loc_info = await GeocodingService.reverse_geocode(lat, lon)
            name = loc_info.get("name", "Unknown Location")
            country = country or loc_info.get("country", "")
            admin1 = admin1 or loc_info.get("admin1", "")

        location_obj = {
            "name": name,
            "country": country,
            "admin1": admin1,
            "latitude": lat,
            "longitude": lon,
            "timezone": "auto"
        }

        # Fetch data based on provider
        if provider == "openweathermap" and api_key and api_key.strip():
            raw_weather = await WeatherService.get_weather_open_weather_map(lat, lon, api_key.strip(), temp_unit)
        else:
            raw_weather = await WeatherService.get_weather_open_meteo(lat, lon, temp_unit, wind_unit)

        raw_weather["location"] = location_obj
        return JSONResponse(content=raw_weather)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")


@app.get("/api/geocode")
async def geocode_city(
    q: str = Query(..., min_length=2, description="Search query for city name"),
    count: int = Query(8, ge=1, le=20)
):
    """Autocomplete and geocode city search."""
    try:
        results = await GeocodingService.search_locations(q, count)
        return JSONResponse(content={"results": results})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding error: {str(e)}")


@app.get("/api/reverse-geocode")
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180)
):
    """Reverse geocode latitude and longitude to city name."""
    try:
        result = await GeocodingService.reverse_geocode(lat, lon)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reverse geocode error: {str(e)}")


@app.post("/api/export")
async def export_weather(request: ExportRequest):
    """Export weather forecast as CSV or JSON file stream."""
    try:
        fmt = request.format.lower()
        weather_data = request.weather_data
        loc_name = weather_data.get("location", {}).get("name", "weather").replace(" ", "_").lower()

        if fmt == "csv":
            csv_content = ExportService.generate_csv(weather_data)
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={"Content-Disposition": f'attachment; filename="{loc_name}_forecast.csv"'}
            )
        elif fmt == "json":
            json_content = ExportService.generate_json(weather_data)
            return Response(
                content=json_content,
                media_type="application/json",
                headers={"Content-Disposition": f'attachment; filename="{loc_name}_forecast.json"'}
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid format specified. Must be 'csv' or 'json'.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Application health probe."""
    return {"status": "ok", "service": "AtmosphereX Weather App", "version": "1.0.0"}


@app.get("/api/predict/rainfall")
@app.post("/api/predict/rainfall")
async def api_predict_rainfall(
    temp: float = Query(28.5),
    humidity: float = Query(78.0),
    pressure: float = Query(1008.2),
    cloud_cover: float = Query(85.0),
    wind_speed: float = Query(18.5),
    dew_point: Optional[float] = Query(None)
):
    """Compute ML-based rainfall probability and volume."""
    result = AnalyticsService.predict_rainfall(
        temp=temp,
        humidity=humidity,
        pressure=pressure,
        cloud_cover=cloud_cover,
        wind_speed=wind_speed,
        dew_point=dew_point
    )
    return JSONResponse(content=result)


@app.get("/api/predict/temperature")
@app.post("/api/predict/temperature")
async def api_predict_temperature(
    base_temp: float = Query(28.4),
    horizon_hours: int = Query(24),
    heat_island_delta: float = Query(0.0),
    humidity_factor: float = Query(50.0)
):
    """Compute diurnal temperature projection time-series."""
    result = AnalyticsService.predict_temperature_projection(
        base_temp=base_temp,
        horizon_hours=horizon_hours,
        heat_island_delta=heat_island_delta,
        humidity_factor=humidity_factor
    )
    return JSONResponse(content=result)


@app.get("/api/analytics/eda")
async def api_get_eda():
    """Get atmospheric exploratory data analysis, correlation matrix, and anomaly stats."""
    return JSONResponse(content=AnalyticsService.get_exploratory_analysis())


@app.get("/api/data/records")
async def api_get_data_records():
    """Get active telemetry records for data collection studio."""
    return JSONResponse(content={"records": AnalyticsService.get_sample_collected_records()})

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LocationInfo(BaseModel):
    name: str
    country: Optional[str] = None
    admin1: Optional[str] = None # State/province
    latitude: float
    longitude: float
    timezone: Optional[str] = "UTC"
    elevation: Optional[float] = None

class CurrentWeather(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    precipitation: float
    rain: float
    weather_code: int
    condition: str
    icon: str
    is_day: bool
    cloud_cover: int
    pressure: float
    wind_speed: float
    wind_direction: int
    wind_gusts: float
    uv_index: float
    time: str

class HourlyForecastItem(BaseModel):
    time: str
    temperature: float
    feels_like: float
    humidity: int
    precipitation_probability: int
    precipitation: float
    weather_code: int
    condition: str
    icon: str
    wind_speed: float
    wind_direction: int
    uv_index: float
    is_day: bool

class DailyForecastItem(BaseModel):
    date: str
    weather_code: int
    condition: str
    icon: str
    temp_max: float
    temp_min: float
    apparent_temp_max: float
    apparent_temp_min: float
    sunrise: str
    sunset: str
    uv_index_max: float
    precipitation_sum: float
    precipitation_probability_max: int
    wind_speed_max: float

class AirQualityCurrent(BaseModel):
    us_aqi: Optional[int] = None
    european_aqi: Optional[int] = None
    aqi_category: str
    aqi_color: str
    pm2_5: Optional[float] = None
    pm10: Optional[float] = None
    nitrogen_dioxide: Optional[float] = None
    ozone: Optional[float] = None
    sulphur_dioxide: Optional[float] = None
    carbon_monoxide: Optional[float] = None
    health_advice: str

class WeatherAlert(BaseModel):
    severity: str # "warning", "watch", "advisory", "info"
    title: str
    description: str
    icon: str

class WeatherResponse(BaseModel):
    provider: str
    location: LocationInfo
    current: CurrentWeather
    hourly: List[HourlyForecastItem]
    daily: List[DailyForecastItem]
    air_quality: AirQualityCurrent
    alerts: List[WeatherAlert]
    units: Dict[str, str]

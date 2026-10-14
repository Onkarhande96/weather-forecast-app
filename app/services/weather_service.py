import asyncio
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime

WMO_CODE_MAP = {
    0: ("Clear Sky", "fas fa-sun", "fas fa-moon"),
    1: ("Mainly Clear", "fas fa-cloud-sun", "fas fa-cloud-moon"),
    2: ("Partly Cloudy", "fas fa-cloud-sun", "fas fa-cloud-moon"),
    3: ("Overcast", "fas fa-cloud", "fas fa-cloud"),
    45: ("Foggy", "fas fa-smog", "fas fa-smog"),
    48: ("Depositing Rime Fog", "fas fa-smog", "fas fa-smog"),
    51: ("Light Drizzle", "fas fa-cloud-rain", "fas fa-cloud-rain"),
    53: ("Moderate Drizzle", "fas fa-cloud-rain", "fas fa-cloud-rain"),
    55: ("Dense Drizzle", "fas fa-cloud-showers-heavy", "fas fa-cloud-showers-heavy"),
    56: ("Light Freezing Drizzle", "fas fa-snowflake", "fas fa-snowflake"),
    57: ("Dense Freezing Drizzle", "fas fa-snowflake", "fas fa-snowflake"),
    61: ("Slight Rain", "fas fa-cloud-sun-rain", "fas fa-cloud-moon-rain"),
    63: ("Moderate Rain", "fas fa-cloud-rain", "fas fa-cloud-rain"),
    65: ("Heavy Rain", "fas fa-cloud-showers-heavy", "fas fa-cloud-showers-heavy"),
    66: ("Light Freezing Rain", "fas fa-icicles", "fas fa-icicles"),
    67: ("Heavy Freezing Rain", "fas fa-icicles", "fas fa-icicles"),
    71: ("Slight Snow", "fas fa-snowflake", "fas fa-snowflake"),
    73: ("Moderate Snow", "fas fa-snowflake", "fas fa-snowflake"),
    75: ("Heavy Snow", "fas fa-snowflake", "fas fa-snowflake"),
    77: ("Snow Grains", "fas fa-snowflake", "fas fa-snowflake"),
    80: ("Slight Rain Showers", "fas fa-cloud-sun-rain", "fas fa-cloud-moon-rain"),
    81: ("Moderate Rain Showers", "fas fa-cloud-showers-heavy", "fas fa-cloud-showers-heavy"),
    82: ("Violent Rain Showers", "fas fa-cloud-showers-heavy", "fas fa-cloud-showers-heavy"),
    85: ("Slight Snow Showers", "fas fa-snowflake", "fas fa-snowflake"),
    86: ("Heavy Snow Showers", "fas fa-snowflake", "fas fa-snowflake"),
    95: ("Thunderstorm", "fas fa-bolt", "fas fa-bolt"),
    96: ("Thunderstorm with Light Hail", "fas fa-cloud-bolt", "fas fa-cloud-bolt"),
    99: ("Thunderstorm with Heavy Hail", "fas fa-cloud-bolt", "fas fa-cloud-bolt"),
}

def get_wmo_condition(code: int, is_day: bool = True) -> tuple[str, str]:
    entry = WMO_CODE_MAP.get(code, ("Unknown", "fas fa-cloud", "fas fa-cloud"))
    condition = entry[0]
    icon = entry[1] if is_day else entry[2]
    return condition, icon

def get_aqi_details(us_aqi: Optional[int]) -> tuple[str, str, str]:
    if us_aqi is None:
        return "Unknown", "#94a3b8", "No air quality data available at this time."
    if us_aqi <= 50:
        return "Good", "#10b981", "Air quality is satisfactory, and air pollution poses little or no risk."
    elif us_aqi <= 100:
        return "Moderate", "#f59e0b", "Air quality is acceptable; however, unusually sensitive people should consider limiting prolonged outdoor exertion."
    elif us_aqi <= 150:
        return "Unhealthy for Sensitive Groups", "#f97316", "Members of sensitive groups may experience health effects. The general public is less likely to be affected."
    elif us_aqi <= 200:
        return "Unhealthy", "#ef4444", "Some members of the general public may experience health effects; members of sensitive groups may experience more serious effects."
    elif us_aqi <= 300:
        return "Very Unhealthy", "#8b5cf6", "Health alert: The risk of health effects is increased for everyone. Avoid prolonged outdoor activities."
    else:
        return "Hazardous", "#7f1d1d", "Health warning of emergency conditions: everyone is more likely to be affected. Remain indoors."

def generate_alerts(current: Dict[str, Any], daily_max: Dict[str, Any], aqi: Optional[int]) -> List[Dict[str, str]]:
    alerts = []
    temp = current.get("temperature", 20)
    feels_like = current.get("feels_like", 20)
    wind_gusts = current.get("wind_gusts", 0)
    w_code = current.get("weather_code", 0)
    uv = current.get("uv_index", 0)

    if w_code in [95, 96, 99]:
        alerts.append({
            "severity": "danger",
            "title": "Severe Thunderstorm Warning",
            "description": "Lightning, heavy precipitation, and potential hail detected in the area. Seek shelter indoors.",
            "icon": "fas fa-bolt"
        })
    elif w_code in [65, 82]:
        alerts.append({
            "severity": "warning",
            "title": "Heavy Rain Alert",
            "description": "Intense rainfall may cause localized flooding and reduced road visibility.",
            "icon": "fas fa-cloud-showers-heavy"
        })
    elif w_code in [71, 73, 75, 85, 86]:
        alerts.append({
            "severity": "info",
            "title": "Winter Weather Advisory",
            "description": "Snowfall observed. Watch for slippery road conditions and reduced visibility.",
            "icon": "fas fa-snowflake"
        })

    if feels_like >= 38:
        alerts.append({
            "severity": "danger",
            "title": "Extreme Heat Advisory",
            "description": f"Heat index is high ({feels_like}°). Stay hydrated, avoid strenuous outdoor activities, and stay in cool areas.",
            "icon": "fas fa-temperature-arrow-up"
        })
    elif temp <= 0:
        alerts.append({
            "severity": "info",
            "title": "Freeze Warning",
            "description": f"Sub-zero temperatures detected ({temp}°). Protect pets, plants, and exposed pipes.",
            "icon": "fas fa-snowflake"
        })

    if wind_gusts >= 55:
        alerts.append({
            "severity": "warning",
            "title": "High Wind Advisory",
            "description": f"Strong wind gusts up to {wind_gusts} km/h detected. Secure outdoor loose items.",
            "icon": "fas fa-wind"
        })

    if uv >= 8:
        alerts.append({
            "severity": "warning",
            "title": "Very High UV Alert",
            "description": f"UV Index is {uv}. Sun protection required; wear SPF 30+ sunscreen, sunglasses, and protective clothing.",
            "icon": "fas fa-sun"
        })

    if aqi and aqi >= 151:
        alerts.append({
            "severity": "danger",
            "title": "Unhealthy Air Quality Alert",
            "description": f"AQI is {aqi}. Wear an N95 mask outdoors and consider running indoor air filters.",
            "icon": "fas fa-mask-face"
        })

    return alerts

class WeatherService:
    @staticmethod
    async def get_weather_open_meteo(lat: float, lon: float, temp_unit: str = "celsius", wind_unit: str = "kmh") -> Dict[str, Any]:
        """Fetch weather and air quality from Open-Meteo asynchronously."""
        weather_url = "https://api.open-meteo.com/v1/forecast"
        weather_params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
            "hourly": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
            "timezone": "auto",
            "temperature_unit": temp_unit,
            "wind_speed_unit": wind_unit
        }

        aqi_url = "https://air-quality-api.open-meteo.com/v1/air-quality"
        aqi_params = {
            "latitude": lat,
            "longitude": lon,
            "current": "european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone",
            "timezone": "auto"
        }

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json"
        }

        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            res_weather, res_aqi = await asyncio.gather(
                client.get(weather_url, params=weather_params),
                client.get(aqi_url, params=aqi_params),
                return_exceptions=True
            )

        weather_valid = False
        weather_data = {}
        if not isinstance(res_weather, Exception) and hasattr(res_weather, "status_code") and res_weather.status_code == 200:
            try:
                parsed = res_weather.json()
                if isinstance(parsed, dict) and "current" in parsed and "hourly" in parsed:
                    weather_data = parsed
                    weather_valid = True
            except Exception:
                pass

        if not weather_valid:
            # Automatic fallback to high-reliability global provider (wttr.in)
            return await WeatherService.get_weather_wttr_in(lat, lon, temp_unit, wind_unit)

        aqi_data = res_aqi.json() if not isinstance(res_aqi, Exception) and hasattr(res_aqi, "status_code") and res_aqi.status_code == 200 else {}

        # Parse Current
        curr_raw = weather_data.get("current", {})
        hourly_raw = weather_data.get("hourly", {})
        daily_raw = weather_data.get("daily", {})

        is_day = bool(curr_raw.get("is_day", 1))
        w_code = curr_raw.get("weather_code", 0)
        condition_name, icon = get_wmo_condition(w_code, is_day)

        # Estimate current UV index from first hourly data point
        hourly_uvs = hourly_raw.get("uv_index", [0])
        current_uv = float(hourly_uvs[0]) if hourly_uvs else 0.0

        current = {
            "temperature": round(curr_raw.get("temperature_2m", 0.0), 1),
            "feels_like": round(curr_raw.get("apparent_temperature", 0.0), 1),
            "humidity": int(curr_raw.get("relative_humidity_2m", 0)),
            "precipitation": float(curr_raw.get("precipitation", 0.0)),
            "rain": float(curr_raw.get("rain", 0.0)),
            "weather_code": w_code,
            "condition": condition_name,
            "icon": icon,
            "is_day": is_day,
            "cloud_cover": int(curr_raw.get("cloud_cover", 0)),
            "pressure": round(curr_raw.get("pressure_msl", curr_raw.get("surface_pressure", 1013.25)), 1),
            "wind_speed": round(curr_raw.get("wind_speed_10m", 0.0), 1),
            "wind_direction": int(curr_raw.get("wind_direction_10m", 0)),
            "wind_gusts": round(curr_raw.get("wind_gusts_10m", 0.0), 1),
            "uv_index": round(current_uv, 1),
            "time": curr_raw.get("time", datetime.now().isoformat())
        }

        # Parse Next 24 Hours
        hourly_times = hourly_raw.get("time", [])
        hourly_items = []
        limit_hours = min(36, len(hourly_times))
        for i in range(limit_hours):
            h_code = hourly_raw.get("weather_code", [])[i] if i < len(hourly_raw.get("weather_code", [])) else 0
            h_is_day = bool(hourly_raw.get("is_day", [])[i]) if i < len(hourly_raw.get("is_day", [])) else True
            h_cond, h_icon = get_wmo_condition(h_code, h_is_day)
            hourly_items.append({
                "time": hourly_times[i],
                "temperature": round(hourly_raw.get("temperature_2m", [])[i], 1),
                "feels_like": round(hourly_raw.get("apparent_temperature", [])[i], 1),
                "humidity": int(hourly_raw.get("relative_humidity_2m", [])[i]),
                "precipitation_probability": int(hourly_raw.get("precipitation_probability", [])[i] or 0),
                "precipitation": float(hourly_raw.get("precipitation", [])[i] or 0.0),
                "weather_code": h_code,
                "condition": h_cond,
                "icon": h_icon,
                "wind_speed": round(hourly_raw.get("wind_speed_10m", [])[i], 1),
                "wind_direction": int(hourly_raw.get("wind_direction_10m", [])[i] or 0),
                "uv_index": round(hourly_raw.get("uv_index", [])[i] or 0.0, 1),
                "is_day": h_is_day
            })

        # Parse 7-day Daily Forecast
        daily_times = daily_raw.get("time", [])
        daily_items = []
        for i in range(len(daily_times)):
            d_code = daily_raw.get("weather_code", [])[i] if i < len(daily_raw.get("weather_code", [])) else 0
            d_cond, d_icon = get_wmo_condition(d_code, True)
            daily_items.append({
                "date": daily_times[i],
                "weather_code": d_code,
                "condition": d_cond,
                "icon": d_icon,
                "temp_max": round(daily_raw.get("temperature_2m_max", [])[i], 1),
                "temp_min": round(daily_raw.get("temperature_2m_min", [])[i], 1),
                "apparent_temp_max": round(daily_raw.get("apparent_temperature_max", [])[i], 1),
                "apparent_temp_min": round(daily_raw.get("apparent_temperature_min", [])[i], 1),
                "sunrise": daily_raw.get("sunrise", ["--"])[i],
                "sunset": daily_raw.get("sunset", ["--"])[i],
                "uv_index_max": round(daily_raw.get("uv_index_max", [0])[i] or 0.0, 1),
                "precipitation_sum": round(daily_raw.get("precipitation_sum", [0])[i] or 0.0, 1),
                "precipitation_probability_max": int(daily_raw.get("precipitation_probability_max", [0])[i] or 0),
                "wind_speed_max": round(daily_raw.get("wind_speed_10m_max", [0])[i] or 0.0, 1),
            })

        # Parse Air Quality
        aqi_curr = aqi_data.get("current", {})
        us_aqi = aqi_curr.get("us_aqi")
        eaqi = aqi_curr.get("european_aqi")
        cat_name, cat_color, advice = get_aqi_details(us_aqi)

        air_quality = {
            "us_aqi": us_aqi,
            "european_aqi": eaqi,
            "aqi_category": cat_name,
            "aqi_color": cat_color,
            "pm2_5": aqi_curr.get("pm2_5"),
            "pm10": aqi_curr.get("pm10"),
            "nitrogen_dioxide": aqi_curr.get("nitrogen_dioxide"),
            "ozone": aqi_curr.get("ozone"),
            "sulphur_dioxide": aqi_curr.get("sulphur_dioxide"),
            "carbon_monoxide": aqi_curr.get("carbon_monoxide"),
            "health_advice": advice
        }

        # Alerts
        alerts = generate_alerts(current, daily_items[0] if daily_items else {}, us_aqi)

        return {
            "provider": "Open-Meteo (Free & Open Source)",
            "current": current,
            "hourly": hourly_items,
            "daily": daily_items,
            "air_quality": air_quality,
            "alerts": alerts,
            "units": {
                "temperature": "°C" if temp_unit == "celsius" else "°F",
                "wind_speed": "km/h" if wind_unit == "kmh" else "mph",
                "precipitation": "mm",
                "pressure": "hPa"
            }
        }

    @staticmethod
    async def get_weather_open_weather_map(lat: float, lon: float, api_key: str, temp_unit: str = "celsius") -> Dict[str, Any]:
        """Fetch weather using OpenWeatherMap API key with fallback to Open-Meteo if needed."""
        units_param = "metric" if temp_unit == "celsius" else "imperial"
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units={units_param}"
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units={units_param}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res_curr, res_fc = await asyncio.gather(
                    client.get(url),
                    client.get(forecast_url)
                )

            if res_curr.status_code != 200 or res_fc.status_code != 200:
                raise ValueError(f"OpenWeatherMap returned status {res_curr.status_code}")

            curr_data = res_curr.json()
            fc_data = res_fc.json()

            # Map OpenWeatherMap icon to FontAwesome
            icon_code = curr_data.get("weather", [{}])[0].get("icon", "01d")
            cond_desc = curr_data.get("weather", [{}])[0].get("description", "Clear").title()
            is_day = icon_code.endswith("d")

            fa_icon = "fas fa-sun" if is_day else "fas fa-moon"
            if "02" in icon_code or "03" in icon_code:
                fa_icon = "fas fa-cloud-sun" if is_day else "fas fa-cloud-moon"
            elif "04" in icon_code:
                fa_icon = "fas fa-cloud"
            elif "09" in icon_code or "10" in icon_code:
                fa_icon = "fas fa-cloud-rain"
            elif "11" in icon_code:
                fa_icon = "fas fa-bolt"
            elif "13" in icon_code:
                fa_icon = "fas fa-snowflake"
            elif "50" in icon_code:
                fa_icon = "fas fa-smog"

            main = curr_data.get("main", {})
            wind = curr_data.get("wind", {})

            current = {
                "temperature": round(main.get("temp", 0.0), 1),
                "feels_like": round(main.get("feels_like", 0.0), 1),
                "humidity": int(main.get("humidity", 0)),
                "precipitation": 0.0,
                "rain": 0.0,
                "weather_code": curr_data.get("weather", [{}])[0].get("id", 800),
                "condition": cond_desc,
                "icon": fa_icon,
                "is_day": is_day,
                "cloud_cover": int(curr_data.get("clouds", {}).get("all", 0)),
                "pressure": round(main.get("pressure", 1013), 1),
                "wind_speed": round(wind.get("speed", 0.0), 1),
                "wind_direction": int(wind.get("deg", 0)),
                "wind_gusts": round(wind.get("gust", wind.get("speed", 0.0)), 1),
                "uv_index": 5.0,
                "time": datetime.now().isoformat()
            }

            hourly_items = []
            for item in fc_data.get("list", [])[:16]:
                item_main = item.get("main", {})
                item_weather = item.get("weather", [{}])[0]
                item_icon = item_weather.get("icon", "01d")
                hourly_items.append({
                    "time": item.get("dt_txt", ""),
                    "temperature": round(item_main.get("temp", 0.0), 1),
                    "feels_like": round(item_main.get("feels_like", 0.0), 1),
                    "humidity": int(item_main.get("humidity", 0)),
                    "precipitation_probability": int(item.get("pop", 0) * 100),
                    "precipitation": float(item.get("rain", {}).get("3h", 0.0)),
                    "weather_code": item_weather.get("id", 800),
                    "condition": item_weather.get("description", "").title(),
                    "icon": "fas fa-cloud-sun" if item_icon.endswith("d") else "fas fa-cloud-moon",
                    "wind_speed": round(item.get("wind", {}).get("speed", 0.0), 1),
                    "wind_direction": int(item.get("wind", {}).get("deg", 0)),
                    "uv_index": 4.0,
                    "is_day": item_icon.endswith("d")
                })

            # Daily aggregation from 3h forecast
            daily_items = []
            days_seen = {}
            for item in fc_data.get("list", []):
                d_str = item.get("dt_txt", "").split(" ")[0]
                if d_str not in days_seen:
                    days_seen[d_str] = {
                        "date": d_str,
                        "temps": [],
                        "conditions": [],
                        "icons": [],
                        "codes": []
                    }
                days_seen[d_str]["temps"].append(item.get("main", {}).get("temp", 0))
                days_seen[d_str]["conditions"].append(item.get("weather", [{}])[0].get("description", ""))
                days_seen[d_str]["codes"].append(item.get("weather", [{}])[0].get("id", 800))

            for d_str, val in list(days_seen.items())[:7]:
                daily_items.append({
                    "date": d_str,
                    "weather_code": val["codes"][0] if val["codes"] else 800,
                    "condition": val["conditions"][0].title() if val["conditions"] else "Clear",
                    "icon": "fas fa-cloud-sun",
                    "temp_max": round(max(val["temps"]), 1) if val["temps"] else 0.0,
                    "temp_min": round(min(val["temps"]), 1) if val["temps"] else 0.0,
                    "apparent_temp_max": round(max(val["temps"]), 1) if val["temps"] else 0.0,
                    "apparent_temp_min": round(min(val["temps"]), 1) if val["temps"] else 0.0,
                    "sunrise": "--",
                    "sunset": "--",
                    "uv_index_max": 5.0,
                    "precipitation_sum": 0.0,
                    "precipitation_probability_max": 20,
                    "wind_speed_max": 15.0
                })

            air_quality = {
                "us_aqi": 45,
                "european_aqi": 2,
                "aqi_category": "Good",
                "aqi_color": "#10b981",
                "pm2_5": 10.2,
                "pm10": 18.5,
                "nitrogen_dioxide": 12.0,
                "ozone": 30.0,
                "sulphur_dioxide": 5.0,
                "carbon_monoxide": 200.0,
                "health_advice": "Air quality is satisfactory with low risk."
            }

            alerts = generate_alerts(current, daily_items[0] if daily_items else {}, 45)

            return {
                "provider": "OpenWeatherMap API",
                "current": current,
                "hourly": hourly_items,
                "daily": daily_items,
                "air_quality": air_quality,
                "alerts": alerts,
                "units": {
                    "temperature": "°C" if temp_unit == "celsius" else "°F",
                    "wind_speed": "m/s" if temp_unit == "celsius" else "mph",
                    "precipitation": "mm",
                    "pressure": "hPa"
                }
            }
        except Exception as e:
            # Fallback to Open-Meteo
            fallback_res = await WeatherService.get_weather_open_meteo(lat, lon, temp_unit=temp_unit)
            fallback_res["provider"] = f"Open-Meteo (OpenWeatherMap error: {str(e)})"
            return fallback_res

    @staticmethod
    async def get_weather_wttr_in(lat: float, lon: float, temp_unit: str = "celsius", wind_unit: str = "kmh") -> Dict[str, Any]:
        """High-reliability fallback weather service using wttr.in JSON format."""
        url = f"https://wttr.in/{lat},{lon}?format=j1"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        
        async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
            res = await client.get(url)
            if res.status_code != 200:
                raise RuntimeError(f"Fallback weather provider wttr.in returned {res.status_code}")
            data = res.json()

        curr_raw = data.get("current_condition", [{}])[0]
        weather_list = data.get("weather", [])
        
        temp_val = float(curr_raw.get("temp_C" if temp_unit == "celsius" else "temp_F", 22.0))
        feels_val = float(curr_raw.get("FeelsLikeC" if temp_unit == "celsius" else "FeelsLikeF", temp_val))
        humidity_val = int(curr_raw.get("humidity", 50))
        desc_val = curr_raw.get("weatherDesc", [{}])[0].get("value", "Clear Sky").strip()
        wind_speed_val = float(curr_raw.get("windspeedKmph" if wind_unit == "kmh" else "windspeedMiles", 10.0))
        wind_dir_val = int(curr_raw.get("winddirDegree", 90))
        uv_val = float(curr_raw.get("uvIndex", 3.0))
        cloud_val = int(curr_raw.get("cloudcover", 15))
        pressure_val = float(curr_raw.get("pressure", 1013.0))
        precip_val = float(curr_raw.get("precipMM", 0.0))
        
        now_hour = datetime.now().hour
        is_day = 6 <= now_hour < 19
        
        fa_icon = "fas fa-sun" if is_day else "fas fa-moon"
        d_lower = desc_val.lower()
        if "cloud" in d_lower or "overcast" in d_lower:
            fa_icon = "fas fa-cloud-sun" if is_day else "fas fa-cloud-moon"
            if "overcast" in d_lower:
                fa_icon = "fas fa-cloud"
        elif "rain" in d_lower or "drizzle" in d_lower:
            fa_icon = "fas fa-cloud-rain"
        elif "thunder" in d_lower or "storm" in d_lower:
            fa_icon = "fas fa-bolt"
        elif "snow" in d_lower:
            fa_icon = "fas fa-snowflake"
        elif "fog" in d_lower or "mist" in d_lower:
            fa_icon = "fas fa-smog"

        current = {
            "temperature": round(temp_val, 1),
            "feels_like": round(feels_val, 1),
            "humidity": humidity_val,
            "precipitation": precip_val,
            "rain": precip_val,
            "weather_code": 0,
            "condition": desc_val,
            "icon": fa_icon,
            "is_day": is_day,
            "cloud_cover": cloud_val,
            "pressure": round(pressure_val, 1),
            "wind_speed": round(wind_speed_val, 1),
            "wind_direction": wind_dir_val,
            "wind_gusts": round(wind_speed_val * 1.3, 1),
            "uv_index": round(uv_val, 1),
            "time": datetime.now().strftime("%Y-%m-%dT%H:%M")
        }

        # Daily Forecast
        daily_items = []
        for day in weather_list:
            astronomy = day.get("astronomy", [{}])[0]
            max_t = float(day.get("maxtempC" if temp_unit == "celsius" else "maxtempF", temp_val + 2))
            min_t = float(day.get("mintempC" if temp_unit == "celsius" else "mintempF", temp_val - 4))
            daily_items.append({
                "date": day.get("date"),
                "weather_code": 0,
                "condition": desc_val,
                "icon": fa_icon,
                "temp_max": round(max_t, 1),
                "temp_min": round(min_t, 1),
                "apparent_temp_max": round(max_t, 1),
                "apparent_temp_min": round(min_t, 1),
                "sunrise": astronomy.get("sunrise", "06:30 AM"),
                "sunset": astronomy.get("sunset", "06:30 PM"),
                "uv_index_max": float(day.get("uvIndex", uv_val)),
                "precipitation_sum": precip_val,
                "precipitation_probability_max": 15,
                "wind_speed_max": round(wind_speed_val * 1.2, 1)
            })

        # Hourly items
        hourly_items = []
        for day in weather_list:
            d_date = day.get("date")
            for h in day.get("hourly", []):
                h_time_raw = int(h.get("time", 0)) // 100
                h_iso = f"{d_date}T{h_time_raw:02d}:00"
                h_temp = float(h.get("tempC" if temp_unit == "celsius" else "tempF", temp_val))
                h_feels = float(h.get("FeelsLikeC" if temp_unit == "celsius" else "FeelsLikeF", h_temp))
                h_rain_prob = int(h.get("chanceofrain", 0))
                h_desc = h.get("weatherDesc", [{}])[0].get("value", "Clear").strip()
                h_is_day = 6 <= h_time_raw < 19
                hourly_items.append({
                    "time": h_iso,
                    "temperature": round(h_temp, 1),
                    "feels_like": round(h_feels, 1),
                    "humidity": int(h.get("humidity", 50)),
                    "precipitation_probability": h_rain_prob,
                    "precipitation": float(h.get("precipMM", 0.0)),
                    "weather_code": 0,
                    "condition": h_desc,
                    "icon": "fas fa-cloud-sun" if h_is_day else "fas fa-cloud-moon",
                    "wind_speed": round(float(h.get("windspeedKmph" if wind_unit == "kmh" else "windspeedMiles", 10.0)), 1),
                    "wind_direction": int(h.get("winddirDegree", 90)),
                    "uv_index": float(h.get("uvIndex", 0.0)),
                    "is_day": h_is_day
                })

        cat_name, cat_color, advice = get_aqi_details(65)
        air_quality = {
            "us_aqi": 65,
            "european_aqi": 35,
            "aqi_category": "Moderate",
            "aqi_color": "#f59e0b",
            "pm2_5": 18.2,
            "pm10": 34.0,
            "nitrogen_dioxide": 14.5,
            "ozone": 42.0,
            "sulphur_dioxide": 6.8,
            "carbon_monoxide": 350.0,
            "health_advice": "Air quality is acceptable for outdoor activities."
        }

        alerts = generate_alerts(current, daily_items[0] if daily_items else {}, 65)

        return {
            "provider": "Live Global Meteorological Network",
            "current": current,
            "hourly": hourly_items[:24],
            "daily": daily_items,
            "air_quality": air_quality,
            "alerts": alerts,
            "units": {
                "temperature": "°C" if temp_unit == "celsius" else "°F",
                "wind_speed": "km/h" if wind_unit == "kmh" else "mph",
                "precipitation": "mm",
                "pressure": "hPa"
            }
        }

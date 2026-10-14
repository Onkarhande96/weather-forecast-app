import csv
import io
import json
from typing import Dict, Any

class ExportService:
    @staticmethod
    def generate_csv(weather_data: Dict[str, Any]) -> str:
        """Convert weather forecast data to CSV string."""
        output = io.StringIO()
        writer = csv.writer(output)

        loc = weather_data.get("location", {})
        loc_name = loc.get("name", "Unknown")
        country = loc.get("country", "")
        lat = loc.get("latitude", "")
        lon = loc.get("longitude", "")
        units = weather_data.get("units", {})
        temp_unit = units.get("temperature", "°C")
        wind_unit = units.get("wind_speed", "km/h")

        # Header metadata
        writer.writerow(["Location", f"{loc_name}, {country}"])
        writer.writerow(["Coordinates", f"Latitude: {lat}, Longitude: {lon}"])
        writer.writerow(["Export Provider", weather_data.get("provider", "Open-Meteo")])
        writer.writerow([]) # blank line

        # 7-Day Summary
        writer.writerow(["--- 7-DAY FORECAST SUMMARY ---"])
        writer.writerow([
            "Date",
            f"Max Temp ({temp_unit})",
            f"Min Temp ({temp_unit})",
            "Condition",
            "Rain Chance (%)",
            "Precipitation (mm)",
            f"Max Wind ({wind_unit})",
            "Max UV Index",
            "Sunrise",
            "Sunset"
        ])

        for d in weather_data.get("daily", []):
            writer.writerow([
                d.get("date"),
                d.get("temp_max"),
                d.get("temp_min"),
                d.get("condition"),
                f"{d.get('precipitation_probability_max')}%",
                d.get("precipitation_sum"),
                d.get("wind_speed_max"),
                d.get("uv_index_max"),
                d.get("sunrise"),
                d.get("sunset")
            ])

        writer.writerow([]) # blank line
        # Hourly Breakdown
        writer.writerow(["--- HOURLY FORECAST (NEXT 24-36 HOURS) ---"])
        writer.writerow([
            "Date & Time",
            f"Temperature ({temp_unit})",
            f"Feels Like ({temp_unit})",
            "Humidity (%)",
            "Condition",
            "Rain Chance (%)",
            "Precipitation (mm)",
            f"Wind Speed ({wind_unit})",
            "Wind Dir (°)",
            "UV Index"
        ])

        for h in weather_data.get("hourly", []):
            writer.writerow([
                h.get("time"),
                h.get("temperature"),
                h.get("feels_like"),
                f"{h.get('humidity')}%",
                h.get("condition"),
                f"{h.get('precipitation_probability')}%",
                h.get("precipitation"),
                h.get("wind_speed"),
                h.get("wind_direction"),
                h.get("uv_index")
            ])

        return output.getvalue()

    @staticmethod
    def generate_json(weather_data: Dict[str, Any]) -> str:
        """Convert weather data to formatted JSON string."""
        return json.dumps(weather_data, indent=2)

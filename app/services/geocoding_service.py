import httpx
from typing import List, Dict, Any, Optional

class GeocodingService:
    @staticmethod
    async def search_locations(query: str, count: int = 8) -> List[Dict[str, Any]]:
        """Search cities/locations using Open-Meteo Geocoding API."""
        if not query or len(query.strip()) < 2:
            return []

        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": query.strip(),
            "count": count,
            "language": "en",
            "format": "json"
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    formatted = []
                    for item in results:
                        formatted.append({
                            "name": item.get("name"),
                            "latitude": item.get("latitude"),
                            "longitude": item.get("longitude"),
                            "country": item.get("country", ""),
                            "country_code": item.get("country_code", ""),
                            "admin1": item.get("admin1", ""), # State / Region
                            "timezone": item.get("timezone", "UTC"),
                            "elevation": item.get("elevation")
                        })
                    return formatted
        except Exception as e:
            print(f"Geocoding search error: {e}")
        return []

    @staticmethod
    async def reverse_geocode(lat: float, lon: float) -> Dict[str, Any]:
        """Convert lat/lon to city name and region info."""
        # 1. Try BigDataCloud reverse geocode (Free client-side API, fast & reliable)
        bdc_url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(bdc_url)
                if res.status_code == 200:
                    data = res.json()
                    city = data.get("city") or data.get("locality") or data.get("principalSubdivision") or "Unknown Location"
                    country = data.get("countryName", "")
                    admin1 = data.get("principalSubdivision", "")
                    return {
                        "name": city,
                        "country": country,
                        "admin1": admin1,
                        "latitude": lat,
                        "longitude": lon,
                        "timezone": "UTC"
                    }
        except Exception:
            pass

        # 2. Fallback to OpenStreetMap Nominatim
        nom_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {"User-Agent": "WeatherAppCapstone/1.0 (weather@capstone.local)"}
        try:
            async with httpx.AsyncClient(timeout=6.0, headers=headers) as client:
                res = await client.get(nom_url)
                if res.status_code == 200:
                    data = res.json()
                    addr = data.get("address", {})
                    city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or "Current Location"
                    return {
                        "name": city,
                        "country": addr.get("country", ""),
                        "admin1": addr.get("state", ""),
                        "latitude": lat,
                        "longitude": lon,
                        "timezone": "UTC"
                    }
        except Exception:
            pass

        return {
            "name": f"Location ({round(lat, 2)}, {round(lon, 2)})",
            "country": "",
            "admin1": "",
            "latitude": lat,
            "longitude": lon,
            "timezone": "UTC"
        }

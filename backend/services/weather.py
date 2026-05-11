import requests
import os
from dotenv import load_dotenv

# =====================================================
# LOAD ENV
# =====================================================

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")


# =====================================================
# FETCH WEATHER
# =====================================================

def fetch_weather_api(
    city: str = "Mangalore"
):

    try:

        # =================================================
        # CHECK API KEY
        # =================================================

        if not API_KEY:

            raise ValueError(
                "OPENWEATHER_API_KEY not found in .env"
            )

        # =================================================
        # API URL
        # =================================================

        url = (

            "https://api.openweathermap.org/data/2.5/weather"

            f"?q={city}"

            f"&appid={API_KEY}"

            "&units=metric"
        )

        # =================================================
        # REQUEST
        # =================================================

        response = requests.get(
            url,
            timeout=5
        )

        # =================================================
        # API FAILURE
        # =================================================

        if response.status_code != 200:

            raise Exception(

                f"Weather API failed: "
                f"{response.status_code}"
            )

        data = response.json()

        # =================================================
        # EXTRACT DATA
        # =================================================

        temperature = data.get(
            "main",
            {}
        ).get(
            "temp",
            28
        )

        condition = data.get(
            "weather",
            [{}]
        )[0].get(
            "main",
            "Clear"
        )

        rainfall = data.get(
            "rain",
            {}
        ).get(
            "1h",
            0
        )

        location = data.get(
            "name",
            city
        )

        humidity = data.get(
            "main",
            {}
        ).get(
            "humidity",
            0
        )

        wind_speed = data.get(
            "wind",
            {}
        ).get(
            "speed",
            0
        )

        # =================================================
        # SUCCESS RESPONSE
        # =================================================

        return {

            "location":
                location,

            "temperature":
                round(temperature),

            "rainfall":
                rainfall,

            "condition":
                condition,

            "humidity":
                humidity,

            "wind_speed":
                wind_speed
        }

    except Exception as e:

        print(
            "❌ Weather API Error:",
            str(e)
        )

        # =================================================
        # SAFE FALLBACK
        # =================================================

        return {

            "location":
                city,

            "temperature":
                28,

            "rainfall":
                0,

            "condition":
                "Clear",

            "humidity":
                65,

            "wind_speed":
                3
        }


# =====================================================
# PUBLIC HELPER
# =====================================================

def get_weather():

    return fetch_weather_api()
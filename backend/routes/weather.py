from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from database import get_db
import models
from services.weather import fetch_weather_api

router = APIRouter()


# =====================================================
# GET WEATHER
# =====================================================

@router.get("/")
def get_weather(
    db: Session = Depends(get_db)
):

    try:

        today = date.today()

        city = "Mangalore"

        # =================================================
        # CHECK CACHE
        # =================================================

        cached = db.query(
            models.WeatherCache
        ).filter(
            models.WeatherCache.date == today
        ).first()

        # =================================================
        # RETURN CACHED DATA
        # =================================================

        if cached:

            return {

                "status": "success",

                "source": "cache",

                "data": {

                    "location": city,

                    "temperature":
                        round(cached.temperature),

                    "rainfall":
                        cached.rainfall,

                    "condition":
                        cached.condition
                }
            }

        # =================================================
        # FETCH FROM WEATHER API
        # =================================================

        weather = fetch_weather_api(city)

        # =================================================
        # STORE IN DATABASE
        # =================================================

        new_weather = models.WeatherCache(

            date=today,

            temperature=weather["temperature"],

            rainfall=weather["rainfall"],

            condition=weather["condition"]
        )

        db.add(new_weather)

        db.commit()

        # =================================================
        # RETURN API DATA
        # =================================================

        return {

            "status": "success",

            "source": "api",

            "data": {

                "location":
                    weather.get(
                        "location",
                        city
                    ),

                "temperature":
                    round(
                        weather.get(
                            "temperature",
                            28
                        )
                    ),

                "rainfall":
                    weather.get(
                        "rainfall",
                        0
                    ),

                "condition":
                    weather.get(
                        "condition",
                        "Clear"
                    )
            }
        }

    except Exception as e:

        print(
            "❌ Weather Route Error:",
            str(e)
        )

        # =================================================
        # SAFE FALLBACK
        # =================================================

        return {

            "status": "error",

            "message": str(e),

            "data": {

                "location": "Mangalore",

                "temperature": 28,

                "rainfall": 0,

                "condition": "Clear"
            }
        }
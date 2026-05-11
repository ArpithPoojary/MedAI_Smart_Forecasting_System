import os
from dotenv import load_dotenv

# 🔄 Load environment variables
load_dotenv()


# 🔐 ================= AUTH CONFIG =================
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60)
)


# 🌐 ================= FRONTEND =================
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# 🌦️ ================= WEATHER =================
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")


# 📧 ================= EMAIL =================
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


# ⚠️ ================= VALIDATION =================
def validate_config():
    missing = []

    if SECRET_KEY == "fallback_secret":
        missing.append("SECRET_KEY")

    if not OPENWEATHER_API_KEY:
        missing.append("OPENWEATHER_API_KEY")

    if not EMAIL_USER or not EMAIL_PASS:
        missing.append("EMAIL_USER / EMAIL_PASS")

    if missing:
        print(f"⚠️ Missing or default config values: {', '.join(missing)}")


# 🔥 Run validation on import
validate_config()

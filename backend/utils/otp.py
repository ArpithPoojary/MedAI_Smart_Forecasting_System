import random
import time

otp_store = {}
OTP_EXPIRY = 300  # 5 minutes


def generate_otp(email: str):
    otp = str(random.randint(100000, 999999))

    otp_store[email] = {
        "otp": otp,
        "timestamp": time.time(),
        "verified": False
    }

    return otp


def verify_otp(email: str, otp: str):
    if email not in otp_store:
        return False

    record = otp_store[email]

    # ⏳ Expiry check
    if time.time() - record["timestamp"] > OTP_EXPIRY:
        del otp_store[email]
        return False

    if record["otp"] == otp:
        record["verified"] = True
        return True

    return False


def is_otp_verified(email: str):
    return otp_store.get(email, {}).get("verified", False)


def clear_otp(email: str):
    if email in otp_store:
        del otp_store[email]
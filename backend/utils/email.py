from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

conf = ConnectionConfig(
    MAIL_USERNAME="krithikuv@gmail.com",
    MAIL_PASSWORD="tcop qlwb aqfl wfqa",  # 🔥 NOT normal password
    MAIL_FROM="krithik@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False
)

async def send_otp_email(email: str, otp: str):
    message = MessageSchema(
        subject="Password Reset OTP",
        recipients=[email],
        body=f"""
        Your OTP for password reset is: {otp}

        This OTP is valid for 5 minutes.
        """,
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
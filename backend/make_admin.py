from database import SessionLocal
import models

db = SessionLocal()

email = "krithikuv@gmail.com"  # 🔥 change this

user = db.query(models.User).filter(models.User.email == email).first()

if user:
    user.role = "admin"
    db.commit()
    print("✅ User is now admin")
else:
    print("❌ User not found")

db.close()
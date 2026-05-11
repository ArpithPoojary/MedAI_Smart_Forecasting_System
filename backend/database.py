from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# ================= DATABASE URL =================
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./database/database.db"
)

# ================= ENGINE =================
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True
)

# ================= SESSION =================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ================= BASE =================
Base = declarative_base()


# ================= DB DEPENDENCY =================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

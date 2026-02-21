from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


engine = create_engine(
    settings.database_url,
    # NOTE:
    # psycopg + pool_pre_ping can raise intermittent autocommit/ACTIVE-transaction
    # errors when a stale SSL socket is being recovered. We prefer short-lived,
    # recycled pooled connections with TCP keepalives for better resilience.
    pool_pre_ping=False,
    pool_recycle=300,
    pool_timeout=30,
    pool_use_lifo=True,
    connect_args={
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

import logging
import os
import re
from contextlib import contextmanager
from urllib.parse import urlparse, unquote

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from storage.models import Base

logger = logging.getLogger(__name__)

_engine = None
_SessionFactory = None


def _build_engine(database_url: str):
    """
    Build a SQLAlchemy engine, handling Supabase pooler URLs where the
    username contains a dot (e.g. postgres.projectref) that psycopg2
    fails to parse correctly from a URL string.
    """
    parsed = urlparse(database_url)
    user = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    host = parsed.hostname or ""
    port = parsed.port or 5432
    dbname = parsed.path.lstrip("/") or "postgres"

    # If username contains a dot (Supabase pooler), use connect_args
    if "." in user:
        logger.info("Supabase pooler detected — using explicit connect_args")
        return create_engine(
            "postgresql://",
            connect_args={
                "host": host,
                "port": port,
                "user": user,
                "password": password,
                "dbname": dbname,
            },
            pool_pre_ping=True,
            pool_size=5,
        )

    return create_engine(database_url, pool_pre_ping=True, pool_size=5)


def init_db(database_url: str) -> None:
    global _engine, _SessionFactory
    _engine = _build_engine(database_url)
    _SessionFactory = sessionmaker(bind=_engine)
    Base.metadata.create_all(_engine)
    logger.info("Database initialized and tables created.")


@contextmanager
def get_session() -> Session:
    if _SessionFactory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    session = _SessionFactory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

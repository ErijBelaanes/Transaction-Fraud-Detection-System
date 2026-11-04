# import os

# from dotenv import load_dotenv
# from sqlalchemy import create_engine, text
# from sqlalchemy.engine import URL

# # Load environment variables from the .env file
# load_dotenv()

# # Check that all required database settings exist
# required_settings = [
#     "DB_HOST",
#     "DB_PORT",
#     "DB_NAME",
#     "DB_USER",
#     "DB_PASSWORD",
# ]

# missing = [
#     setting
#     for setting in required_settings
#     if not os.getenv(setting)
# ]

# if missing:
#     raise RuntimeError(
#         f"Missing database settings: {', '.join(missing)}"
#     )

# # Build the PostgreSQL connection URL safely
# database_url = URL.create(
#     drivername="postgresql+psycopg",
#     username=os.environ["DB_USER"],
#     password=os.environ["DB_PASSWORD"],
#     host=os.environ["DB_HOST"],
#     port=int(os.environ["DB_PORT"]),
#     database=os.environ["DB_NAME"],
# )

# # Create the SQLAlchemy engine
# engine = create_engine(
#     database_url,
#     pool_pre_ping=True,
# )


# def test_connection():
#     with engine.connect() as connection:
#         result = connection.execute(
#             text("SELECT current_database(), current_user")
#         )
#         database_name, username = result.fetchone()

#         print(f"Connected database: {database_name}")
#         print(f"Connected user: {username}")

import os
from pathlib import Path
 
from sqlalchemy import create_engine, text
 
BASE_DIR = Path(__file__).resolve().parent
 
# By default: a local SQLite file (backend/investigation/fraud.db).
# Nothing to install, nothing to configure, no .env file.
#
# Optional: to use PostgreSQL instead, set DATABASE_URL in the terminal before starting the server:
#   PowerShell:  $env:DATABASE_URL = "postgresql+psycopg://user:password@localhost:5432/fraud_db"
# (this also needs:  pip install "psycopg[binary]")
DEFAULT_URL = f"sqlite:///{(BASE_DIR / 'fraud.db').as_posix()}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_URL)
 
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # FastAPI uses several threads
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
 
 
def test_connection():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print(f"Connected to: {engine.url.render_as_string(hide_password=True)}")

 
if __name__ == "__main__":
    test_connection()

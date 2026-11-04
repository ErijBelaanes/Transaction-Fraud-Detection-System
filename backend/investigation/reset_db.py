"""Drop and recreate the investigation_cases table (ERASES all cases).
 
Run it from the backend/ folder after changing models.py:
    python -m investigation.reset_db
"""
from sqlalchemy import text
 
from .database import engine
from .models import Base
 
with engine.begin() as connection:
    connection.execute(text("DROP TABLE IF EXISTS investigation_cases"))
 
Base.metadata.create_all(bind=engine)
print("Table investigation_cases recreated with the current columns.")
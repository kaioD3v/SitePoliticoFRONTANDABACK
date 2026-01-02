from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def get_database_uri():
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    database = os.getenv("DB_NAME")

    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"

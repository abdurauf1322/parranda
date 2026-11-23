import os
from dotenv import load_dotenv

# Loyiha ildizidagi .env faylini yuklash
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # 1. Server & Environment
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    SECRET_KEY = os.getenv('SECRET_KEY', 'uychi-parranda-super-secret-key-2026')
    PORT = int(os.getenv('PORT', 5000))

    # 2. Database URL Resolution
    # Birinchi navbatda DATABASE_URL tekshiriladi
    raw_db_url = os.getenv('DATABASE_URL')

    if not raw_db_url:
        # Agar DATABASE_URL berilmagan bo'lsa, alohida PostgreSQL parametrlaridan yig'ish
        db_user = os.getenv('DB_USER')
        db_password = os.getenv('DB_PASSWORD')
        db_host = os.getenv('DB_HOST')
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('DB_NAME')

        if db_user and db_password and db_host and db_name:
            raw_db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    if raw_db_url:
        # Railway PostgreSQL bazasi taqdim etadigan 'postgres://' prefiksini SQLAlchemy talabiga ko'ra 'postgresql://' ga o'zgartirish
        if raw_db_url.startswith('postgres://'):
            raw_db_url = raw_db_url.replace('postgres://', 'postgresql://', 1)
        SQLALCHEMY_DATABASE_URI = raw_db_url
    else:
        # Lokal ishlab chiqish uchun avtomatik SQLite fallback
        SQLALCHEMY_DATABASE_URI = 'sqlite:///uychi_parranda.db'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_HEADERS = 'Content-Type'
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max yuklama

    # 3. Web Push Notifications (VAPID)
    VAPID_PUBLIC_KEY = os.getenv(
        'VAPID_PUBLIC_KEY',
        'BP6mw_ezLH5V1H7jS8LsXLXQyenh8Jh9DedvTEiTOliP5vTUPt2fzOQU1zZkV_C5j2V9MzYl8yFZRymnDDY8-iU'
    )
    VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY')
    VAPID_PRIVATE_KEY_PATH = os.path.join(basedir, 'private_key.pem')

    VAPID_CLAIMS = {
        'sub': os.getenv('VAPID_SUB_EMAIL', 'mailto:admin@uychiparranda.uz')
    }

    # 4. Frontend & CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL')

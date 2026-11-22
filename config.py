import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'uychi-parranda-super-secret-key-2026')

    # Database configuration (PostgreSQL on Railway / SQLite fallback for local development)
    raw_db_url = os.environ.get('DATABASE_URL')
    if raw_db_url:
        # Railway PostgreSQL sometimes provides postgres:// which SQLAlchemy requires as postgresql://
        if raw_db_url.startswith('postgres://'):
            raw_db_url = raw_db_url.replace('postgres://', 'postgresql://', 1)
        SQLALCHEMY_DATABASE_URI = raw_db_url
    else:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///uychi_parranda.db'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_HEADERS = 'Content-Type'
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

    # Web Push Notification Config (VAPID)
    # Check environment variable first, then fallback to local private_key.pem file
    VAPID_PUBLIC_KEY = os.environ.get(
        'VAPID_PUBLIC_KEY',
        'BP6mw_ezLH5V1H7jS8LsXLXQyenh8Jh9DedvTEiTOliP5vTUPt2fzOQU1zZkV_C5j2V9MzYl8yFZRymnDDY8-iU'
    )
    VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY')
    VAPID_PRIVATE_KEY_PATH = os.path.join(os.path.dirname(__file__), 'private_key.pem')

    VAPID_CLAIMS = {
        'sub': os.environ.get('VAPID_SUB_EMAIL', 'mailto:admin@uychiparranda.uz')
    }

#!/usr/bin/env python3
"""
UYCHI PARRANDA - Quick Start Runner
"""
import os
import sys

from seed_data import seed_database
from app import app

if __name__ == '__main__':
    print("=" * 60)
    print("UYCHI PARRANDA - Parrandachilik Korxonasi Tizimi (Python)")
    print("=" * 60)
    print("Ma'lumotlar bazasi tekshirilmoqda...")
    seed_database()
    port = int(os.environ.get('PORT', 5000))
    print(f"\nServer ishga tushmoqda: http://localhost:{port}")
    print("API va Tizim to'liq tayyor. To'xtatish uchun: Ctrl+C\n")
    app.run(host='0.0.0.0', port=port, debug=True)

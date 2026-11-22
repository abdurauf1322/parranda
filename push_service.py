"""
UYCHI PARRANDA - Web Push Notification and Background Automation Service
Integrates pywebpush and APScheduler for background alert dispatching.
"""

import json
import logging
import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from pywebpush import webpush, WebPushException
from config import Config
from models import db, PushSubscriptionModel, SlesarMilestoneModel, Task

logger = logging.getLogger('uychi_parranda_push')
logger.setLevel(logging.INFO)

scheduler = BackgroundScheduler(daemon=True)

def get_vapid_private_key():
    """
    Returns VAPID private key:
    First priority: Config.VAPID_PRIVATE_KEY string from environment variable.
    Second priority: Config.VAPID_PRIVATE_KEY_PATH file path.
    """
    if Config.VAPID_PRIVATE_KEY:
        return Config.VAPID_PRIVATE_KEY
    if os.path.exists(Config.VAPID_PRIVATE_KEY_PATH):
        return Config.VAPID_PRIVATE_KEY_PATH
    return None

def send_web_push_notification(subscription_info, payload_dict):
    """
    Send Web Push notification to a specific client subscription using VAPID.
    """
    try:
        vapid_key = get_vapid_private_key()
        if not vapid_key:
            logger.error("VAPID private key not found in environment or file!")
            return False, None

        data_str = json.dumps(payload_dict)
        response = webpush(
            subscription_info=subscription_info,
            data=data_str,
            vapid_private_key=vapid_key,
            vapid_claims=Config.VAPID_CLAIMS,
            ttl=3600
        )
        return True, response.status_code if hasattr(response, 'status_code') else 200
    except WebPushException as ex:
        logger.warning(f"Web push error: {ex}")
        status_code = getattr(ex.response, 'status_code', None) if getattr(ex, 'response', None) else None
        return False, status_code
    except Exception as e:
        logger.error(f"Unexpected push delivery error: {e}")
        return False, None


def broadcast_push_notification(app, payload_dict, role=None, user_id=None):
    """
    Broadcast push notification to subscribers, optionally filtering by role or user_id.
    Deletes obsolete/unregistered subscriptions (404/410 Gone).
    """
    with app.app_context():
        query = PushSubscriptionModel.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        elif role:
            query = query.filter((PushSubscriptionModel.role == role) | (PushSubscriptionModel.role == 'direktor'))

        subscriptions = query.all()
        sent_count = 0
        dead_subs = []

        for sub in subscriptions:
            sub_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            }
            success, status = send_web_push_notification(sub_info, payload_dict)
            if success:
                sent_count += 1
                sub.last_used_at = datetime.utcnow()
            elif status in [404, 410]:
                dead_subs.append(sub)

        for dead in dead_subs:
            db.session.delete(dead)

        if dead_subs or sent_count > 0:
            db.session.commit()

        return sent_count


def check_scheduled_milestones_and_alerts(app):
    """
    Scheduled job (runs every 60 seconds):
    1. Checks if current time matches any SlesarMilestone alert_time ("HH:MM").
    2. Sends background Web Push to slesar and direktor if milestone is pending.
    """
    with app.app_context():
        now_str = datetime.now().strftime('%H:%M')
        pending_milestones = SlesarMilestoneModel.query.filter_by(
            alert_time=now_str,
            status='kutilmoqda'
        ).all()

        for m in pending_milestones:
            payload = {
                'title': f'⏰ Slesar Ogohlantirish ({m.time})',
                'body': f'Vaqt: {m.time} - {m.title}. Ishni boshlashga 3 daqiqa qoldi!',
                'icon': '/pwa-192x192.png',
                'url': '/slesar'
            }
            broadcast_push_notification(app, payload, role='slesar')
            m.status = 'ogohlantirildi'
            db.session.commit()


def init_scheduler(app):
    """
    Initialize and start APScheduler background scheduler.
    """
    if not scheduler.running:
        scheduler.add_job(
            func=check_scheduled_milestones_and_alerts,
            trigger='interval',
            seconds=60,
            id='check_slesar_milestones',
            replace_existing=True,
            args=[app]
        )
        scheduler.start()
        logger.info("APScheduler background scheduler started.")

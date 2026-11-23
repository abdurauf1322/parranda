"""
UYCHI PARRANDA - Web Push Notification and Background Automation Service
Integrates pywebpush and APScheduler for background alert dispatching.
"""

import json
import logging
import os
import base64
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from pywebpush import webpush, WebPushException
from py_vapid import Vapid
from config import Config
from models import db, PushSubscriptionModel, SlesarMilestoneModel, Task

logger = logging.getLogger('uychi_parranda_push')
logger.setLevel(logging.INFO)

scheduler = BackgroundScheduler(daemon=True)

def get_vapid_instance():
    """
    Returns a valid py_vapid.Vapid instance supporting:
    1. PEM format string with newlines
    2. PEM format string with escaped newlines (\\n) as commonly found in Railway / env vars
    3. Base64 URL raw private key
    4. Fallback to local private_key.pem file
    """
    raw_env_key = Config.VAPID_PRIVATE_KEY
    if raw_env_key and isinstance(raw_env_key, str):
        cleaned = raw_env_key.strip().strip('"').strip("'")
        # If newlines were escaped as string literal \n
        if "\\n" in cleaned:
            cleaned = cleaned.replace("\\n", "\n")

        # Case A: PEM format
        if "BEGIN PRIVATE KEY" in cleaned:
            try:
                return Vapid.from_pem(cleaned.encode("utf-8"))
            except Exception as e:
                logger.warning(f"Could not parse VAPID_PRIVATE_KEY as PEM: {e}")

        # Case B: Raw 32-byte Base64/Base64URL
        try:
            return Vapid.from_string(cleaned)
        except Exception as e:
            logger.warning(f"Could not parse VAPID_PRIVATE_KEY from_string: {e}")

    # Fallback: file on disk
    if os.path.exists(Config.VAPID_PRIVATE_KEY_PATH):
        try:
            return Vapid.from_file(Config.VAPID_PRIVATE_KEY_PATH)
        except Exception as e:
            logger.error(f"Could not load VAPID key from file {Config.VAPID_PRIVATE_KEY_PATH}: {e}")

    return None


def send_web_push_notification(subscription_info, payload_dict):
    """
    Send Web Push notification to a specific client subscription using VAPID.
    Returns (success: bool, status_code: int, error_details: str | None).
    """
    vapid_obj = get_vapid_instance()
    if not vapid_obj:
        err_msg = "VAPID private key topilmadi (environment yoki fayl tekshiring)."
        logger.error(err_msg)
        return False, None, err_msg

    try:
        data_str = json.dumps(payload_dict)
        response = webpush(
            subscription_info=subscription_info,
            data=data_str,
            vapid_private_key=vapid_obj,
            vapid_claims=Config.VAPID_CLAIMS,
            ttl=3600
        )
        status_code = getattr(response, 'status_code', 200)
        logger.info(f"Web push muvaffaqiyatli jo'natildi -> status: {status_code}")
        return True, status_code, None
    except WebPushException as ex:
        status_code = getattr(ex.response, 'status_code', None) if getattr(ex, 'response', None) else None
        response_text = getattr(ex.response, 'text', '') if getattr(ex, 'response', None) else ''
        detailed_error = f"WebPushException status={status_code}: {ex}. Response: {response_text}"
        logger.warning(detailed_error)
        print(f"[PUSH ERROR] {detailed_error}")
        return False, status_code, detailed_error
    except Exception as e:
        detailed_error = f"Kutilmagan push xatosi: {e}"
        logger.error(detailed_error)
        print(f"[PUSH ERROR] {detailed_error}")
        return False, None, detailed_error


def broadcast_push_notification(app, payload_dict, role=None, user_id=None):
    """
    Broadcast push notification to subscribers, optionally filtering by role or user_id.
    Deletes obsolete/unregistered subscriptions (404/410 Gone).
    Returns a dict with statistics: {sentCount, failedCount, totalSubscribers, errors}.
    """
    with app.app_context():
        query = PushSubscriptionModel.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        elif role:
            query = query.filter((PushSubscriptionModel.role == role) | (PushSubscriptionModel.role == 'direktor'))

        subscriptions = query.all()
        sent_count = 0
        failed_count = 0
        dead_subs = []
        error_logs = []

        for sub in subscriptions:
            sub_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth
                }
            }
            success, status, err_details = send_web_push_notification(sub_info, payload_dict)
            if success:
                sent_count += 1
                sub.last_used_at = datetime.utcnow()
            else:
                failed_count += 1
                if err_details:
                    error_logs.append(err_details)
                if status in [404, 410]:
                    dead_subs.append(sub)

        for dead in dead_subs:
            db.session.delete(dead)

        if dead_subs or sent_count > 0:
            db.session.commit()

        return {
            'sentCount': sent_count,
            'failedCount': failed_count,
            'totalSubscribers': len(subscriptions),
            'errors': error_logs[:5]
        }


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

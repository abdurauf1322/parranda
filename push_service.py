"""
UYCHI PARRANDA - Web Push Notification and Background Automation Service
Integrates pywebpush and APScheduler for background alert dispatching.
"""

import json
import logging
import os
import base64
import time
from datetime import datetime
import urllib.request
import urllib.error
from apscheduler.schedulers.background import BackgroundScheduler
from pywebpush import webpush, WebPushException
from py_vapid import Vapid
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from config import Config
from models import db, PushSubscriptionModel, FCMDeviceTokenModel, SlesarMilestoneModel, Task

logger = logging.getLogger('uychi_parranda_push')
logger.setLevel(logging.INFO)

scheduler = BackgroundScheduler(daemon=True)

# -------------------------------------------------------------
# FIREBASE CLOUD MESSAGING (FCM) HTTP v1 IMPLEMENTATION
# -------------------------------------------------------------
_cached_fcm_token = {"token": None, "expires_at": 0, "project_id": None}

def _get_service_account_dict():
    """
    Firebase Service Account JSON ma'lumotlarini yuklaydi.
    1. FIREBASE_SERVICE_ACCOUNT_JSON env variable (matn holida)
    2. FIREBASE_SERVICE_ACCOUNT_PATH (fayl yo'li)
    """
    raw_json = Config.FIREBASE_SERVICE_ACCOUNT_JSON
    if raw_json:
        try:
            return json.loads(raw_json)
        except Exception as e:
            logger.error(f"FIREBASE_SERVICE_ACCOUNT_JSON parse xatosi: {e}")

    path = Config.FIREBASE_SERVICE_ACCOUNT_PATH
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Firebase service account faylini o'qishda xatolik: {e}")

    return None


def get_fcm_access_token():
    """
    Google OAuth 2.0 orqali FCM HTTP v1 API uchun OAuth2 Access Token oladi (qo'shimcha og'ir kutubxonalarsiz, sof cryptography yordamida).
    """
    global _cached_fcm_token
    now = time.time()
    if _cached_fcm_token["token"] and _cached_fcm_token["expires_at"] > now + 60:
        return _cached_fcm_token["token"], _cached_fcm_token["project_id"]

    sa = _get_service_account_dict()
    if not sa:
        logger.warning("Firebase Service Account konfiguratsiyasi topilmadi. FCM v1 o'tkazib yuboriladi.")
        return None, None

    project_id = sa.get("project_id")
    client_email = sa.get("client_email")
    private_key_pem = sa.get("private_key")
    token_uri = sa.get("token_uri", "https://oauth2.googleapis.com/token")

    if not (client_email and private_key_pem and project_id):
        logger.error("Firebase Service Account faylida client_email yoki private_key yetarli emas.")
        return None, None

    # Create JWT for Google OAuth2
    header = {"alg": "RS256", "typ": "JWT"}
    payload = {
        "iss": client_email,
        "scope": "https://www.googleapis.com/auth/firebase.messaging",
        "aud": token_uri,
        "exp": int(now + 3600),
        "iat": int(now)
    }

    def b64url(b_val):
        return base64.urlsafe_b64encode(b_val).decode('utf-8').rstrip('=')

    header_b64 = b64url(json.dumps(header).encode('utf-8'))
    payload_b64 = b64url(json.dumps(payload).encode('utf-8'))
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')

    try:
        priv_key = load_pem_private_key(private_key_pem.encode('utf-8'), password=None)
        signature = priv_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
        signed_jwt = f"{header_b64}.{payload_b64}.{b64url(signature)}"

        # Exchange JWT for Access Token
        post_data = urllib.parse.urlencode({
            'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion': signed_jwt
        }).encode('utf-8')

        req = urllib.request.Request(token_uri, data=post_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            access_token = data.get('access_token')
            expires_in = data.get('expires_in', 3600)
            _cached_fcm_token = {
                "token": access_token,
                "expires_at": now + expires_in,
                "project_id": project_id
            }
            return access_token, project_id
    except Exception as e:
        logger.error(f"Google OAuth2 token olishda xatolik: {e}")
        return None, None


def send_fcm_v1_notification(device_token, title, body, data_dict=None):
    """
    FCM HTTP v1 API orqali Android qurilmaga bildirishnoma yuborish.
    High-priority Android config bilan fonga darhol uyg'otuvchi qilib uzatiladi.
    """
    token, project_id = get_fcm_access_token()
    if not token or not project_id:
        return False, None, "Firebase konfiguratsiya qilinmagan"

    url = f"https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
    
    # Custom data har doim string bo'lishi kerak
    data_payload = {}
    if data_dict:
        for k, v in data_dict.items():
            data_payload[str(k)] = str(v)
    data_payload['title'] = str(title)
    data_payload['body'] = str(body)

    message_payload = {
        "message": {
            "token": device_token,
            "notification": {
                "title": title,
                "body": body
            },
            "data": data_payload,
            "android": {
                "priority": "HIGH",
                "notification": {
                    "sound": "default",
                    "channel_id": "uychi_parranda_urgent_channel",
                    "priority": "HIGH",
                    "default_vibrate_timings": True
                }
            }
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(message_payload).encode('utf-8'),
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            logger.info(f"FCM v1 push muvaffaqiyatli: {res_body}")
            return True, response.status, None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        logger.warning(f"FCM v1 HTTP error {e.code}: {err_body}")
        return False, e.code, err_body
    except Exception as ex:
        logger.error(f"FCM v1 yuborishda xatolik: {ex}")
        return False, None, str(ex)

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
    Broadcast push notification to subscribers:
    1. Web Push (Service Worker / PWA brauzerlar)
    2. Android FCM v1 (Android APK foydalanuvchilari)
    Deletes obsolete/unregistered subscriptions (404/410 Gone / UNREGISTERED).
    Returns statistics: {sentCount, failedCount, totalSubscribers, fcmSent, fcmFailed, errors}.
    """
    with app.app_context():
        # 1. WEB PUSH (PWA)
        web_query = PushSubscriptionModel.query
        if user_id:
            web_query = web_query.filter_by(user_id=user_id)
        elif role:
            web_query = web_query.filter((PushSubscriptionModel.role == role) | (PushSubscriptionModel.role == 'direktor'))

        subscriptions = web_query.all()
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

        # 2. ANDROID NATIVE FCM v1
        fcm_query = FCMDeviceTokenModel.query
        if user_id:
            fcm_query = fcm_query.filter_by(user_id=user_id)
        elif role:
            fcm_query = fcm_query.filter((FCMDeviceTokenModel.role == role) | (FCMDeviceTokenModel.role == 'direktor'))

        fcm_tokens = fcm_query.all()
        fcm_sent = 0
        fcm_failed = 0
        dead_fcm_tokens = []

        title = payload_dict.get('title', 'Uychi Parranda')
        body = payload_dict.get('body', '')

        for dev in fcm_tokens:
            fcm_ok, fcm_status, fcm_err = send_fcm_v1_notification(
                device_token=dev.token,
                title=title,
                body=body,
                data_dict=payload_dict
            )
            if fcm_ok:
                fcm_sent += 1
                dev.last_updated_at = datetime.utcnow()
            else:
                fcm_failed += 1
                if fcm_err:
                    error_logs.append(f"FCM: {fcm_err}")
                # Agar token o'chgan bo'lsa (UNREGISTERED / NOT_FOUND / 404)
                if fcm_status == 404 or (fcm_err and ("UNREGISTERED" in fcm_err or "NOT_FOUND" in fcm_err)):
                    dead_fcm_tokens.append(dev)

        for dead_tok in dead_fcm_tokens:
            db.session.delete(dead_tok)

        if dead_subs or dead_fcm_tokens or sent_count > 0 or fcm_sent > 0:
            db.session.commit()

        return {
            'sentCount': sent_count + fcm_sent,
            'webSent': sent_count,
            'fcmSent': fcm_sent,
            'failedCount': failed_count + fcm_failed,
            'totalSubscribers': len(subscriptions) + len(fcm_tokens),
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

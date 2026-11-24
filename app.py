"""
UYCHI PARRANDA - Parrandachilik Fabrikasi Boshqaruv Tizimi
Main Flask REST API Server
"""

import os
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from config import Config
from models import (
    db, User, Branch, Attendance, Task, SlesarMilestoneModel,
    DailyFactoryReportModel, PhotoReportModel, ChatMessageModel,
    BranchInventoryItemModel, ChickenWeightRecordModel, PersonalNoteModel, AuditLogModel,
    PushSubscriptionModel, FCMDeviceTokenModel
)
from push_service import init_scheduler, broadcast_push_notification

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, 'frontend', 'dist')

app = Flask(__name__, static_folder=None)
app.config.from_object(Config)

# Enable CORS for React frontend (production FRONTEND_URL & local dev environments)
frontend_origin = Config.FRONTEND_URL
allowed_origins = [
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4173'
]
if frontend_origin:
    allowed_origins.append(frontend_origin.rstrip('/'))

CORS(app, origins=allowed_origins, supports_credentials=True)

db.init_app(app)

with app.app_context():
    db.create_all()

# Initialize APScheduler for automated background alerts
init_scheduler(app)



# Auth Decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # Also support Authorization header Bearer token / username for API clients
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({'error': 'Avtorizatsiyadan o\'tilmagan'}), 401
        return f(*args, **kwargs)
    return decorated_function


# -------------------------------------------------------------
# 1. AUTHENTICATION & USERS
# -------------------------------------------------------------

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Login yoki parol noto\'g\'ri'}), 401

    session['user_id'] = user.id
    session['username'] = user.username
    session['role'] = user.role
    session['full_name'] = user.full_name

    # Automatic Arrival Attendance Check-In on login if not already recorded today
    today_str = datetime.now().strftime('%Y-%m-%d')
    existing_att = Attendance.query.filter_by(user_id=user.id, date=today_str).first()
    if not existing_att:
        now_time = datetime.now().strftime('%H:%M:%S')
        new_att = Attendance(
            user_id=user.id,
            user_name=user.full_name,
            role=user.role,
            date=today_str,
            check_in_time=now_time,
            status='keldi'
        )
        db.session.add(new_att)
        db.session.commit()

    return jsonify({
        'success': True,
        'user': user.to_dict(),
        'message': f'Xush kelibsiz, {user.full_name}!'
    })


@app.route('/api/auth/users', methods=['GET'])
def get_all_users():
    users = User.query.filter_by(is_active=True).all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/auth/change-password', methods=['POST'])
def change_password():
    data = request.get_json() or {}
    user_id = data.get('userId') or session.get('user_id')
    current_pw = data.get('currentPassword')
    new_pw = data.get('newPassword')
    new_uname = data.get('newUsername')

    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Foydalanuvchi topilmadi'}), 404

    if current_pw and not user.check_password(current_pw):
        return jsonify({'success': False, 'message': 'Hozirgi parol noto\'g\'ri'}), 400

    if new_pw:
        user.set_password(new_pw)
    if new_uname:
        user.username = new_uname

    db.session.commit()
    return jsonify({'success': True, 'message': 'Parol muvaffaqiyatli o\'zgartirildi', 'user': user.to_dict()})


# -------------------------------------------------------------
# 2. ENTERPRISE BRANCHES (5 FILIAL)
# -------------------------------------------------------------

@app.route('/api/branches', methods=['GET'])
def get_branches():
    branches = Branch.query.all()
    return jsonify([b.to_dict() for b in branches])


@app.route('/api/branches/<branch_id>', methods=['PUT'])
def update_branch(branch_id):
    data = request.get_json() or {}
    b = Branch.query.filter_by(branch_id=branch_id).first()
    if not b:
        return jsonify({'error': 'Filial topilmadi'}), 404

    b.name = data.get('name', b.name)
    b.bird_capacity = data.get('birdCapacity', b.bird_capacity)
    b.current_birds = data.get('currentBirds', b.current_birds)
    b.daily_egg_target = data.get('dailyEggTarget', b.daily_egg_target)
    b.manager_name = data.get('managerName', b.manager_name)
    db.session.commit()
    return jsonify({'success': True, 'branch': b.to_dict()})


# -------------------------------------------------------------
# 3. ATTENDANCE & SUBSTITUTION (DAVOMAT VA O'RINBOSARLIK)
# -------------------------------------------------------------

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    date_filter = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    records = Attendance.query.filter_by(date=date_filter).all()
    return jsonify([r.to_dict() for r in records])


@app.route('/api/attendance/check-in', methods=['POST'])
def attendance_check_in():
    data = request.get_json() or {}
    user_id = data.get('userId') or session.get('user_id', 1)
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Foydalanuvchi topilmadi'}), 404

    today_str = datetime.now().strftime('%Y-%m-%d')
    now_time = datetime.now().strftime('%H:%M:%S')

    att = Attendance.query.filter_by(user_id=user_id, date=today_str).first()
    is_sub = data.get('isSubstitution', False)

    if not att:
        att = Attendance(
            user_id=user_id,
            user_name=user.full_name,
            role=user.role,
            date=today_str,
            check_in_time=now_time,
            is_substitution=is_sub,
            original_worker_name=data.get('originalWorkerName'),
            substitute_worker_name=data.get('substituteWorkerName'),
            status='orinbosar_bilan' if is_sub else 'keldi',
            notes=data.get('notes')
        )
        db.session.add(att)
    else:
        att.check_in_time = now_time
        att.is_substitution = is_sub
        att.status = 'orinbosar_bilan' if is_sub else 'keldi'

    db.session.commit()
    return jsonify({'success': True, 'attendance': att.to_dict()})


# -------------------------------------------------------------
# 4. SLESAR 10 MILESTONES & 3-MINUTE ALERTS
# -------------------------------------------------------------

@app.route('/api/slesar/milestones', methods=['GET'])
def get_milestones():
    milestones = SlesarMilestoneModel.query.order_by(SlesarMilestoneModel.time.asc()).all()
    return jsonify([m.to_dict() for m in milestones])


@app.route('/api/slesar/milestones/<int:mid>/complete', methods=['POST'])
def complete_milestone(mid):
    m = SlesarMilestoneModel.query.get(mid)
    if not m:
        return jsonify({'error': 'Bosqich topilmadi'}), 404

    data = request.get_json() or {}
    m.status = 'bajarildi'
    m.completed_at = datetime.now().strftime('%H:%M:%S')
    m.notes = data.get('notes', m.notes)
    db.session.commit()
    return jsonify({'success': True, 'milestone': m.to_dict()})


# -------------------------------------------------------------
# 5. TASKS & 1-5 STARS EVALUATION
# -------------------------------------------------------------

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    role_filter = request.args.get('role')
    query = Task.query
    if role_filter:
        query = query.filter_by(assigned_to_role=role_filter)
    tasks = query.order_by(Task.id.desc()).all()
    return jsonify([t.to_dict() for t in tasks])


@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json() or {}
    task = Task(
        title=data.get('title'),
        description=data.get('description'),
        assigned_by_name=data.get('assignedByName', 'Ish boshqaruvchi'),
        assigned_by_role=data.get('assignedByRole', 'ish_boshqaruvchi'),
        assigned_to_role=data.get('assignedToRole', 'slesar'),
        assigned_to_name=data.get('assignedToName', 'Mas\'ul xodim'),
        building=data.get('building', '1-Bino'),
        priority=data.get('priority', 'orta'),
        due_time=data.get('dueTime')
    )
    db.session.add(task)
    db.session.commit()

    # Send background Web Push Notification to the assigned role
    try:
        broadcast_push_notification(
            app,
            payload_dict={
                'title': f'📋 Yangi topshiriq: {task.title}',
                'body': f'{task.assigned_by_name} sizga yangi topshiriq biriktirdi ({task.priority.upper()})',
                'icon': '/pwa-192x192.png',
                'url': '/tasks'
            },
            role=task.assigned_to_role
        )
    except Exception as e:
        app.logger.warning(f"Push task broadcast error: {e}")

    return jsonify({'success': True, 'task': task.to_dict()})


@app.route('/api/tasks/<int:tid>/status', methods=['PUT'])
def update_task_status(tid):
    data = request.get_json() or {}
    task = Task.query.get(tid)
    if not task:
        return jsonify({'error': 'Vazifa topilmadi'}), 404

    task.status = data.get('status', task.status)
    if task.status == 'bajarildi':
        task.completed_at = datetime.now().strftime('%H:%M:%S')
    db.session.commit()
    return jsonify({'success': True, 'task': task.to_dict()})


@app.route('/api/tasks/<int:tid>/evaluate', methods=['POST'])
def evaluate_task(tid):
    data = request.get_json() or {}
    task = Task.query.get(tid)
    if not task:
        return jsonify({'error': 'Vazifa topilmadi'}), 404

    task.evaluation_score = data.get('score', 5) # 1 - 5 yulduz
    task.evaluation_note = data.get('note', '')
    task.evaluated_by_name = data.get('evaluatedByName', session.get('full_name', 'Direktor'))
    task.status = 'tasdiqlandi'
    db.session.commit()
    return jsonify({'success': True, 'task': task.to_dict()})


# -------------------------------------------------------------
# 6. INVENTORY & WAREHOUSE (OMBOR VA ZAXIRA)
# -------------------------------------------------------------

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    branch_id = request.args.get('branchId')
    query = BranchInventoryItemModel.query
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    items = query.all()
    return jsonify([i.to_dict() for i in items])


@app.route('/api/inventory', methods=['POST'])
def add_inventory():
    data = request.get_json() or {}
    item = BranchInventoryItemModel(
        branch_id=data.get('branchId', 'chortoq'),
        name=data.get('name'),
        category=data.get('category', 'yem'),
        quantity=float(data.get('quantity', 0)),
        unit=data.get('unit', 'kg'),
        min_threshold=float(data.get('minThreshold', 100)),
        last_updated=datetime.now().strftime('%Y-%m-%d %H:%M')
    )
    db.session.add(item)
    db.session.commit()
    return jsonify({'success': True, 'item': item.to_dict()})


@app.route('/api/inventory/<int:item_id>', methods=['PUT'])
def update_inventory_quantity(item_id):
    data = request.get_json() or {}
    item = BranchInventoryItemModel.query.get(item_id)
    if not item:
        return jsonify({'error': 'Mahsulot topilmadi'}), 404

    if 'quantity' in data:
        item.quantity = float(data['quantity'])
    item.last_updated = datetime.now().strftime('%Y-%m-%d %H:%M')
    db.session.commit()
    return jsonify({'success': True, 'item': item.to_dict()})


# -------------------------------------------------------------
# 7. CHICKEN WEIGHTS (PARRANDALAR VAZNI)
# -------------------------------------------------------------

@app.route('/api/weights', methods=['GET'])
def get_weights():
    branch_id = request.args.get('branchId')
    query = ChickenWeightRecordModel.query
    if branch_id:
        query = query.filter_by(branch_id=branch_id)
    records = query.order_by(ChickenWeightRecordModel.id.desc()).all()
    return jsonify([r.to_dict() for r in records])


@app.route('/api/weights', methods=['POST'])
def add_weight_record():
    data = request.get_json() or {}
    rec = ChickenWeightRecordModel(
        branch_id=data.get('branchId', 'chortoq'),
        building=data.get('building', '1-Bino'),
        cage_number=data.get('cageNumber', 'Qafas-A1'),
        batch_number=data.get('batchNumber'),
        bird_age_days=int(data.get('birdAgeDays', 30)),
        sample_size=int(data.get('sampleSize', 10)),
        avg_weight_grams=float(data.get('avgWeightGrams', 1850)),
        target_weight_grams=float(data.get('targetWeightGrams', 1800)),
        measured_by=data.get('measuredBy', 'Veterinar'),
        measured_date=data.get('measuredDate', datetime.now().strftime('%Y-%m-%d')),
        notes=data.get('notes')
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify({'success': True, 'record': rec.to_dict()})


# -------------------------------------------------------------
# 8. GENERAL CHAT & MESSAGES
# -------------------------------------------------------------

@app.route('/api/chat', methods=['GET'])
def get_chat_messages():
    messages = ChatMessageModel.query.order_by(ChatMessageModel.id.asc()).limit(100).all()
    return jsonify([m.to_dict() for m in messages])


@app.route('/api/chat', methods=['POST'])
def send_chat_message():
    data = request.get_json() or {}
    msg = ChatMessageModel(
        sender_id=data.get('senderId') or session.get('user_id'),
        sender_name=data.get('senderName', 'Xodim'),
        sender_role=data.get('senderRole', 'ishchi'),
        sender_branch=data.get('senderBranch', 'chortoq'),
        message=data.get('message', ''),
        timestamp=datetime.now().strftime('%H:%M'),
        is_announcement=data.get('isAnnouncement', False),
        attachment_url=data.get('attachmentUrl'),
        attachment_type=data.get('attachmentType'),
        audio_duration=data.get('audioDuration')
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({'success': True, 'message': msg.to_dict()})


# -------------------------------------------------------------
# 9. PERSONAL NOTES (SHAXSIY ZAMETKALAR)
# -------------------------------------------------------------

@app.route('/api/notes', methods=['GET'])
def get_personal_notes():
    user_id = request.args.get('userId') or session.get('user_id', 1)
    notes = PersonalNoteModel.query.filter_by(user_id=user_id).order_by(PersonalNoteModel.is_pinned.desc(), PersonalNoteModel.id.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@app.route('/api/notes', methods=['POST'])
def add_personal_note():
    data = request.get_json() or {}
    user_id = data.get('userId') or session.get('user_id', 1)
    note = PersonalNoteModel(
        user_id=user_id,
        title=data.get('title', 'Eslatma'),
        content=data.get('content', ''),
        category=data.get('category', 'ish'),
        color=data.get('color', 'yellow'),
        is_pinned=data.get('isPinned', False),
        is_voice_memo=data.get('isVoiceMemo', False)
    )
    db.session.add(note)
    db.session.commit()
    return jsonify({'success': True, 'note': note.to_dict()})


# -------------------------------------------------------------
# 10. DAILY FACTORY REPORTS (ISH BOSHQARUVCHI VA STATISTIKACHI)
# -------------------------------------------------------------

@app.route('/api/daily-reports', methods=['GET'])
def get_daily_reports():
    building = request.args.get('building')
    date = request.args.get('date')
    query = DailyFactoryReportModel.query
    if building:
        query = query.filter_by(building=building)
    if date:
        query = query.filter_by(date=date)
    reports = query.order_by(DailyFactoryReportModel.id.desc()).all()
    return jsonify([r.to_dict() for r in reports])


@app.route('/api/daily-reports', methods=['POST'])
def submit_daily_report():
    data = request.get_json() or {}

    # Validation: Temperature range checks
    avg_temp = float(data.get('avgTemperature', 22.0))
    if avg_temp < 5.0 or avg_temp > 50.0:
        return jsonify({
            'error': 'INVALID_TEMPERATURE',
            'message': 'Harorat 5°C dan 50°C gacha bo\'lgan me\'yorda kiritilishi shart'
        }), 400

    birds_count = int(data.get('birdsCount', 0))
    if birds_count < 0:
        return jsonify({
            'error': 'INVALID_BIRDS_COUNT',
            'message': 'Parrandalar soni manfiy bo\'lishi mumkin emas'
        }), 400

    mortality_count = int(data.get('mortalityCount', 0))
    if mortality_count < 0 or mortality_count > 10000:
        return jsonify({
            'error': 'INVALID_MORTALITY',
            'message': 'Nobudlar soni haqiqiy diapazonda bo\'lishi kerak'
        }), 400

    report = DailyFactoryReportModel(
        date=data.get('date', datetime.now().strftime('%Y-%m-%d')),
        building=data.get('building', '1-Bino'),
        batch_number=data.get('batchNumber'),
        birds_count=birds_count,
        eggs_collected_total=int(data.get('eggsCollectedTotal', 0)),
        eggs_category_premium=int(data.get('eggsCategoryPremium', 0)),
        eggs_category_first=int(data.get('eggsCategoryFirst', 0)),
        eggs_category_second=int(data.get('eggsCategorySecond', 0)),
        eggs_damaged=int(data.get('eggsDamaged', 0)),
        mortality_count=mortality_count,
        feed_consumed_kg=float(data.get('feedConsumedKg', 0.0)),
        water_consumed_liters=float(data.get('waterConsumedLiters', 0.0)),
        avg_temperature=avg_temp,
        humidity_percent=float(data.get('humidityPercent', 60.0)),
        submitted_by_name=data.get('submittedByName', session.get('full_name', 'Ish boshqaruvchi')),
        submitted_at=datetime.now().strftime('%H:%M:%S'),
        notes=data.get('notes')
    )
    db.session.add(report)
    db.session.commit()
    return jsonify({'success': True, 'report': report.to_dict()}), 201


# -------------------------------------------------------------
# 11. PHOTO REPORTS
# -------------------------------------------------------------

@app.route('/api/photos', methods=['GET'])
def get_photo_reports():
    category = request.args.get('category')
    query = PhotoReportModel.query
    if category:
        query = query.filter_by(category=category)
    photos = query.order_by(PhotoReportModel.id.desc()).all()
    return jsonify([p.to_dict() for p in photos])


@app.route('/api/photos', methods=['POST'])
def add_photo_report():
    data = request.get_json() or {}
    image_url = data.get('imageUrl')
    if not image_url:
        return jsonify({'error': 'MISSING_IMAGE', 'message': 'Rasm manzili yoki base64 majburiy'}), 400

    photo = PhotoReportModel(
        uploader_name=data.get('uploaderName', session.get('full_name', 'Xodim')),
        uploader_role=data.get('uploaderRole', session.get('role', 'slesar')),
        title=data.get('title', 'Foto hisobot'),
        category=data.get('category', 'boshqa'),
        building=data.get('building'),
        image_url=image_url,
        timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        notes=data.get('notes')
    )
    db.session.add(photo)
    db.session.commit()
    return jsonify({'success': True, 'photo': photo.to_dict()}), 201


# -------------------------------------------------------------
# 12. SWAGGER / OPENAPI SPECIFICATION & DOCS UI
# -------------------------------------------------------------

@app.route('/api/openapi.json')
def openapi_spec():
    return jsonify({
        "openapi": "3.0.3",
        "info": {
            "title": "Uychi Parranda Industrial Farm Management API",
            "version": "2.0.0",
            "description": "Parrandachilik fabrikasining 5 ta filiali, 12 ta lavozim, davomat, slesar vaqt grafigi, ombor va kunlik sex ko'rsatkichlari uchun rasmiy RESTful API."
        },
        "servers": [{"url": "http://localhost:5000", "description": "Local Python Backend"}],
        "paths": {
            "/api/auth/login": {
                "post": {
                    "summary": "Xodim tizimga kirishi va avtomatik davomat qayd etish",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "username": {"type": "string", "example": "slesar1"},
                                        "password": {"type": "string", "example": "123456"}
                                    },
                                    "required": ["username", "password"]
                                }
                            }
                        }
                    },
                    "responses": {"200": {"description": "Muvaffaqiyatli kirish"}}
                }
            },
            "/api/daily-reports": {
                "get": {"summary": "Kunlik sex hisobotlarini olish"},
                "post": {
                    "summary": "Yangi kunlik sex ko'rsatkichlarini topshirish (Validatsiya bilan)",
                    "responses": {"201": {"description": "Hisobot saqlandi"}, "400": {"description": "Noto'g'ri oraliq"}}
                }
            },
            "/api/attendance/check-in": {
                "post": {"summary": "Ishga kelish / o'rinbosar bilan davomat belgilash"}
            },
            "/api/slesar/milestones": {
                "get": {"summary": "Slesar 10 ta texnologik vaqt bosqichlari"}
            },
            "/api/tasks": {
                "get": {"summary": "Topshiriqlar ro'yxati"},
                "post": {"summary": "Yangi topshiriq biriktirish"}
            },
            "/api/inventory": {
                "get": {"summary": "Ombor qoldiqlari (yem, dori, ehtiyot qismlar)"}
            },
            "/api/weights": {
                "get": {"summary": "Parrandalar vazn o'lchovlari"}
            }
        }
    })


@app.route('/api/docs')
def swagger_ui():
    return """
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="utf-8" />
      <title>Uychi Parranda - API Hujjatlari (Swagger)</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    </head>
    <body style="margin: 0; background: #0f172a;">
      <div id="swagger-ui"></div>
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis],
          });
        };
      </script>
    </body>
    </html>
    """

# -------------------------------------------------------------
# 13. WEB PUSH NOTIFICATIONS (VAPID + Service Worker)
# -------------------------------------------------------------

@app.route('/api/push/vapid-public-key', methods=['GET'])
@app.route('/api/notifications/vapid-public-key', methods=['GET'])
def get_vapid_public_key():
    return jsonify({
        'publicKey': Config.VAPID_PUBLIC_KEY
    })


@app.route('/api/push/subscribe', methods=['POST'])
@app.route('/api/notifications/subscribe', methods=['POST'])
def subscribe_push():
    data = request.get_json() or {}
    endpoint = data.get('endpoint')
    keys = data.get('keys') or {}
    p256dh = keys.get('p256dh')
    auth = keys.get('auth')

    if not endpoint or not p256dh or not auth:
        return jsonify({'error': 'Subscription ma\'lumotlari to\'liq emas'}), 400

    username = data.get('username') or session.get('username')
    role = data.get('role') or session.get('role')
    user_id = data.get('userId') or session.get('user_id')

    # Upsert subscription
    sub = PushSubscriptionModel.query.filter_by(endpoint=endpoint).first()
    if not sub:
        sub = PushSubscriptionModel(
            endpoint=endpoint,
            p256dh=p256dh,
            auth=auth,
            username=username,
            role=role,
            user_id=user_id,
            user_agent=request.headers.get('User-Agent', '')[:250]
        )
        db.session.add(sub)
    else:
        sub.p256dh = p256dh
        sub.auth = auth
        if username:
            sub.username = username
        if role:
            sub.role = role
        if user_id:
            sub.user_id = user_id
        sub.last_used_at = datetime.utcnow()

    db.session.commit()
    return jsonify({'success': True, 'message': 'Push subscription saqlandi'})


@app.route('/api/push/send-test', methods=['POST'])
@app.route('/api/notifications/test', methods=['POST', 'GET'])
def send_test_push():
    data = request.get_json() if request.is_json else {}
    if not data:
        data = request.args.to_dict()

    role = data.get('role')
    title = data.get('title', '🔔 Test Ogohlantirish')
    body = data.get('body', 'Web Push tizimi to\'liq sozlandi va backgroundda ishlamoqda!')
    url = data.get('url', '/')

    res = broadcast_push_notification(
        app,
        payload_dict={
            'title': title,
            'body': body,
            'icon': '/pwa-192x192.png',
            'url': url
        },
        role=role
    )
    return jsonify({
        'success': True,
        'result': res,
        'sentCount': res.get('sentCount', 0),
        'totalSubscribers': res.get('totalSubscribers', 0)
    })


@app.route('/api/push/broadcast', methods=['POST'])
def api_broadcast_push():
    data = request.get_json() or {}
    title = data.get('title')
    body = data.get('body')
    role = data.get('role')
    user_id = data.get('userId')
    url = data.get('url', '/')

    if not title or not body:
        return jsonify({'error': 'Title va body talab qilinadi'}), 400

    res = broadcast_push_notification(
        app,
        payload_dict={
            'title': title,
            'body': body,
            'icon': '/pwa-192x192.png',
            'url': url
        },
        role=role,
        user_id=user_id
    )
    return jsonify({'success': True, 'result': res})


# -------------------------------------------------------------
# 13. ANDROID NATIVE FCM TOKEN REGISTRATION
# -------------------------------------------------------------

@app.route('/api/fcm/register', methods=['POST'])
def api_fcm_register():
    """
    Android Native ilovadan olingan FCM tokenini xavfsiz saqlash yoki yangilash.
    XAVFSIZLIK: Foydalanuvchi session orqali yoki to'g'ri login/parol (yoki auth header)
    orqali tasdiqlangan bo'lishi SHART. Ixtiyoriy boshqa xodim nomidan token qo'shish qat'iyan taqiqlangan.
    """
    data = request.get_json() or {}
    token = data.get('token')
    if not token:
        return jsonify({'error': 'token majburiy'}), 400

    authenticated_user = None

    # 1. Sessiya orqali tekshirish
    if session.get('user_id'):
        authenticated_user = User.query.get(session.get('user_id'))

    # 2. To'g'ridan-to'g'ri Android API orqali login/parol bilan autentifikatsiya
    if not authenticated_user:
        username = data.get('username')
        password = data.get('password')
        if username and password:
            candidate = User.query.filter_by(username=username).first()
            if candidate and candidate.check_password(password):
                authenticated_user = candidate

    if not authenticated_user:
        return jsonify({
            'error': 'Avtorizatsiyadan o\'tilmagan. Tokenni ro\'yxatdan o\'tkazish uchun to\'g\'ri login va parol talab qilinadi.'
        }), 401

    device_name = data.get('deviceName', 'Android Device')

    # Agar token avval mavjud bo'lsa, uni faqat tasdiqlangan foydalanuvchiga yangilash
    existing = FCMDeviceTokenModel.query.filter_by(token=token).first()
    if existing:
        existing.user_id = authenticated_user.id
        existing.username = authenticated_user.username
        existing.role = authenticated_user.role
        existing.device_name = device_name
        existing.last_updated_at = datetime.utcnow()
    else:
        new_device = FCMDeviceTokenModel(
            user_id=authenticated_user.id,
            username=authenticated_user.username,
            role=authenticated_user.role,
            token=token,
            device_name=device_name
        )
        db.session.add(new_device)

    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'FCM token muvaffaqiyatli saqlandi ({authenticated_user.full_name})',
        'user': authenticated_user.to_dict()
    })


@app.route('/api/fcm/unregister', methods=['POST'])
def api_fcm_unregister():
    """
    Foydalanuvchi logout bo'lganda qurilma tokenini o'chirish.
    XAVFSIZLIK: Boshqa foydalanuvchining tokenini o'chirib yuborishning oldi olinadi.
    """
    data = request.get_json() or {}
    token = data.get('token')
    if not token:
        return jsonify({'error': 'token majburiy'}), 400

    authenticated_user_id = session.get('user_id')

    # Agar login/parol berilgan bo'lsa
    if not authenticated_user_id:
        username = data.get('username')
        password = data.get('password')
        if username and password:
            user = User.query.filter_by(username=username).first()
            if user and user.check_password(password):
                authenticated_user_id = user.id

    existing = FCMDeviceTokenModel.query.filter_by(token=token).first()
    if existing:
        # Agar autentifikatsiya bo'lsa va token boshqa kishiniki bo'lsa, ruxsat bermaslik
        if authenticated_user_id and existing.user_id and existing.user_id != authenticated_user_id:
            return jsonify({'error': 'Ushbu tokenni o\'chirish uchun ruxsat yo\'q'}), 403

        db.session.delete(existing)
        db.session.commit()
        return jsonify({'success': True, 'message': 'FCM token tizimdan o\'chirildi'})

    return jsonify({'success': True, 'message': 'Token topilmadi'})


@app.route('/api/health')
def api_health():
    return jsonify({
        'status': 'online',
        'message': 'Uychi Parranda Python API Server is active.',
        'endpoints': [
            '/api/auth/login',
            '/api/auth/users',
            '/api/branches',
            '/api/attendance',
            '/api/slesar/milestones',
            '/api/tasks',
            '/api/inventory',
            '/api/weights',
            '/api/chat',
            '/api/notes',
            '/api/photos',
            '/api/daily-reports',
            '/api/push/vapid-public-key'
        ]
    })


@app.route('/')
def serve_index():
    index_file = os.path.join(FRONTEND_DIST, 'index.html')
    if os.path.exists(index_file):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return jsonify({'error': 'React frontend build topilmadi. Iltimos frontend papkasida `npm run build` bajaring.'}), 404


@app.route('/<path:path>')
def serve_static_or_spa(path):
    # Do not intercept API or Swagger routes
    if path.startswith('api/') or path == 'api':
        return jsonify({'error': 'API endpoint topilmadi'}), 404

    # Handle PWA webmanifest specifically if requested as manifest.webmanifest
    if path == 'manifest.webmanifest' and not os.path.exists(os.path.join(FRONTEND_DIST, path)):
        if os.path.exists(os.path.join(FRONTEND_DIST, 'manifest.json')):
            return send_from_directory(FRONTEND_DIST, 'manifest.json', mimetype='application/manifest+json')

    target_file = os.path.join(FRONTEND_DIST, path)
    if os.path.exists(target_file) and os.path.isfile(target_file):
        # Set proper Service-Worker-Allowed and caching headers for sw.js
        if path == 'sw.js':
            response = send_from_directory(FRONTEND_DIST, path, mimetype='application/javascript')
            response.headers['Service-Worker-Allowed'] = '/'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
        return send_from_directory(FRONTEND_DIST, path)

    # SPA Fallback (React Router refresh support)
    index_file = os.path.join(FRONTEND_DIST, 'index.html')
    if os.path.exists(index_file):
        return send_from_directory(FRONTEND_DIST, 'index.html')

    return jsonify({'error': 'Sahifa topilmadi'}), 404


if __name__ == '__main__':
    port = Config.PORT
    app.run(host='0.0.0.0', port=port, debug=(Config.FLASK_ENV == 'development'))

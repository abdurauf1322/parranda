"""
UYCHI PARRANDA - Parrandachilik Fabrikasi Boshqaruv Tizimi
SQLAlchemy Database Models
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(64), nullable=False, index=True)
    phone = db.Column(db.String(32), nullable=True)
    branch_id = db.Column(db.String(64), nullable=True, default='chortoq')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'fullName': self.full_name,
            'role': self.role,
            'phone': self.phone,
            'branchId': self.branch_id,
            'isActive': self.is_active,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class Branch(db.Model):
    __tablename__ = 'branches'

    id = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.String(64), unique=True, nullable=False, index=True) # chortoq, pop, etc.
    name = db.Column(db.String(128), nullable=False)
    location = db.Column(db.String(128), nullable=False)
    bird_capacity = db.Column(db.Integer, default=50000)
    current_birds = db.Column(db.Integer, default=48000)
    daily_egg_target = db.Column(db.Integer, default=45000)
    status = db.Column(db.String(32), default='faol')
    manager_name = db.Column(db.String(128), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'branchId': self.branch_id,
            'name': self.name,
            'location': self.location,
            'birdCapacity': self.bird_capacity,
            'currentBirds': self.current_birds,
            'dailyEggTarget': self.daily_egg_target,
            'status': self.status,
            'managerName': self.manager_name
        }


class Attendance(db.Model):
    __tablename__ = 'attendance'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_name = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(64), nullable=False)
    date = db.Column(db.String(16), nullable=False, index=True) # YYYY-MM-DD
    check_in_time = db.Column(db.String(16), nullable=False)    # HH:MM:SS
    check_out_time = db.Column(db.String(16), nullable=True)

    # Substitution (Almashuvchi/O'rinbosarlik) tartibi:
    is_substitution = db.Column(db.Boolean, default=False)
    original_worker_name = db.Column(db.String(128), nullable=True)
    substitute_worker_name = db.Column(db.String(128), nullable=True)

    status = db.Column(db.String(32), default='keldi') # keldi, orinbosar_bilan, kechikdi, chiqib_ketdi
    notes = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'userName': self.user_name,
            'role': self.role,
            'date': self.date,
            'checkInTime': self.check_in_time,
            'checkOutTime': self.check_out_time,
            'isSubstitution': self.is_substitution,
            'originalWorkerName': self.original_worker_name,
            'substituteWorkerName': self.substitute_worker_name,
            'status': self.status,
            'notes': self.notes
        }


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text, nullable=True)
    assigned_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    assigned_by_name = db.Column(db.String(128), nullable=False)
    assigned_by_role = db.Column(db.String(64), nullable=False)
    assigned_to_role = db.Column(db.String(64), nullable=False, index=True)
    assigned_to_name = db.Column(db.String(128), nullable=False)
    building = db.Column(db.String(64), nullable=True)
    priority = db.Column(db.String(16), default='orta') # shoshilinch, yuqori, orta, oddiy
    status = db.Column(db.String(32), default='yangi')  # yangi, jarayonda, bajarildi, tasdiqlandi, rad_etildi
    due_time = db.Column(db.String(16), nullable=True)
    completed_at = db.Column(db.String(32), nullable=True)

    # 1 - 5 Stars Evaluation (Baholash tizimi)
    evaluation_score = db.Column(db.Integer, nullable=True)
    evaluation_note = db.Column(db.String(256), nullable=True)
    evaluated_by_name = db.Column(db.String(128), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'assignedByName': self.assigned_by_name,
            'assignedByRole': self.assigned_by_role,
            'assignedToRole': self.assigned_to_role,
            'assignedToName': self.assigned_to_name,
            'building': self.building,
            'priority': self.priority,
            'status': self.status,
            'dueTime': self.due_time,
            'completedAt': self.completed_at,
            'evaluationScore': self.evaluation_score,
            'evaluationNote': self.evaluation_note,
            'evaluatedByName': self.evaluated_by_name,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


class SlesarMilestoneModel(db.Model):
    __tablename__ = 'slesar_milestones'

    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.String(8), nullable=False)       # "07:00"
    alert_time = db.Column(db.String(8), nullable=False) # "06:57"
    title = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(32), default='kutilmoqda') # kutilmoqda, ogohlantirildi, bajarildi
    completed_at = db.Column(db.String(16), nullable=True)
    notes = db.Column(db.String(256), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'time': self.time,
            'alertTime': self.alert_time,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'completedAt': self.completed_at,
            'notes': self.notes
        }


class DailyFactoryReportModel(db.Model):
    __tablename__ = 'daily_factory_reports'

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(16), nullable=False, index=True)
    building = db.Column(db.String(64), nullable=False)
    batch_number = db.Column(db.String(64), nullable=True)
    birds_count = db.Column(db.Integer, default=0)
    eggs_collected_total = db.Column(db.Integer, default=0)
    eggs_category_premium = db.Column(db.Integer, default=0)
    eggs_category_first = db.Column(db.Integer, default=0)
    eggs_category_second = db.Column(db.Integer, default=0)
    eggs_damaged = db.Column(db.Integer, default=0)
    mortality_count = db.Column(db.Integer, default=0)
    feed_consumed_kg = db.Column(db.Float, default=0.0)
    water_consumed_liters = db.Column(db.Float, default=0.0)
    avg_temperature = db.Column(db.Float, default=0.0)
    humidity_percent = db.Column(db.Float, default=0.0)
    submitted_by_name = db.Column(db.String(128), nullable=False)
    submitted_at = db.Column(db.String(16), nullable=False)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'building': self.building,
            'batchNumber': self.batch_number,
            'birdsCount': self.birds_count,
            'eggsCollectedTotal': self.eggs_collected_total,
            'eggsCategoryPremium': self.eggs_category_premium,
            'eggsCategoryFirst': self.eggs_category_first,
            'eggsCategorySecond': self.eggs_category_second,
            'eggsDamaged': self.eggs_damaged,
            'mortalityCount': self.mortality_count,
            'feedConsumedKg': self.feed_consumed_kg,
            'waterConsumedLiters': self.water_consumed_liters,
            'avgTemperature': self.avg_temperature,
            'humidityPercent': self.humidity_percent,
            'submittedByName': self.submitted_by_name,
            'submittedAt': self.submitted_at,
            'notes': self.notes
        }


class PhotoReportModel(db.Model):
    __tablename__ = 'photo_reports'

    id = db.Column(db.Integer, primary_key=True)
    uploader_name = db.Column(db.String(128), nullable=False)
    uploader_role = db.Column(db.String(64), nullable=False)
    title = db.Column(db.String(256), nullable=False)
    category = db.Column(db.String(64), nullable=False) # hisoblagich, plomba, tuxum_yuklash, surveillance, sanitariya, diagnostika, boshqa
    building = db.Column(db.String(64), nullable=True)
    image_url = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.String(16), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(32), default='kutilmoqda') # kutilmoqda, tasdiqlandi, rad_etildi
    verified_by = db.Column(db.String(128), nullable=True)
    verified_at = db.Column(db.String(16), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'uploaderName': self.uploader_name,
            'uploaderRole': self.uploader_role,
            'title': self.title,
            'category': self.category,
            'building': self.building,
            'imageUrl': self.image_url,
            'timestamp': self.timestamp,
            'notes': self.notes,
            'status': self.status,
            'verifiedBy': self.verified_by,
            'verifiedAt': self.verified_at
        }


class ChatMessageModel(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, nullable=True)
    sender_name = db.Column(db.String(128), nullable=False)
    sender_role = db.Column(db.String(64), nullable=False)
    sender_branch = db.Column(db.String(64), nullable=True)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.String(16), nullable=False)
    is_announcement = db.Column(db.Boolean, default=False)
    attachment_url = db.Column(db.Text, nullable=True)
    attachment_type = db.Column(db.String(32), nullable=True) # audio, image, file
    audio_duration = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'senderId': self.sender_id,
            'senderName': self.sender_name,
            'senderRole': self.sender_role,
            'senderBranch': self.sender_branch,
            'message': self.message,
            'timestamp': self.timestamp,
            'isAnnouncement': self.is_announcement,
            'attachmentUrl': self.attachment_url,
            'attachmentType': self.attachment_type,
            'audioDuration': self.audio_duration
        }


class BranchInventoryItemModel(db.Model):
    __tablename__ = 'branch_inventory'

    id = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.String(64), nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False)
    category = db.Column(db.String(64), nullable=False) # yem, dori, ehtiyot_qismlar, tara, yoqilgi
    quantity = db.Column(db.Float, default=0.0)
    unit = db.Column(db.String(32), default='kg')      # kg, litr, dona, qop
    min_threshold = db.Column(db.Float, default=100.0)
    last_updated = db.Column(db.String(32), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'branchId': self.branch_id,
            'name': self.name,
            'category': self.category,
            'quantity': self.quantity,
            'unit': self.unit,
            'minThreshold': self.min_threshold,
            'lastUpdated': self.last_updated
        }


class ChickenWeightRecordModel(db.Model):
    __tablename__ = 'chicken_weights'

    id = db.Column(db.Integer, primary_key=True)
    branch_id = db.Column(db.String(64), nullable=False, index=True)
    building = db.Column(db.String(64), nullable=False)
    cage_number = db.Column(db.String(64), nullable=False)
    batch_number = db.Column(db.String(64), nullable=True)
    bird_age_days = db.Column(db.Integer, default=1)
    sample_size = db.Column(db.Integer, default=10)
    avg_weight_grams = db.Column(db.Float, nullable=False)
    target_weight_grams = db.Column(db.Float, nullable=False)
    measured_by = db.Column(db.String(128), nullable=False)
    measured_date = db.Column(db.String(16), nullable=False)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'branchId': self.branch_id,
            'building': self.building,
            'cageNumber': self.cage_number,
            'batchNumber': self.batch_number,
            'birdAgeDays': self.bird_age_days,
            'sampleSize': self.sample_size,
            'avgWeightGrams': self.avg_weight_grams,
            'targetWeightGrams': self.target_weight_grams,
            'measuredBy': self.measured_by,
            'measuredDate': self.measured_date,
            'notes': self.notes
        }


class PersonalNoteModel(db.Model):
    __tablename__ = 'personal_notes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(256), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(64), default='ish') # ish, eslatma, shaxsiy, tezkor
    color = db.Column(db.String(32), default='yellow')
    is_pinned = db.Column(db.Boolean, default=False)
    is_voice_memo = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'color': self.color,
            'isPinned': self.is_pinned,
            'isVoiceMemo': self.is_voice_memo,
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None
        }


class AuditLogModel(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(128), nullable=False)
    action = db.Column(db.String(128), nullable=False)
    target_module = db.Column(db.String(128), nullable=False)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userName': self.user_name,
            'action': self.action,
            'targetModule': self.target_module,
            'details': self.details,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class PushSubscriptionModel(db.Model):
    __tablename__ = 'push_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    username = db.Column(db.String(64), nullable=True, index=True)
    role = db.Column(db.String(64), nullable=True, index=True)
    endpoint = db.Column(db.Text, unique=True, nullable=False)
    p256dh = db.Column(db.String(256), nullable=False)
    auth = db.Column(db.String(128), nullable=False)
    user_agent = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'username': self.username,
            'role': self.role,
            'endpoint': self.endpoint,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }


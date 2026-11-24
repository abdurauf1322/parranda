import unittest
import json
from app import app, db
from models import User, FCMDeviceTokenModel
from push_service import broadcast_push_notification

class FCMNotificationSecurityTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        cls.client = app.test_client()
        with app.app_context():
            db.create_all()
            # Test user
            test_user = User.query.filter_by(username='test_auditor').first()
            if not test_user:
                test_user = User(
                    username='test_auditor',
                    full_name='Test Auditor',
                    role='elektrik'
                )
                test_user.set_password('Secret123!')
                db.session.add(test_user)
                db.session.commit()

    def test_1_unauthorized_fcm_register_fails(self):
        """1. Ruxsatsiz yoki parolsiz foydalanuvchi token ro'yxatdan o'tkaza olmasligi kerak (401)."""
        res = self.client.post('/api/fcm/register', json={
            'token': 'fake_token_unauth_123',
            'username': 'test_auditor',
            'role': 'direktor' # Boshqa rolni da'vo qilmoqda
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertIn('Avtorizatsiyadan o\'tilmagan', data.get('error', ''))

    def test_2_authorized_fcm_register_succeeds(self):
        """2. To'g'ri login va parol orqali token muvaffaqiyatli saqlanishi kerak."""
        res = self.client.post('/api/fcm/register', json={
            'token': 'valid_token_test_abc',
            'username': 'test_auditor',
            'password': 'Secret123!',
            'deviceName': 'Pixel Test Phone'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))

        with app.app_context():
            saved = FCMDeviceTokenModel.query.filter_by(token='valid_token_test_abc').first()
            self.assertIsNotNone(saved)
            self.assertEqual(saved.username, 'test_auditor')
            self.assertEqual(saved.role, 'elektrik') # Bazadagi asl roli belgilangan bo'lishi kerak!

    def test_3_event_id_generation_and_channel_selection(self):
        """3. Har bir xabar uchun yagona event_id yaratilishi va kanal tanlash ishlashi kerak."""
        res = broadcast_push_notification(app, {
            'title': 'Sinov Topshiriq',
            'body': 'Elektr uzildi'
        }, role='elektrik', channel='both')

        self.assertIn('event_id', res)
        self.assertTrue(res['event_id'].startswith('evt_'))

    def test_4_unregister_with_wrong_credentials_fails(self):
        """4. Boshqa odamning tokenini o'chirishga ruxsat berilmasligi kerak."""
        # Yangi foydalanuvchi
        with app.app_context():
            u2 = User.query.filter_by(username='attacker_user').first()
            if not u2:
                u2 = User(username='attacker_user', full_name='Attacker', role='ishchi')
                u2.set_password('AttackPass')
                db.session.add(u2)
                db.session.commit()

        # Attacker test_auditor ning tokenini o'chirishga urinyapti
        res = self.client.post('/api/fcm/unregister', json={
            'token': 'valid_token_test_abc',
            'username': 'attacker_user',
            'password': 'AttackPass'
        })
        self.assertEqual(res.status_code, 403)

if __name__ == '__main__':
    unittest.main()

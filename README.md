# UYCHI PARRANDA - Parrandachilik Fabrikasi Boshqaruv Tizimi (Python)

Ushbu papka Python dasturchisi uchun to'liq tayyorlangan loyiha paketidir. Unda **Python backend (Flask + SQLAlchemy + REST API)** va **Frontend (React + Vite + TypeScript)** manba kodlari bitta joyga jamlangan.

---

## 📁 Papka Tuzilishi

```text
python_project/
├── README.md               # Ushbu qo'llanma
├── requirements.txt        # Kerakli Python kutubxonalari
├── config.py               # Ma'lumotlar bazasi va server konfiguratsiyasi
├── models.py               # Barcha SQLAlchemy jadvallari (ORM modellari)
├── seed_data.py            # Boshlang'ich ma'lumotlarni yuklovchi skript
├── app.py                  # Asosiy Flask REST API serveri
├── run.py                  # Dasturni 1 ta buyruq bilan ishga tushirish skripti
└── frontend/               # React + Vite to'liq frontend manba kodlari
    ├── package.json
    ├── src/
    └── public/
```

---

## 🚀 Ishga Tushirish (Quick Start)

### 1. Python Virtual Muhitini Yaratish va Faollashtirish
```bash
# Papkaga kiring
cd python_project

# Virtual muhit yarating
python3 -m venv venv

# Muhitni faollashtiring:
# Linux / macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. Kutubxonalarni O'rnatish
```bash
pip install -r requirements.txt
```

### 3. Bazani Yaratish va Ishga Tushirish
Bitta buyruq orqali baza avtomatik yaratiladi, 12 ta xodim va 5 ta filial boshlang'ich ma'lumotlari kiritiladi va server ishga tushadi:
```bash
python run.py
```

Server quyidagi manzilda ishga tushadi:
👉 **http://localhost:5000**
👉 **http://localhost:5000/api/docs** — Interaktiv Swagger / OpenAPI Hujjatlari (barcha API so'rovlarni brauzerda sinab ko'rish mumkin)

---

## 👥 Boshlang'ich Foydalanuvchilar (Barcha xodimlar paroli: `12345`)

| Login | Lavozim | F.I.Sh | Telefon |
| :--- | :--- | :--- | :--- |
| `direktor` | Bosh Direktor | Rahimov Akmal | +998 90 123 45 67 |
| `kadrlar` | Kadrlar (HR) | Usmonova Nilufar | +998 90 123 45 68 |
| `statistikachi` | Statistikachi | Saidov Bobur | +998 90 123 45 69 |
| `ish_boshqaruvchi` | Ish boshqaruvchi (Manager) | Karimov Dilshod | +998 90 123 45 70 |
| `veterinar` | Veterinar | Qodirov Elyor | +998 90 123 45 71 |
| `elektrik` | Bosh Elektrik | Yoqubov Farrux | +998 90 123 45 72 |
| `slesar` | Slesar-mexanik | Mirzayev G'ayrat | +998 90 123 45 73 |
| `haydovchi_tuxum` | Tuxum tashuvchi | Sobirov Hasan | +998 90 123 45 74 |
| `haydovchi_yem` | Yem tashuvchi | Sobirov Husan | +998 90 123 45 75 |
| `qorovul` | Xavfsizlik (Qorovul) | Aliyev Jasur | +998 90 123 45 76 |
| `oshpaz` | Bosh Oshpaz | Xalilova Komila | +998 90 123 45 77 |
| `tozalik` | Sanitariya mas'uli | Nematov Laziz | +998 90 123 45 78 |

---

## 📡 REST API Endpointlar Ro'yxati

### 1. Autentifikatsiya va Xodimlar
* `POST /api/auth/login` — Foydalanuvchi tizimga kirishi (avtomatik davomat belgilash bilan)
* `GET /api/auth/users` — Barcha faol xodimlar ro'yxati
* `POST /api/auth/change-password` — Shaxsiy login va parolni o'zgartirish

### 2. Korxona Filiallari (5 ta filial)
* `GET /api/branches` — Filiallar ro'yxati (Chortoq, Pop, Yangiqo'rg'on, Kosonsoy, Norin)
* `PUT /api/branches/<branch_id>` — Filial quvvati va ko'rsatkichlarini yangilash

### 3. Davomat va O'rinbosarlik (Attendance & Substitution)
* `GET /api/attendance?date=YYYY-MM-DD` — Kunlik davomat jurnali
* `POST /api/attendance/check-in` — Kelish/Ketish va O'rinbosarlik qaydi

### 4. Slesar 10 Bosqichli Grafigi va 3 Daqiqalik Alertlar
* `GET /api/slesar/milestones` — 10 ta kunlik reja bosqichi (07:00, 07:45, 09:00, ..., 17:00)
* `POST /api/slesar/milestones/<id>/complete` — Bosqichni bajarilgan deb belgilash

### 5. Topshiriqlar va 1-5 Yulduz Baholash (Tasks & Stars)
* `GET /api/tasks?role=slesar` — Topshiriqlar ro'yxati
* `POST /api/tasks` — Yangi topshiriq biriktirish
* `PUT /api/tasks/<id>/status` — Topshiriq holatini yangilash (jarayonda / bajarildi)
* `POST /api/tasks/<id>/evaluate` — Ish boshqaruvchi yoki direktor tomonidan 1-5 yulduz bilan baholash

### 6. Ombor va Inventarizatsiya (Inventory)
* `GET /api/inventory?branchId=chortoq` — Ombor qoldiqlari (yem, dori, ehtiyot qismlar, tara)
* `POST /api/inventory` — Yangi mahsulot qo'shish
* `PUT /api/inventory/<id>` — Miqdorni yangilash

### 7. Parrandalar Vazni (Chicken Weights)
* `GET /api/weights?branchId=chortoq` — Qafaslar bo'yicha vazn o'lchovlari
* `POST /api/weights` — Yangi vazn o'lchovi kiritish

### 8. Umumiy Chat (Chat & Voice Memos)
* `GET /api/chat` — So'nggi 100 ta xabarlar
* `POST /api/chat` — Xabar yoki audio-yozuv yuborish

### 9. Shaxsiy Zametkalar (Personal Notes)
* `GET /api/notes?userId=1` — Xodimning shaxsiy eslatmalari
* `POST /api/notes` — Yangi eslatma yozish

---

## 💻 Frontend (React) ni Ishga Tushirish

Agar frontendni ishlab chiquvchi rejimida ishlatmoqchi bo'lsangiz:
```bash
cd frontend
npm install
npm run dev
```
Frontend `http://localhost:3000` da ochiladi va Python backend `http://localhost:5000` bilan ishlaydi.

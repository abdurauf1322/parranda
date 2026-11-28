"""
UYCHI PARRANDA - Initial Database Seeder
Populates SQLite/PostgreSQL with initial 12 users, 5 branches,
role-isolated operational schedules, initial inventory, and tasks.
"""

from models import (
    db, User, Branch, SlesarMilestoneModel,
    BranchInventoryItemModel, Task
)

ROLE_DEFAULT_MILESTONES = {
    'slesar': [
        ("07:00", "06:57", "Qushlarni boqish (Yem tarqatgichni oldinga surish)", "1-bino va 2-bino"),
        ("07:45", "07:42", "Yem tarqatgichni orqaga qaytarish", "Barcha liniyalar tekshiruvi"),
        ("09:00", "08:57", "Kunlik hisobot & Tuxum yig'ish lentasini yoqish", "Mexanizm tezligi nazorati"),
        ("10:00", "09:57", "Yem tarqatgichni oldinga surish (2-ovqatlantirish)", "Bunker sathi nazorati"),
        ("11:00", "10:57", "Tuxum yig'ish (2-bosqich saralash)", "Tuxum sifati nazorati"),
        ("12:00", "11:57", "Yem tarqatgichni orqaga qaytarish", "Motor va tasmalar holati"),
        ("13:00", "12:57", "Kunlik tushki hisobot va suv ta'minoti tekshiruvi", "Nippel va suv bosimi"),
        ("14:00", "13:57", "Yem tarqatgichni oldinga surish & Go'ng chiqarish lentasi", "Go'ng chiqarish transportyori"),
        ("15:45", "15:42", "Yem tarqatgichni orqaga qaytarish", "Asboblar texnik ko'rigi"),
        ("17:00", "16:57", "Yakuniy kunlik texnik hisobot va xavfsizlik topshirish", "Smena yakuni"),
    ],
    'veterinar': [
        ("08:00", "07:57", "Ertalabki qushlar ko'rigi va nobudlik nazorati", "1-5 binolar umumiy klinikasi"),
        ("10:30", "10:27", "Emlash (vaksina) va vitamin kompleksi berish", "Suv tizimi orqali dozalash"),
        ("13:30", "13:27", "Bio-xavfsizlik va dezbar'er tekshiruvi", "Kirish darvozasi va sexlar"),
        ("16:00", "15:57", "Vaksina muzlatkich harorati va kunlik vet-jurnal", "2°C–8°C nazorat"),
    ],
    'elektrik': [
        ("07:30", "07:27", "Asosiy shchit, generator va avtomatika ko'rigi", "Kuchlanish va faza nazorati"),
        ("10:00", "09:57", "Ventilyatsiya va harorat datchiklari tekshiruvi", "Barcha sexlar havo almashinuvi"),
        ("13:00", "12:57", "Yoritish taymerlari va yem motorlari diagnostikasi", "Qizib ketish va tok kuchi"),
        ("16:30", "16:27", "Elektr hisoblagich ko'rsatkichi va foto-hisobot", "Kunlik sarf yozuvi"),
    ],
    'haydovchi_tuxum': [
        ("07:30", "07:27", "Avtomobil texnik ko'rigi va harorat nazorati", "Kuzov tozaligi va tormoz"),
        ("09:00", "08:57", "Tuxum yashiklarini yuklash va nakladnoy", "Omborxonadan qabul qilish"),
        ("12:00", "11:57", "Buyurtmachilarga tuxum yetkazib berish reysi", "Yo'nalish varaqasi bo'yicha"),
        ("16:30", "16:27", "Bo'sh tara topshirish va yuk xati foto-hisoboti", "Kassa va omborga topshirish"),
    ],
    'haydovchi_yem': [
        ("07:30", "07:27", "Yuk mashinasi va gidravlika texnik ko'rigi", "Yoqilg'i va shinalar"),
        ("09:30", "09:27", "Tegirmon / zavoddan kombikorm yuklash", "Tarozi va tonnaj cheki"),
        ("12:30", "12:27", "Filiallar silos va omborlariga yem tushirish", "Bunker sathi bilan solishtirish"),
        ("16:00", "15:57", "Kunlik tashilgan tonnaj hisoboti va foto", "Omborchi tasdig'i"),
    ],
    'qorovul': [
        ("08:00", "07:57", "Smena qabul qilish va asosiy darvoza nazorati", "Plomba va kalitlar"),
        ("12:00", "11:57", "Fabrika perimetri va omborlar aylanishi", "Tashqi devor va darvozalar"),
        ("16:00", "15:57", "Kirish-chiqish avtomobillar va mehmonlar jurnali", "Yuk hujjatlarini tekshirish"),
        ("20:00", "19:57", "Tungi navbatchilik, yoritish va kamera nazorati", "Tungi xavfsizlik rejimi"),
    ],
    'oshpaz': [
        ("07:00", "06:57", "Ertalabki nonushta tayyorlash va tarqatish", "Xodimlar oshxonasi"),
        ("11:30", "11:27", "Tushlik tayyorlash va porsiyalar nazorati", "Issiq ovqat menyusi"),
        ("15:00", "14:57", "Oshxona gigiyenasi va mahsulot qoldig'i tekshiruvi", "Muzlatkich va ombor"),
        ("18:00", "17:57", "Kechki ovqat va oshxona dezinfeksiyasi", "Smena yakuni tozaligi"),
    ],
    'tozalik': [
        ("08:00", "07:57", "1-2 binolar yo'laklari va maishiy xonalar tozaligi", "Ertalabki supurish-yuvish"),
        ("11:00", "10:57", "Sanuzel va kirish dezbar'erlarini dezinfeksiya qilish", "Xlor va maxsus eritma"),
        ("14:30", "14:27", "Tuxum saralash va qadoqlash xonasi sanitariyasi", "Nam tozalash"),
        ("17:00", "16:57", "Chiqindilarni olib chiqish va foto-hisobot", "Oldin/keyin suratlari"),
    ],
}


def ensure_role_milestones_seeded():
    """Ensures every operational role has its default schedule rows."""
    added = False
    for role, items in ROLE_DEFAULT_MILESTONES.items():
        if SlesarMilestoneModel.query.filter_by(role=role).count() == 0:
            for t, alt, title, desc in items:
                db.session.add(
                    SlesarMilestoneModel(
                        role=role,
                        time=t,
                        alert_time=alt,
                        title=title,
                        description=desc,
                        status='kutilmoqda',
                    )
                )
            added = True
    if added:
        db.session.commit()


def seed_database(flask_app=None):
    if flask_app is None:
        from app import app as flask_app
    with flask_app.app_context():
        print("Baza jadvallarini yaratish...")
        db.create_all()

        # 1. 12 Users (Har bir rol uchun bittadan mas'ul xodim)
        if User.query.count() == 0:
            print("12 ta xodim akkauntlarini yuklash...")
            initial_users = [
                ("direktor", "Rahimov Akmal", "direktor", "+998901234567", "chortoq"),
                ("kadrlar", "Usmonova Nilufar", "kadrlar", "+998901234568", "chortoq"),
                ("statistikachi", "Saidov Bobur", "statistikachi", "+998901234569", "chortoq"),
                ("ish_boshqaruvchi", "Karimov Dilshod", "ish_boshqaruvchi", "+998901234570", "chortoq"),
                ("veterinar", "Qodirov Elyor", "veterinar", "+998901234571", "chortoq"),
                ("elektrik", "Yoqubov Farrux", "elektrik", "+998901234572", "chortoq"),
                ("slesar", "Mirzayev G'ayrat", "slesar", "+998901234573", "chortoq"),
                ("haydovchi_tuxum", "Sobirov Hasan", "haydovchi_tuxum", "+998901234574", "chortoq"),
                ("haydovchi_yem", "Sobirov Husan", "haydovchi_yem", "+998901234575", "chortoq"),
                ("qorovul", "Aliyev Jasur", "qorovul", "+998901234576", "chortoq"),
                ("oshpaz", "Xalilova Komila", "oshpaz", "+998901234577", "chortoq"),
                ("tozalik", "Nematov Laziz", "tozalik", "+998901234578", "chortoq"),
            ]

            for uname, fname, role, phone, branch in initial_users:
                user = User(
                    username=uname,
                    full_name=fname,
                    role=role,
                    phone=phone,
                    branch_id=branch
                )
                user.set_password("12345")
                db.session.add(user)

        # 2. 5 Enterprise Branches
        if Branch.query.count() == 0:
            print("5 ta filialni yuklash...")
            branches = [
                ("chortoq", "Chortoq Asosiy Filiali", "Chortoq tumani, Navoiy MFY", 60000, 58000, 52000, "Karimov Dilshod"),
                ("pop", "Pop Parrandachilik Filiali", "Pop tumani, Kelachi MFY", 45000, 42000, 38000, "Tursunov Jamshid"),
                ("yangiqorgon", "Yangiqo'rg'on Tuxum Kompleksi", "Yangiqo'rg'on tumani, Bekobod", 50000, 49000, 44000, "Ergashev Sherzod"),
                ("kosonsoy", "Kosonsoy Broyler & Tuxum", "Kosonsoy tumani, Tergachi", 40000, 39500, 35000, "Mamajonov Otabek"),
                ("norin", "Norin Parranda Fermasi", "Norin tumani, Haqqulobod", 35000, 34000, 30000, "Qo'chqorov Sardor"),
            ]
            for bid, name, loc, cap, birds, egg_t, mgr in branches:
                b = Branch(
                    branch_id=bid,
                    name=name,
                    location=loc,
                    bird_capacity=cap,
                    current_birds=birds,
                    daily_egg_target=egg_t,
                    manager_name=mgr
                )
                db.session.add(b)

        # 3. Role-Specific Operational Schedules
        ensure_role_milestones_seeded()

        # 4. Initial Branch Inventory
        if BranchInventoryItemModel.query.count() == 0:
            print("Boshlang'ich ombor zaxiralarini yuklash...")
            inventory = [
                ("chortoq", "Kombikorm PK-1 (Tuxum beruvchi)", "yem", 12500, "kg", 3000),
                ("chortoq", "Bug'doy doni (Saralangan)", "yem", 8200, "kg", 2000),
                ("chortoq", "Enrofloksatsin 10% eritma", "dori", 45, "litr", 10),
                ("chortoq", "Vitamin kompleksi (Chiktonik)", "dori", 80, "litr", 15),
                ("chortoq", "Nippel tomizgichlar (zaxira)", "ehtiyot_qismlar", 350, "dona", 50),
                ("chortoq", "Tuxum yashigi (30 talik karton)", "tara", 15000, "dona", 2000),
                ("pop", "Kombikorm PK-1", "yem", 9200, "kg", 2500),
                ("yangiqorgon", "Kombikorm PK-1", "yem", 11000, "kg", 3000),
            ]
            for bid, iname, cat, qty, unit, thres in inventory:
                inv = BranchInventoryItemModel(
                    branch_id=bid,
                    name=iname,
                    category=cat,
                    quantity=qty,
                    unit=unit,
                    min_threshold=thres,
                    last_updated="2026-10-12 08:30"
                )
                db.session.add(inv)

        # 5. Sample Tasks across roles
        if Task.query.count() == 0:
            print("Namunaviy vazifalar...")
            sample_tasks = [
                ("1-bino suv bosimi va filtrlarni tekshirish", "Suv filtrlari tozalansin, nippel bosimi 1.5 bar bo'lsin", "slesar", "Mirzayev G'ayrat", "1-Bino", "yuqori", "11:30"),
                ("3-bino ventilyatsiya datchigini sozlash", "Harorat datchigini kalibrovka qilish", "elektrik", "Yoqubov Farrux", "3-Bino", "yuqori", "11:00"),
                ("2-bino qushlariga Chiktonik vitamin berish", "Suv tizimi orqali 10 litr qo'shish", "veterinar", "Qodirov Elyor", "2-Bino", "orta", "14:00"),
                ("Chortoq markaziga 150 yashik tuxum yetkazish", "Nakladnoy va foto-hisobot bilan topshirish", "haydovchi_tuxum", "Sobirov Hasan", "Ombor", "yuqori", "13:00"),
                ("Asosiy darvoza tungi yoritish chiroqlarini tekshirish", "Smena topshirishdan oldin nazorat", "qorovul", "Aliyev Jasur", "Darvoza", "orta", "18:00"),
            ]
            for t_title, t_desc, t_role, t_name, t_bldg, t_prio, t_due in sample_tasks:
                db.session.add(Task(
                    title=t_title,
                    description=t_desc,
                    assigned_by_name="Karimov Dilshod",
                    assigned_by_role="ish_boshqaruvchi",
                    assigned_to_role=t_role,
                    assigned_to_name=t_name,
                    building=t_bldg,
                    priority=t_prio,
                    status="yangi",
                    due_time=t_due
                ))

        db.session.commit()
        print("Muvaffaqiyatli yakunlandi! Baza to'liq tayyor.")

if __name__ == '__main__':
    seed_database()

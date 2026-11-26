"""
UYCHI PARRANDA - Initial Database Seeder
Runs once to populate SQLite/PostgreSQL with initial 12 users, 5 branches,
10 Slesar milestones, initial inventory, and tasks.
"""

from models import (
    db, User, Branch, SlesarMilestoneModel,
    BranchInventoryItemModel, Task, PersonalNoteModel
)

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

        # 3. 10 Slesar Milestones (3-minute alerts)
        if SlesarMilestoneModel.query.count() == 0:
            print("Slesar 10 ta operatsion bosqichini yuklash...")
            milestones = [
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
            ]
            for t, alt, title, desc in milestones:
                m = SlesarMilestoneModel(
                    time=t,
                    alert_time=alt,
                    title=title,
                    description=desc,
                    status='kutilmoqda'
                )
                db.session.add(m)

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

        # 5. Sample Task
        if Task.query.count() == 0:
            print("Namunaviy vazifalar...")
            sample_task = Task(
                title="1-bino suv bosimi va filtrlarni tekshirish",
                description="Suv filtrlari tozalansin, har bir qafas qatoridagi nippel bosimi 1.5 bar ekanligi o'lchansin",
                assigned_by_name="Karimov Dilshod",
                assigned_by_role="ish_boshqaruvchi",
                assigned_to_role="slesar",
                assigned_to_name="Mirzayev G'ayrat",
                building="1-Bino",
                priority="yuqori",
                status="yangi",
                due_time="11:30"
            )
            db.session.add(sample_task)

        db.session.commit()
        print("Muvaffaqiyatli yakunlandi! Baza to'liq tayyor.")

if __name__ == '__main__':
    seed_database()

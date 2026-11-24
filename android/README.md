# Uychi Parranda - Android Native Notification APK

Ushbu alohida Android ilova Google Firebase Cloud Messaging (FCM) orqali:
1. PWA ilova yopiq bo'lganda;
2. Brauzer (Chrome) ochilmagan bo'lganda;
3. Telefon ekrani qulflangan holatda ham;
Uychi Parranda serveridan keladigan barcha tezkor bildirishnomalarni Android Notification Manager orqali ovoz va tebranish bilan qabul qiladi.

---

## 1. Firebase Loyihasi Sozlash (Bir martalik)
1. [Firebase Console](https://console.firebase.google.com/) sahifasiga kiring va yangi loyiha oching (yoki mavjud loyihani tanlang).
2. Android ilova qo'shing:
   - **Package name:** `uz.uychiparranda.notification`
3. Yuklab olingan `google-services.json` faylini `android/app/google-services.json` o'rniga qo'ying.
4. **Project Settings -> Service accounts** bo'limiga o'ting:
   - "Generate new private key" tugmasini bosing va yuklangan `.json` faylini backend papkasiga `firebase_service_account.json` nomi bilan saqlang (yoki Railway Variables bo'limida `FIREBASE_SERVICE_ACCOUNT_JSON` ga to'g'ridan-to'g'ri joylang).

---

## 2. APK Build qilish (Kompyuterda)
Android loyihasi `uychi_parranda_python_project/android` papkasida joylashgan.

1. **Android Studio orqali:**
   - Android Studio'da `uychi_parranda_python_project/android` papkasini oching.
   - **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** menyusini bosing.
   - Tayyor APK `android/app/build/outputs/apk/debug/app-debug.apk` manzilida hosil bo'ladi.

2. **Terminal (Gradle) orqali:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

---

## 3. Telefonga o'rnatish va Ishlatish
1. `app-debug.apk` faylini Telegram yoki USB kabel orqali xodimlar telefoniga yuklang va o'rnating.
2. Ilovani oching:
   - Android 13+ da so'raladigan **"Bildirishnomalarga ruxsat berish" (Allow Notifications)** tugmasini bosing.
   - **Backend Server URL:** Railway hosting manzilingizni kiriting (`https://parranda-production.up.railway.app`).
   - **Username:** Xodim loginini kiriting (masalan: `abdulaziz_raximjonov`).
   - **Xodim Vazifasi (Roli):** Ro'yxatdan kerakli rolni tanlang (`elektrik`, `slesar`, `veterinar` va h.k.).
   - **"Saqlash va Ulanish"** tugmasini bosing.
3. Bo'ldi! Ilovani butunlay yopib qo'ysangiz ham (Recent Apps'dan surib tashlasangiz ham), backend topshiriq yoki e'lon berganda FCM orqali telefon ekrani yoqiladi, ovoz va tebranish bilan bildirishnoma ko'rsatiladi.

package uz.uychiparranda.notification.service

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import uz.uychiparranda.notification.UychiApplication
import uz.uychiparranda.notification.security.SecurityHelper

class UychiFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "UychiFCMService"
        const val KEY_FCM_TOKEN = "fcm_token"
        const val KEY_USER_ROLE = "user_role"
        const val KEY_USERNAME = "username"
        const val KEY_PASSWORD = "password"
        const val KEY_BACKEND_URL = "backend_url"
        const val KEY_IS_LOGGED_IN = "is_logged_in"
        const val DEFAULT_BACKEND_URL = "https://parranda-production.up.railway.app"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Yangi FCM token olindi.") // Token va parollar logga chiqarilmaydi!
        val securePrefs = SecurityHelper.getSecurePreferences(this)
        securePrefs.edit().putString(KEY_FCM_TOKEN, token).apply()

        // Faqat login holatida fon tokenini yangilash
        if (securePrefs.getBoolean(KEY_IS_LOGGED_IN, false)) {
            val backendUrl = securePrefs.getString(KEY_BACKEND_URL, DEFAULT_BACKEND_URL) ?: DEFAULT_BACKEND_URL
            val username = securePrefs.getString(KEY_USERNAME, null)
            val password = securePrefs.getString(KEY_PASSWORD, null)
            val role = securePrefs.getString(KEY_USER_ROLE, null)
            if (username != null && password != null) {
                syncTokenWithBackend(backendUrl, token, username, password, role)
            }
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "FCM Xabar qabul qilindi.")

        val eventId = remoteMessage.data["event_id"]
            ?: remoteMessage.data["tag"]
            ?: "evt_${remoteMessage.sentTime}"

        // PERSISTENT STORAGE orqali tekshirish (ilova qayta ishga tushganda yoki telefon o'chib yonganda ham saqlanadi)
        if (SecurityHelper.isEventAlreadyProcessed(this, eventId)) {
            Log.d(TAG, "Dublikat event_id aniqlandi ($eventId), xabar qayta ko'rsatilmaydi.")
            return
        }

        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: "Uychi Parranda"

        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: "Yangi vazifa yoki e'lon mavjud"

        val targetUrl = remoteMessage.data["url"] ?: "/"

        showSystemNotification(eventId, title, body, targetUrl)
    }

    private fun showSystemNotification(eventId: String, title: String, body: String, targetUrl: String) {
        val securePrefs = SecurityHelper.getSecurePreferences(this)
        val backendUrl = securePrefs.getString(KEY_BACKEND_URL, DEFAULT_BACKEND_URL) ?: DEFAULT_BACKEND_URL
        val fullUrl = if (targetUrl.startsWith("http")) targetUrl else "$backendUrl$targetUrl"

        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(fullUrl)).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            eventId.hashCode(),
            browserIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notificationBuilder = NotificationCompat.Builder(this, UychiApplication.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(longArrayOf(0, 300, 150, 300, 150, 450))
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val stableNotificationId = Math.abs(eventId.hashCode())
        notificationManager.notify(stableNotificationId, notificationBuilder.build())
    }

    private fun syncTokenWithBackend(backendUrl: String, token: String, username: String, password: String, role: String?) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val json = JSONObject().apply {
                    put("token", token)
                    put("username", username)
                    put("password", password)
                    put("role", role ?: "xodim")
                    put("deviceName", "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
                }

                val mediaType = "application/json; charset=utf-8".toMediaType()
                val body = json.toString().toRequestBody(mediaType)
                val request = Request.Builder()
                    .url("${backendUrl.trimEnd('/')}/api/fcm/register")
                    .post(body)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (response.code == 401 || response.code == 403) {
                        // Sessiya yoki parol o'zgargan bo'lsa, xavfsiz holda login holatini soxtalashtirmaslik
                        val securePrefs = SecurityHelper.getSecurePreferences(this@UychiFirebaseMessagingService)
                        securePrefs.edit().putBoolean(KEY_IS_LOGGED_IN, false).apply()
                        Log.w(TAG, "Autentifikatsiya muddati tugagan yoki xato. Qayta login talab qilinadi.")
                    } else {
                        Log.d(TAG, "Backend token sync: code=${response.code}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Backend token sync tarmoq xatosi.")
            }
        }
    }
}

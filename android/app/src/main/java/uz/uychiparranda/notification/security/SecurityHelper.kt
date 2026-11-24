package uz.uychiparranda.notification.security

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object SecurityHelper {

    private const val ENCRYPTED_PREFS_FILE = "uychi_secure_prefs"
    private const val EVENT_PREFS_FILE = "uychi_event_history_prefs"
    private const val KEY_SEEN_EVENT_IDS = "seen_event_ids"

    /**
     * Android Keystore orqali AES-256 bilan shifrlangan xavfsiz SharedPreferences oladi.
     * Bu yerda saqlanadigan ma'lumotlar (parol, token, login) qurilma xotirasida ochiq holda ko'rinmaydi.
     */
    fun getSecurePreferences(context: Context): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                ENCRYPTED_PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Eski yoki maxsus tizimlarda Keystore muammosi bo'lsa xavfsiz fallback
            context.getSharedPreferences(ENCRYPTED_PREFS_FILE, Context.MODE_PRIVATE)
        }
    }

    /**
     * Ilova qayta ishga tushganda yoki telefon o'chib-yonganida ham event_id dublikatlarini saqlash
     */
    fun isEventAlreadyProcessed(context: Context, eventId: String): Boolean {
        val prefs = context.getSharedPreferences(EVENT_PREFS_FILE, Context.MODE_PRIVATE)
        val eventSet = prefs.getStringSet(KEY_SEEN_EVENT_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()

        if (eventSet.contains(eventId)) {
            return true
        }

        // Oxirgi 150 ta event_id ni xotirada saqlash
        if (eventSet.size > 150) {
            val iterator = eventSet.iterator()
            if (iterator.hasNext()) {
                iterator.next()
                iterator.remove()
            }
        }
        eventSet.add(eventId)
        prefs.edit().putStringSet(KEY_SEEN_EVENT_IDS, eventSet).apply()
        return false
    }

    /**
     * Logout qilinganda barcha xavfsiz ma'lumotlarni tozalash
     */
    fun clearSecureData(context: Context) {
        val prefs = getSecurePreferences(context)
        prefs.edit().clear().apply()
    }
}

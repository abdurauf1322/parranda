package uz.uychiparranda.notification

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import uz.uychiparranda.notification.databinding.ActivityMainBinding
import uz.uychiparranda.notification.service.UychiFirebaseMessagingService

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val requestNotificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                Toast.makeText(this, "Bildirishnomalarga ruxsat berildi!", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Diqqat: Bildirishnoma ruxsatisiz xabarlar ko'rinmaydi!", Toast.LENGTH_LONG).show()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        loadSavedSettings()
        checkNotificationPermission()

        binding.btnLoginSync.setOnClickListener {
            performLoginAndSync()
        }

        binding.btnLogout.setOnClickListener {
            performLogout()
        }
    }

    private fun loadSavedSettings() {
        val prefs = getSharedPreferences(UychiFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
        binding.etBackendUrl.setText(prefs.getString(UychiFirebaseMessagingService.KEY_BACKEND_URL, UychiFirebaseMessagingService.DEFAULT_BACKEND_URL))
        binding.etUsername.setText(prefs.getString(UychiFirebaseMessagingService.KEY_USERNAME, ""))
        binding.etPassword.setText(prefs.getString(UychiFirebaseMessagingService.KEY_PASSWORD, ""))

        val isLoggedIn = prefs.getBoolean(UychiFirebaseMessagingService.KEY_IS_LOGGED_IN, false)
        updateUiState(isLoggedIn)

        fetchFcmToken()
    }

    private fun updateUiState(isLoggedIn: Boolean) {
        if (isLoggedIn) {
            val prefs = getSharedPreferences(UychiFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
            val uName = prefs.getString(UychiFirebaseMessagingService.KEY_USERNAME, "")
            val uRole = prefs.getString(UychiFirebaseMessagingService.KEY_USER_ROLE, "")
            binding.tvUserStatus.text = "Ulangan: $uName (Lavozim: $uRole)"
            binding.tvUserStatus.setTextColor(0xFF10B981.toInt())
            binding.btnLoginSync.visibility = View.GONE
            binding.btnLogout.visibility = View.VISIBLE
        } else {
            binding.tvUserStatus.text = "Holat: Tizimga ulanmagan"
            binding.tvUserStatus.setTextColor(0xFFEF4444.toInt())
            binding.btnLoginSync.visibility = View.VISIBLE
            binding.btnLogout.visibility = View.GONE
        }
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun fetchFcmToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                binding.tvTokenStatus.text = "FCM Token: ${token.take(16)}... (Faol)"
                val prefs = getSharedPreferences(UychiFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().putString(UychiFirebaseMessagingService.KEY_FCM_TOKEN, token).apply()
            } else {
                binding.tvTokenStatus.text = "FCM Token kutilmoqda yoki sozlanmagan"
            }
        }
    }

    private fun performLoginAndSync() {
        val backendUrl = binding.etBackendUrl.text.toString().trim()
        val username = binding.etUsername.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

        if (backendUrl.isEmpty() || username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Iltimos, server manzili, login va parolni kiriting!", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnLoginSync.isEnabled = false
        binding.btnLoginSync.text = "Autentifikatsiyadan o'tilmoqda..."

        FirebaseMessaging.getInstance().token.addOnCompleteListener { tokenTask ->
            val token = if (tokenTask.isSuccessful) tokenTask.result else "offline_token_${System.currentTimeMillis()}"

            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val client = OkHttpClient()
                    val json = JSONObject().apply {
                        put("token", token)
                        put("username", username)
                        put("password", password)
                        put("deviceName", "${Build.MANUFACTURER} ${Build.MODEL}")
                    }

                    val mediaType = "application/json; charset=utf-8".toMediaType()
                    val body = json.toString().toRequestBody(mediaType)
                    val request = Request.Builder()
                        .url("${backendUrl.trimEnd('/')}/api/fcm/register")
                        .post(body)
                        .build()

                    val response = client.newCall(request).execute()
                    val responseStr = response.body?.string() ?: ""

                    withContext(Dispatchers.Main) {
                        binding.btnLoginSync.isEnabled = true
                        binding.btnLoginSync.text = "Tizimga Kirish va Bog'lash"

                        if (response.isSuccessful) {
                            val respJson = JSONObject(responseStr)
                            val userObj = respJson.optJSONObject("user")
                            val role = userObj?.optString("role") ?: "xodim"

                            val prefs = getSharedPreferences(UychiFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
                            prefs.edit()
                                .putString(UychiFirebaseMessagingService.KEY_BACKEND_URL, backendUrl)
                                .putString(UychiFirebaseMessagingService.KEY_USERNAME, username)
                                .putString(UychiFirebaseMessagingService.KEY_PASSWORD, password)
                                .putString(UychiFirebaseMessagingService.KEY_USER_ROLE, role)
                                .putString(UychiFirebaseMessagingService.KEY_FCM_TOKEN, token)
                                .putBoolean(UychiFirebaseMessagingService.KEY_IS_LOGGED_IN, true)
                                .apply()

                            updateUiState(true)
                            Toast.makeText(this@MainActivity, "Muvaffaqiyatli ulandi! ($role)", Toast.LENGTH_LONG).show()
                        } else {
                            Toast.makeText(this@MainActivity, "Login xatoligi: Login yoki parol noto'g'ri!", Toast.LENGTH_LONG).show()
                        }
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        binding.btnLoginSync.isEnabled = true
                        binding.btnLoginSync.text = "Tizimga Kirish va Bog'lash"
                        Toast.makeText(this@MainActivity, "Serverga ulanib bo'lmadi: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    private fun performLogout() {
        val prefs = getSharedPreferences(UychiFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
        val backendUrl = prefs.getString(UychiFirebaseMessagingService.KEY_BACKEND_URL, UychiFirebaseMessagingService.DEFAULT_BACKEND_URL) ?: UychiFirebaseMessagingService.DEFAULT_BACKEND_URL
        val token = prefs.getString(UychiFirebaseMessagingService.KEY_FCM_TOKEN, "")
        val username = prefs.getString(UychiFirebaseMessagingService.KEY_USERNAME, "")
        val password = prefs.getString(UychiFirebaseMessagingService.KEY_PASSWORD, "")

        binding.btnLogout.isEnabled = false
        binding.btnLogout.text = "Chiqilmoqda..."

        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (!token.isNullOrEmpty()) {
                    val client = OkHttpClient()
                    val json = JSONObject().apply {
                        put("token", token)
                        put("username", username)
                        put("password", password)
                    }
                    val mediaType = "application/json; charset=utf-8".toMediaType()
                    val body = json.toString().toRequestBody(mediaType)
                    val request = Request.Builder()
                        .url("${backendUrl.trimEnd('/')}/api/fcm/unregister")
                        .post(body)
                        .build()
                    client.newCall(request).execute()
                }
            } catch (e: Exception) {
                // Logout tarmoq xatosi bo'lsa ham lokal tozalanadi
            }

            withContext(Dispatchers.Main) {
                binding.btnLogout.isEnabled = true
                binding.btnLogout.text = "Hisobdan Chiqish"
                prefs.edit()
                    .putBoolean(UychiFirebaseMessagingService.KEY_IS_LOGGED_IN, false)
                    .remove(UychiFirebaseMessagingService.KEY_PASSWORD)
                    .apply()
                updateUiState(false)
                Toast.makeText(this@MainActivity, "Hisobdan chiqildi va qurilma uzildi.", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

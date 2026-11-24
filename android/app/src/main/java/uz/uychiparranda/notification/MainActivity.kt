package uz.uychiparranda.notification

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.ArrayAdapter
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

    private val roles = listOf(
        "direktor", "bosh_energetik", "bosh_muhandis",
        "elektrik", "slesar", "veterinar", "operator", "omborchi"
    )

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

        setupRoleSpinner()
        loadSavedSettings()
        checkNotificationPermission()

        binding.btnSaveAndSync.setOnClickListener {
            saveAndSyncSettings()
        }

        binding.btnTestNotification.setOnClickListener {
            testLocalNotification()
        }
    }

    private fun setupRoleSpinner() {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, roles)
        binding.spinnerRole.adapter = adapter
    }

    private fun loadSavedSettings() {
        val prefs = getSharedPreferences(UychiFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
        binding.etBackendUrl.setText(prefs.getString(UychiFirebaseMessagingService.KEY_BACKEND_URL, UychiFirebaseMessagingService.DEFAULT_BACKEND_URL))
        binding.etUsername.setText(prefs.getString(UychiFirebaseMessagingService.KEY_USERNAME, ""))

        val savedRole = prefs.getString(UychiFirebaseMessagingService.KEY_USER_ROLE, "elektrik")
        val roleIndex = roles.indexOf(savedRole)
        if (roleIndex >= 0) {
            binding.spinnerRole.setSelection(roleIndex)
        }

        val currentToken = prefs.getString(UychiFirebaseMessagingService.KEY_FCM_TOKEN, null)
        if (currentToken != null) {
            binding.tvTokenStatus.text = "FCM Token faol: ${currentToken.take(16)}..."
        } else {
            fetchFcmToken()
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
                binding.tvTokenStatus.text = "FCM Token faol: ${token.take(16)}..."
                val prefs = getSharedPreferences(UychiFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().putString(UychiFirebaseMessagingService.KEY_FCM_TOKEN, token).apply()
            } else {
                binding.tvTokenStatus.text = "FCM Token olishda xatolik: ${task.exception?.message}"
            }
        }
    }

    private fun saveAndSyncSettings() {
        val backendUrl = binding.etBackendUrl.text.toString().trim()
        val username = binding.etUsername.text.toString().trim()
        val role = binding.spinnerRole.selectedItem.toString()

        if (backendUrl.isEmpty()) {
            Toast.makeText(this, "Backend URL manzilini kiriting!", Toast.LENGTH_SHORT).show()
            return
        }

        val prefs = getSharedPreferences(UychiFirebaseMessagingService.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(UychiFirebaseMessagingService.KEY_BACKEND_URL, backendUrl)
            .putString(UychiFirebaseMessagingService.KEY_USERNAME, username)
            .putString(UychiFirebaseMessagingService.KEY_USER_ROLE, role)
            .apply()

        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            sendRegistrationToBackend(backendUrl, token, username, role)
        }
    }

    private fun sendRegistrationToBackend(backendUrl: String, token: String, username: String, role: String) {
        binding.btnSaveAndSync.isEnabled = false
        binding.btnSaveAndSync.text = "Sinxronlanmoqda..."

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val json = JSONObject().apply {
                    put("token", token)
                    put("username", username)
                    put("role", role)
                    put("deviceName", "${Build.MANUFACTURER} ${Build.MODEL}")
                }

                val mediaType = "application/json; charset=utf-8".toMediaType()
                val body = json.toString().toRequestBody(mediaType)
                val request = Request.Builder()
                    .url("${backendUrl.trimEnd('/')}/api/fcm/register")
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                val success = response.isSuccessful

                withContext(Dispatchers.Main) {
                    binding.btnSaveAndSync.isEnabled = true
                    binding.btnSaveAndSync.text = "Saqlash va Ulanish"
                    if (success) {
                        Toast.makeText(this@MainActivity, "Serverga muvaffaqiyatli ulandi!", Toast.LENGTH_LONG).show()
                    } else {
                        Toast.makeText(this@MainActivity, "Server xatosi: ${response.code}", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnSaveAndSync.isEnabled = true
                    binding.btnSaveAndSync.text = "Saqlash va Ulanish"
                    Toast.makeText(this@MainActivity, "Ulanishda xatolik: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun testLocalNotification() {
        Toast.makeText(this, "Sinov bildirishnomasi jo'natildi", Toast.LENGTH_SHORT).show()
    }
}

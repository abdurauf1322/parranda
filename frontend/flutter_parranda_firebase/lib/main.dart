import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'services/firestore_service.dart';
import 'services/offline_sync_manager.dart';
import 'services/alarm_service.dart';
import 'models/models.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const UychiParrandaApp());
}

class UychiParrandaApp extends StatelessWidget {
  const UychiParrandaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<FirestoreService>(create: (_) => FirestoreService()),
        ChangeNotifierProvider<OfflineSyncManager>(create: (_) => OfflineSyncManager()),
        ChangeNotifierProvider<RecurringAlarmManager>(create: (_) => RecurringAlarmManager()),
      ],
      child: MaterialApp(
        title: 'UYCHI PARRANDA - Parrandachilik Fabrikasi',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          primaryColor: const Color(0xFFF59E0B),
          scaffoldBackgroundColor: const Color(0xFF0F172A),
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFFF59E0B),
            secondary: Color(0xFF10B981),
            surface: Color(0xFF1E293B),
          ),
        ),
        home: const FarmHomeScreen(),
      ),
    );
  }
}

class FarmHomeScreen extends StatelessWidget {
  const FarmHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final syncManager = context.watch<OfflineSyncManager>();
    final alarmManager = context.watch<RecurringAlarmManager>();
    final firestore = context.read<FirestoreService>();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.egg, color: Color(0xFFF59E0B)),
            const SizedBox(width: 8),
            const Text(
              'UYCHI PARRANDA',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          // Online/Offline sync status badge
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: syncManager.isOnline ? const Color(0x2210B981) : const Color(0x22EF4444),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: syncManager.isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  syncManager.isOnline ? Icons.cloud_done : Icons.cloud_off,
                  size: 14,
                  color: syncManager.isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                ),
                const SizedBox(width: 4),
                Text(
                  syncManager.isOnline ? 'Online Synced' : 'Offline Cache',
                  style: TextStyle(
                    fontSize: 11,
                    color: syncManager.isOnline ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // 3-Minute Alarm Banner if active
          if (alarmManager.isActive)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: const Color(0xFFEF4444).withOpacity(0.9),
              child: Row(
                children: [
                  const Icon(Icons.alarm_on, color: Colors.white, size: 28),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '3 DAQIQALIK OGOHLANTIRISH: ${alarmManager.activeTitle}',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        Text(
                          'Keyingi signal: ${alarmManager.secondsRemaining ~/ 60}:${(alarmManager.secondsRemaining % 60).toString().padLeft(2, '0')} (Signal: ${alarmManager.cycleCount} marta)',
                          style: const TextStyle(fontSize: 12, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () => alarmManager.markDone(),
                    icon: const Icon(Icons.check_circle, size: 18),
                    label: const Text('Bajarildi'),
                  ),
                ],
              ),
            ),
          // Task stream from Firestore (Cached offline & Auto-synced online)
          Expanded(
            child: StreamBuilder<List<FarmTaskModel>>(
              stream: firestore.streamTasks(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text('Xatolik: ${snapshot.error}'));
                }
                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                final tasks = snapshot.data!;
                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: tasks.length,
                  itemBuilder: (context, idx) {
                    final t = tasks[idx];
                    return Card(
                      color: const Color(0xFF1E293B),
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(t.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${t.assignedToRole} • Holati: ${t.status}'),
                        trailing: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF59E0B),
                          ),
                          onPressed: () {
                            alarmManager.start3MinAlarm(title: t.title, taskId: t.id);
                          },
                          child: const Text('3 min ogohlantirish', style: TextStyle(color: Colors.black)),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

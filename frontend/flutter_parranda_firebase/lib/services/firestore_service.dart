import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';
import '../firebase_options.dart';

class FirestoreService {
  late final FirebaseFirestore _firestore;

  FirestoreService() {
    // Configure Cloud Firestore with Offline Persistence enabled
    _firestore = FirebaseFirestore.instanceFor(
      app: FirebaseFirestore.instance.app,
      databaseId: DefaultFirebaseOptions.databaseId,
    );

    // CRITICAL: Enable local caching for 100% offline mode
    _firestore.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );
  }

  FirebaseFirestore get db => _firestore;

  // ==================== PERSONAL NOTES (Zametkalar) ====================
  // Stream only the current user's notes, listening to local cache & cloud
  Stream<List<PersonalNoteModel>> getPersonalNotesStream(String userId) {
    return _firestore
        .collection('personal_notes')
        .where('userId', isEqualTo: userId)
        .snapshots(includeMetadataChanges: true)
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => PersonalNoteModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  Future<void> savePersonalNote(PersonalNoteModel note) async {
    // Automatically saved to local cache if offline, synced to cloud when online
    await _firestore
        .collection('personal_notes')
        .doc(note.id)
        .set(note.toMap(), SetOptions(merge: true));
  }

  Future<void> deletePersonalNote(String noteId) async {
    await _firestore.collection('personal_notes').doc(noteId).delete();
  }

  // ==================== ATTENDANCE ====================
  Stream<List<AttendanceModel>> getAttendanceStream() {
    return _firestore
        .collection('attendance')
        .orderBy('date', descending: true)
        .snapshots(includeMetadataChanges: true)
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => AttendanceModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  Future<void> recordAttendance(AttendanceModel attendance) async {
    await _firestore
        .collection('attendance')
        .doc(attendance.id)
        .set(attendance.toMap(), SetOptions(merge: true));
  }

  // ==================== TASKS ====================
  Stream<List<FarmTaskModel>> getTasksStream() {
    return _firestore
        .collection('tasks')
        .snapshots(includeMetadataChanges: true)
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => FarmTaskModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  Future<void> saveTask(FarmTaskModel task) async {
    await _firestore
        .collection('tasks')
        .doc(task.id)
        .set(task.toMap(), SetOptions(merge: true));
  }

  Future<void> updateTaskStatus(String taskId, String newStatus, {int? score}) async {
    final Map<String, dynamic> updates = {'status': newStatus};
    if (score != null) {
      updates['evaluationScore'] = score;
    }
    await _firestore.collection('tasks').doc(taskId).update(updates);
  }

  // ==================== USERS / EMPLOYEES ====================
  Stream<List<UserModel>> getUsersStream() {
    return _firestore
        .collection('users')
        .snapshots(includeMetadataChanges: true)
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => UserModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  Future<void> saveUser(UserModel user) async {
    await _firestore
        .collection('users')
        .doc(user.id)
        .set(user.toMap(), SetOptions(merge: true));
  }

  Future<void> deleteUser(String userId) async {
    await _firestore.collection('users').doc(userId).delete();
  }

  // Force network reconnection test
  Future<void> reconnect() async {
    await _firestore.enableNetwork();
  }
}

// Flutter 3-minute recurring audio alert & notification manager
import 'dart:async';
import 'package:flutter/foundation.dart';

class RecurringAlarmManager extends ChangeNotifier {
  Timer? _timer;
  int _secondsRemaining = 180; // 3 minutes = 180s
  bool _isActive = false;
  String _activeTitle = '';
  String? _taskId;
  int _cycleCount = 0;
  bool _isRinging = false;

  bool get isActive => _isActive;
  int get secondsRemaining => _secondsRemaining;
  String get activeTitle => _activeTitle;
  String? get taskId => _taskId;
  int get cycleCount => _cycleCount;
  bool get isRinging => _isRinging;

  void start3MinAlarm({required String title, String? taskId}) {
    _isActive = true;
    _activeTitle = title;
    _taskId = taskId;
    _secondsRemaining = 180;
    _cycleCount = 0;
    _isRinging = false;
    _timer?.cancel();

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_isActive) {
        timer.cancel();
        return;
      }

      if (_secondsRemaining > 0) {
        _secondsRemaining--;
        notifyListeners();
      } else {
        // 3 minutes elapsed! Trigger alarm sound and notification
        _cycleCount++;
        _isRinging = true;
        _secondsRemaining = 180; // reset for next 3 minutes cycle
        _playAlarmSound();
        notifyListeners();
      }
    });

    notifyListeners();
  }

  void markDone() {
    _isActive = false;
    _isRinging = false;
    _timer?.cancel();
    _timer = null;
    notifyListeners();
  }

  void _playAlarmSound() {
    // In Flutter, play system notification tone or audioplayers
    debugPrint('🔔 [ALARM] 3 daqiqa o‘tdi! Ogohlantirish ovozi yangramoqda: $_activeTitle');
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

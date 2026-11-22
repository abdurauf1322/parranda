import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

enum SyncState {
  onlineSynced,
  onlineSyncing,
  offlineCached,
}

class OfflineSyncManager extends ChangeNotifier {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription? _subscription;

  bool _isOnline = true;
  bool _hasPendingWrites = false;
  DateTime? _lastSyncTime;

  bool get isOnline => _isOnline;
  bool get hasPendingWrites => _hasPendingWrites;
  DateTime? get lastSyncTime => _lastSyncTime;

  SyncState get syncState {
    if (!_isOnline) return SyncState.offlineCached;
    if (_hasPendingWrites) return SyncState.onlineSyncing;
    return SyncState.onlineSynced;
  }

  OfflineSyncManager() {
    _initConnectivity();
  }

  Future<void> _initConnectivity() async {
    final results = await _connectivity.checkConnectivity();
    _updateOnlineStatus(results);

    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      _updateOnlineStatus(results);
    });
  }

  void _updateOnlineStatus(List<ConnectivityResult> results) {
    final online = results.any((r) => r != ConnectivityResult.none);
    if (_isOnline != online) {
      _isOnline = online;
      if (online) {
        _lastSyncTime = DateTime.now();
      }
      notifyListeners();
    }
  }

  void updatePendingWrites(bool pending) {
    if (_hasPendingWrites != pending) {
      _hasPendingWrites = pending;
      if (!pending && _isOnline) {
        _lastSyncTime = DateTime.now();
      }
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

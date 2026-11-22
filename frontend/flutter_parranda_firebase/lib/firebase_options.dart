// File generated for UYCHI PARRANDA Flutter integration
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static const String databaseId =
      'ai-studio-uychiparranda-d5ac90a7-3f85-4c8b-bee8-f64e82a5c14f';

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return android;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAJt4wsqMxiW4lV1e8pos9VZanTCBSiolA',
    appId: '1:15891202943:web:dec8733b9f8f42082d104a',
    messagingSenderId: '15891202943',
    projectId: 'ascendant-key-gv9wh',
    authDomain: 'ascendant-key-gv9wh.firebaseapp.com',
    storageBucket: 'ascendant-key-gv9wh.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAJt4wsqMxiW4lV1e8pos9VZanTCBSiolA',
    appId: '1:15891202943:android:dec8733b9f8f42082d104a',
    messagingSenderId: '15891202943',
    projectId: 'ascendant-key-gv9wh',
    storageBucket: 'ascendant-key-gv9wh.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAJt4wsqMxiW4lV1e8pos9VZanTCBSiolA',
    appId: '1:15891202943:ios:dec8733b9f8f42082d104a',
    messagingSenderId: '15891202943',
    projectId: 'ascendant-key-gv9wh',
    storageBucket: 'ascendant-key-gv9wh.firebasestorage.app',
  );
}

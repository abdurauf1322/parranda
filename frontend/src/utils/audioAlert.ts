/**
 * Web Audio API synthesizer for industrial poultry farm alarms & notifications
 * Works offline, no external audio files required.
 */

class SoundSynthesizer {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  public initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * 3-Minute Recurring Urgent Alarm
   * Audible, clear multi-tone siren designed for industrial poultry farm notifications.
   * Repeats every 3 minutes until "Bajarildi" is clicked.
   */
  public play3MinUrgentAlarm() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      // High-pitched attention sequence: 3 sets of dual pulses
      const pulses = [
        { freq: 950, start: 0, dur: 0.15 },
        { freq: 1200, start: 0.18, dur: 0.22 },
        { freq: 950, start: 0.45, dur: 0.15 },
        { freq: 1200, start: 0.63, dur: 0.22 },
        { freq: 1400, start: 0.90, dur: 0.30 },
      ];

      pulses.forEach((p) => {
        const startTime = now + p.start;
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(p.freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + p.dur);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(startTime);
        osc.stop(startTime + p.dur + 0.05);
      });
    } catch (e) {
      console.warn('Audio alert not allowed yet without user gesture', e);
    }
  }

  /**
   * Milestone Alert (industrial chime for Slesar operational schedule)
   */
  public playMilestoneAlarm() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const freqs = [587.33, 880.0, 1174.66, 880.0, 1174.66]; // D5, A5, D6, A5, D6
      freqs.forEach((freq, idx) => {
        const startTime = now + idx * 0.18;
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } catch (e) {
      console.warn('Audio alert not allowed yet without user gesture', e);
    }
  }

  /**
   * "Bajarildi" (Completed) - Celebratory success chime
   */
  public playTaskDoneTone() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      // Rising cheerful triad: C5 -> E5 -> G5 -> C6
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const startTime = now + idx * 0.09;
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Harmonious Dual Chime (Acoustic Enterprise Notification)
   * High-end pleasant chime for status updates, sync completion, and smooth confirmations
   */
  public playHarmonicChime() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      // Elegant major 6th dyad: E5 (659.25Hz) & C#6 (1108.73Hz)
      const notes = [659.25, 1108.73];
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.08;
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Polite Reminder Chime for upcoming schedule
   */
  public playPoliteReminder() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const notes = [440.0, 554.37, 659.25]; // A major triad
      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.1;
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Subtle woodblock thud for invalid boundaries or input errors
   */
  public playValidationErrorTone() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignored
    }
  }

  /**
   * Short success / check-in chime
   */
  public playSuccessTone() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignored
    }
  }

  /**
   * Chat message incoming notification beep
   */
  public playMessageBeep() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1000, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignored
    }
  }

  /**
   * High Priority Alert Siren
   */
  public playUrgentWarning() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.2);
      osc.frequency.linearRampToValueAtTime(440, now + 0.4);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Ignored
    }
  }

  /**
   * Request native browser Notification permission on user gesture
   */
  public async requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      this.initContext();
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.playSuccessTone();
        this.sendBrowserNotification(
          "✅ Bildirishnomalar yoqildi",
          "Uychi Parranda: Slesar texnologik vaqtlari va 3 daqiqalik signallar muvaffaqiyatli ulandi."
        );
      }
      return permission;
    } catch {
      return Notification.permission;
    }
  }

  /**
   * Get current notification permission state
   */
  public getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Trigger native browser Notification & hardware vibration
   * Works on both Android Chrome PWA and desktop
   */
  public sendBrowserNotification(title: string, body: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Hardware vibration on Android phones (very loud attention signal)
    if ('navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 450]);
      } catch {
        // Ignored
      }
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const options = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [300, 150, 300, 150, 450],
      tag: `up-alert-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: {
        url: '/',
        timestamp: Date.now(),
      },
    };

    // 1. Android Chrome PWA: Use ServiceWorker showNotification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.showNotification(title, options);
        })
        .catch(() => {
          try {
            new Notification(title, options);
          } catch {
            // Ignored
          }
        });

      // Also dispatch direct message to SW controller if present
      if (navigator.serviceWorker.controller) {
        try {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            options,
          });
        } catch {
          // Ignored
        }
      }
    } else {
      // 2. Desktop fallback
      try {
        new Notification(title, options);
      } catch {
        // Ignored
      }
    }
  }
}

export const soundSynth = new SoundSynthesizer();

// Automatically resume Web Audio context on the first user interaction anywhere
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    soundSynth.initContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

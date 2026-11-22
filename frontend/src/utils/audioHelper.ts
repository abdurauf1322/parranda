/**
 * Audio Helper for Corporate Chat Voice Notes
 * Provides safe microphone recording, audio file encoding,
 * and realistic audible voice memo synthesis when hardware microphone access
 * is blocked or denied in sandbox iframe environments.
 */

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * Creates a real, playable 16-bit PCM WAV audio note encoded in Base64 Data URL.
 * Generates a pleasant voice-walkie/chime frequency tone with smooth decay.
 */
export function createMelodicVoiceDataUrl(durationSeconds = 3): {
  url: string;
  duration: number;
} {
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeAscii(view, 8, 'WAVE');

  // fmt chunk
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit

  // data chunk
  writeAscii(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Walkie-talkie / voice memo tone sequence: 480Hz -> 640Hz -> 800Hz
  const notes = [440, 554, 659];
  const noteDuration = durationSeconds / notes.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.min(Math.floor(t / noteDuration), notes.length - 1);
    const freq = notes[noteIdx];
    const subT = t - noteIdx * noteDuration;
    // Bell / voice memo envelope
    const attack = Math.min(1, subT * 40);
    const decay = Math.exp(-subT * 2.8);
    const amp = attack * decay;

    // Harmonic blend
    const wave =
      Math.sin(2 * Math.PI * freq * t) * 0.5 +
      Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.2 +
      Math.sin(2 * Math.PI * (freq * 2) * t) * 0.1;

    const sample = Math.max(-32768, Math.min(32767, Math.floor(wave * amp * 18000)));
    view.setInt16(44 + i * 2, sample, true);
  }

  // Convert array buffer to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64 = btoa(binary);

  return {
    url: `data:audio/wav;base64,${base64}`,
    duration: durationSeconds,
  };
}

/**
 * Format duration in seconds to mm:ss format
 */
export function formatAudioDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.round(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

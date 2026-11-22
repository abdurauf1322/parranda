import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { createMelodicVoiceDataUrl, formatAudioDuration } from '../../utils/audioHelper';
import {
  MessageSquare,
  Send,
  Sparkles,
  Paperclip,
  Megaphone,
  Mic,
  Square,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Pause,
  Volume2,
  Building2,
  Filter,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Music,
  Maximize2,
  Download,
  Headphones,
  Clock,
  RotateCcw,
  Trash2
} from 'lucide-react';

const QUICK_FARM_MESSAGES = [
  'Grafik bo\'yicha ozuqa tarqatildi, liniya soz.',
  'Barcha binolarda harorat va shamollatish me\'yorida.',
  'Tuxum yig\'ish va saralash ishlari boshlandi.',
  'Elektr tarmog\'i va generator sinovdan o\'tkazildi.',
  'Dezinfeksiya va tozalik ishlari yakunlandi.',
  'Tushlik tayyor, marhamat oshxonaga!',
];

export const GeneralChat: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    currentUser,
    branches,
    selectedBranchFilter,
    setSelectedBranchFilter,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'announcements' | 'media'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Media Attachment States
  const [attachedFile, setAttachedFile] = useState<{
    url: string;
    objectUrl?: string;
    type: 'image' | 'video' | 'audio' | 'file';
    name: string;
    duration?: number;
  } | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingSecondsRef = useRef(0);
  const recordingStartTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{
    text: string;
    type: 'info' | 'warning' | 'success';
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // Audio Playback state tracking for voice messages
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState<{ [id: string]: number }>({});
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Voice note preview & playback before sending (Qayta eshitib ko'rish)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewPlaybackRate, setPreviewPlaybackRate] = useState<number>(1);

  // Push-to-Talk (Bosib turib gapirish) States & Refs
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const [slideCancelTriggered, setSlideCancelTriggered] = useState(false);
  const pressStartTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isHoldingRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const isStartingRecordingRef = useRef<boolean>(false);
  const pendingStopOnStartRef = useRef<boolean>(false);
  const wasHoldActionRef = useRef<boolean>(false);

  // Media Lightbox Modal (safe alternative to window.open)
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    title: string;
  } | null>(null);

  // Hidden File Inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const canPostAnnouncements = ['direktor', 'ish_boshqaruvchi', 'statistikachi', 'kadrlar'].includes(
    currentUser.role
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioElementRef.current) {
        activeAudioElementRef.current.pause();
        activeAudioElementRef.current = null;
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Audio Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Set up preview audio when an audio file is recorded or attached
  useEffect(() => {
    if (attachedFile?.type === 'audio' && (attachedFile.objectUrl || attachedFile.url)) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }

      const audioSrc = attachedFile.objectUrl || attachedFile.url;
      const isMockPath = !audioSrc.startsWith('data:') && !audioSrc.startsWith('http') && !audioSrc.startsWith('blob:');
      const playableSrc = isMockPath ? createMelodicVoiceDataUrl(attachedFile.duration || 4).url : audioSrc;

      const audio = new Audio(playableSrc);
      audio.playbackRate = previewPlaybackRate;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setPreviewDuration(Math.round(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        setPreviewCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPreviewPlaying(false);
        setPreviewCurrentTime(0);
      };

      audio.onpause = () => {
        setIsPreviewPlaying(false);
      };

      audio.onerror = () => {
        setIsPreviewPlaying(false);
      };

      previewAudioRef.current = audio;
      setIsPreviewPlaying(false);
      setPreviewCurrentTime(0);
      setPreviewDuration(attachedFile.duration || 4);

      return () => {
        audio.pause();
        audio.src = '';
        previewAudioRef.current = null;
      };
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setIsPreviewPlaying(false);
      setPreviewCurrentTime(0);
      setPreviewDuration(0);
    }
  }, [attachedFile?.objectUrl, attachedFile?.url, attachedFile?.type]);

  // Preview Audio Player Controls
  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      setPlayingAudioId(null);
    }

    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      if (previewAudioRef.current.ended || previewCurrentTime >= (previewDuration || 1)) {
        previewAudioRef.current.currentTime = 0;
        setPreviewCurrentTime(0);
      }
      previewAudioRef.current
        .play()
        .then(() => setIsPreviewPlaying(true))
        .catch((err) => {
          console.warn('Preview play error:', err);
          setIsPreviewPlaying(false);
        });
    }
  };

  const handleSeekPreview = (newTime: number) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = newTime;
      setPreviewCurrentTime(newTime);
    }
  };

  const handleRestartPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = 0;
      setPreviewCurrentTime(0);
      previewAudioRef.current
        .play()
        .then(() => setIsPreviewPlaying(true))
        .catch(() => setIsPreviewPlaying(false));
    }
  };

  const cyclePreviewSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(previewPlaybackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPreviewPlaybackRate(newSpeed);
    if (previewAudioRef.current) {
      previewAudioRef.current.playbackRate = newSpeed;
    }
  };

  const handleReRecord = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setAttachedFile(null);
    setIsPreviewPlaying(false);
    setPreviewCurrentTime(0);
    setTimeout(() => {
      startRecording();
    }, 150);
  };

  const handleDiscardVoiceNote = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setAttachedFile(null);
    setIsPreviewPlaying(false);
    setPreviewCurrentTime(0);
    setNoticeMessage({
      text: "Ovozli xabar bekor qilindi.",
      type: 'info',
    });
    setTimeout(() => setNoticeMessage(null), 2500);
  };

  const handleSendVoiceNote = () => {
    if (!attachedFile) return;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    sendChatMessage({
      message: inputText.trim(),
      isAnnouncement,
      attachmentUrl: attachedFile.url || attachedFile.objectUrl,
      attachmentType: 'audio',
      audioDuration: previewDuration || attachedFile.duration || Math.max(1, recordingSecondsRef.current),
      fileName: attachedFile.name,
      scheduledDateTime,
    });

    setInputText('');
    setAttachedFile(null);
    setIsAnnouncement(false);
    setScheduledDateTime('');
    setNoticeMessage({
      text: "Ovozli xabar muvaffaqiyatli yuborildi!",
      type: 'success',
    });
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  // Generate an audible demo voice note (failsafe for sandboxed iframe environments)
  const attachDemoVoiceNote = () => {
    const demo = createMelodicVoiceDataUrl(4);
    setAttachedFile({
      url: demo.url,
      objectUrl: demo.url,
      type: 'audio',
      name: `Ovozli_xabar_${new Date().toLocaleTimeString('uz-UZ').slice(0, 5)}.wav`,
      duration: demo.duration,
    });
    setNoticeMessage({
      text: "Sinov ovozli xabari tayyorlandi. Uni quyidagi pleer orqali tinglab ko'rishingiz, boshidan qayta eshitishingiz va jo'natishingiz mumkin.",
      type: 'info',
    });
  };

  // Start Voice Message Recording
  const startRecording = async () => {
    if (isStartingRecordingRef.current || isRecordingRef.current) return;
    isStartingRecordingRef.current = true;
    pendingStopOnStartRef.current = false;
    setNoticeMessage(null);

    // Stop currently playing audio
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      setPlayingAudioId(null);
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    }

    // If browser/device does not support getUserMedia
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Brauzer audio yozishni qollab-quvvatlamaydi, namuna ovozli xabar ishlatiladi.');
      isStartingRecordingRef.current = false;
      attachDemoVoiceNote();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus',
        'audio/wav',
      ];
      let mimeType = '';
      for (const t of candidateTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const objectUrl = URL.createObjectURL(audioBlob);
        const finalDuration = recordingSecondsRef.current > 0 ? recordingSecondsRef.current : 2;

        // Immediately set attachedFile with objectUrl for zero-lag preview playback
        setAttachedFile({
          url: objectUrl,
          objectUrl,
          type: 'audio',
          name: `Ovozli_xabar_${new Date().toLocaleTimeString('uz-UZ').slice(0, 5)}.webm`,
          duration: finalDuration,
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAttachedFile((prev) => {
            if (!prev || prev.type !== 'audio') return prev;
            return {
              ...prev,
              url: base64Audio,
            };
          });
          setNoticeMessage({
            text: `Ovozli xabar yozildi (${finalDuration}s). Uni pastdagi pleer orqali qayta eshitib ko'rishingiz, pauza qilishingiz yoki yuborishingiz mumkin!`,
            type: 'success',
          });
        };
        reader.readAsDataURL(audioBlob);
      };

      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);
      recordingStartTimeRef.current = Date.now();
      recorder.start(150); // 150ms timeslice for steady chunk streaming
      
      isStartingRecordingRef.current = false;
      isRecordingRef.current = true;
      setIsRecording(true);

      // Agar foydalanuvchi getUserMedia yuklanayotganda tugmani qo'yib yuborgan bo'lsa
      if (pendingStopOnStartRef.current || (!isHoldingRef.current && (Date.now() - pressStartTimeRef.current >= 280))) {
        pendingStopOnStartRef.current = false;
        setTimeout(() => {
          stopRecording();
        }, 150);
      }
    } catch (err: unknown) {
      console.warn('Mikrofon ruxsati yoki qurilmasi mavjud emas:', (err as Error)?.message || err);
      isStartingRecordingRef.current = false;
      isRecordingRef.current = false;
      setIsRecording(false);
      attachDemoVoiceNote();
      setNoticeMessage({
        text: "Brauzerda mikrofon ruxsati berilmadi yoki bloklangan. Test ovozli xabari tayyorlandi — qayta eshitishingiz yoki audio fayl yuklashingiz mumkin.",
        type: 'warning',
      });
    }
  };

  const stopRecording = () => {
    if (isStartingRecordingRef.current) {
      pendingStopOnStartRef.current = true;
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      const elapsed = Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000));
      recordingSecondsRef.current = elapsed;
      try {
        mediaRecorderRef.current.requestData();
      } catch (e) {
        console.warn('requestData error:', e);
      }
      mediaRecorderRef.current.stop();
    }
    isRecordingRef.current = false;
    setIsRecording(false);
  };

  const cancelRecording = () => {
    isStartingRecordingRef.current = false;
    pendingStopOnStartRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('cancelRecording error:', e);
      }
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    audioChunksRef.current = [];
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAttachedFile(null);
    setNoticeMessage({
      text: "Ovoz yozish bekor qilindi.",
      type: 'info',
    });
    setTimeout(() => setNoticeMessage(null), 2000);
  };

  // Push-to-Talk (Bosib turib gapirish) Handlers
  const handleMicPressStart = (clientX: number, clientY: number) => {
    pressStartTimeRef.current = Date.now();
    touchStartPosRef.current = { x: clientX, y: clientY };
    isHoldingRef.current = true;
    wasHoldActionRef.current = false;
    setSlideCancelTriggered(false);
    setIsHoldingMic(true);

    if (!isRecordingRef.current && !isStartingRecordingRef.current) {
      startRecording();
    }
  };

  const handleMicPressMove = (clientX: number, _clientY: number) => {
    if (!isHoldingRef.current || !touchStartPosRef.current) return;
    const deltaX = clientX - touchStartPosRef.current.x;
    // Chapga 45px yoki undan ortiq surilsa, bekor qilish holatiga o'tadi
    if (deltaX < -45) {
      if (!slideCancelTriggered) setSlideCancelTriggered(true);
    } else {
      if (slideCancelTriggered) setSlideCancelTriggered(false);
    }
  };

  const handleMicPressEnd = () => {
    if (!isHoldingRef.current) return;
    const pressDuration = Date.now() - pressStartTimeRef.current;
    const wasSlideCancelled = slideCancelTriggered;

    isHoldingRef.current = false;
    setIsHoldingMic(false);
    setSlideCancelTriggered(false);
    touchStartPosRef.current = null;

    if (wasSlideCancelled) {
      cancelRecording();
      wasHoldActionRef.current = true;
      return;
    }

    // Agar 280ms dan ortiq bosib turilgan bo'lsa (Hold to talk), qo'yib yuborilganda yozuv to'xtatiladi
    if (pressDuration >= 280) {
      wasHoldActionRef.current = true;
      if (isRecordingRef.current) {
        stopRecording();
      } else if (isStartingRecordingRef.current) {
        pendingStopOnStartRef.current = true;
      }
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isHoldingRef.current) {
        handleMicPressEnd();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isRecording, slideCancelTriggered]);

  // Handle Audio File Selection (.mp3, .wav, .m4a, etc.)
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setNoticeMessage({
        text: "Audio fayl hajmi 15MB dan oshmasligi kerak!",
        type: 'warning',
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        url: reader.result as string,
        objectUrl,
        type: 'audio',
        name: file.name,
        duration: 8,
      });
      setNoticeMessage({
        text: `Audio fayl biriktirildi: ${file.name}. Uni qayta eshitib ko'rishingiz va jo'natishingiz mumkin.`,
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Image Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setNoticeMessage({
        text: "Rasm hajmi 8MB dan oshmasligi kerak!",
        type: 'warning',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        url: reader.result as string,
        type: 'image',
        name: file.name,
      });
      setNoticeMessage({
        text: `Rasm biriktirildi: ${file.name}`,
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Video Selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setNoticeMessage({
        text: "Video hisobot hajmi 25MB dan oshmasligi kerak!",
        type: 'warning',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        url: reader.result as string,
        type: 'video',
        name: file.name,
      });
      setNoticeMessage({
        text: `Video hisobot biriktirildi: ${file.name}`,
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    sendChatMessage({
      message: inputText.trim(),
      isAnnouncement,
      attachmentUrl: attachedFile?.url,
      attachmentType: attachedFile?.type,
      audioDuration: attachedFile?.duration,
      fileName: attachedFile?.name,
      scheduledDateTime,
    });

    setInputText('');
    setAttachedFile(null);
    setIsAnnouncement(false);
    setScheduledDateTime('');
    setNoticeMessage(null);
  };

  const handleQuickSend = (text: string) => {
    sendChatMessage({
      message: text,
      isAnnouncement: false,
    });
  };

  // Play voice message with fail-safe fallback to synthesized melody
  const togglePlayAudio = (messageId: string, audioUrl?: string, duration?: number) => {
    if (!audioUrl) return;

    if (playingAudioId === messageId && activeAudioElementRef.current) {
      if (!activeAudioElementRef.current.paused) {
        activeAudioElementRef.current.pause();
        setPlayingAudioId(null);
        return;
      }
    }

    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current = null;
    }

    // Determine playable URL: if invalid or relative mock path, fallback to pleasant synthesized note
    const isMockPath = !audioUrl.startsWith('data:') && !audioUrl.startsWith('http') && !audioUrl.startsWith('blob:');
    const playableUrl = isMockPath ? createMelodicVoiceDataUrl(Math.min(duration || 3, 5)).url : audioUrl;

    try {
      const audio = new Audio(playableUrl);
      activeAudioElementRef.current = audio;
      setPlayingAudioId(messageId);

      audio.ontimeupdate = () => {
        setPlaybackTime((prev) => ({
          ...prev,
          [messageId]: audio.currentTime,
        }));
      };

      audio.onended = () => {
        setPlayingAudioId(null);
        setPlaybackTime((prev) => ({
          ...prev,
          [messageId]: 0,
        }));
      };

      audio.onpause = () => {
        if (playingAudioId === messageId) {
          setPlayingAudioId(null);
        }
      };

      audio.onerror = () => {
        // Fallback tone if network URL fails
        try {
          const fallback = new Audio(createMelodicVoiceDataUrl(Math.min(duration || 3, 5)).url);
          activeAudioElementRef.current = fallback;
          fallback.ontimeupdate = () => {
            setPlaybackTime((prev) => ({
              ...prev,
              [messageId]: fallback.currentTime,
            }));
          };
          fallback.onended = () => {
            setPlayingAudioId(null);
            setPlaybackTime((prev) => ({ ...prev, [messageId]: 0 }));
          };
          fallback.play().catch(() => setPlayingAudioId(null));
        } catch {
          setPlayingAudioId(null);
        }
      };

      audio.play().catch(() => {
        setPlayingAudioId(null);
      });
    } catch {
      setPlayingAudioId(null);
    }
  };

  const handleSeekAudio = (
    messageId: string,
    newTime: number,
    audioUrl?: string,
    duration?: number
  ) => {
    if (activeAudioElementRef.current && playingAudioId === messageId) {
      activeAudioElementRef.current.currentTime = newTime;
      setPlaybackTime((prev) => ({ ...prev, [messageId]: newTime }));
    } else {
      setPlaybackTime((prev) => ({ ...prev, [messageId]: newTime }));
      if (audioUrl) {
        togglePlayAudio(messageId, audioUrl, duration);
        setTimeout(() => {
          if (activeAudioElementRef.current) {
            activeAudioElementRef.current.currentTime = newTime;
          }
        }, 50);
      }
    }
  };

  // Filter messages by tab and by enterprise branch
  const filteredMessages = chatMessages.filter((msg) => {
    // 1. Filter type
    if (filterType === 'announcements' && !msg.isAnnouncement) return false;
    if (filterType === 'media' && !msg.attachmentType) return false;

    // 2. Branch filter
    if (selectedBranchFilter !== 'all') {
      if (msg.senderBranchId && msg.senderBranchId !== selectedBranchFilter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        className="hidden"
        onChange={handleVideoSelect}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
        className="hidden"
        onChange={handleAudioSelect}
      />

      {/* Top Corporate Chat Header with Enterprise Branch Selector */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              "Uychi parranda" Korporativ Chati
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Barcha filiallar va ko‘p sonli lavozim egalari muloqoti</span>
              <span className="text-amber-400 font-medium">
                • {currentUser.branchName || 'Bosh Filial'}
              </span>
            </div>
          </div>
        </div>

        {/* Branch Filter & Tab Filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filial tanlash dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded-xl border border-slate-700/70 text-xs">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                Barcha Filiallar (5 ta)
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Type tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hammasi
            </button>
            <button
              onClick={() => setFilterType('announcements')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'announcements'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Megaphone className="w-3 h-3" />
              <span>E'lonlar</span>
            </button>
            <button
              onClick={() => setFilterType('media')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'media'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Media & Audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice & Helper Banner if active */}
      {noticeMessage && (
        <div
          className={`px-4 py-2 border-b text-xs flex items-center justify-between transition-all ${
            noticeMessage.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              : noticeMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {noticeMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : noticeMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{noticeMessage.text}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-slate-400 hover:text-white p-0.5"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
            <MessageSquare className="w-10 h-10 stroke-[1.5] text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">Hozircha xabarlar yo'q</p>
            <p className="text-[11px]">Ushbu bo‘lim yoki filial bo‘yicha xabar yuborish orqali muloqotni boshlang.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const roleConfig = ROLE_LABELS[msg.senderRole];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
              >
                {/* Sender Header info */}
                <div className="flex items-center gap-2 mb-1 px-1 text-xs">
                  <span className="font-semibold text-slate-200">
                    {msg.senderName}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      roleConfig?.badgeColor || 'bg-slate-700 text-slate-200 border-slate-600'
                    }`}
                  >
                    {roleConfig?.short || roleConfig?.title || msg.senderRole}
                  </span>
                  {/* Filial belgisi */}
                  {msg.senderBranch && (
                    <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-0.5 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                      <Building2 className="w-2.5 h-2.5" />
                      {msg.senderBranch}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </div>

                {/* Bubble Container */}
                <div
                  className={`relative max-w-lg sm:max-w-xl rounded-2xl p-3.5 shadow-md ${
                    msg.isAnnouncement
                      ? 'bg-gradient-to-r from-amber-950/80 to-amber-900/60 border border-amber-500/50 text-amber-100 shadow-amber-500/10'
                      : isMe
                      ? 'bg-amber-600 text-slate-950 font-medium rounded-tr-xs'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-xs'
                  }`}
                >
                  {/* Announcement Banner */}
                  {msg.isAnnouncement && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 pb-2 mb-2 border-b border-amber-500/30 uppercase tracking-wider">
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>Rasmiy Rahbariyat E'loni (Barcha filiallar uchun)</span>
                    </div>
                  )}

                  {/* Main text message */}
                  {msg.message && (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                  )}

                  {/* Audio Voice Note Player */}
                  {msg.attachmentType === 'audio' && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-slate-900/95 border border-slate-700/80 flex flex-col gap-2 min-w-[250px] sm:min-w-[280px] shadow-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(msg.id, msg.attachmentUrl, msg.audioDuration)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                              playingAudioId === msg.id
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/40'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            }`}
                            title={playingAudioId === msg.id ? "Pauza" : "Tinglash"}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                          <div>
                            <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                              <Headphones className="w-3.5 h-3.5 text-amber-400" />
                              <span>Ovozli xabar</span>
                              {playingAudioId === msg.id && (
                                <span className="text-[10px] text-emerald-400 animate-pulse font-normal">
                                  • Tinglanmoqda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              <span className="text-emerald-400 font-semibold">
                                {formatAudioDuration(playbackTime[msg.id] || 0)}
                              </span>{' '}
                              /{' '}
                              <span>
                                {formatAudioDuration(msg.audioDuration || 4)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Equalizer animation bars */}
                        <div className="flex items-end gap-1 h-5 px-1.5 shrink-0">
                          {[40, 75, 55, 90, 60, 45, 80].map((h, i) => (
                            <span
                              key={i}
                              style={{
                                height:
                                  playingAudioId === msg.id
                                    ? `${(h * ((i % 3) + 1)) % 100}%`
                                    : `${h * 0.3}%`,
                              }}
                              className={`w-1 rounded-full transition-all duration-200 ${
                                playingAudioId === msg.id
                                  ? 'bg-emerald-400 animate-bounce'
                                  : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Interactive audio scrubber slider */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                        <input
                          type="range"
                          min="0"
                          max={msg.audioDuration || 4}
                          step="0.1"
                          value={playbackTime[msg.id] || 0}
                          onChange={(e) =>
                            handleSeekAudio(
                              msg.id,
                              parseFloat(e.target.value),
                              msg.attachmentUrl,
                              msg.audioDuration
                            )
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Attachment */}
                  {msg.attachmentType === 'image' && msg.attachmentUrl && (
                    <div className="mt-2.5 rounded-xl overflow-hidden border border-white/20 bg-black/30 group">
                      <img
                        src={msg.attachmentUrl}
                        alt="Yuborilgan rasm"
                        className="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition-all"
                        onClick={() =>
                          setLightboxMedia({
                            url: msg.attachmentUrl!,
                            type: 'image',
                            title: `${msg.senderName} tomonidan yuklangan rasm`,
                          })
                        }
                      />
                      <div className="px-2.5 py-1.5 text-[10px] font-medium opacity-90 flex items-center justify-between bg-black/40">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-amber-400" />
                          <span>Rasm hisobot</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxMedia({
                              url: msg.attachmentUrl!,
                              type: 'image',
                              title: `${msg.senderName} tomonidan yuklangan rasm`,
                            })
                          }
                          className="flex items-center gap-1 text-[10px] text-amber-400 hover:underline cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Kattalashtirish</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Video Attachment */}
                  {msg.attachmentType === 'video' && msg.attachmentUrl && (
                    <div className="mt-2.5 rounded-xl overflow-hidden border border-white/20 bg-black/40">
                      <video
                        src={msg.attachmentUrl}
                        controls
                        className="w-full max-h-64 rounded-xl bg-black"
                      />
                      <div className="px-2.5 py-1 text-[10px] font-medium opacity-80 flex items-center justify-between bg-black/40">
                        <span className="flex items-center gap-1 text-amber-400">
                          <VideoIcon className="w-3 h-3" />
                          <span>Video hisobot</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxMedia({
                              url: msg.attachmentUrl!,
                              type: 'video',
                              title: `${msg.senderName} - Video hisobot`,
                            })
                          }
                          className="text-slate-300 hover:text-white flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Kengaytirish</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scheduled / Delayed message indicator */}
                  {msg.isScheduled && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 font-semibold w-fit">
                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>🔒 Kechiktirilgan xabar ({msg.delayDays} kundan keyin jo'natiladi: {msg.scheduledSendTime})</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick message chips for mobile farm workers */}
      <div className="px-4 py-2 bg-slate-850 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Tezkor shablon:
        </span>
        {QUICK_FARM_MESSAGES.map((text, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickSend(text)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] whitespace-nowrap transition-colors border border-slate-700/60 cursor-pointer"
          >
            {text}
          </button>
        ))}
      </div>

      {/* Voice Note Preview & Replay Card (Qayta eshitib ko'rish va jo'natish) */}
      {attachedFile && attachedFile.type === 'audio' && (
        <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-t-2 border-emerald-500/80 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between gap-2 border-b border-slate-750 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>Ovozli xabar tayyor</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    {formatAudioDuration(previewDuration || attachedFile.duration || 4)}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Jo'natishdan oldin tinglab ko'ring, boshidan eshiting yoki kerak bo'lsa qayta yozing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleReRecord}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Yozuvni bekor qilib, boshidan qaytadan ovoz yozish"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Qayta yozish</span>
              </button>
              <button
                type="button"
                onClick={handleDiscardVoiceNote}
                className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 rounded-lg border border-slate-700 transition-all cursor-pointer"
                title="Bekor qilish / O'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audio Player Controls & Waveform Scrubber */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
              {/* Big Play/Pause button */}
              <button
                type="button"
                onClick={togglePreviewPlay}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer shrink-0 ${
                  isPreviewPlaying
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/20 scale-105'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title={isPreviewPlaying ? "Pauza" : "Qayta eshitish (Play)"}
              >
                {isPreviewPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Restart from beginning */}
              <button
                type="button"
                onClick={handleRestartPreview}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
                title="Boshidan eshitish"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Speed Toggle (1x, 1.5x, 2x) */}
              <button
                type="button"
                onClick={cyclePreviewSpeed}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 font-mono text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
                title="Tinglash tezligi (1x / 1.5x / 2x)"
              >
                {previewPlaybackRate}x
              </button>
            </div>

            {/* Progress Slider and Dynamic Equalizer Bars */}
            <div className="flex-1 w-full flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 font-bold w-10 text-right">
                  {formatAudioDuration(previewCurrentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={previewDuration || attachedFile.duration || 1}
                  step="0.05"
                  value={previewCurrentTime}
                  onChange={(e) => handleSeekPreview(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] font-mono text-slate-400 w-10">
                  {formatAudioDuration(previewDuration || attachedFile.duration || 4)}
                </span>
              </div>

              {/* Waveform graphic bars */}
              <div className="flex items-center justify-between gap-1 h-4 px-2 sm:px-6">
                {Array.from({ length: 24 }).map((_, i) => {
                  const activeProgress = previewCurrentTime / (previewDuration || attachedFile.duration || 1);
                  const barProgress = i / 24;
                  const isPast = barProgress <= activeProgress;
                  const barHeight = Math.sin(i * 0.45) * 45 + 55;
                  return (
                    <span
                      key={i}
                      style={{
                        height: `${Math.max(
                          20,
                          isPreviewPlaying ? barHeight * ((i % 3) * 0.3 + 0.6) : barHeight * 0.5
                        )}%`,
                      }}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isPast ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Direct Send Voice Note Button */}
            <button
              type="button"
              onClick={handleSendVoiceNote}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer shrink-0"
            >
              <span>Ovozli xabarni yuborish</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Non-Audio Media Attachment Pending Bar (for images and videos) */}
      {attachedFile && attachedFile.type !== 'audio' && (
        <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 text-xs text-amber-300 font-medium">
            {attachedFile.type === 'image' && <ImageIcon className="w-4 h-4 text-amber-400" />}
            {attachedFile.type === 'video' && <VideoIcon className="w-4 h-4 text-blue-400" />}
            <span>{attachedFile.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/60"
              title="Biriktirmani bekor qilish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Recording In-Progress Studio Bar */}
      {isRecording && (
        <div className="p-3.5 bg-red-950/90 border-t-2 border-red-500 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-100 font-bold uppercase tracking-wider">
                Ovoz yozilmoqda:
              </span>
              <span className="font-mono text-sm text-amber-300 font-extrabold bg-red-900/80 px-2.5 py-0.5 rounded-lg border border-red-700">
                {formatAudioDuration(recordingSeconds)}
              </span>
              {isHoldingMic && (
                <span className="text-[11px] text-amber-200 bg-red-900/40 px-2 py-0.5 rounded-md border border-red-800 hidden sm:inline-block">
                  Bosib turilibdi (Qo'yib yuborsangiz to'xtaydi)
                </span>
              )}
            </div>

            {/* Live waving animated bars */}
            <div className="hidden sm:flex items-center gap-1 h-5 px-2">
              {[40, 80, 50, 95, 60, 85, 45, 90, 70, 40].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${(h * ((i % 4) + 1)) % 100}%` }}
                  className="w-1 bg-red-400 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Bekor qilish</span>
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>To'xtatish & Eshitib ko'rish</span>
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-800/90 border-t border-slate-700/80 flex flex-col gap-2"
      >
        {/* Delayed Message Setting via Calendar & Exact Time */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 bg-slate-900/90 rounded-xl border border-slate-700/70 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Xabarni kalendar & aniq vaqt orqali kechiktirish:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            />
            {scheduledDateTime && (
              <button
                type="button"
                onClick={() => setScheduledDateTime('')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold cursor-pointer"
                title="Tozalash (darhol yuborish)"
              >
                Darhol
              </button>
            )}
          </div>
          {scheduledDateTime && (
            <div className="w-full text-left text-[11px] text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold flex items-center gap-1.5 mt-0.5">
              <span>🔒 Belgilangan kalendar vaqti bo'yicha jo'natiladi: {scheduledDateTime.replace('T', ' ')}</span>
            </div>
          )}
        </div>

        {canPostAnnouncements && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="announcement_chk"
              checked={isAnnouncement}
              onChange={(e) => setIsAnnouncement(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-600 cursor-pointer"
            />
            <label
              htmlFor="announcement_chk"
              className="text-xs text-amber-300 font-semibold cursor-pointer select-none flex items-center gap-1"
            >
              <Megaphone className="w-3 h-3" />
              <span>Barcha filiallarga rasmiy korxona e'loni sifatida yuborish</span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Action buttons: Mic, Audio File, Image, Video */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mic / Audio Record button with Push-to-Talk (Bosib turib gapirish) */}
            <div className="relative">
              {/* Floating hint bubble while holding down */}
              {isHoldingMic && isRecording && (
                <div className="absolute bottom-full left-0 mb-3 px-3 py-1.5 bg-slate-950/95 border border-slate-700 text-xs rounded-xl shadow-2xl z-30 flex items-center gap-2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-150 backdrop-blur-sm pointer-events-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  {slideCancelTriggered ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      Qo'yib yuboring — yozuv bekor qilinadi!
                    </span>
                  ) : (
                    <span className="text-amber-300 font-medium flex items-center gap-2">
                      <span className="font-bold">🎙️ Gapiring...</span>
                      <span>Qo'yib yuboring — to'xtaydi</span>
                      <span className="text-slate-400 text-[10px]">| ⬅️ Chapga suring (bekor qilish)</span>
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  try {
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  } catch {}
                  handleMicPressStart(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  handleMicPressMove(e.clientX, e.clientY);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {}
                  handleMicPressEnd();
                }}
                onPointerCancel={(e) => {
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {}
                  if (isHoldingRef.current) {
                    cancelRecording();
                    isHoldingRef.current = false;
                    setIsHoldingMic(false);
                    setSlideCancelTriggered(false);
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  if (wasHoldActionRef.current) {
                    wasHoldActionRef.current = false;
                    return;
                  }
                  if (isRecordingRef.current) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }}
                title={
                  isRecording
                    ? "Yozishni to'xtatish va eshitib ko'rish"
                    : attachedFile?.type === 'audio'
                    ? "Ovozli xabar tayyor (Qayta eshitish)"
                    : "Ovozli xabar: Bosib turib gapiring (Hold to talk) yoki bir marta bosing"
                }
                className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none touch-none ${
                  isRecording
                    ? isHoldingMic
                      ? slideCancelTriggered
                        ? 'bg-rose-600 text-white border-rose-400 ring-4 ring-rose-500/40 scale-110'
                        : 'bg-red-500 text-white border-red-400 ring-4 ring-red-400/50 scale-110 shadow-lg shadow-red-500/40'
                      : 'bg-red-500 text-white border-red-400 animate-pulse ring-2 ring-red-400/50'
                    : attachedFile?.type === 'audio'
                    ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500'
                    : 'bg-slate-900 hover:bg-slate-750 text-slate-300 hover:text-amber-400 border-slate-700'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Audio File Upload button */}
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              title="Audio fayl yuklash (.mp3, .wav, .m4a)"
              className="p-2.5 bg-slate-900 hover:bg-slate-750 text-slate-300 hover:text-amber-400 border border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <Music className="w-4 h-4" />
            </button>

            {/* Photo / Image button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Rasm hisobot biriktirish"
              className="p-2.5 bg-slate-900 hover:bg-slate-750 text-slate-300 hover:text-amber-400 border border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Video button */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              title="Video hisobot biriktirish"
              className="p-2.5 bg-slate-900 hover:bg-slate-750 text-slate-300 hover:text-amber-400 border border-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <VideoIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              attachedFile?.type === 'audio'
                ? "Ovozli xabarga izoh qo'shing (ixtiyoriy)..."
                : isRecording
                ? "Mikrofonga gapiring... (bosib turish yoki to'xtatish)"
                : `Xabar yozing yoki mikrofonni bosib turib gapiring...`
            }
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !attachedFile}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <span>Yuborish</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Internal Media Lightbox Modal (safe in-app viewer, replaces window.open) */}
      {lightboxMedia && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-200">
            <span className="text-sm font-semibold truncate">{lightboxMedia.title}</span>
            <button
              onClick={() => setLightboxMedia(null)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white cursor-pointer"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
            {lightboxMedia.type === 'image' ? (
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.title}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-xl shadow-2xl bg-black"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

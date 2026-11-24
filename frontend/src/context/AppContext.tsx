import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  User,
  Role,
  AttendanceRecord,
  FarmTask,
  SlesarMilestone,
  PhotoReport,
  DailyFactoryReport,
  VetDiagnosis,
  ElectricityLog,
  EggTransportLog,
  FeedTransportLog,
  GuardShiftLog,
  GroceryRequest,
  SanitationTask,
  ChatMessage,
  TaskStatus,
  PersonalNote,
  BranchId,
  EnterpriseBranch,
  AppTab,
  BranchProductivityMetric,
  BranchDailyPlan,
  BranchDailyTask,
  BranchOperationalChange,
  OperationalTaskStatus,
  BranchInventoryItem,
  ChickenWeightRecord,
  AuditLog,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ATTENDANCE,
  INITIAL_TASKS,
  INITIAL_SLESAR_MILESTONES,
  INITIAL_PHOTO_REPORTS,
  INITIAL_FACTORY_REPORTS,
  INITIAL_DIAGNOSES,
  INITIAL_ELECTRICITY_LOG,
  INITIAL_EGG_TRANSPORTS,
  INITIAL_FEED_TRANSPORTS,
  INITIAL_GUARD_SHIFT,
  INITIAL_GROCERY_REQUESTS,
  INITIAL_SANITATION_TASKS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_PERSONAL_NOTES,
  ENTERPRISE_BRANCHES,
  INITIAL_BRANCH_METRICS,
  INITIAL_BRANCH_OPERATIONAL_PLANS,
  INITIAL_BRANCH_INVENTORY,
  ROLE_LABELS,
} from '../data/mockData';
import { soundSynth } from '../utils/audioAlert';
import { registerWebPushSubscription } from '../utils/webPushHelper';
import { triggerBackendPush } from '../utils/pushTrigger';
import { compressImage } from '../utils/imageCompressor';
import {
  COLLECTIONS,
  seedInitialFirestoreData,
  saveDocument,
  removeDocument,
  subscribeCollection,
} from '../services/firestoreSync';

export interface Recurring3MinAlert {
  id: string;
  title: string;
  description?: string;
  targetType: 'task' | 'milestone' | 'custom';
  targetId?: string;
  isActive: boolean;
  secondsLeft: number; // counts down from 180 to 0
  cycleCount: number;  // how many times the 3-minute alarm has triggered
  isRinging: boolean;  // whether alarm is actively sounding right now
  startedAt: string;
  nextRingTimestamp?: number; // Real wall-clock timestamp for background timer accuracy
}

export type SyncStatus = 'online_synced' | 'online_syncing' | 'offline';

interface AppContextType {
  // Auth & Current User
  currentUser: User;
  users: User[];
  isAuthenticated: boolean;
  loginUser: (
    loginInput: string,
    passwordInput: string,
    selectedRole?: Role | string
  ) => { success: boolean; message: string; user?: User };
  changeUserPassword: (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => { success: boolean; message: string };
  changeUserLogin: (
    userId: string,
    newUsername: string,
    currentPassword?: string
  ) => { success: boolean; message: string };
  changeUserCredentials: (
    userId: string,
    updates: {
      newUsername?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ) => { success: boolean; message: string; updatedUser?: User };
  switchUserWithPassword: (
    userId: string,
    password: string
  ) => { success: boolean; message: string };
  logout: () => void;
  switchRole: (role: Role) => void;
  switchUser: (userId: string) => void;
  updateUserProfile: (fullName: string, phone: string) => void;

  // HR / Kadrlar bo'limi employee management
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Attendance
  attendanceRecords: AttendanceRecord[];
  hasCheckedInToday: boolean;
  currentUserAttendance: AttendanceRecord | undefined;
  checkInAttendance: (isSubstitution: boolean, originalWorkerName?: string, substituteWorkerName?: string, notes?: string) => void;

  // Tasks
  tasks: FarmTask[];
  createTask: (task: Omit<FarmTask, 'id' | 'createdAt' | 'assignedByUserId' | 'assignedByName' | 'assignedByRole' | 'status'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, score?: number, note?: string) => void;
  resetTasksToDefault: () => void;

  // Slesar Milestones (Editable times & alerts)
  slesarMilestones: SlesarMilestone[];
  completeMilestone: (id: string, notes?: string) => void;
  activeMilestoneAlert: SlesarMilestone | null;
  dismissMilestoneAlert: () => void;
  triggerTestAlert: (milestoneId?: string) => void;
  updateMilestone: (id: string, updates: Partial<SlesarMilestone>) => void;
  addMilestone: (milestone: { time: string; title: string; description?: string }) => void;
  deleteMilestone: (id: string) => void;
  resetMilestonesToDefault: () => void;

  // 3-Minute Recurring Alarm System ("Bajarildi" tugmasi bosilmaguncha har 3 daqiqada ogohlantirish)
  recurring3MinAlert: Recurring3MinAlert | null;
  start3MinAlert: (title: string, description?: string, targetId?: string, targetType?: 'task' | 'milestone' | 'custom') => void;
  stop3MinAlert: () => void;
  markAlertCompleted: (note?: string) => void; // The "BAJARILDI" action button
  silenceAlarmSound: () => void;
  testTriggerAlarmNow: () => void;

  // Personal Notes (Zametkalar - faqat yozgan odamga ko'rinadi)
  personalNotes: PersonalNote[];
  currentUserNotes: PersonalNote[];
  addPersonalNote: (title: string, content: string, category?: PersonalNote['category'], color?: PersonalNote['color'], isPinned?: boolean) => void;
  updatePersonalNote: (id: string, updates: Partial<PersonalNote>) => void;
  deletePersonalNote: (id: string) => void;

  // Photo Reports
  photoReports: PhotoReport[];
  addPhotoReport: (title: string, category: PhotoReport['category'], imageUrl: string, notes?: string, building?: string) => Promise<PhotoReport | void> | void;
  verifyPhotoReport: (id: string, status: 'tasdiqlandi' | 'rad_etildi') => void;

  // Factory Reports
  factoryReports: DailyFactoryReport[];
  addFactoryReport: (report: Omit<DailyFactoryReport, 'id' | 'date' | 'submittedByName' | 'submittedAt'>) => void;
  acceptFactoryReport: (id: string, feedback?: string) => void;

  // Vet Diagnoses
  diagnoses: VetDiagnosis[];
  addDiagnosis: (diag: Omit<VetDiagnosis, 'id' | 'date' | 'doctorName' | 'createdAt'>) => void;

  // Electricity Log
  electricityLog: ElectricityLog;
  updateElectricityLog: (log: Partial<ElectricityLog>) => void;

  // Transports
  eggTransports: EggTransportLog[];
  addEggTransport: (item: Omit<EggTransportLog, 'id' | 'date' | 'time' | 'driverName'>) => void;
  feedTransports: FeedTransportLog[];
  addFeedTransport: (item: Omit<FeedTransportLog, 'id' | 'date' | 'time' | 'driverName'>) => void;

  // Guard Shift
  guardShift: GuardShiftLog;
  updateGuardShift: (updates: Partial<GuardShiftLog>) => void;

  // Grocery Requests
  groceryRequests: GroceryRequest[];
  addGroceryRequest: (mealTarget: GroceryRequest['mealTarget'], items: GroceryRequest['items'], urgency: 'oddiy' | 'tezkor') => void;
  updateGroceryStatus: (id: string, status: GroceryRequest['status'], note?: string) => void;

  // Sanitation
  sanitationTasks: SanitationTask[];
  toggleSanitationTask: (id: string, photoUrl?: string, notes?: string, disinfectantUsed?: string) => void;
  addSanitationTask: (task: {
    title: string;
    zone: string;
    notes?: string;
    photoUrl?: string;
    disinfectantUsed?: string;
    isCompleted?: boolean;
  }) => Promise<SanitationTask>;
  evaluateSanitationTask: (id: string, score: number, note?: string) => void;

  // Branches ("Uychi parranda" filiallari va xodimlarni taqsimlash)
  branches: EnterpriseBranch[];
  selectedBranchFilter: string;
  setSelectedBranchFilter: (branchId: string) => void;
  assignUserBranch: (userId: string, branchId: BranchId) => void;
  addBranch: (branch: Omit<EnterpriseBranch, 'id'>) => EnterpriseBranch;
  updateBranch: (branchId: BranchId, updates: Partial<EnterpriseBranch>) => void;
  deleteBranch: (branchId: BranchId) => void;
  branchMetrics: Record<BranchId, BranchProductivityMetric>;
  updateBranchMetrics: (branchId: BranchId, metrics: Partial<BranchProductivityMetric>) => void;

  // Kundalik Operativ Reja (Har bir filial uchun kunlik ishlar va o'zgarishlar)
  branchOperationalPlans: BranchDailyPlan[];
  updateBranchPlanGoal: (branchId: BranchId, dailyGoal: string, shiftStatus?: 'kunduzgi' | 'tungi' | 'yakunlangan', notes?: string) => void;
  addBranchDailyTask: (branchId: BranchId, task: Omit<BranchDailyTask, 'id'>) => void;
  updateBranchDailyTaskStatus: (branchId: BranchId, taskId: string, status: OperationalTaskStatus, completionNote?: string) => void;
  deleteBranchDailyTask: (branchId: BranchId, taskId: string) => void;
  addBranchOperationalChange: (branchId: BranchId, change: Omit<BranchOperationalChange, 'id' | 'time'>) => void;

  // Filiallar Inventarizatsiyasi
  branchInventory: BranchInventoryItem[];
  addBranchInventoryItem: (item: Omit<BranchInventoryItem, 'id' | 'lastUpdated' | 'updatedBy'>) => void;
  updateBranchInventoryQuantity: (id: string, quantity: number, notes?: string) => void;
  deleteBranchInventoryItem: (id: string) => void;

  // Parrandalar vazni
  chickenWeights: ChickenWeightRecord[];
  addChickenWeightRecord: (record: Omit<ChickenWeightRecord, 'id'>) => void;
  cageWeightsMap: Record<number, Record<number, number>>;
  updateCageWeight: (cageNumber: number, chickenNumber: number, weight: number) => void;
  resetCageWeights: (cageNumber: number) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;

  // Chat (ovozli xabar, rasm, video va matn)
  chatMessages: ChatMessage[];
  sendChatMessage: (options: {
    message: string;
    isAnnouncement?: boolean;
    attachmentUrl?: string;
    attachmentType?: 'image' | 'video' | 'audio' | 'file';
    audioDuration?: number;
    fileName?: string;
    delayDays?: number;
    scheduledDateTime?: string;
  }) => void;

  // Firebase Cloud Firestore Online & Offline Sync Status
  isOnline: boolean;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
  syncNow: () => Promise<void>;

  // General & Sound
  soundEnabled: boolean;
  toggleSound: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  farmCurrentTime: string;
  getAccessibleTabs: () => AppTab[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to compute 3 minutes earlier time (HH:mm -> HH:mm)
function compute3MinutesEarlier(timeStr: string): string {
  try {
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    minutes -= 3;
    if (minutes < 0) {
      minutes += 60;
      hours = (hours - 1 + 24) % 24;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
}

/**
 * Rolga mos bo'limlarni belgilash:
 * O'z lavozimi bilan tizimga kirilgach, faqat shu lavozimga oid va umumiy bo'limlar ko'rinadi!
 */
export function getAccessibleTabsForRole(role: Role): AppTab[] {
  // Barcha xodimlar uchun umumiy bo'limlar:
  // 1. O'z lavozimining boshqaruv paneli (dashboard)
  // 2. Kundalik Operativ Reja (operational_plan)
  // 3. Umumiy chat (chat)
  // 4. Topshiriqlar (tasks)
  // 5. Davomat jurnali (attendance)
  // 6. Foto-hisobotlar (photos)
  // 7. Shaxsiy zametkalar (notes)
  const commonTabs: AppTab[] = [
    'dashboard',
    'operational_plan',
    'chat',
    'tasks',
    'attendance',
    'photos',
    'notes',
    'chicken_weight',
    'inventory',
  ];

  if (role === 'direktor') {
    return [
      'dashboard',
      'operational_plan',
      'branch_analytics',
      'inventory',
      'hr',
      'chat',
      'tasks',
      'attendance',
      'photos',
      'notes',
    ];
  }

  if (role === 'kadrlar') {
    return [
      'dashboard',
      'operational_plan',
      'branch_analytics',
      'inventory',
      'hr',
      'chat',
      'tasks',
      'attendance',
      'photos',
      'notes',
    ];
  }

  if (role === 'statistikachi' || role === 'ish_boshqaruvchi') {
    return [
      'dashboard',
      'operational_plan',
      'branch_analytics',
      'inventory',
      'chat',
      'tasks',
      'attendance',
      'photos',
      'notes',
    ];
  }

  // Boshqa barcha texnik va operatsion xodimlar (slesar, veterinar, elektrik, eltuvchi, qorovul, oshpaz, tozalik)
  // Faqat o'z lavozim paneli, o'z filialining operativ rejasi va umumiy bo'limlarni ko'radi!
  return commonTabs;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Core Data States
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('up_users');
    const list: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    return list.map((u) => ({
      ...u,
      password: u.password || '12345',
    }));
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const savedId = localStorage.getItem('up_logged_in_user_id');
    if (savedId) {
      return savedId;
    }
    const savedRole = localStorage.getItem('up_current_role') as Role;
    const defaultUser = INITIAL_USERS.find((u) => u.role === savedRole) || INITIAL_USERS[0];
    return defaultUser.id;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedId = localStorage.getItem('up_logged_in_user_id');
    return !!savedId;
  });

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('up_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [tasks, setTasks] = useState<FarmTask[]>(() => {
    const saved = localStorage.getItem('up_tasks');
    if (!saved) return INITIAL_TASKS;
    try {
      const parsed = JSON.parse(saved);
      // If previous storage only has 4 or fewer tasks, merge or use fresh INITIAL_TASKS so all roles can be evaluated
      if (Array.isArray(parsed) && parsed.length >= 6) {
        return parsed;
      }
      return INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const resetTasksToDefault = useCallback(() => {
    setTasks(INITIAL_TASKS);
    try {
      localStorage.setItem('up_tasks', JSON.stringify(INITIAL_TASKS));
      INITIAL_TASKS.forEach((t) => saveDocument(COLLECTIONS.TASKS, t));
    } catch (e) {
      console.warn('Storage error on reset tasks:', e);
    }
    soundSynth.playSuccessTone();
  }, []);

  const [slesarMilestones, setSlesarMilestones] = useState<SlesarMilestone[]>(() => {
    const saved = localStorage.getItem('up_slesar_milestones');
    return saved ? JSON.parse(saved) : INITIAL_SLESAR_MILESTONES;
  });

  const resetMilestonesToDefault = useCallback(() => {
    setSlesarMilestones(INITIAL_SLESAR_MILESTONES);
    INITIAL_SLESAR_MILESTONES.forEach((m) => saveDocument(COLLECTIONS.SLESAR_MILESTONES, m));
    soundSynth.playSuccessTone();
  }, []);

  const [activeMilestoneAlert, setActiveMilestoneAlert] = useState<SlesarMilestone | null>(null);

  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>(() => {
    const saved = localStorage.getItem('up_personal_notes');
    return saved ? JSON.parse(saved) : INITIAL_PERSONAL_NOTES;
  });

  const [photoReports, setPhotoReports] = useState<PhotoReport[]>(() => {
    const saved = localStorage.getItem('up_photo_reports');
    return saved ? JSON.parse(saved) : INITIAL_PHOTO_REPORTS;
  });

  const [factoryReports, setFactoryReports] = useState<DailyFactoryReport[]>(() => {
    const saved = localStorage.getItem('up_factory_reports');
    return saved ? JSON.parse(saved) : INITIAL_FACTORY_REPORTS;
  });

  const [diagnoses, setDiagnoses] = useState<VetDiagnosis[]>(() => {
    const saved = localStorage.getItem('up_diagnoses');
    return saved ? JSON.parse(saved) : INITIAL_DIAGNOSES;
  });

  const [electricityLog, setElectricityLog] = useState<ElectricityLog>(() => {
    const saved = localStorage.getItem('up_electricity_log');
    return saved ? JSON.parse(saved) : INITIAL_ELECTRICITY_LOG;
  });

  const [eggTransports, setEggTransports] = useState<EggTransportLog[]>(() => {
    const saved = localStorage.getItem('up_egg_transports');
    return saved ? JSON.parse(saved) : INITIAL_EGG_TRANSPORTS;
  });

  const [feedTransports, setFeedTransports] = useState<FeedTransportLog[]>(() => {
    const saved = localStorage.getItem('up_feed_transports');
    return saved ? JSON.parse(saved) : INITIAL_FEED_TRANSPORTS;
  });

  const [guardShift, setGuardShift] = useState<GuardShiftLog>(() => {
    const saved = localStorage.getItem('up_guard_shift');
    return saved ? JSON.parse(saved) : INITIAL_GUARD_SHIFT;
  });

  const [groceryRequests, setGroceryRequests] = useState<GroceryRequest[]>(() => {
    const saved = localStorage.getItem('up_grocery_requests');
    return saved ? JSON.parse(saved) : INITIAL_GROCERY_REQUESTS;
  });

  const [sanitationTasks, setSanitationTasks] = useState<SanitationTask[]>(() => {
    const saved = localStorage.getItem('up_sanitation_tasks');
    return saved ? JSON.parse(saved) : INITIAL_SANITATION_TASKS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('up_chat_messages');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    localStorage.setItem('up_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Filiallar analitikasi va mahsuldorlik ko'rsatkichlari
  const [branchMetrics, setBranchMetrics] = useState<Record<BranchId, BranchProductivityMetric>>(() => {
    const saved = localStorage.getItem('up_branch_metrics');
    return saved ? JSON.parse(saved) : INITIAL_BRANCH_METRICS;
  });

  useEffect(() => {
    localStorage.setItem('up_branch_metrics', JSON.stringify(branchMetrics));
  }, [branchMetrics]);

  const updateBranchMetrics = useCallback((branchId: BranchId, updates: Partial<BranchProductivityMetric>) => {
    setBranchMetrics((prev) => {
      const current = prev[branchId] || INITIAL_BRANCH_METRICS[branchId];
      return {
        ...prev,
        [branchId]: { ...current, ...updates },
      };
    });
  }, []);

  // Kundalik Operativ Reja (Har bir filial uchun kunlik ishlar va o'zgarishlar)
  const [branchOperationalPlans, setBranchOperationalPlans] = useState<BranchDailyPlan[]>(() => {
    const saved = localStorage.getItem('up_branch_operational_plans');
    return saved ? JSON.parse(saved) : INITIAL_BRANCH_OPERATIONAL_PLANS;
  });

  useEffect(() => {
    localStorage.setItem('up_branch_operational_plans', JSON.stringify(branchOperationalPlans));
  }, [branchOperationalPlans]);

  const updateBranchPlanGoal = useCallback(
    (branchId: BranchId, dailyGoal: string, shiftStatus?: 'kunduzgi' | 'tungi' | 'yakunlangan', notes?: string) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setBranchOperationalPlans((prev) => {
        const exists = prev.some((p) => p.branchId === branchId);
        if (exists) {
          return prev.map((p) => {
            if (p.branchId === branchId) {
              const updated: BranchDailyPlan = {
                ...p,
                dailyGoal,
                shiftStatus: shiftStatus || p.shiftStatus,
                notes: notes !== undefined ? notes : p.notes,
                lastUpdated: timeStr,
              };
              saveDocument('operational_plans', updated);
              return updated;
            }
            return p;
          });
        } else {
          const newPlan: BranchDailyPlan = {
            id: `plan-${branchId}`,
            branchId,
            branchName: typeof branchId === 'string' ? branchId : 'Filial',
            date: new Date().toISOString().slice(0, 10),
            leaderName: 'Ish Boshqaruvchi',
            leaderRole: 'Ish Boshqaruvchi',
            dailyGoal,
            shiftStatus: shiftStatus || 'kunduzgi',
            notes,
            tasks: [],
            changes: [],
            lastUpdated: timeStr,
          };
          saveDocument('operational_plans', newPlan);
          return [...prev, newPlan];
        }
      });
      soundSynth.playSuccessTone();
    },
    []
  );

  const addBranchDailyTask = useCallback(
    (branchId: BranchId, task: Omit<BranchDailyTask, 'id'>) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newTask: BranchDailyTask = {
        ...task,
        id: `btask-${Date.now()}`,
      };
      setBranchOperationalPlans((prev) => {
        const exists = prev.some((p) => p.branchId === branchId);
        if (exists) {
          return prev.map((p) => {
            if (p.branchId === branchId) {
              const updated: BranchDailyPlan = {
                ...p,
                tasks: [newTask, ...p.tasks],
                lastUpdated: timeStr,
              };
              saveDocument('operational_plans', updated);
              return updated;
            }
            return p;
          });
        } else {
          const newPlan: BranchDailyPlan = {
            id: `plan-${branchId}`,
            branchId,
            branchName: typeof branchId === 'string' ? branchId : 'Filial',
            date: new Date().toISOString().slice(0, 10),
            leaderName: 'Ish Boshqaruvchi',
            leaderRole: 'Ish Boshqaruvchi',
            dailyGoal: 'Kunlik ishlab chiqarish va parvarish rejasini bajarish',
            shiftStatus: 'kunduzgi',
            tasks: [newTask],
            changes: [],
            lastUpdated: timeStr,
          };
          saveDocument('operational_plans', newPlan);
          return [...prev, newPlan];
        }
      });
      soundSynth.playSuccessTone();
    },
    []
  );

  const updateBranchDailyTaskStatus = useCallback(
    (branchId: BranchId, taskId: string, status: OperationalTaskStatus, completionNote?: string) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setBranchOperationalPlans((prev) =>
        prev.map((p) => {
          if (p.branchId === branchId) {
            const updatedTasks = p.tasks.map((t) => {
              if (t.id === taskId) {
                return {
                  ...t,
                  status,
                  ...(status === 'bajarildi'
                    ? {
                        completedAt: timeStr,
                        completionNote: completionNote || t.completionNote || "O'z vaqtida bajarildi",
                      }
                    : {}),
                };
              }
              return t;
            });
            const updated: BranchDailyPlan = {
              ...p,
              tasks: updatedTasks,
              lastUpdated: timeStr,
            };
            saveDocument('operational_plans', updated);
            return updated;
          }
          return p;
        })
      );
      if (status === 'bajarildi') {
        soundSynth.playTaskDoneTone();
      }
    },
    []
  );

  const deleteBranchDailyTask = useCallback(
    (branchId: BranchId, taskId: string) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setBranchOperationalPlans((prev) =>
        prev.map((p) => {
          if (p.branchId === branchId) {
            const updated: BranchDailyPlan = {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
              lastUpdated: timeStr,
            };
            saveDocument('operational_plans', updated);
            return updated;
          }
          return p;
        })
      );
    },
    []
  );

  const addBranchOperationalChange = useCallback(
    (branchId: BranchId, change: Omit<BranchOperationalChange, 'id' | 'time'>) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newChange: BranchOperationalChange = {
        ...change,
        id: `ch-${Date.now()}`,
        time: timeStr,
      };
      setBranchOperationalPlans((prev) => {
        const exists = prev.some((p) => p.branchId === branchId);
        if (exists) {
          return prev.map((p) => {
            if (p.branchId === branchId) {
              const updated: BranchDailyPlan = {
                ...p,
                changes: [newChange, ...p.changes],
                lastUpdated: timeStr,
              };
              saveDocument('operational_plans', updated);
              return updated;
            }
            return p;
          });
        } else {
          const newPlan: BranchDailyPlan = {
            id: `plan-${branchId}`,
            branchId,
            branchName: typeof branchId === 'string' ? branchId : 'Filial',
            date: new Date().toISOString().slice(0, 10),
            leaderName: 'Ish Boshqaruvchi',
            leaderRole: 'Ish Boshqaruvchi',
            dailyGoal: 'Kunlik ishlab chiqarish va parvarish rejasini bajarish',
            shiftStatus: 'kunduzgi',
            tasks: [],
            changes: [newChange],
            lastUpdated: timeStr,
          };
          saveDocument('operational_plans', newPlan);
          return [...prev, newPlan];
        }
      });
      soundSynth.playSuccessTone();
    },
    []
  );

  // Filiallar Inventarizatsiyasi (yem, dori, asbob-uskunalar)
  const [branchInventory, setBranchInventory] = useState<BranchInventoryItem[]>(() => {
    const saved = localStorage.getItem('up_branch_inventory');
    return saved ? JSON.parse(saved) : INITIAL_BRANCH_INVENTORY;
  });

  const [cageWeightsMap, setCageWeightsMap] = useState<Record<number, Record<number, number>>>({});
  const updateCageWeight = useCallback((cageNumber: number, chickenNumber: number, weight: number) => {
    setCageWeightsMap(prev => ({
      ...prev,
      [cageNumber]: {
        ...(prev[cageNumber] || {}),
        [chickenNumber]: weight
      }
    }));
  }, []);
  const resetCageWeights = useCallback((cageNumber: number) => {
    setCageWeightsMap(prev => ({ ...prev, [cageNumber]: {} }));
  }, []);

  const [chickenWeights, setChickenWeights] = useState<ChickenWeightRecord[]>(() => {
    const saved = localStorage.getItem('up_chicken_weights');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('up_chicken_weights', JSON.stringify(chickenWeights));
  }, [chickenWeights]);

  useEffect(() => {
    localStorage.setItem('up_branch_inventory', JSON.stringify(branchInventory));
  }, [branchInventory]);

  useEffect(() => {
    localStorage.setItem('up_branch_inventory', JSON.stringify(branchInventory));
  }, [branchInventory]);

  const addBranchInventoryItem = useCallback(
    (item: Omit<BranchInventoryItem, 'id' | 'lastUpdated' | 'updatedBy'>) => {
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newItem: BranchInventoryItem = {
        ...item,
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        lastUpdated: timeStr,
        updatedBy: currentUser.fullName,
      };
      setBranchInventory((prev) => [newItem, ...prev]);
      soundSynth.playSuccessTone();
    },
    [currentUser]
  );

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    saveDocument(COLLECTIONS.AUDIT_LOGS, newLog);
  }, []);

  const addChickenWeightRecord = useCallback((record: Omit<ChickenWeightRecord, 'id'>) => {
    const newRecord: ChickenWeightRecord = {
      ...record,
      id: `cw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setChickenWeights((prev) => [newRecord, ...prev]);
    saveDocument(COLLECTIONS.CHICKEN_WEIGHTS, newRecord);
    
    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.fullName,
      action: 'ADD_CHICKEN_WEIGHT',
      entityType: 'ChickenWeightRecord',
      entityId: newRecord.id,
      details: `Cage: ${record.cageNumber}, Weight: ${record.weight}g`
    });
    
    soundSynth.playSuccessTone();
  }, [addAuditLog, currentUser]);

  const updateBranchInventoryQuantity = useCallback(
    (id: string, quantity: number, notes?: string) => {
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setBranchInventory((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity,
                notes: notes !== undefined ? notes : item.notes,
                lastUpdated: timeStr,
                updatedBy: currentUser.fullName,
              }
            : item
        )
      );
      soundSynth.playSuccessTone();
    },
    [currentUser]
  );

  const deleteBranchInventoryItem = useCallback((id: string) => {
    setBranchInventory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Recurring 3-minute alert state ("Bajarildi" bosilmaguncha har 3 daqiqada ogohlantirsin)
  const [recurring3MinAlert, setRecurring3MinAlert] = useState<Recurring3MinAlert | null>(() => {
    const saved = localStorage.getItem('up_recurring_3min_alert');
    return saved ? JSON.parse(saved) : null;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [farmCurrentTime, setFarmCurrentTime] = useState<string>('08:56:40');

  // O'z lavozimi uchun ruxsat etilgan bo'limlar ro'yxati
  const getAccessibleTabs = useCallback(() => {
    return getAccessibleTabsForRole(currentUser.role);
  }, [currentUser.role]);

  // Agar foydalanuvchi o'z lavozimiga tegishli bo'lmagan bo'limda bo'lsa,
  // avtomatik ravishda uning o'z boshqaruv paneliga qaytarish
  useEffect(() => {
    const allowed = getAccessibleTabsForRole(currentUser.role);
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, activeTab]);

  // Network Online/Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const timeStr = new Date().toLocaleTimeString();
      setLastSyncTime(timeStr);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize and Seed Cloud Firestore, subscribe to collections
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initializeFirestoreSync = async () => {
      try {
        await seedInitialFirestoreData({
          users: INITIAL_USERS,
          attendance: INITIAL_ATTENDANCE,
          tasks: INITIAL_TASKS,
          slesarMilestones: INITIAL_SLESAR_MILESTONES,
          personalNotes: INITIAL_PERSONAL_NOTES,
          photoReports: INITIAL_PHOTO_REPORTS,
          factoryReports: INITIAL_FACTORY_REPORTS,
          diagnoses: INITIAL_DIAGNOSES,
          electricityLog: INITIAL_ELECTRICITY_LOG,
          eggTransports: INITIAL_EGG_TRANSPORTS,
          feedTransports: INITIAL_FEED_TRANSPORTS,
          guardShift: INITIAL_GUARD_SHIFT,
          groceryRequests: INITIAL_GROCERY_REQUESTS,
          sanitationTasks: INITIAL_SANITATION_TASKS,
          chatMessages: INITIAL_CHAT_MESSAGES,
        });

        // 1. Users subscription
        unsubs.push(
          subscribeCollection<User>(COLLECTIONS.USERS, (items, fromCache, pendingWrites) => {
            if (items.length > 0) setUsers(items);
            if (pendingWrites) setIsSyncing(true);
            else setIsSyncing(false);
          })
        );

        // 2. Tasks subscription
        unsubs.push(
          subscribeCollection<FarmTask>(COLLECTIONS.TASKS, (items, fromCache, pendingWrites) => {
            if (items.length > 0) setTasks(items);
            if (pendingWrites) setIsSyncing(true);
            else setIsSyncing(false);
          })
        );

        // 3. Slesar Milestones
        unsubs.push(
          subscribeCollection<SlesarMilestone>(COLLECTIONS.SLESAR_MILESTONES, (items) => {
            if (items.length > 0) setSlesarMilestones(items);
          })
        );

        // 4. Personal Notes
        unsubs.push(
          subscribeCollection<PersonalNote>(COLLECTIONS.PERSONAL_NOTES, (items) => {
            if (items.length > 0) setPersonalNotes(items);
          })
        );

        // 5. Attendance
        unsubs.push(
          subscribeCollection<AttendanceRecord>(COLLECTIONS.ATTENDANCE, (items) => {
            if (items.length > 0) setAttendanceRecords(items);
          })
        );

        // 6. Photo Reports
        unsubs.push(
          subscribeCollection<PhotoReport>(COLLECTIONS.PHOTO_REPORTS, (items) => {
            if (items.length > 0) setPhotoReports(items);
          })
        );

        // 7. Chat
        unsubs.push(
          subscribeCollection<ChatMessage>(COLLECTIONS.CHAT_MESSAGES, (items) => {
            if (items.length > 0) setChatMessages(items);
          })
        );

        // 8. Chicken Weights
        unsubs.push(
          subscribeCollection<ChickenWeightRecord>(COLLECTIONS.CHICKEN_WEIGHTS, (items) => {
            if (items.length > 0) setChickenWeights(items);
          })
        );

        // Set last synced timestamp
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Firestore subscription fallback to local cache/persistence:', err);
      }
    };

    initializeFirestoreSync();

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Clock tick & Slesar Milestone Alarm & Daily Reset
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setFarmCurrentTime(timeStr);

      // --- Daily Reset for Slesar Milestones (at midnight or on new calendar date) ---
      const todayDateStr = now.toISOString().split('T')[0];
      const savedDate = localStorage.getItem('up_last_milestone_reset_date');
      if (savedDate && savedDate !== todayDateStr) {
        resetMilestonesToDefault();
        localStorage.setItem('up_last_milestone_reset_date', todayDateStr);
      } else if (!savedDate) {
        localStorage.setItem('up_last_milestone_reset_date', todayDateStr);
      }
      if (timeStr === '00:00:01') {
        resetMilestonesToDefault();
      }
      // -------------------------------------------------------------------------------

      const [curH, curM] = timeStr.split(':').map(Number);
      const currentMinutes = curH * 60 + curM;

      // Robust check: Trigger any milestone whose alert time has arrived or passed (within 60 mins)
      const pendingMilestone = slesarMilestones.find((m) => {
        if (m.status !== 'kutilmoqda') return false;
        const [aH, aM] = m.alertTime.split(':').map(Number);
        const alertMinutes = aH * 60 + aM;
        return currentMinutes >= alertMinutes && currentMinutes <= alertMinutes + 60;
      });

      if (pendingMilestone && !activeMilestoneAlert) {
        setActiveMilestoneAlert(pendingMilestone);
        soundSynth.playMilestoneAlarm();
        soundSynth.sendBrowserNotification(
          'Slesar Texnologik Ogohlantirish (3 daqiqa qoldi!)',
          `${pendingMilestone.time}: ${pendingMilestone.title}`
        );

        // Automatically start the 3-minute recurring alarm loop with real wall-clock timestamp!
        setRecurring3MinAlert({
          id: `alert-${Date.now()}`,
          title: `Slesar: ${pendingMilestone.title}`,
          description: pendingMilestone.description,
          targetType: 'milestone',
          targetId: pendingMilestone.id,
          isActive: true,
          secondsLeft: 180,
          cycleCount: 0,
          isRinging: true,
          startedAt: timeStr,
          nextRingTimestamp: Date.now() + 180000,
        });

        const updatedMilestones = slesarMilestones.map((m) =>
          m.id === pendingMilestone.id ? { ...m, status: 'ogohlantirildi' as const } : m
        );
        setSlesarMilestones(updatedMilestones);
        saveDocument(COLLECTIONS.SLESAR_MILESTONES, { ...pendingMilestone, status: 'ogohlantirildi' as const });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [slesarMilestones, activeMilestoneAlert, resetMilestonesToDefault]);

  // 3-Minute Recurring Alarm Interval with Real Wall-Clock Timestamp (Throttling-Proof)
  useEffect(() => {
    if (!recurring3MinAlert || !recurring3MinAlert.isActive) return;

    const timer = setInterval(() => {
      setRecurring3MinAlert((prev) => {
        if (!prev || !prev.isActive) return null;

        const nowMs = Date.now();
        const nextRing = prev.nextRingTimestamp || (nowMs + (prev.secondsLeft || 180) * 1000);

        if (nowMs < nextRing) {
          const remainingSec = Math.max(1, Math.ceil((nextRing - nowMs) / 1000));
          return {
            ...prev,
            secondsLeft: remainingSec,
            nextRingTimestamp: nextRing,
          };
        } else {
          // 3 minutes (180 seconds) reached! Trigger sound alarm & native browser notification
          soundSynth.play3MinUrgentAlarm();
          soundSynth.sendBrowserNotification(
            `🚨 DIQQAT: 3 daqiqalik ogohlantirish! (${prev.cycleCount + 1}-marta)`,
            `"${prev.title}". Bajarildi tugmasi bosilmaguncha har 3 daqiqada ogohlantiriladi!`
          );

          return {
            ...prev,
            secondsLeft: 180, // reset for the next 3-minute cycle
            nextRingTimestamp: nowMs + 180000,
            cycleCount: prev.cycleCount + 1,
            isRinging: true,
          };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [recurring3MinAlert?.isActive]);

  // Persist Recurring Alert in LocalStorage
  useEffect(() => {
    if (recurring3MinAlert) {
      localStorage.setItem('up_recurring_3min_alert', JSON.stringify(recurring3MinAlert));
    } else {
      localStorage.removeItem('up_recurring_3min_alert');
    }
  }, [recurring3MinAlert]);

  // Persist Core State to LocalStorage (secondary fallback)
  useEffect(() => {
    localStorage.setItem('up_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('up_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('up_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('up_slesar_milestones', JSON.stringify(slesarMilestones));
  }, [slesarMilestones]);

  useEffect(() => {
    localStorage.setItem('up_personal_notes', JSON.stringify(personalNotes));
  }, [personalNotes]);

  useEffect(() => {
    try {
      localStorage.setItem('up_photo_reports', JSON.stringify(photoReports));
    } catch (err) {
      try {
        // Keep latest 10 reports if full quota
        localStorage.setItem('up_photo_reports', JSON.stringify(photoReports.slice(0, 10)));
      } catch {
        console.warn('LocalStorage quota limit reached for photoReports. Active cache preserved in Firestore IndexedDB.');
      }
    }
  }, [photoReports]);

  useEffect(() => {
    localStorage.setItem('up_factory_reports', JSON.stringify(factoryReports));
  }, [factoryReports]);

  useEffect(() => {
    localStorage.setItem('up_diagnoses', JSON.stringify(diagnoses));
  }, [diagnoses]);

  useEffect(() => {
    localStorage.setItem('up_electricity_log', JSON.stringify(electricityLog));
  }, [electricityLog]);

  useEffect(() => {
    localStorage.setItem('up_egg_transports', JSON.stringify(eggTransports));
  }, [eggTransports]);

  useEffect(() => {
    localStorage.setItem('up_feed_transports', JSON.stringify(feedTransports));
  }, [feedTransports]);

  useEffect(() => {
    localStorage.setItem('up_guard_shift', JSON.stringify(guardShift));
  }, [guardShift]);

  useEffect(() => {
    localStorage.setItem('up_grocery_requests', JSON.stringify(groceryRequests));
  }, [groceryRequests]);

  useEffect(() => {
    localStorage.setItem('up_sanitation_tasks', JSON.stringify(sanitationTasks));
  }, [sanitationTasks]);

  useEffect(() => {
    localStorage.setItem('up_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const switchRole = useCallback((role: Role) => {
    const matchedUser = users.find((u) => u.role === role);
    if (matchedUser) {
      setCurrentUserId(matchedUser.id);
      localStorage.setItem('up_current_role', role);
      localStorage.setItem('up_logged_in_user_id', matchedUser.id);
    }
  }, [users]);

  const switchUser = useCallback((userId: string) => {
    const matchedUser = users.find((u) => u.id === userId);
    if (matchedUser) {
      setCurrentUserId(matchedUser.id);
      localStorage.setItem('up_current_role', matchedUser.role);
      localStorage.setItem('up_logged_in_user_id', matchedUser.id);
    }
  }, [users]);

  // 3-Minute Alarm System Methods
  const start3MinAlert = useCallback(
    (title: string, description?: string, targetId?: string, targetType: 'task' | 'milestone' | 'custom' = 'custom') => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newAlert: Recurring3MinAlert = {
        id: `alert-${Date.now()}`,
        title,
        description,
        targetId,
        targetType,
        isActive: true,
        secondsLeft: 180, // 3 minutes
        cycleCount: 0,
        isRinging: true,
        startedAt: timeStr,
        nextRingTimestamp: Date.now() + 180000,
      };
      setRecurring3MinAlert(newAlert);
      soundSynth.play3MinUrgentAlarm();
      soundSynth.sendBrowserNotification(
        '🔔 3 daqiqalik ogohlantirish boshlandi',
        `"${title}" - "Bajarildi" tugmasi bosilmaguncha har 3 daqiqada signal beriladi.`
      );
    },
    []
  );

  const stop3MinAlert = useCallback(() => {
    setRecurring3MinAlert(null);
  }, []);

  // THE KEY "BAJARILDI" HANDLER
  const markAlertCompleted = useCallback(
    (note?: string) => {
      if (!recurring3MinAlert) return;

      const { targetId, targetType } = recurring3MinAlert;

      // 1. Stop the 3-minute recurring alarm loop immediately
      setRecurring3MinAlert(null);
      setActiveMilestoneAlert(null);

      // 2. Play cheerful completion tone
      soundSynth.playTaskDoneTone();

      // 3. Mark the linked Task as completed
      if (targetType === 'task' && targetId) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === targetId) {
              const updated = {
                ...t,
                status: 'bajarildi' as TaskStatus,
                completedAt: timeStr,
                evaluationNote: note || t.evaluationNote || "3 daqiqalik ogohlantirish bo'yicha bajarildi",
              };
              saveDocument(COLLECTIONS.TASKS, updated);
              return updated;
            }
            return t;
          })
        );
      }

      // 4. Mark the linked Slesar milestone as completed
      if (targetType === 'milestone' && targetId) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setSlesarMilestones((prev) =>
          prev.map((m) => {
            if (m.id === targetId) {
              const updated = {
                ...m,
                status: 'bajarildi' as const,
                completedAt: timeStr,
                notes: note || m.notes || "Slesar operativ vazifasi to'liq bajarildi",
              };
              saveDocument(COLLECTIONS.SLESAR_MILESTONES, updated);
              return updated;
            }
            return m;
          })
        );
      }

      soundSynth.sendBrowserNotification(
        '✅ Vazifa bajarildi!',
        `3 daqiqalik ogohlantirish to'xtatildi. Rahmat!`
      );
    },
    [recurring3MinAlert]
  );

  const silenceAlarmSound = useCallback(() => {
    setRecurring3MinAlert((prev) => (prev ? { ...prev, isRinging: false } : null));
  }, []);

  const testTriggerAlarmNow = useCallback(() => {
    soundSynth.play3MinUrgentAlarm();
    soundSynth.sendBrowserNotification(
      '🔊 Test: 3 daqiqalik ogohlantirish signali',
      'Ovozli signal tizimi soz va to‘g‘ri ishlamoqda.'
    );
  }, []);

  // Manual Firestore Sync
  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      setLastSyncTime(new Date().toLocaleTimeString());
      await new Promise((resolve) => setTimeout(resolve, 800));
      soundSynth.playSuccessTone();
    } catch (e) {
      console.warn('Sync attempt:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncStatus: SyncStatus = isOnline
    ? isSyncing
      ? 'online_syncing'
      : 'online_synced'
    : 'offline';

  // Authentication logic (Login va Parol orqali shaxsiy kabinetga xavfsiz kirish)
  const loginUser = useCallback(
    (
      loginInput: string,
      passwordInput: string,
      selectedRole?: Role | string
    ) => {
      const cleanLogin = (loginInput || '').trim().replace(/^@/, '');
      const cleanPassword = (passwordInput || '').trim();

      if (!cleanLogin) {
        return {
          success: false,
          message: "Iltimos, login, ism-familiya yoki telefon raqamingizni kiriting!",
        };
      }

      if (!cleanPassword) {
        return {
          success: false,
          message: "Iltimos, shaxsiy kabinet parolingizni kiriting! (Boshlang'ich parol: 12345)",
        };
      }

      const normalize = (t: string) => (t || '').toLowerCase().replace(/[‘'’`ʻʼ]/g, "'").trim();
      const digitsOnly = (t: string) => (t || '').replace(/\D/g, '');

      const norm = normalize(cleanLogin);
      const searchDigits = digitsOnly(cleanLogin);

      // 1-bosqich: To'g'ridan-to'g'ri login (username) bo'yicha qidirish (eng yuqori prioritet)
      let matchedUser = users.find((u) => normalize(u.username) === norm);

      // 2-bosqich: Agar lavozim tanlangan bo'lsa, avval shu lavozim ichidan qidirish
      if (!matchedUser && selectedRole) {
        const roleUsers = users.filter((u) => u.role === selectedRole);
        matchedUser = roleUsers.find((u) => {
          const uUser = normalize(u.username);
          const uFull = normalize(u.fullName);
          const uPhoneDigits = digitsOnly(u.phone || '');

          if (uUser === norm) return true;
          if (uFull === norm) return true;
          if (searchDigits.length >= 7 && uPhoneDigits.includes(searchDigits)) return true;
          if (uFull.includes(norm) || (norm.length >= 4 && norm.includes(uFull))) return true;
          const words = uFull.split(' ');
          if (words.some((w) => w.length >= 3 && (w === norm || w.startsWith(norm)))) return true;
          return false;
        });
      }

      // 3-bosqich: Barcha foydalanuvchilar orasidan keng qamrovli qidirish
      if (!matchedUser) {
        matchedUser = users.find((u) => {
          const uUser = normalize(u.username);
          const uRole = normalize(u.role);
          const uFull = normalize(u.fullName);
          const uPhoneDigits = digitsOnly(u.phone || '');

          // Aniq ism-familiya mosligi
          if (uFull === norm) return true;
          // Telefon raqami mosligi
          if (searchDigits.length >= 7 && uPhoneDigits.includes(searchDigits)) return true;
          // Lavozim nomi kiritilgan bo'lsa (masalan: "direktor", "slesar", "veterinar")
          if (uRole === norm) return true;
          // Qisman to'liq ism mosligi
          if (uFull.includes(norm) || (norm.length >= 4 && norm.includes(uFull))) return true;
          // Ism yoki familiyaning bir qismi
          const words = uFull.split(' ');
          if (words.some((w) => w.length >= 3 && (w === norm || w.startsWith(norm)))) return true;

          return false;
        });
      }

      if (!matchedUser) {
        return {
          success: false,
          message: `Kechirasiz, "${cleanLogin}" login yoki ism-familiyali xodim tizimda topilmadi! Iltimos, to'g'ri loginni kiriting yoki ro'yxatdan o'z ismingizni tanlang.`,
        };
      }

      // Xavfsizlik: Parol tekshiruvi (Default: 12345)
      const expectedPassword = matchedUser.password || '12345';
      if (cleanPassword !== expectedPassword) {
        return {
          success: false,
          message: `Xavfsizlik ogohlantirishi: "${matchedUser.fullName}" (${ROLE_LABELS[matchedUser.role]?.title || matchedUser.role}) shaxsiy kabineti uchun parol noto'g'ri! Iltimos, to'g'ri parolingizni kiriting (Boshlang'ich standart parol: 12345).`,
        };
      }

      setCurrentUserId(matchedUser.id);
      setIsAuthenticated(true);
      localStorage.setItem('up_logged_in_user_id', matchedUser.id);
      localStorage.setItem('up_current_role', matchedUser.role);
      soundSynth.playSuccessTone();

      // Register Web Push subscription for this user
      registerWebPushSubscription({
        id: typeof matchedUser.id === 'number' ? matchedUser.id : undefined,
        username: matchedUser.username || matchedUser.id,
        role: matchedUser.role
      }).catch(() => {});

      // Automatic attendance check-in upon login
      const today = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toTimeString().split(' ')[0];
      setAttendanceRecords((prev) => {
        const alreadyCheckedIn = prev.some((r) => r.userId === matchedUser.id && r.date === today);
        if (!alreadyCheckedIn) {
          const newAtt: AttendanceRecord = {
            id: `att-${Date.now()}`,
            userId: matchedUser.id,
            userName: matchedUser.fullName,
            role: matchedUser.role,
            date: today,
            checkInTime: timeStr,
            isSubstitution: false,
            status: 'keldi',
          };
          saveDocument(COLLECTIONS.ATTENDANCE, newAtt);
          return [newAtt, ...prev];
        }
        return prev;
      });

      return {
        success: true,
        message: `Xush kelibsiz, ${matchedUser.fullName}! Shaxsiy kabinetingizga muvaffaqiyatli kirdingiz.`,
        user: matchedUser,
      };
    },
    [users]
  );

  // Shaxsiy kabinet login va parolini o'zgartirish (Boshqa birov kirolmasligi uchun)
  const changeUserCredentials = useCallback(
    (
      userId: string,
      updates: {
        newUsername?: string;
        currentPassword?: string;
        newPassword?: string;
      }
    ) => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, message: "Foydalanuvchi topilmadi!" };
      }

      const expectedPassword = user.password || '12345';
      const currentPassword = (updates.currentPassword || '').trim();

      // Xavfsizlik: Har qanday o'zgarish uchun amaldagi parolni tekshirish shart
      if (!currentPassword || currentPassword !== expectedPassword) {
        return {
          success: false,
          message: "Joriy parol noto'g'ri kiritildi! Iltimos, amaldagi shaxsiy parolingizni to'g'ri kiriting (Boshlang'ich standart parol: 12345).",
        };
      }

      let cleanUsername = user.username;
      let usernameChanged = false;

      // 1. Yangi login (username) tekshiruvi
      if (updates.newUsername !== undefined && updates.newUsername.trim()) {
        const candidate = updates.newUsername
          .trim()
          .toLowerCase()
          .replace(/^@+/, '')
          .replace(/[\s]+/g, '_');

        if (candidate.length < 3) {
          return {
            success: false,
            message: "Yangi login kamida 3 ta belgidan iborat bo'lishi lozim!",
          };
        }

        // Boshqa xodim bilan login to'qnashmasligini tekshirish
        const isTaken = users.some(
          (u) => u.id !== userId && (u.username || '').toLowerCase() === candidate
        );
        if (isTaken) {
          return {
            success: false,
            message: `"${candidate}" logini allaqachon boshqa xodim tomonidan band qilingan! Iltimos, boshqa login tanlang.`,
          };
        }

        cleanUsername = candidate;
        usernameChanged = cleanUsername !== user.username;
      }

      let newPass = user.password || '12345';
      let passwordChanged = false;

      // 2. Yangi parol tekshiruvi
      if (updates.newPassword !== undefined && updates.newPassword.trim()) {
        const candidatePass = updates.newPassword.trim();
        if (candidatePass.length < 4) {
          return {
            success: false,
            message: "Yangi maxfiy parol kamida 4 ta belgidan iborat bo'lishi lozim!",
          };
        }
        newPass = candidatePass;
        passwordChanged = true;
      }

      if (!usernameChanged && !passwordChanged) {
        return {
          success: false,
          message: "Hech qanday o'zgarish kiritilmadi! Yangi login yoki yangi parol kiriting.",
        };
      }

      const updatedUser: User = {
        ...user,
        username: cleanUsername,
        password: newPass,
      };

      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
      saveDocument(COLLECTIONS.USERS, updatedUser);
      soundSynth.playSuccessTone();

      let msg = "Shaxsiy kabinet ma'lumotlari muvaffaqiyatli saqlandi!";
      if (usernameChanged && passwordChanged) {
        msg = `Sizning yangi loginingiz: @${cleanUsername} va yangi maxfiy parolingiz o'rnatildi! Endi ushbu ma'lumotlar bilan kirasiz.`;
      } else if (usernameChanged) {
        msg = `Sizning yangi loginingiz: @${cleanUsername} muvaffaqiyatli o'rnatildi! Endi shu login bilan kirasiz.`;
      } else {
        msg = `Yangi maxfiy parolingiz muvaffaqiyatli o'rnatildi! Begona shaxslar endi kira olmaydi.`;
      }

      return {
        success: true,
        message: msg,
        updatedUser,
      };
    },
    [users]
  );

  const changeUserLogin = useCallback(
    (userId: string, newUsername: string, currentPassword?: string) => {
      const res = changeUserCredentials(userId, { newUsername, currentPassword });
      return { success: res.success, message: res.message };
    },
    [changeUserCredentials]
  );

  // Parol o'zgartirish (shortcut)
  const changeUserPassword = useCallback(
    (userId: string, currentPassword: string, newPassword: string) => {
      const res = changeUserCredentials(userId, { currentPassword, newPassword });
      return { success: res.success, message: res.message };
    },
    [changeUserCredentials]
  );

  // Boshqa xodimning shaxsiy kabinetiga parol bilan o'tish
  const switchUserWithPassword = useCallback(
    (userId: string, password: string) => {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) {
        return { success: false, message: "Tanlangan xodim topilmadi!" };
      }

      const expected = targetUser.password || '12345';
      if (password.trim() !== expected) {
        return {
          success: false,
          message: `Xavfsizlik ogohlantirishi: "${targetUser.fullName}" shaxsiy kabinetining paroli noto'g'ri! Begona shaxs kabinetiga ruxsatsiz kirish taqiqlanadi (Standart: 12345).`,
        };
      }

      setCurrentUserId(targetUser.id);
      setIsAuthenticated(true);
      localStorage.setItem('up_current_role', targetUser.role);
      localStorage.setItem('up_logged_in_user_id', targetUser.id);
      soundSynth.playSuccessTone();

      // Register Web Push subscription for this user
      registerWebPushSubscription({
        id: typeof targetUser.id === 'number' ? targetUser.id : undefined,
        username: targetUser.username || targetUser.id,
        role: targetUser.role
      }).catch(() => {});

      return {
        success: true,
        message: `Xush kelibsiz, ${targetUser.fullName}! Shaxsiy kabinetga kirdingiz.`,
      };
    },
    [users]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('up_logged_in_user_id');
    setIsAuthenticated(false);
  }, []);

  const updateUserProfile = useCallback(
    (fullName: string, phone: string) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === currentUser.id) {
            const updated = { ...u, fullName, phone };
            saveDocument(COLLECTIONS.USERS, updated);
            return updated;
          }
          return u;
        })
      );
    },
    [currentUser.id]
  );

  // HR / Kadrlar bo'limi management
  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
    };
    setUsers((prev) => [...prev, newUser]);
    saveDocument(COLLECTIONS.USERS, newUser);
    soundSynth.playSuccessTone();
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          saveDocument(COLLECTIONS.USERS, updated);
          return updated;
        }
        return u;
      })
    );
    soundSynth.playSuccessTone();
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    removeDocument(COLLECTIONS.USERS, id);
    soundSynth.playSuccessTone();
  }, []);

  // Attendance
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentUserAttendance = attendanceRecords.find(
    (a) => a.userId === currentUser.id && a.date === todayStr
  );
  const hasCheckedInToday = !!currentUserAttendance;

  const checkInAttendance = useCallback(
    (isSubstitution: boolean, originalWorkerName?: string, substituteWorkerName?: string, notes?: string) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.fullName,
        role: currentUser.role,
        date: todayStr,
        checkInTime: timeStr,
        isSubstitution,
        originalWorkerName: isSubstitution ? originalWorkerName : undefined,
        substituteWorkerName: isSubstitution ? substituteWorkerName : undefined,
        status: isSubstitution ? 'orinbosar_bilan' : 'keldi',
        notes,
      };

      setAttendanceRecords((prev) => [
        newRecord,
        ...prev.filter((r) => !(r.userId === currentUser.id && r.date === todayStr)),
      ]);
      saveDocument(COLLECTIONS.ATTENDANCE, newRecord);
      soundSynth.playSuccessTone();
    },
    [currentUser, todayStr]
  );

  // Slesar Milestones
  const completeMilestone = useCallback((id: string, notes?: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSlesarMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, status: 'bajarildi' as const, completedAt: timeStr, notes: notes || m.notes };
          saveDocument(COLLECTIONS.SLESAR_MILESTONES, updated);
          return updated;
        }
        return m;
      })
    );
    setActiveMilestoneAlert((current) => (current?.id === id ? null : current));
    if (recurring3MinAlert?.targetId === id) {
      setRecurring3MinAlert(null);
    }
    soundSynth.playTaskDoneTone();
  }, [recurring3MinAlert]);

  const dismissMilestoneAlert = useCallback(() => {
    setActiveMilestoneAlert(null);
  }, []);

  const triggerTestAlert = useCallback(
    (milestoneId?: string) => {
      const target =
        slesarMilestones.find((m) => m.id === milestoneId) ||
        slesarMilestones.find((m) => m.status === 'kutilmoqda') ||
        slesarMilestones[0];
      if (target) {
        setActiveMilestoneAlert(target);
        soundSynth.playMilestoneAlarm();
        soundSynth.sendBrowserNotification(
          `🔔 Slesar Ogohlantirish (3 daqiqa qoldi!)`,
          `${target.time}: ${target.title}`
        );
        start3MinAlert(`Slesar: ${target.title}`, target.description, target.id, 'milestone');
      }
    },
    [slesarMilestones, start3MinAlert]
  );

  const updateMilestone = useCallback((id: string, updates: Partial<SlesarMilestone>) => {
    setSlesarMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const newTime = updates.time || m.time;
          const newAlert = updates.alertTime || (updates.time ? compute3MinutesEarlier(updates.time) : m.alertTime);
          const updated = {
            ...m,
            ...updates,
            time: newTime,
            alertTime: newAlert,
          };
          saveDocument(COLLECTIONS.SLESAR_MILESTONES, updated);
          return updated;
        }
        return m;
      })
    );
    soundSynth.playSuccessTone();
  }, []);

  const addMilestone = useCallback((item: { time: string; title: string; description?: string }) => {
    const newAlert = compute3MinutesEarlier(item.time);
    const newM: SlesarMilestone = {
      id: `m-${Date.now()}`,
      time: item.time,
      alertTime: newAlert,
      title: item.title,
      description: item.description || '',
      status: 'kutilmoqda',
    };
    setSlesarMilestones((prev) => {
      const updated = [...prev, newM].sort((a, b) => a.time.localeCompare(b.time));
      return updated;
    });
    saveDocument(COLLECTIONS.SLESAR_MILESTONES, newM);
    soundSynth.playSuccessTone();
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setSlesarMilestones((prev) => prev.filter((m) => m.id !== id));
    removeDocument(COLLECTIONS.SLESAR_MILESTONES, id);
    soundSynth.playSuccessTone();
  }, []);

  // Personal Notes
  const currentUserNotes = personalNotes.filter((n) => n.userId === currentUser.id);

  const addPersonalNote = useCallback(
    (title: string, content: string, category: PersonalNote['category'] = 'eslatma', color: PersonalNote['color'] = 'yellow', isPinned = false) => {
      const now = new Date();
      const dateStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newNote: PersonalNote = {
        id: `note-${Date.now()}`,
        userId: currentUser.id,
        authorName: currentUser.fullName,
        title,
        content,
        category,
        color,
        isPinned,
        createdAt: dateStr,
      };
      setPersonalNotes((prev) => [newNote, ...prev]);
      saveDocument(COLLECTIONS.PERSONAL_NOTES, newNote);
      soundSynth.playSuccessTone();
    },
    [currentUser]
  );

  const updatePersonalNote = useCallback((id: string, updates: Partial<PersonalNote>) => {
    const now = new Date();
    const dateStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setPersonalNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, ...updates, updatedAt: dateStr };
          saveDocument(COLLECTIONS.PERSONAL_NOTES, updated);
          return updated;
        }
        return n;
      })
    );
    soundSynth.playSuccessTone();
  }, []);

  const deletePersonalNote = useCallback((id: string) => {
    setPersonalNotes((prev) => prev.filter((n) => n.id !== id));
    removeDocument(COLLECTIONS.PERSONAL_NOTES, id);
    soundSynth.playSuccessTone();
  }, []);

  // Tasks
  const createTask = useCallback(
    (taskData: Omit<FarmTask, 'id' | 'createdAt' | 'assignedByUserId' | 'assignedByName' | 'assignedByRole' | 'status'>) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const newTask: FarmTask = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: timeStr,
        dueDate: taskData.dueDate || todayStr,
        dueTime: taskData.dueTime || '18:00',
        assignedByUserId: currentUser.id,
        assignedByName: currentUser.fullName,
        assignedByRole: currentUser.role,
        status: 'yangi',
      };
      setTasks((prev) => [newTask, ...prev]);
      saveDocument(COLLECTIONS.TASKS, newTask);

      // Trigger Background Web Push Notification to the assigned employee/role
      triggerBackendPush({
        title: `📋 Yangi topshiriq: ${newTask.title}`,
        body: `${currentUser.fullName} (${currentUser.role}) sizga yangi vazifa yukladi. Bino: ${newTask.building}`,
        role: newTask.assignedToRole,
        url: '/tasks'
      });

      // If task priority is urgent, offer or auto-start 3-min recurring alarm
      if (newTask.priority === 'urgent') {
        start3MinAlert(newTask.title, newTask.description, newTask.id, 'task');
      }

      soundSynth.playMessageBeep();
    },
    [currentUser, start3MinAlert]
  );

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus, score?: number, note?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const updated: FarmTask = {
            ...t,
            status,
            completedAt: status === 'bajarildi' || status === 'tasdiqlandi' ? (t.completedAt || timeStr) : t.completedAt,
            evaluationScore: score !== undefined ? score : t.evaluationScore,
            evaluationNote: note !== undefined ? note : t.evaluationNote,
            evaluatedByName: score !== undefined ? currentUser.fullName : t.evaluatedByName,
          };
          saveDocument(COLLECTIONS.TASKS, updated);
          return updated;
        }
        return t;
      })
    );

    // If active 3-min alert is for this task and status changed to completed, stop the alert
    if (recurring3MinAlert?.targetId === taskId && (status === 'bajarildi' || status === 'tasdiqlandi')) {
      setRecurring3MinAlert(null);
    }

    soundSynth.playSuccessTone();
  }, [currentUser.fullName, recurring3MinAlert]);

  // Photo Reports
  const addPhotoReport = useCallback(
    async (title: string, category: PhotoReport['category'], imageUrl: string, notes?: string, building?: string) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Guarantee safe compression so base64 never exceeds Firestore limit or rules
      let safeImageUrl = imageUrl;
      if (safeImageUrl && !safeImageUrl.startsWith('http') && safeImageUrl.length > 350000) {
        try {
          safeImageUrl = await compressImage(safeImageUrl, 960, 960, 0.65);
        } catch (e) {
          console.warn('Image compression fallback:', e);
        }
      }

      const newReport: PhotoReport = {
        id: `pr-${Date.now()}`,
        uploaderId: currentUser.id,
        uploaderName: currentUser.fullName,
        uploaderRole: currentUser.role,
        title: title.trim(),
        category,
        building: building || 'Asosiy hudud',
        imageUrl: safeImageUrl,
        timestamp: timeStr,
        notes: (notes || '').trim(),
        status: 'kutilmoqda',
      };

      setPhotoReports((prev) => [newReport, ...prev]);

      try {
        await saveDocument(COLLECTIONS.PHOTO_REPORTS, newReport);
      } catch (err) {
        console.warn('Firestore photo report save notice (preserved in local cache):', err);
      }

      soundSynth.playSuccessTone();
      return newReport;
    },
    [currentUser]
  );

  const verifyPhotoReport = useCallback(
    async (id: string, status: 'tasdiqlandi' | 'rad_etildi') => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      let updatedReport: PhotoReport | null = null;
      setPhotoReports((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const updated: PhotoReport = {
              ...r,
              status,
              verifiedBy: currentUser.fullName,
              verifiedAt: timeStr,
            };
            updatedReport = updated;
            return updated;
          }
          return r;
        })
      );

      if (updatedReport) {
        try {
          await saveDocument(COLLECTIONS.PHOTO_REPORTS, updatedReport);
        } catch (err) {
          console.warn('Firestore verify save notice:', err);
        }
      }
      soundSynth.playSuccessTone();
    },
    [currentUser.fullName]
  );

  // Factory Reports
  const addFactoryReport = useCallback(
    (reportData: Omit<DailyFactoryReport, 'id' | 'date' | 'submittedByName' | 'submittedAt'>) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newRep: DailyFactoryReport = {
        ...reportData,
        id: `rep-${Date.now()}`,
        date: todayStr,
        submittedByName: currentUser.fullName,
        submittedAt: timeStr,
        status: 'kutilmoqda',
      };
      setFactoryReports((prev) => [newRep, ...prev]);
      saveDocument(COLLECTIONS.FACTORY_REPORTS, newRep);
      soundSynth.playSuccessTone();
    },
    [currentUser.fullName, todayStr]
  );

  const acceptFactoryReport = useCallback(
    (id: string, feedback?: string) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFactoryReports((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const updated: DailyFactoryReport = {
              ...r,
              status: 'qabul_qilindi',
              acceptedAt: timeStr,
              acceptedByName: currentUser.fullName,
              statisticianFeedback: feedback !== undefined ? feedback : r.statisticianFeedback,
            };
            saveDocument(COLLECTIONS.FACTORY_REPORTS, updated);
            return updated;
          }
          return r;
        })
      );
      soundSynth.playSuccessTone();
    },
    [currentUser.fullName]
  );

  // Vet Diagnoses
  const addDiagnosis = useCallback(
    (diagData: Omit<VetDiagnosis, 'id' | 'date' | 'doctorName' | 'createdAt'>) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newDiag: VetDiagnosis = {
        ...diagData,
        id: `diag-${Date.now()}`,
        date: todayStr,
        doctorName: currentUser.fullName,
        createdAt: timeStr,
      };
      setDiagnoses((prev) => [newDiag, ...prev]);
      saveDocument(COLLECTIONS.DIAGNOSES, newDiag);
      soundSynth.playSuccessTone();
    },
    [currentUser.fullName, todayStr]
  );

  // Electricity
  const updateElectricityLog = useCallback((updates: Partial<ElectricityLog>) => {
    setElectricityLog((prev) => {
      const updated = {
        ...prev,
        ...updates,
        date: todayStr,
        reportedByName: currentUser.fullName,
      };
      saveDocument(COLLECTIONS.ELECTRICITY_LOGS, updated);
      return updated;
    });
    soundSynth.playSuccessTone();
  }, [currentUser.fullName, todayStr]);

  // Transports
  const addEggTransport = useCallback(
    (item: Omit<EggTransportLog, 'id' | 'date' | 'time' | 'driverName'>) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newTransport: EggTransportLog = {
        ...item,
        id: `egg-t-${Date.now()}`,
        date: todayStr,
        time: timeStr,
        driverName: currentUser.fullName,
      };
      setEggTransports((prev) => [newTransport, ...prev]);
      saveDocument(COLLECTIONS.EGG_TRANSPORTS, newTransport);
      soundSynth.playSuccessTone();
    },
    [currentUser.fullName, todayStr]
  );

  const addFeedTransport = useCallback(
    (item: Omit<FeedTransportLog, 'id' | 'date' | 'time' | 'driverName'>) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newTransport: FeedTransportLog = {
        ...item,
        id: `feed-t-${Date.now()}`,
        date: todayStr,
        time: timeStr,
        driverName: currentUser.fullName,
      };
      setFeedTransports((prev) => [newTransport, ...prev]);
      saveDocument(COLLECTIONS.FEED_TRANSPORTS, newTransport);
      soundSynth.playSuccessTone();
    },
    [currentUser.fullName, todayStr]
  );

  // Guard Shift
  const updateGuardShift = useCallback((updates: Partial<GuardShiftLog>) => {
    setGuardShift((prev) => {
      const updated = {
        ...prev,
        ...updates,
        guardName: currentUser.fullName,
      };
      saveDocument(COLLECTIONS.GUARD_SHIFTS, updated);
      return updated;
    });
    soundSynth.playSuccessTone();
  }, [currentUser.fullName]);

  // Grocery
  const addGroceryRequest = useCallback(
    (mealTarget: GroceryRequest['mealTarget'], items: GroceryRequest['items'], urgency: 'oddiy' | 'tezkor') => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newReq: GroceryRequest = {
        id: `groc-${Date.now()}`,
        date: todayStr,
        requestedByName: currentUser.fullName,
        mealTarget,
        items,
        urgency,
        status: 'kutilmoqda',
        createdAt: timeStr,
      };
      setGroceryRequests((prev) => [newReq, ...prev]);
      saveDocument(COLLECTIONS.GROCERY_REQUESTS, newReq);
      soundSynth.playSuccessTone();
    },
    [currentUser.fullName, todayStr]
  );

  const updateGroceryStatus = useCallback((id: string, status: GroceryRequest['status'], note?: string) => {
    setGroceryRequests((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updated = {
            ...g,
            status,
            approvalNote: note || g.approvalNote,
            approvedByName: currentUser.fullName,
          };
          saveDocument(COLLECTIONS.GROCERY_REQUESTS, updated);
          return updated;
        }
        return g;
      })
    );
    soundSynth.playSuccessTone();
  }, [currentUser.fullName]);

  // Sanitation
  const toggleSanitationTask = useCallback((id: string, photoUrl?: string, notes?: string, disinfectantUsed?: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setSanitationTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isNowCompleted = !t.isCompleted;
          const updated: SanitationTask = {
            ...t,
            isCompleted: isNowCompleted,
            completedAt: isNowCompleted ? timeStr : undefined,
            cleanedByName: currentUser.fullName,
            photoUrl: photoUrl || t.photoUrl,
            notes: notes !== undefined ? notes : t.notes,
            disinfectantUsed: disinfectantUsed !== undefined ? disinfectantUsed : t.disinfectantUsed,
          };
          saveDocument(COLLECTIONS.SANITATION_TASKS, updated);
          return updated;
        }
        return t;
      })
    );
    soundSynth.playSuccessTone();
  }, [currentUser.fullName]);

  const addSanitationTask = useCallback(async (data: {
    title: string;
    zone: string;
    notes?: string;
    photoUrl?: string;
    disinfectantUsed?: string;
    isCompleted?: boolean;
  }) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isCompleted = data.isCompleted ?? true;
    const newTask: SanitationTask = {
      id: `san-${Date.now()}`,
      zone: data.zone.trim(),
      title: data.title.trim(),
      isCompleted,
      photoUrl: data.photoUrl,
      cleanedByName: currentUser.fullName,
      completedAt: isCompleted ? timeStr : undefined,
      notes: data.notes?.trim(),
      disinfectantUsed: data.disinfectantUsed?.trim(),
      createdAt: timeStr,
    };

    setSanitationTasks((prev) => [newTask, ...prev]);

    try {
      await saveDocument(COLLECTIONS.SANITATION_TASKS, newTask);
    } catch (err) {
      console.warn('Sanitation task save error (preserved locally):', err);
    }

    // Also sync as a FarmTask for Ish Boshqaruvchi evaluation
    if (isCompleted) {
      const syncFarmTask: FarmTask = {
        id: `task-${newTask.id}`,
        title: `Tozalik: ${data.zone} - ${data.title}`,
        description: `${data.notes ? data.notes + '. ' : ''}Dezinfeksiya vositasi: ${data.disinfectantUsed || 'Standart'}.${data.photoUrl ? ' (Foto hisobot biriktirilgan)' : ''}`,
        assignedByUserId: 'u-3',
        assignedByRole: 'ish_boshqaruvchi',
        assignedByName: 'Rahimov Javohir (Farm Manager)',
        assignedToRole: 'tozalik_masuli',
        assignedToName: `${currentUser.fullName} (Tozalik mas'uli)`,
        building: data.zone,
        priority: 'orta',
        status: 'bajarildi',
        createdAt: timeStr,
        completedAt: timeStr,
        photoUrl: data.photoUrl,
      };
      setTasks((prev) => [syncFarmTask, ...prev]);
      try {
        saveDocument(COLLECTIONS.TASKS, syncFarmTask);
      } catch (e) {
        console.warn('Task sync save error:', e);
      }
    }

    // Auto-generate photo report if photoUrl is attached
    if (data.photoUrl) {
      try {
        await addPhotoReport(
          `Sanitariya va Tozalik: ${data.zone} - ${data.title}`,
          'sanitariya',
          data.photoUrl,
          data.notes || `${data.zone} hududida tozalash ishlari bajarildi. Vosita: ${data.disinfectantUsed || 'Standart'}`,
          data.zone
        );
      } catch (e) {
        console.warn('Auto photo report generation notice:', e);
      }
    }

    soundSynth.playSuccessTone();
    return newTask;
  }, [currentUser.fullName, addPhotoReport]);

  const evaluateSanitationTask = useCallback((id: string, score: number, note?: string) => {
    const finalNote = note || (score >= 4 ? "Sifatli va o'z vaqtida bajarildi" : "Ko'rib chiqildi, qabul qilindi");
    let targetZone = '';
    let targetTitle = '';
    let targetPhoto = '';

    setSanitationTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          targetZone = t.zone;
          targetTitle = t.title;
          targetPhoto = t.photoUrl || '';
          const updated: SanitationTask = {
            ...t,
            isCompleted: true,
            inspectorApproved: true,
            evaluationScore: score,
            evaluationNote: finalNote,
            evaluatedByName: currentUser.fullName,
          };
          saveDocument(COLLECTIONS.SANITATION_TASKS, updated);
          return updated;
        }
        return t;
      })
    );

    // Sync corresponding FarmTask
    setTasks((prev) => {
      const existing = prev.find((t) => t.id === `task-${id}` || (targetTitle && t.title.includes(targetTitle)));
      if (existing) {
        return prev.map((t) => {
          if (t.id === existing.id) {
            const updated: FarmTask = {
              ...t,
              status: 'tasdiqlandi',
              evaluationScore: score,
              evaluationNote: finalNote,
              evaluatedByName: currentUser.fullName,
            };
            saveDocument(COLLECTIONS.TASKS, updated);
            return updated;
          }
          return t;
        });
      } else {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const newFarmTask: FarmTask = {
          id: `task-${id}`,
          title: `Tozalik: ${targetZone || 'Bino'} - ${targetTitle || 'Sanitariya vazifasi'}`,
          description: finalNote,
          assignedByUserId: 'u-3',
          assignedByRole: 'ish_boshqaruvchi',
          assignedByName: 'Rahimov Javohir (Farm Manager)',
          assignedToRole: 'tozalik_masuli',
          assignedToName: "Tozalik mas'uli",
          building: targetZone || '1-Bino',
          priority: 'orta',
          status: 'tasdiqlandi',
          createdAt: timeStr,
          completedAt: timeStr,
          evaluationScore: score,
          evaluationNote: finalNote,
          evaluatedByName: currentUser.fullName,
          photoUrl: targetPhoto || undefined,
        };
        saveDocument(COLLECTIONS.TASKS, newFarmTask);
        return [newFarmTask, ...prev];
      }
    });

    soundSynth.playSuccessTone();
  }, [currentUser.fullName]);

  // Branches State (Unlimited branches, renameable by HR)
  const [branches, setBranches] = useState<EnterpriseBranch[]>(() => {
    const saved = localStorage.getItem('up_enterprise_branches');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return ENTERPRISE_BRANCHES;
  });

  useEffect(() => {
    localStorage.setItem('up_enterprise_branches', JSON.stringify(branches));
  }, [branches]);

  const addBranch = useCallback((branchData: Omit<EnterpriseBranch, 'id'>) => {
    const newId = `branch_${Date.now()}`;
    const newBranch: EnterpriseBranch = {
      id: newId,
      ...branchData,
    };
    setBranches((prev) => [...prev, newBranch]);
    // Create initial operational plan for new branch
    const initialPlan: BranchDailyPlan = {
      id: `plan-${newId}`,
      branchId: newId,
      branchName: newBranch.name,
      date: new Date().toISOString().slice(0, 10),
      leaderName: newBranch.managerName || 'Ish Boshqaruvchi',
      leaderRole: 'Ish Boshqaruvchi',
      leaderPhone: newBranch.phone || '',
      dailyGoal: 'Kunlik ishlab chiqarish va parvarish rejasini bajarish',
      shiftStatus: 'kunduzgi',
      weatherOrCondition: "22°C, Me'yorda",
      tasks: [],
      changes: [],
      lastUpdated: '08:00',
    };
    setBranchOperationalPlans((prev) => [...prev, initialPlan]);
    saveDocument('operational_plans', initialPlan);
    soundSynth.playSuccessTone();
    return newBranch;
  }, []);

  const updateBranch = useCallback((branchId: BranchId, updates: Partial<EnterpriseBranch>) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, ...updates } : b))
    );
    if (updates.name) {
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.branchId === branchId ? { ...u, branchName: updates.name! } : u))
      );
    }
    soundSynth.playSuccessTone();
  }, []);

  const deleteBranch = useCallback((branchId: BranchId) => {
    setBranches((prev) => prev.filter((b) => b.id !== branchId));
    soundSynth.playSuccessTone();
  }, []);

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  const assignUserBranch = useCallback((userId: string, branchId: BranchId) => {
    const branchObj = branches.find((b) => b.id === branchId);
    if (!branchObj) return;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = {
            ...u,
            branchId,
            branchName: branchObj.name,
          };
          saveDocument(COLLECTIONS.USERS, updated);
          return updated;
        }
        return u;
      })
    );
    soundSynth.playSuccessTone();
  }, [branches]);

  // Chat
  const sendChatMessage = useCallback(
    (options: {
      message: string;
      isAnnouncement?: boolean;
      attachmentUrl?: string;
      attachmentType?: 'image' | 'video' | 'audio' | 'file';
      audioDuration?: number;
      fileName?: string;
      delayDays?: number;
      scheduledDateTime?: string;
    }) => {
      const {
        message,
        isAnnouncement,
        attachmentUrl,
        attachmentType,
        audioDuration,
        fileName,
        delayDays,
        scheduledDateTime,
      } = options;

      if (!message.trim() && !attachmentUrl) return;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const branchLabel = currentUser.branchName ? currentUser.branchName.replace(' Filiali', '') : 'Bosh Filial';

      const isScheduled = !!scheduledDateTime || (!!delayDays && delayDays > 0);
      let scheduledSendTime = undefined;

      if (scheduledDateTime) {
        const [datePart, timePart] = scheduledDateTime.split('T');
        if (datePart && timePart) {
          const [y, m, d] = datePart.split('-');
          scheduledSendTime = `${d}.${m}.${y} ${timePart}`;
        } else {
          scheduledSendTime = scheduledDateTime;
        }
      } else if (isScheduled && delayDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + delayDays);
        scheduledSendTime = futureDate.toLocaleDateString('uz-UZ');
      }

      const newMsg: ChatMessage = {
        id: `chat-${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderRole: currentUser.role,
        senderBranch: branchLabel,
        senderBranchId: currentUser.branchId,
        message: message.trim(),
        timestamp: timeStr,
        isAnnouncement: !!isAnnouncement,
        attachmentUrl,
        attachmentType,
        audioDuration,
        fileName,
        isScheduled,
        delayDays: delayDays || 0,
        scheduledSendTime,
        scheduledDateTime,
      };

      setChatMessages((prev) => [...prev, newMsg]);
      saveDocument(COLLECTIONS.CHAT_MESSAGES, newMsg);

      // Trigger Web Push to all users for announcements, or relevant employees for regular messages
      if (isAnnouncement) {
        triggerBackendPush({
          title: `📢 E'lon: ${currentUser.fullName}`,
          body: newMsg.message.slice(0, 100),
          url: '/chat'
        });
      }

      soundSynth.playMessageBeep();
    },
    [currentUser]
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundSynth.setSoundEnabled(next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        loginUser,
        changeUserPassword,
        changeUserLogin,
        changeUserCredentials,
        switchUserWithPassword,
        logout,
        switchRole,
        switchUser,
        updateUserProfile,
        addUser,
        updateUser,
        deleteUser,
        attendanceRecords,
        hasCheckedInToday,
        currentUserAttendance,
        checkInAttendance,
        tasks,
        createTask,
        updateTaskStatus,
        resetTasksToDefault,
        slesarMilestones,
        completeMilestone,
        activeMilestoneAlert,
        dismissMilestoneAlert,
        triggerTestAlert,
        updateMilestone,
        addMilestone,
        deleteMilestone,
        resetMilestonesToDefault,
        recurring3MinAlert,
        start3MinAlert,
        stop3MinAlert,
        markAlertCompleted,
        silenceAlarmSound,
        testTriggerAlarmNow,
        personalNotes,
        currentUserNotes,
        addPersonalNote,
        updatePersonalNote,
        deletePersonalNote,
        photoReports,
        addPhotoReport,
        verifyPhotoReport,
        factoryReports,
        addFactoryReport,
        acceptFactoryReport,
        diagnoses,
        addDiagnosis,
        electricityLog,
        updateElectricityLog,
        eggTransports,
        addEggTransport,
        feedTransports,
        addFeedTransport,
        guardShift,
        updateGuardShift,
        groceryRequests,
        addGroceryRequest,
        updateGroceryStatus,
        sanitationTasks,
        toggleSanitationTask,
        addSanitationTask,
        evaluateSanitationTask,
        branches,
        selectedBranchFilter,
        setSelectedBranchFilter,
        assignUserBranch,
        addBranch,
        updateBranch,
        deleteBranch,
        branchMetrics,
        updateBranchMetrics,
        branchOperationalPlans,
        updateBranchPlanGoal,
        addBranchDailyTask,
        updateBranchDailyTaskStatus,
        deleteBranchDailyTask,
        addBranchOperationalChange,
        branchInventory,
        addBranchInventoryItem,
        updateBranchInventoryQuantity,
        deleteBranchInventoryItem,
        chickenWeights,
        addChickenWeightRecord,
        cageWeightsMap,
        updateCageWeight,
        resetCageWeights,
        auditLogs,
        addAuditLog,
        chatMessages,
        sendChatMessage,
        isOnline,
        isSyncing,
        syncStatus,
        lastSyncTime,
        syncNow,
        soundEnabled,
        toggleSound,
        activeTab,
        setActiveTab,
        farmCurrentTime,
        getAccessibleTabs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

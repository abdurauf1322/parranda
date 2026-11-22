export type BranchId =
  | 'uychi_bosh'
  | 'chortoq_1'
  | 'kosonsoy_2'
  | 'pop_3'
  | 'norin_4'
  | string;

export interface EnterpriseBranch {
  id: BranchId;
  name: string;
  code: string;
  location: string;
  buildingsCount: number;
  capacityBirds: number;
  phone: string;
  managerName: string;
}

export type Role =
  | 'direktor'
  | 'kadrlar'
  | 'statistikachi'
  | 'ish_boshqaruvchi'
  | 'veterinar'
  | 'elektrik'
  | 'slesar'
  | 'eltuvchi_tuxum'
  | 'yem_tashuvchi'
  | 'qorovul'
  | 'oshpaz'
  | 'tozalik_masuli';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  phone?: string;
  password?: string;
  avatarUrl?: string;
  hireDate?: string;
  department?: string;
  isActive?: boolean;
  branchId?: BranchId;
  branchName?: string;
}

export interface PersonalNote {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  content: string;
  category: 'ish' | 'eslatma' | 'shaxsiy' | 'muhim';
  color: 'yellow' | 'blue' | 'green' | 'purple' | 'rose';
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime?: string;
  isSubstitution: boolean;
  originalWorkerName?: string;
  substituteWorkerName?: string;
  status: 'keldi' | 'kechikdi' | 'orinbosar_bilan' | 'chiqib_ketdi';
  notes?: string;
}

export type TaskPriority = 'urgent' | 'yuqori' | 'orta' | 'oddiy';
export type TaskStatus = 'yangi' | 'jarayonda' | 'bajarildi' | 'tasdiqlandi' | 'rad_etildi';

export interface FarmTask {
  id: string;
  title: string;
  description: string;
  assignedByUserId: string;
  assignedByName: string;
  assignedByRole: Role;
  assignedToUserId?: string;
  assignedToRole: Role;
  assignedToName: string;
  building?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  dueDate?: string; // "YYYY-MM-DD"
  dueTime?: string; // "HH:mm"
  completedAt?: string;
  evaluationScore?: number; // 1 to 5 stars
  evaluationNote?: string;
  evaluatedByName?: string;
  photoUrl?: string;
}

export interface SlesarMilestone {
  id: string;
  time: string; // "07:00"
  alertTime: string; // "06:57" (3 mins before)
  title: string;
  description: string;
  status: 'kutilmoqda' | 'ogohlantirildi' | 'bajarildi' | 'otkazildi';
  completedAt?: string;
  notes?: string;
}

export interface PhotoReport {
  id: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: Role;
  title: string;
  category: 'hisoblagich' | 'plomba' | 'tuxum_yuklash' | 'surveillance' | 'sanitariya' | 'diagnostika' | 'boshqa';
  building?: string;
  imageUrl: string;
  timestamp: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  status: 'kutilmoqda' | 'tasdiqlandi' | 'rad_etildi';
}

export interface DailyFactoryReport {
  id: string;
  date: string;
  building: string; // Bino raqami
  batchNumber?: string; // Partiya raqami (olib tashlangan)
  birdsCount: number;
  eggsCollectedTotal: number;
  eggsCategoryPremium: number;
  eggsCategoryFirst: number;
  eggsCategorySecond: number;
  eggsDamaged: number;
  mortalityCount: number; // Nobudlar soni
  mortalityReason?: string; // Nobudlar soni izohi bilan
  // Kunlik ko'rsatkichlar:
  waterPerBirdMl?: number; // Suv sarfi (jon boshiga, ml)
  feedPerBirdGram?: number; // Yem sarfi (jon boshiga, gr)
  feedConsumedKg: number; // Umumiy kunlik yem sarfi (kg)
  feedRemainingKg?: number; // Zahiradagi qoldiq yem (kg)
  feedReceivedKg?: number; // Qabul qilib olingan yem miqdori (yem omboridan) (kg)
  minTemperature?: number; // Minimal harorat (°C)
  maxTemperature?: number; // Maksimal harorat (°C)
  avgTemperature: number; // Celcius
  humidityPercent: number; // %
  medicationGiven?: string; // Berilgan dori vositasi
  waterConsumedLiters: number;
  submittedByName: string;
  submittedAt: string;
  notes?: string;
  status?: 'kutilmoqda' | 'qabul_qilindi' | 'tasdiqlandi';
  acceptedAt?: string;
  acceptedByName?: string;
  statisticianFeedback?: string;
}

export interface VetDiagnosis {
  id: string;
  date: string;
  building: string;
  birdAgeWeeks: number;
  symptoms: string;
  diagnosis: string;
  prescribedTreatment: string;
  medicationName: string;
  dosage: string;
  courseDurationDays: number;
  severity: 'yengil' | 'ortacha' | 'xavfli';
  doctorName: string;
  status: 'davolanmoqda' | 'sogaydi' | 'nazoratda';
  photoUrl?: string;
  createdAt: string;
}

export interface ElectricityLog {
  id: string;
  date: string;
  time: string;
  meterReadingKwh: number;
  dailyConsumptionKwh: number;
  generatorFuelLevelPercent: number;
  generatorOilPressure: string;
  generatorStatus: 'tayyor' | 'ishlamoqda' | 'tamirda';
  meterPhotoUrl?: string;
  reportedByName: string;
  notes?: string;
  outageStartTime?: string; // Tarmoq o'chgan vaqti (masalan: 14:30)
  outageEndTime?: string;   // Tarmoq yongan vaqti (masalan: 16:15)
  outageReason?: string;    // O'chish sababi
}

export interface EggTransportLog {
  id: string;
  date: string;
  time: string;
  driverName: string;
  vehicleNumber: string;
  destination: string;
  boxesCount: number;
  totalEggsCount: number;
  eggCategory: 'Oliy nav' | '1-nav' | '2-nav' | 'Aralash';
  loadingPhotoUrl: string;
  receiptPhotoUrl: string;
  status: 'yuklandi' | 'yolda' | 'yetkazildi';
  notes?: string;
}

export interface FeedTransportLog {
  id: string;
  date: string;
  time: string;
  driverName: string;
  vehicleNumber: string;
  feedType: 'Starter (0-4 hafta)' | 'Grover (5-16 hafta)' | 'Finisher (Tuxum berish)' | 'Maxsus ozuqa';
  tonnage: number; // tonnada
  destinationBuilding: string;
  sealNumber: string;
  sealPhotoUrl: string;
  unloadingPhotoUrl?: string;
  status: 'qabul_qilindi' | 'yuklandi' | 'bunkerga_tushirildi';
  notes?: string;
}

export interface GuardShiftLog {
  id: string;
  date: string;
  shiftType: 'kunduzgi' | 'tungi';
  guardName: string;
  takeoverTime: string;
  handoverTime?: string;
  handoverToGuardName?: string;
  perimeterStatus: 'tinch' | 'shubhali' | 'nosozlik_mavjud';
  incidentReport?: string;
  surveillancePhotoUrl?: string;
  hourlyPhotosCount: number;
  lastMonitorCheckTime: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: 'kg' | 'dona' | 'litr' | 'qop';
  category: 'Gosht' | 'Sabzavot' | 'Sut mahsuloti' | 'Non' | 'Quruq oziq-ovqat';
}

export interface GroceryRequest {
  id: string;
  date: string;
  requestedByName: string;
  mealTarget: 'Nonushta' | 'Tushlik' | 'Kechki ovqat' | 'Kunlik zaxira';
  items: GroceryItem[];
  urgency: 'oddiy' | 'tezkor';
  status: 'kutilmoqda' | 'tasdiqlandi' | 'berildi' | 'rad_etildi';
  approvalNote?: string;
  approvedByName?: string;
  createdAt: string;
}

export interface SanitationTask {
  id: string;
  zone: string;
  title: string;
  isCompleted: boolean;
  photoUrl?: string;
  cleanedByName?: string;
  completedAt?: string;
  inspectorApproved?: boolean;
  notes?: string;
  disinfectantUsed?: string;
  createdAt?: string;
  evaluationScore?: number;
  evaluationNote?: string;
  evaluatedByName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  message: string;
  timestamp: string;
  isAnnouncement?: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  audioDuration?: number; // seconds
  fileSizeMb?: number;
  fileName?: string;
  senderBranch?: string;
  senderBranchId?: BranchId;
  isScheduled?: boolean;
  scheduledSendTime?: string;
  delayDays?: number;
  scheduledDateTime?: string; // Exact date and time e.g. "2026-10-25T15:33"
}

export type AppTab =
  | 'dashboard'
  | 'operational_plan'
  | 'branch_analytics'
  | 'inventory'
  | 'chicken_weight'
  | 'chat'
  | 'photos'
  | 'tasks'
  | 'attendance'
  | 'notes'
  | 'hr';

export type OperationalPriority = 'urgent' | 'shoshilinch' | 'yuqori' | 'orta' | 'oddiy';
export type OperationalTaskStatus = 'kutilmoqda' | 'jarayonda' | 'bajarildi' | 'kechiktirildi';
export type OperationalChangeCategory =
  | 'ratsion'
  | 'harorat'
  | 'partiya'
  | 'profilaktika'
  | 'suv_ventilyatsiya'
  | 'vaksina'
  | 'boshqa';

export interface BranchDailyTask {
  id: string;
  timeSlot: string;
  title: string;
  description?: string;
  buildingOrSector?: string;
  responsiblePerson: string;
  responsibleRole?: Role;
  priority: OperationalPriority;
  status: OperationalTaskStatus;
  completedAt?: string;
  completionNote?: string;
}

export interface BranchOperationalChange {
  id: string;
  category: OperationalChangeCategory;
  title: string;
  description: string;
  impactLevel: 'muhim' | 'ogohlantirish' | 'oddiy';
  reportedBy: string;
  time: string;
  appliedDate: string;
  status: 'joriy_etildi' | 'rejalashtirilgan' | 'kuzatuvda';
}

export interface BranchDailyPlan {
  id: string;
  branchId: BranchId;
  branchName: string;
  date: string;
  leaderName: string;
  leaderRole: string;
  leaderPhone?: string;
  dailyGoal: string;
  shiftStatus: 'kunduzgi' | 'tungi' | 'yakunlangan';
  weatherOrCondition?: string;
  tasks: BranchDailyTask[];
  changes: BranchOperationalChange[];
  notes?: string;
  lastUpdated: string;
}

export interface BranchProductivityMetric {
  branchId: BranchId;
  date: string;
  totalBirds: number;
  eggsCollected: number;
  layingRatePercent: number;
  feedConsumedKg: number;
  feedConversionFcr: number;
  waterConsumedLiters: number;
  mortalityCount: number;
  mortalityRatePercent: number;
  damagedEggsCount: number;
  damagedEggsPercent: number;
  avgTemperature: number;
  avgHumidity: number;
  tasksCompletedPercent: number;
}

export type InventoryCategory = 'yem' | 'dori' | 'asbob';

export interface ChickenWeightRecord {
  id: string;
  cageNumber: number; // 1-12
  chickenNumber: number; // 1-8
  weight: number; // grams
  createdAt: string; // ISO date
  branchId: BranchId;
  factoryNumber: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  details?: string;
}

export interface BranchInventoryItem {
  id: string;
  branchId: BranchId;
  category: InventoryCategory;
  name: string;
  quantity: number;
  unit: string; // 'kg', 'qop', 'dona', 'litr', 'ampula'
  minThreshold: number;
  lastUpdated: string;
  updatedBy: string;
  notes?: string;
}

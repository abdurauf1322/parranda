export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  phone?: string;
  branchId?: string;
  isActive: boolean;
}

export interface BranchInfo {
  id: number;
  branchId: string;
  name: string;
  location: string;
  birdCapacity: number;
  currentBirds: number;
  dailyEggTarget: number;
  status: string;
  managerName: string;
}

export interface SlesarMilestone {
  id: number | string;
  time: string;
  alertTime: string;
  title: string;
  description: string;
  status: 'kutilmoqda' | 'ogohlantirildi' | 'bajarildi';
  completedAt?: string;
  notes?: string;
}

export interface TaskItem {
  id: number | string;
  title: string;
  description?: string;
  assignedByName?: string;
  assignedByRole?: string;
  assignedToRole: string;
  assignedToName?: string;
  building?: string;
  dueTime?: string;
  status: 'kutilmoqda' | 'jarayonda' | 'bajarildi' | 'tasdiqlandi' | 'yangi';
  priority?: string;
  evaluationScore?: number;
  evaluationNote?: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: number | string;
  senderId?: number;
  senderName: string;
  senderRole: string;
  message: string;
  isAnnouncement: boolean;
  timestamp: string;
}

export interface InventoryItem {
  id: number | string;
  branchId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
  lastUpdated?: string;
}

export interface ChickenWeightRecord {
  id: number | string;
  branchId: string;
  building: string;
  cageNumber: string;
  batchNumber?: string;
  birdAgeDays: number;
  sampleSize: number;
  avgWeightGrams: number;
  targetWeightGrams: number;
  measuredBy: string;
  measuredDate: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  role: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
}

export interface PhotoReport {
  id: number | string;
  uploaderName: string;
  uploaderRole: string;
  title: string;
  category: string;
  building?: string;
  imageUrl: string;
  timestamp: string;
  notes?: string;
  status?: string;
}

export interface DailyFactoryReport {
  id: number;
  date: string;
  building: string;
  birdsCount: number;
  eggsCollectedTotal: number;
  mortalityCount: number;
  feedConsumedKg: number;
  avgTemperature: number;
  submittedByName: string;
  submittedAt: string;
  notes?: string;
}

export interface PersonalNote {
  id: number | string;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
}

export const ROLE_LABELS: Record<string, string> = {
  direktor: 'Direktor',
  kadrlar: 'Kadrlar',
  statistikachi: 'Statistikachi',
  ish_boshqaruvchi: 'Ish Boshqaruvchi',
  veterinar: 'Veterinar',
  elektrik: 'Elektrik',
  slesar: 'Slesar / Yem',
  haydovchi_tuxum: 'Haydovchi (Tuxum)',
  haydovchi_yem: 'Haydovchi (Yem)',
  qorovul: 'Qorovul',
  oshpaz: 'Oshpaz',
  tozalik: 'Tozalik',
};

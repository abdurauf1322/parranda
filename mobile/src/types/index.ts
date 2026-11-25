export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  phone?: string;
  branchId?: string;
  isActive: boolean;
}

export interface SlesarMilestone {
  id: string;
  time: string;
  alertTime: string;
  title: string;
  description: string;
  status: 'kutilmoqda' | 'ogohlantirildi' | 'bajarildi';
  completedAt?: string;
  notes?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignedToRole: string;
  assignedToUserId?: number;
  assignedBy?: string;
  dueTime?: string;
  status: 'kutilmoqda' | 'jarayonda' | 'bajarildi';
  priority?: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId?: number;
  senderName: string;
  senderRole: string;
  message: string;
  isAnnouncement: boolean;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
  updatedAt?: string;
}

export interface ChickenWeightRecord {
  id: string;
  branchId: string;
  houseName: string;
  ageDays: number;
  averageWeightGrams: number;
  sampleCount: number;
  recordedBy: string;
  date: string;
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
  id: string;
  userId?: number;
  userName: string;
  role: string;
  category: string;
  caption: string;
  imageUrl: string;
  timestamp: string;
}

export interface PersonalNote {
  id: string;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
}

export const ROLE_LABELS: Record<string, string> = {
  direktor: 'Direktor',
  bosh_energetik: 'Bosh Energetik',
  bosh_muhandis: 'Bosh Muhandis',
  elektrik: 'Elektrik',
  slesar: 'Slesar / Yem',
  veterinar: 'Veterinar',
  operator: 'Operator',
  omborchi: 'Omborchi',
  ishchi: 'Xodim',
};

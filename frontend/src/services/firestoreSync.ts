import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  User,
  AttendanceRecord,
  FarmTask,
  SlesarMilestone,
  PersonalNote,
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
} from '../types';

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  PERSONAL_NOTES: 'personal_notes',
  ATTENDANCE: 'attendance',
  TASKS: 'tasks',
  SLESAR_MILESTONES: 'slesar_milestones',
  PHOTO_REPORTS: 'photo_reports',
  CHAT_MESSAGES: 'chat_messages',
  FACTORY_REPORTS: 'factory_reports',
  DIAGNOSES: 'diagnoses',
  ELECTRICITY_LOGS: 'electricity_logs',
  EGG_TRANSPORTS: 'egg_transports',
  FEED_TRANSPORTS: 'feed_transports',
  GUARD_SHIFTS: 'guard_shifts',
  GROCERY_REQUESTS: 'grocery_requests',
  SANITATION_TASKS: 'sanitation_tasks',
  CHICKEN_WEIGHTS: 'chicken_weights',
  AUDIT_LOGS: 'audit_logs',
} as const;

// Helper to seed initial collections if they are completely empty
export async function seedInitialFirestoreData(mockData: {
  users: User[];
  attendance: AttendanceRecord[];
  tasks: FarmTask[];
  slesarMilestones: SlesarMilestone[];
  personalNotes: PersonalNote[];
  photoReports: PhotoReport[];
  factoryReports: DailyFactoryReport[];
  diagnoses: VetDiagnosis[];
  electricityLog: ElectricityLog;
  eggTransports: EggTransportLog[];
  feedTransports: FeedTransportLog[];
  guardShift: GuardShiftLog;
  groceryRequests: GroceryRequest[];
  sanitationTasks: SanitationTask[];
  chatMessages: ChatMessage[];
}) {
  try {
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    if (usersSnapshot.empty) {
      console.log('Seeding initial data to Cloud Firestore...');
      const batch = writeBatch(db);

      // Seed Users
      mockData.users.forEach((u) => {
        batch.set(doc(db, COLLECTIONS.USERS, u.id), u);
      });

      // Seed Attendance
      mockData.attendance.forEach((a) => {
        batch.set(doc(db, COLLECTIONS.ATTENDANCE, a.id), a);
      });

      // Seed Tasks
      mockData.tasks.forEach((t) => {
        batch.set(doc(db, COLLECTIONS.TASKS, t.id), t);
      });

      // Seed Milestones
      mockData.slesarMilestones.forEach((m) => {
        batch.set(doc(db, COLLECTIONS.SLESAR_MILESTONES, m.id), m);
      });

      // Seed Notes
      mockData.personalNotes.forEach((n) => {
        batch.set(doc(db, COLLECTIONS.PERSONAL_NOTES, n.id), n);
      });

      // Seed Photo reports
      mockData.photoReports.forEach((p) => {
        batch.set(doc(db, COLLECTIONS.PHOTO_REPORTS, p.id), p);
      });

      // Seed Chat messages
      mockData.chatMessages.forEach((c) => {
        batch.set(doc(db, COLLECTIONS.CHAT_MESSAGES, c.id), c);
      });

      // Seed Factory reports
      mockData.factoryReports.forEach((f) => {
        batch.set(doc(db, COLLECTIONS.FACTORY_REPORTS, f.id), f);
      });

      // Seed Diagnoses
      mockData.diagnoses.forEach((d) => {
        batch.set(doc(db, COLLECTIONS.DIAGNOSES, d.id), d);
      });

      // Seed Electricity log
      batch.set(doc(db, COLLECTIONS.ELECTRICITY_LOGS, mockData.electricityLog.id), mockData.electricityLog);

      // Seed Egg Transports
      mockData.eggTransports.forEach((e) => {
        batch.set(doc(db, COLLECTIONS.EGG_TRANSPORTS, e.id), e);
      });

      // Seed Feed Transports
      mockData.feedTransports.forEach((ft) => {
        batch.set(doc(db, COLLECTIONS.FEED_TRANSPORTS, ft.id), ft);
      });

      // Seed Guard Shift
      batch.set(doc(db, COLLECTIONS.GUARD_SHIFTS, mockData.guardShift.id), mockData.guardShift);

      // Seed Grocery Requests
      mockData.groceryRequests.forEach((gr) => {
        batch.set(doc(db, COLLECTIONS.GROCERY_REQUESTS, gr.id), gr);
      });

      // Seed Sanitation tasks
      mockData.sanitationTasks.forEach((st) => {
        batch.set(doc(db, COLLECTIONS.SANITATION_TASKS, st.id), st);
      });

      await batch.commit();
      console.log('Cloud Firestore initial seeding completed successfully!');
    }
  } catch (error) {
    console.warn('Initial seeding skipped or already present:', error);
  }
}

// Generic Document Upsert
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<void> {
  const path = `${collectionName}/${data.id}`;
  try {
    // Remove undefined values to prevent Firestore errors
    const cleanedData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, collectionName, data.id), cleanedData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Generic Document Delete
export async function removeDocument(collectionName: string, id: string): Promise<void> {
  const path = `${collectionName}/${id}`;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Realtime Collection Listener with offline metadata
export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  onData: (items: T[], isFromCache: boolean, hasPendingWrites: boolean) => void
) {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      const items: T[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as T),
        id: docSnap.id,
      }));
      onData(items, snapshot.metadata.fromCache, snapshot.metadata.hasPendingWrites);
    },
    (error) => {
      console.warn(`Firestore sync notice (${collectionName}):`, error?.message || error);
    }
  );
}

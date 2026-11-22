import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { COLLECTIONS } from '../services/firestoreSync';

export const backupDatabase = async () => {
  const backupData: Record<string, any[]> = {};
  
  for (const collectionName of Object.values(COLLECTIONS)) {
    const snapshot = await getDocs(collection(db, collectionName));
    backupData[collectionName] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

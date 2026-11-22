import { FarmTask } from '../types';

/**
 * Bugungi sanani 'YYYY-MM-DD' formatida olish
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Ertangi sanani 'YYYY-MM-DD' formatida olish
 */
export const getTomorrowDateString = (): string => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Topshiriq yaratishda qulay boshlang'ich muddat (sana va vaqt) hisoblash.
 * 12:00 dan keyin qo'yilgan topshiriqlar eskirib qolmasligi uchun
 * hozirgi vaqtdan 2 soat keyingi vaqt yoki ish kuni oxiri (18:00) belgilanadi.
 */
export const getDefaultDueDateTime = (): { dueDate: string; dueTime: string } => {
  const now = new Date();
  const todayStr = getTodayDateString();
  const currentHour = now.getHours();

  if (currentHour >= 19) {
    // Kechki payt bo'lsa, ertangi kunga 10:00 qo'yiladi
    return {
      dueDate: getTomorrowDateString(),
      dueTime: '10:00',
    };
  }

  // Kunduzgi payt bo'lsa, hozirgi vaqtdan 2 soat keyin yoki kamida 18:00
  const targetHour = Math.min(Math.max(currentHour + 2, 12), 18);
  const dueTime = `${String(targetHour).padStart(2, '0')}:00`;

  return {
    dueDate: todayStr,
    dueTime,
  };
};

/**
 * Topshiriq muddati o'tib ketganligini to'g'ri tekshirish:
 * - Agar topshiriq bajarilgan yoki tasdiqlangan bo'lsa -> o'tmagan (false)
 * - Agar sana ertaga yoki undan keyingi kunga belgilangan bo'lsa -> o'tmagan (false)
 * - Agar sana kechagi yoki undan oldingi kunga tegishli bo'lsa -> o'tgan (true)
 * - Agar sana bugun bo'lsa -> faqatgina vaqt (dueTime) hozirgi vaqtdan kichik bo'lsa o'tgan (true)
 */
export const isTaskOverdue = (task: FarmTask, currentTime?: string): boolean => {
  if (task.status === 'bajarildi' || task.status === 'tasdiqlandi') {
    return false;
  }

  if (!task.dueTime && !task.dueDate) {
    return false;
  }

  const todayStr = getTodayDateString();

  // Agar sana berilgan bo'lsa
  if (task.dueDate) {
    if (task.dueDate < todayStr) {
      return true; // Muddat o'tgan sana
    }
    if (task.dueDate > todayStr) {
      return false; // Kelgusi kunga tegishli, muddat hali o'tmagan!
    }
  }

  // Agar sana bugun bo'lsa (yoki dueDate ko'rsatilmagan bo'lsa, bugungi topshiriq deb qaraladi):
  if (!task.dueTime) {
    return false;
  }

  const now = new Date();
  const nowTime = currentTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nowShort = nowTime.substring(0, 5); // "HH:mm"
  const taskShort = task.dueTime.substring(0, 5); // "HH:mm"

  return taskShort < nowShort;
};

/**
 * Topshiriq muddatini inson tushunadigan shaklda formatlash
 */
export const formatTaskDeadline = (dueDate?: string, dueTime?: string): string => {
  if (!dueDate && !dueTime) return "Belgilanmagan";

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  let dateLabel = "";
  if (dueDate) {
    if (dueDate === todayStr) {
      dateLabel = "Bugun";
    } else if (dueDate === tomorrowStr) {
      dateLabel = "Ertaga";
    } else {
      dateLabel = dueDate;
    }
  }

  if (dateLabel && dueTime) {
    return `${dateLabel}, ${dueTime}`;
  }
  return dateLabel || dueTime || "";
};

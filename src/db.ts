export interface Attempt {
  id: string;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'completed' | 'failed';
  failureDay: number | null;
  failureReason: string | null;
}

export interface DayLog {
  id: string; // "attemptId-dayNumber"
  attemptId: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  workout1: boolean;
  workout1Desc: string;
  workout2: boolean; // Must be outdoor
  workout2Desc: string;
  water: number; // Water consumed in ml
  waterGoal: number; // e.g. 3785 ml (1 gallon)
  diet: boolean;
  dietDesc: string;
  reading: boolean;
  readingBook: string;
  readingPages: number;
  photo: string | null; // Base64 image data URL
  journal: string;
  completed: boolean;
  failed: boolean;
  sleep?: boolean;
  steps10k?: boolean;
}

const DB_NAME = '75HardTrackerDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store attempts
      if (!db.objectStoreNames.contains('attempts')) {
        db.createObjectStore('attempts', { keyPath: 'id' });
      }

      // Store daily logs (key is attemptId-dayNumber)
      if (!db.objectStoreNames.contains('days')) {
        db.createObjectStore('days', { keyPath: 'id' });
      }
    };
  });
};

// Attempt CRUD operations
export const saveAttempt = async (attempt: Attempt): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attempts', 'readwrite');
    const store = tx.objectStore('attempts');
    const request = store.put(attempt);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save attempt'));
  });
};

export const getAttempt = async (id: string): Promise<Attempt | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attempts', 'readonly');
    const store = tx.objectStore('attempts');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get attempt'));
  });
};

export const getAllAttempts = async (): Promise<Attempt[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attempts', 'readonly');
    const store = tx.objectStore('attempts');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error('Failed to get all attempts'));
  });
};

// Daily Log CRUD operations
export const saveDayLog = async (log: DayLog): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('days', 'readwrite');
    const store = tx.objectStore('days');
    const request = store.put(log);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save day log'));
  });
};

export const getDayLog = async (attemptId: string, dayNumber: number): Promise<DayLog | null> => {
  const db = await initDB();
  const id = `${attemptId}-${dayNumber}`;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('days', 'readonly');
    const store = tx.objectStore('days');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get day log'));
  });
};

export const getAttemptLogs = async (attemptId: string): Promise<DayLog[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('days', 'readonly');
    const store = tx.objectStore('days');
    const request = store.getAll();

    request.onsuccess = () => {
      const logs: DayLog[] = request.result || [];
      const filtered = logs.filter(log => log.attemptId === attemptId);
      // Sort by day number
      filtered.sort((a, b) => a.dayNumber - b.dayNumber);
      resolve(filtered);
    };
    request.onerror = () => reject(new Error('Failed to get logs for attempt'));
  });
};

export const deleteAttemptLogs = async (attemptId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('days', 'readwrite');
    const store = tx.objectStore('days');
    const request = store.getAllKeys();

    request.onsuccess = () => {
      const keys = request.result as string[];
      const deletePromises = keys
        .filter(key => key.startsWith(`${attemptId}-`))
        .map(key => {
          return new Promise<void>((res, rej) => {
            const delReq = store.delete(key);
            delReq.onsuccess = () => res();
            delReq.onerror = () => rej();
          });
        });

      Promise.all(deletePromises)
        .then(() => resolve())
        .catch(() => reject(new Error('Failed to delete some day logs')));
    };

    request.onerror = () => reject(new Error('Failed to fetch keys for deletion'));
  });
};

export const deleteAttempt = async (attemptId: string): Promise<void> => {
  const db = await initDB();
  await deleteAttemptLogs(attemptId);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attempts', 'readwrite');
    const store = tx.objectStore('attempts');
    const request = store.delete(attemptId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete attempt record'));
  });
};

// Export/Import backup structure
export interface BackupData {
  attempts: Attempt[];
  days: DayLog[];
}

export const exportBackup = async (): Promise<BackupData> => {
  const db = await initDB();
  const attempts = await getAllAttempts();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('days', 'readonly');
    const store = tx.objectStore('days');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve({
        attempts,
        days: request.result || []
      });
    };
    request.onerror = () => reject(new Error('Failed to export daily logs'));
  });
};

export const importBackup = async (data: BackupData): Promise<void> => {
  const db = await initDB();
  
  // Clear existing
  return new Promise((resolve, reject) => {
    const txAttempts = db.transaction('attempts', 'readwrite');
    const storeAttempts = txAttempts.objectStore('attempts');
    storeAttempts.clear();

    txAttempts.oncomplete = () => {
      const txDays = db.transaction('days', 'readwrite');
      const storeDays = txDays.objectStore('days');
      storeDays.clear();

      txDays.oncomplete = () => {
        // Write new data
        const txWriteAttempts = db.transaction('attempts', 'readwrite');
        const storeWriteAttempts = txWriteAttempts.objectStore('attempts');
        data.attempts.forEach(a => storeWriteAttempts.put(a));

        txWriteAttempts.oncomplete = () => {
          const txWriteDays = db.transaction('days', 'readwrite');
          const storeWriteDays = txWriteDays.objectStore('days');
          data.days.forEach(d => storeWriteDays.put(d));

          txWriteDays.oncomplete = () => resolve();
          txWriteDays.onerror = () => reject(new Error('Failed to write day logs during import'));
        };
        txWriteAttempts.onerror = () => reject(new Error('Failed to write attempts during import'));
      };
      txDays.onerror = () => reject(new Error('Failed to clear days store'));
    };
    txAttempts.onerror = () => reject(new Error('Failed to clear attempts store'));
  });
};

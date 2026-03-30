import { openDB } from 'idb';

export async function checkAndRepairDB(): Promise<boolean> {
  try {
    const db = await openDB('badminton-manager', 3);
    const hasAllStores = 
      db.objectStoreNames.contains('players') &&
      db.objectStoreNames.contains('courts') &&
      db.objectStoreNames.contains('matches') &&
      db.objectStoreNames.contains('settings') &&
      db.objectStoreNames.contains('queue') &&
      db.objectStoreNames.contains('accounts') &&
      db.objectStoreNames.contains('sessions');
    
    db.close();
    
    if (!hasAllStores) {
      console.warn('[RallyQ] DB missing stores, deleting and recreating...');
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase('badminton-manager');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => {
          console.error('[RallyQ] DB delete blocked - close all tabs and try again');
          reject(new Error('DB delete blocked'));
        };
      });
      return false; // needs reload
    }
    return true; // all good
  } catch (err) {
    console.error('[RallyQ] DB check failed:', err);
    return false;
  }
}


const DB_NAME = 'forex-ta-pro-cache';
const STORE_NAME = 'multimedia-summaries';
const DB_VERSION = 1;

let db: IDBDatabase;

function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB error:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME);
            }
        };
    });
}

export async function setCache(key: string, value: any): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        
        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error setting cache in IndexedDB:', request.error);
            reject(request.error);
        };
    });
}

export async function getCache<T>(key: string): Promise<T | undefined> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result as T | undefined);
        };

        request.onerror = () => {
            console.error('Error getting cache from IndexedDB:', request.error);
            reject(request.error);
        };
    });
}

// Обёртка над IndexedDB. Все данные приложения хранятся только на телефоне.

const DB_NAME = "teacher-assistant-db";
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = req.result;

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("groups")) {
        db.createObjectStore("groups", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("students")) {
        const s = db.createObjectStore("students", { keyPath: "id", autoIncrement: true });
        s.createIndex("groupId", "groupId");
      }
      if (!db.objectStoreNames.contains("gradeColumns")) {
        const s = db.createObjectStore("gradeColumns", { keyPath: "id", autoIncrement: true });
        s.createIndex("groupId", "groupId");
      }
      if (!db.objectStoreNames.contains("grades")) {
        const s = db.createObjectStore("grades", { keyPath: "id", autoIncrement: true });
        s.createIndex("studentId", "studentId");
        s.createIndex("columnId", "columnId");
        s.createIndex("studentColumn", ["studentId", "columnId"], { unique: true });
      }
      if (!db.objectStoreNames.contains("attendance")) {
        const s = db.createObjectStore("attendance", { keyPath: "id", autoIncrement: true });
        s.createIndex("studentId", "studentId");
        s.createIndex("studentDate", ["studentId", "date"], { unique: true });
      }
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("templateResults")) {
        db.createObjectStore("templateResults", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("exercises")) {
        db.createObjectStore("exercises", { keyPath: "id", autoIncrement: true });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

export const db = {
  async get(storeName, key) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const r = store.get(key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  },

  async getAll(storeName) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const r = store.getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
  },

  async getAllByIndex(storeName, indexName, value) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const r = store.index(indexName).getAll(value);
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
  },

  async put(storeName, value) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const r = store.put(value);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },

  async delete(storeName, key) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const r = store.delete(key);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  },

  async clear(storeName) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const r = store.clear();
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  },

  async getSetting(key, fallback = null) {
    const row = await this.get("settings", key);
    return row ? row.value : fallback;
  },

  async setSetting(key, value) {
    return this.put("settings", { key, value });
  },

  STORE_NAMES: [
    "groups", "students", "gradeColumns", "grades",
    "attendance", "documents", "templateResults", "exercises",
  ],
};

export async function exportAllData() {
  const data = { exportedAt: new Date().toISOString(), version: DB_VERSION, stores: {} };
  const allStores = [...db.STORE_NAMES, "settings"];
  for (const name of allStores) {
    data.stores[name] = await db.getAll(name);
  }
  return data;
}

export async function importAllData(data) {
  if (!data || !data.stores) throw new Error("Файл резервной копии повреждён");
  const database = await openDb();
  const storeNames = Object.keys(data.stores).filter((n) => database.objectStoreNames.contains(n));
  await new Promise((resolve, reject) => {
    const t = database.transaction(storeNames, "readwrite");
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    for (const name of storeNames) {
      const store = t.objectStore(name);
      store.clear();
      for (const row of data.stores[name]) {
        store.put(row);
      }
    }
  });
}

export const DB_NAME = 'gasSalesDB';
export const DB_VERSION = 2;

let db;

// 1️⃣ Open / Create Database
export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
      db = event.target.result;

      // Sales store
      if (!db.objectStoreNames.contains('sales')) {
        const salesStore = db.createObjectStore('sales', {
          keyPath: 'id',
          autoIncrement: true
        });
        salesStore.createIndex('year', 'year', { unique: false });
        salesStore.createIndex('cash', 'cash', { unique: false });
        salesStore.createIndex('transfer', 'transfer', { unique: false });
      }

      // Expense store
      if (!db.objectStoreNames.contains('expense')){
        const expenseStore = db.createObjectStore('expense', {
          keyPath: 'id',
          autoIncrement: true
        });
        expenseStore.createIndex('year', 'year', {unique: false})
        expenseStore.createIndex('cash', 'cash', { unique: false });
        expenseStore.createIndex('transfer', 'transfer', { unique: false });
      }

      //fixPrice store
      if (!db.objectStoreNames.contains('fixprice')) {
        const fixPriceStore = db.createObjectStore('fixprice', { keyPath: 'key' });
      }

      // Creditors store
      if (!db.objectStoreNames.contains('creditors')) {
        const creditorStore = db.createObjectStore('creditors', {
          keyPath: 'id',
          autoIncrement: true
        });

        creditorStore.createIndex('name', 'name', { unique: false });
        creditorStore.createIndex('timestamp', 'timestamp', { unique: false });
      }


      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = function () {
      reject('Failed to open database');
    };
  });
}

openDatabase()

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("Service Worker Registered"))
    .catch(err => console.error("SW failed", err));
}

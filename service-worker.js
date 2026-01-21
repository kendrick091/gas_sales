const CACHE_NAME = "gas-sales-cache-v6";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./calculate.js",
  "./menuLog.js",
  "./creditors.js",
  "./monthlyProfitGraph.js",
  "./price.js",
  "./setting.js",
    "./userType.js",
    "./dailyProfit.js",
    "./expenses.js",
    "./paymentInfo.js",
    "./deleteSales.js",
  "./totalSales.js",
  "./manifest.json"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// Activate
self.addEventListener("activate", () => {
  self.clients.claim();
});

// Fetch (offline support)
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If cached, return it
      if (cachedResponse) {
        return cachedResponse;
      }

      // Else try network
      return fetch(event.request).catch(() => {
        // If offline and not cached, just fail silently
        return new Response("", {
          status: 503,
          statusText: "Offline"
        });
      });
    })
  );
});


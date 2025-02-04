// Version management
const CACHE_VERSION = "v2" // Increment this when you update your app
const CACHE_NAME = `event-pwa-${CACHE_VERSION}`

// Resources to pre-cache
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  // Add other static assets here
]

// Install event - cache static resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching static resources")
      return cache.addAll(STATIC_CACHE_URLS)
    })
  )
  // Activate new service worker immediately
  self.skipWaiting()
})

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions of our cache
              return (
                cacheName.startsWith("event-pwa-") && cacheName !== CACHE_NAME
              )
            })
            .map((cacheName) => {
              console.log("Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        // Take control of all pages immediately
        return clients.claim()
      })
  )
})

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before using it
        const responseClone = response.clone()

        // Open cache and store new response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })

        return response
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // If no cache, return a fallback or error page
          return new Response("Offline content not available")
        })
      })
  )
})

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting()
  }
})

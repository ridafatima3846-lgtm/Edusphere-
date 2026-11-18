const CACHE_NAME = "edusphere-lms-v2";

const PRECACHE_URLS = [
  "/index.html",
  "/app.html",
  "/about.html",
  "/features.html",
  "/contact.html",
  "/login.html",
  "/register.html",
  "/admin-dashboard.html",
  "/students.html",
  "/teachers.html",
  "/courses.html",
  "/classes.html",
  "/assignments.html",
  "/announcements.html",
  "/results.html",
  "/settings.html",
  "/student-dashboard.html",
  "/student-courses.html",
  "/student-assignments.html",
  "/student-announcements.html",
  "/student-results.html",
  "/student-settings.html",
  "/teacher-dashboard.html",
  "/teacher-courses.html",
  "/teacher-assignments.html",
  "/teacher-announcements.html",
  "/teacher-results.html",
  "/teacher-students.html",
  "/teacher-settings.html",
  "/css/app.css",
  "/css/navbar.css",
  "/css/home.css",
  "/css/login.css",
  "/css/register.css",
  "/css/about.css",
  "/css/contact.css",
  "/css/features.css",
  "/css/style.css",
  "/css/page.css",
  "/css/settings.css",
  "/css/admin-dashboard.css",
  "/css/student-dashboard.css",
  "/css/teacher-dashboard.css",
  "/css/students.css",
  "/manifest.json",
  "/images/icon-192.svg",
  "/images/icon-512.svg",
  "/js/admin-dashboard.js",
  "/js/admin-sidebar.js",
  "/js/announcements.js",
  "/js/app.js",
  "/js/assignments.js",
  "/js/classes.js",
  "/js/common.js",
  "/js/courses.js",
  "/js/data.js",
  "/js/demo-seed.js",
  "/js/login.js",
  "/js/principal-academics.js",
  "/js/principal-communication.js",
  "/js/principal-operations.js",
  "/js/principal.js",
  "/js/register.js",
  "/js/results.js",
  "/js/settings.js",
  "/js/student-announcements.js",
  "/js/student-assignments.js",
  "/js/student-courses.js",
  "/js/student-dashboard.js",
  "/js/student-results.js",
  "/js/student-settings.js",
  "/js/student.js",
  "/js/students.js",
  "/js/teacher-announcements.js",
  "/js/teacher-assignments.js",
  "/js/teacher-courses.js",
  "/js/teacher-dashboard.js",
  "/js/teacher-results.js",
  "/js/teacher-settings.js",
  "/js/teacher-students.js",
  "/js/teacher.js",
  "/js/teachers.js",
  "/js/ui.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        event.waitUntil(
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            })
            .catch(() => {})
        );
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

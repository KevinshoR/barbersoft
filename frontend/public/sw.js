// frontend/public/sw.js
// Service Worker de Barbersoft.
// Vive en el navegador incluso con Barbersoft cerrado. Escucha eventos push
// enviados por el servidor y muestra notificaciones nativas del sistema.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Push entrante
self.addEventListener('push', (event) => {
  let data = { title: 'Barbersoft', body: 'Tienes una notificación', url: '/appointments' }
  try { if (event.data) data = { ...data, ...event.data.json() } } catch { /* payload no era JSON */ }

  const options = {
    body:  data.body,
    icon:  '/favicon.svg',
    badge: '/favicon.svg',
    tag:   data.tag || 'barbersoft',
    data:  { url: data.url || '/appointments' },
    vibrate: [180, 90, 180],
    renotify: false,
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/appointments'

  event.waitUntil((async () => {
    // Si la app ya está abierta, enfocamos esa pestaña
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of all) {
      const clientUrl = new URL(client.url)
      if (clientUrl.origin === self.location.origin) {
        client.focus()
        client.postMessage({ type: 'navigate', url: targetUrl })
        return
      }
    }
    // Si no, abrimos una nueva
    await self.clients.openWindow(targetUrl)
  })())
})

/*
 * sw.js — service worker for 1amInvesting dilution alerts.
 *
 * Must live at the site root: a service worker can only control pages at or below its own
 * path, and the push subscription is bound to this origin. It does nothing except receive
 * pushes and open filings — no caching, no offline behaviour, no interference with the
 * site's existing no-store headers.
 */

self.addEventListener('install', function (event) {
  // Take over immediately rather than waiting for every tab to close, so a subscription
  // made on this visit works on this visit.
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Dilution alert', body: event.data ? event.data.text() : '' };
  }

  var title = data.title || 'Dilution alert';
  var options = {
    body: data.body || '',
    // The tag is the filing's accession number, so a re-send of the same filing replaces
    // the existing notification instead of stacking a duplicate.
    tag: data.tag || 'dilution',
    renotify: true,
    requireInteraction: true,
    timestamp: Date.now(),
    icon: '/assets/apple-touch-icon.png',
    badge: '/assets/favicon.png',
    data: { url: data.url || '/' }
  };

  // iOS revokes push permission if a push arrives and no notification is shown, so this
  // must always resolve to a visible notification.
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      // Reuse an already-open tab on this origin where we can, rather than piling up windows.
      for (var i = 0; i < list.length; i++) {
        if (list[i].url === url && 'focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// A push service can rotate a subscription without warning. When that happens the old
// endpoint stops working silently — which for an alerter is the worst failure mode — so
// re-register and tell the server the new endpoint.
self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription
      ? { userVisibleOnly: true, applicationServerKey: event.oldSubscription.options.applicationServerKey }
      : { userVisibleOnly: true })
      .then(function (sub) {
        return fetch('https://alerts.1aminvesting.com/api/resubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            old: event.oldSubscription ? event.oldSubscription.endpoint : null,
            subscription: sub.toJSON()
          })
        });
      })
      .catch(function () { /* nothing useful to do here; the server prunes dead endpoints */ })
  );
});

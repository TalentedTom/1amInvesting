/* Retirement worker: replaces the former dilution-alert push receiver.
 * No push, resubscribe, notification, fetch or offline handlers remain.
 * Keeping this URL lets older installations update and retire themselves.
 */
self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        try {
            const subscription = await self.registration.pushManager.getSubscription();
            if (subscription) await subscription.unsubscribe();
        } catch (_) {}
        try {
            const notifications = await self.registration.getNotifications();
            notifications.forEach(notification => notification.close());
        } catch (_) {}
        await self.registration.unregister();
    })());
});

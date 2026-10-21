/* Dilution alerts were retired at the owner's request.
 * Keep this cleanup for returning visitors; never register a worker, request
 * notification permission, show signup UI or contact the former alerts API.
 */
(async function () {
    'use strict';
    if (!('serviceWorker' in navigator)) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
        const owned = [registration.active, registration.waiting, registration.installing].some(worker => {
            if (!worker) return false;
            const url = new URL(worker.scriptURL);
            return url.origin === location.origin && url.pathname === '/sw.js';
        });
        if (!owned) continue;
        try {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) await subscription.unsubscribe();
        } catch (_) { /* Still retire the worker if the subscription is already gone. */ }
        try {
            const notifications = await registration.getNotifications();
            notifications.forEach(notification => notification.close());
        } catch (_) {}
        try { await registration.unregister(); } catch (_) {}
    }
})().catch(() => { /* Cleanup must never block the portfolio. */ });

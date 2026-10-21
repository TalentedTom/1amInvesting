'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../alerts.js'), 'utf8');
const workerSource = fs.readFileSync(require.resolve('../sw.js'), 'utf8');

function registration(scriptURL, events, subscriptionFails = false) {
    return {
        active: {scriptURL},
        pushManager: {getSubscription: async () => {
            if (subscriptionFails) throw Error('already gone');
            return {unsubscribe: async () => {events.push('unsubscribe');}};
        }},
        getNotifications: async () => [{close() {events.push('close');}}],
        unregister: async () => {events.push('unregister');}
    };
}

test('returning visitors lose only the former dilution subscription and worker', async () => {
    const events = [], unrelated = [];
    const owned = registration('https://www.1aminvesting.com/sw.js', events);
    const other = registration('https://www.1aminvesting.com/other-worker.js', unrelated);
    await vm.runInNewContext(source, {
        navigator: {serviceWorker: {getRegistrations: async () => [owned, other]}},
        location: {origin: 'https://www.1aminvesting.com'}, URL
    });
    assert.deepEqual(events, ['unsubscribe', 'close', 'unregister']);
    assert.deepEqual(unrelated, []);
});

test('cleanup still retires a worker after a subscription error', async () => {
    const events = [];
    await vm.runInNewContext(source, {
        navigator: {serviceWorker: {getRegistrations: async () =>
            [registration('https://www.1aminvesting.com/sw.js', events, true)]}},
        location: {origin: 'https://www.1aminvesting.com'}, URL
    });
    assert.deepEqual(events, ['close', 'unregister']);
});

test('no support or blocked cleanup cannot break the website or request permission', async () => {
    await vm.runInNewContext(source, {navigator: {}});
    await vm.runInNewContext(source, {navigator: {serviceWorker: {
        getRegistrations: async () => {throw Error('blocked');}
    }}});
    assert.doesNotMatch(source, /requestPermission|\.register\(|fetch\(/);
});

test('old workers update to retirement, not a hidden push receiver', async () => {
    const handlers = {}, events = [];
    vm.runInNewContext(workerSource, {self: {
        addEventListener: (name, fn) => {handlers[name] = fn;},
        skipWaiting: async () => {events.push('skipWaiting');},
        registration: registration('https://www.1aminvesting.com/sw.js', events)
    }});
    assert.deepEqual(Object.keys(handlers), ['install', 'activate']);
    let completion;
    handlers.install({waitUntil: promise => {completion = promise;}});
    await completion;
    handlers.activate({waitUntil: promise => {completion = promise;}});
    await completion;
    assert.deepEqual(events, ['skipWaiting', 'unsubscribe', 'close', 'unregister']);
});

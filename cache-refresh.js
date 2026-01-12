(function () {
    'use strict';

    // ===== CONFIGURATION =====
    const DAYS = 3;                     // refresh interval
    const VERSION = 'v2026-01';         // change on deployment
    const STORAGE_KEY = 'siteCacheMeta';

    // =========================
    const now = Date.now();
    const maxAge = DAYS * 24 * 60 * 60 * 1000;

    let stored;
    try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        stored = {};
    }

    const isExpired = !stored.time || (now - stored.time > maxAge);
    const isVersionChanged = stored.version !== VERSION;

    if (isExpired || isVersionChanged) {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ version: VERSION, time: now })
        );

        const url = new URL(window.location.href);

        // Prevent infinite reload
        if (url.searchParams.get('v') !== VERSION) {
            url.searchParams.set('v', VERSION);
            window.location.replace(url.toString());
        }
    }
})();

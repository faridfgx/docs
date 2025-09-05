(function() {
    'use strict';
    
    // Your Supabase configuration
    const SUPABASE_URL = 'https://ksuolzzhpssazyfwbkeg.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdW9senpocHNzYXp5Zndia2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTcxMDQsImV4cCI6MjA3MTEzMzEwNH0.6ltEPGMJyOZbXmRjNCGZJxYmDDwkiFZy4WzawSTCpFA';
    
    let supabase;
    let tracked = false;
    
    // Check if already tracked today
    function hasTrackedToday() {
        const today = new Date().toDateString();
        const trackedDate = localStorage.getItem('last_tracked_date');
        const trackedUrl = localStorage.getItem('last_tracked_url');
        return trackedDate === today && trackedUrl === window.location.href;
    }
    
    // Mark as tracked today
    function markTrackedToday() {
        const today = new Date().toDateString();
        localStorage.setItem('last_tracked_date', today);
        localStorage.setItem('last_tracked_url', window.location.href);
    }
    
    // Track daily visit
    async function trackDailyVisit() {
        if (tracked || hasTrackedToday()) return;
        tracked = true;
        
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const pageUrl = window.location.href;
            
            // Try to insert new record or update existing one
            const { error } = await supabase.rpc('increment_daily_visitor', {
                p_page_url: pageUrl,
                p_visit_date: today
            });
            
            if (error) {
                console.warn('Daily visitor tracking error:', error.message);
            } else {
                markTrackedToday();
                console.log('Daily visit tracked successfully');
            }
        } catch (error) {
            console.warn('Failed to track daily visit:', error.message);
        }
    }
    
    // Initialize tracking
    function initializeTracking() {
        const maxAttempts = 10;
        let attempts = 0;
        
        const tryInit = async () => {
            attempts++;
            
            if (typeof window.supabase !== 'undefined') {
                try {
                    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    await trackDailyVisit();
                    return;
                } catch (error) {
                    console.warn('Supabase initialization error:', error);
                }
            }
            
            if (attempts < maxAttempts) {
                setTimeout(tryInit, 250);
            } else {
                console.warn('Daily visitor tracking failed: Supabase library not loaded');
            }
        };
        
        tryInit();
    }
    
    // Start tracking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTracking);
    } else {
        initializeTracking();
    }
    
})();
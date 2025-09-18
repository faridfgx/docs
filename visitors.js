(function() {
    'use strict';
    
    // Your Supabase configuration
    const SUPABASE_URL = 'https://ksuolzzhpssazyfwbkeg.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdW9senpocHNzYXp5Zndia2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTcxMDQsImV4cCI6MjA3MTEzMzEwNH0.6ltEPGMJyOZbXmRjNCGZJxYmDDwkiFZy4WzawSTCpFA';
    
    let supabase;
    let tracked = false;
    
    // Get local date string (matching dashboard logic)
    function getLocalDateString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Check if already tracked today (using local date)
    function hasTrackedToday() {
        const today = getLocalDateString();
        const trackedDate = localStorage.getItem('last_tracked_date');
        const currentUrl = window.location.href;
        const trackedUrl = localStorage.getItem('last_tracked_url');
        
        //console.log('Tracking check:', { today, trackedDate, currentUrl, trackedUrl });
        return trackedDate === today && trackedUrl === currentUrl;
    }
    
    // Mark as tracked today (using local date)
    function markTrackedToday() {
        const today = getLocalDateString();
        localStorage.setItem('last_tracked_date', today);
        localStorage.setItem('last_tracked_url', window.location.href);
        //console.log('Marked tracked:', { today, url: window.location.href });
    }
    
    // Track daily visit
    async function trackDailyVisit() {
        if (tracked || hasTrackedToday()) {
            //console.log('Already tracked today, skipping...');
            return;
        }
        tracked = true;
        
        try {
            const today = getLocalDateString(); // Use local date consistently
            const pageUrl = window.location.href;
            
            //console.log('Tracking visit:', { today, pageUrl });
            
            // Try to insert new record or update existing one
            const { data, error } = await supabase.rpc('increment_daily_visitor', {
                p_page_url: pageUrl,
                p_visit_date: today
            });
            
            if (error) {
                //console.warn('Daily visitor tracking error:', error.message);
                
                // Fallback: try direct insert/upsert
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('daily_visitors')
                    .upsert({
                        page_url: pageUrl,
                        visit_date: today,
                        visitor_count: 1
                    }, {
                        onConflict: 'page_url,visit_date',
                        ignoreDuplicates: false
                    });
                
                if (fallbackError) {
                    //console.error('Fallback tracking failed:', fallbackError);
                } else {
                    //console.log('Fallback tracking successful:', fallbackData);
                    markTrackedToday();
                }
            } else {
               // console.log('Daily visit tracked successfully:', data);
                markTrackedToday();
            }
        } catch (error) {
            //console.warn('Failed to track daily visit:', error.message);
        }
    }
    
    // Initialize tracking
    function initializeTracking() {
        const maxAttempts = 10;
        let attempts = 0;
        
        const tryInit = async () => {
            attempts++;
            //console.log(`Tracking initialization attempt ${attempts}`);
            
            if (typeof window.supabase !== 'undefined') {
                try {
                    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    //console.log('Supabase client created successfully');
                    await trackDailyVisit();
                    return;
                } catch (error) {
                    //console.warn('Supabase initialization error:', error);
                }
            }
            
            if (attempts < maxAttempts) {
                setTimeout(tryInit, 250);
            } else {
                //console.warn('Daily visitor tracking failed: Supabase library not loaded');
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



const supabaseConfig = {
    url: 'https://ksuolzzhpssazyfwbkeg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdW9senpocHNzYXp5Zndia2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTcxMDQsImV4cCI6MjA3MTEzMzEwNH0.6ltEPGMJyOZbXmRjNCGZJxYmDDwkiFZy4WzawSTCpFA' 
};
class GlobalRatingSystem {
    constructor() {
        this.supabase = null;
        this.userFingerprint = null;
        this.lastDownloadTime = 0;
        this.downloadCooldown = 10000; // 10 seconds in milliseconds
        
        // Cache system
        this.cache = {
            ratings: new Map(),
            downloads: new Map(),
            lastUpdate: 0,
            cacheDuration: 60000 // 1 minute cache
        };
        
        this.init();
    }

    async init() {
        try {
            // Import Supabase
            const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
            
            // Initialize Supabase client
            this.supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
            
            // Generate user fingerprint
            this.userFingerprint = await this.generateUserFingerprint();
            
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeAfterDOM());
            } else {
                this.initializeAfterDOM();
            }
            
        } catch (error) {
            console.error('Error initializing rating system:', error);
            this.showMessage('خطأ في تحميل نظام التقييم', 'error');
        }
    }

    async initializeAfterDOM() {
        try {
            // Get all valid file IDs first
            const validFileIds = this.getValidFileIds();
            
            if (validFileIds.length > 0) {
                // Load all data in optimized batches
                await this.loadAllDataOptimized(validFileIds);
            }
            
            // Attach event listeners only to files with valid IDs
            this.attachEventListeners();
            this.attachDownloadListeners();
            
        } catch (error) {
            console.error('Error during DOM initialization:', error);
        }
    }

    getValidFileIds() {
        const fileItems = document.querySelectorAll('.file-item[data-file-id]');
        const validIds = [];
        
        fileItems.forEach(item => {
            const fileId = item.dataset.fileId;
            if (fileId && fileId.trim() !== '') {
                validIds.push(fileId.trim());
            }
        });
        
        return validIds;
    }

    // Optimized data loading with Supabase
    async loadAllDataOptimized(fileIds) {
        if (fileIds.length === 0) return;

        // Check cache first
        const now = Date.now();
        const isCacheValid = (now - this.cache.lastUpdate) < this.cache.cacheDuration;
        
        if (isCacheValid && this.cache.ratings.size > 0) {
            console.log('Using cached data');
            this.updateDisplaysFromCache(fileIds);
            return;
        }

        try {
            // Load data in parallel
            await Promise.all([
                this.loadRatingsData(fileIds),
                this.loadDownloadsData(fileIds)
            ]);
            
            // Update cache timestamp
            this.cache.lastUpdate = now;
            
            // Update all displays
            this.updateAllDisplays(fileIds);
            
        } catch (error) {
            console.error('Error loading data optimized:', error);
            // Fallback to minimal requests
            await this.loadDataMinimal(fileIds);
        }
    }

    // Load ratings data from Supabase
    async loadRatingsData(fileIds) {
        try {
            // Supabase can handle large IN queries better than Firestore
            const chunks = this.chunkArray(fileIds, 100); // Larger chunks possible
            
            const promises = chunks.map(async (chunk) => {
                const { data, error } = await this.supabase
                    .from('ratings')
                    .select('*')
                    .in('id', chunk);
                
                if (error) {
                    console.warn('Error loading ratings batch:', error);
                    return [];
                }
                
                // Cache the results
                data.forEach(rating => {
                    this.cache.ratings.set(rating.id, rating);
                });
                
                return data;
            });
            
            await Promise.all(promises);
            
        } catch (error) {
            console.error('Error loading ratings data:', error);
        }
    }

    // Load downloads data from Supabase
    async loadDownloadsData(fileIds) {
        try {
            const chunks = this.chunkArray(fileIds, 100);
            
            const promises = chunks.map(async (chunk) => {
                const { data, error } = await this.supabase
                    .from('downloads')
                    .select('*')
                    .in('id', chunk);
                
                if (error) {
                    console.warn('Error loading downloads batch:', error);
                    return [];
                }
                
                // Cache the results
                data.forEach(download => {
                    this.cache.downloads.set(download.id, download);
                });
                
                return data;
            });
            
            await Promise.all(promises);
            
        } catch (error) {
            console.error('Error loading downloads data:', error);
        }
    }

    // Minimal fallback loading
    async loadDataMinimal(fileIds) {
        console.warn('Using minimal fallback loading');
        
        // Only load data for visible files (first 20)
        const visibleFileIds = fileIds.slice(0, 20);
        
        try {
            await Promise.all([
                this.loadRatingsData(visibleFileIds),
                this.loadDownloadsData(visibleFileIds)
            ]);
            
            this.updateAllDisplays(visibleFileIds);
            
            // Load remaining files in background with delay
            if (fileIds.length > 20) {
                setTimeout(() => {
                    const remainingIds = fileIds.slice(20);
                    this.loadRatingsData(remainingIds);
                    this.loadDownloadsData(remainingIds);
                }, 2000);
            }
            
        } catch (error) {
            console.error('Minimal loading failed:', error);
            // Set default values for all files
            this.setDefaultValues(fileIds);
        }
    }

    // Update displays from cache
    updateDisplaysFromCache(fileIds) {
        fileIds.forEach(fileId => {
            // Update ratings
            const ratingData = this.cache.ratings.get(fileId) || { average: 0, count: 0 };
            this.updateRatingDisplay(fileId, ratingData);
            
            // Check if user has already rated
            if (ratingData.raters && ratingData.raters.includes(this.userFingerprint)) {
                this.disableRating(fileId);
            }
            
            // Update downloads
            const downloadData = this.cache.downloads.get(fileId);
            const count = downloadData ? (downloadData.count || 0) : 0;
            this.updateDownloadDisplay(fileId, count);
        });
    }

    // Update all displays after loading
    updateAllDisplays(fileIds) {
        fileIds.forEach(fileId => {
            // Update ratings
            const ratingData = this.cache.ratings.get(fileId) || { average: 0, count: 0 };
            this.updateRatingDisplay(fileId, ratingData);
            
            // Check if user has already rated
            if (ratingData.raters && ratingData.raters.includes(this.userFingerprint)) {
                this.disableRating(fileId);
            }
            
            // Update downloads
            const downloadData = this.cache.downloads.get(fileId);
            const count = downloadData ? (downloadData.count || 0) : 0;
            this.updateDownloadDisplay(fileId, count);
        });
    }

    // Set default values when loading fails
    setDefaultValues(fileIds) {
        fileIds.forEach(fileId => {
            this.updateRatingDisplay(fileId, { average: 0, count: 0 });
            this.updateDownloadDisplay(fileId, 0);
        });
    }

    async generateUserFingerprint() {
        // Create a simple fingerprint based on browser characteristics
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('User fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString();
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    attachEventListeners() {
        // Only attach to files with valid file IDs
        const fileItems = document.querySelectorAll('.file-item[data-file-id]');
        
        fileItems.forEach(item => {
            const fileId = item.dataset.fileId;
            
            // Skip if no file ID or empty file ID
            if (!fileId || fileId.trim() === '') {
                return;
            }
            
            const stars = item.querySelectorAll('.star');
            
            stars.forEach(star => {
                // Remove existing listeners to prevent duplicates
                const newStar = star.cloneNode(true);
                star.parentNode.replaceChild(newStar, star);
                
                newStar.addEventListener('mouseenter', (e) => {
                    if (!newStar.classList.contains('disabled')) {
                        const allStars = item.querySelectorAll('.star');
                        this.highlightStars(allStars, parseInt(e.target.dataset.rating));
                    }
                });

                newStar.addEventListener('mouseleave', () => {
                    if (!newStar.classList.contains('disabled')) {
                        const allStars = item.querySelectorAll('.star');
                        this.clearHighlight(allStars);
                        this.showCurrentRating(allStars, fileId);
                    }
                });

                newStar.addEventListener('click', async (e) => {
                    if (!newStar.classList.contains('disabled')) {
                        const rating = parseInt(e.target.dataset.rating);
                        await this.rateFile(fileId, rating);
                    }
                });
            });
        });
    }

    attachDownloadListeners() {
        const downloadButtons = document.querySelectorAll('.download-btn');
        
        downloadButtons.forEach(button => {
            const fileItem = button.closest('.file-item');
            
            // Skip if no file item found
            if (!fileItem) {
                return;
            }
            
            const fileId = fileItem.dataset.fileId;
            
            // Skip if no file ID or empty file ID
            if (!fileId || fileId.trim() === '') {
                return;
            }
            
            const originalOnclick = button.getAttribute('onclick');
            
            // Skip if no onclick attribute
            if (!originalOnclick) {
                return;
            }
            
            // Remove original onclick to prevent conflicts
            button.removeAttribute('onclick');
            
            // Create new click handler
            const clickHandler = (e) => {
                e.preventDefault();
                this.handleDownload(fileId.trim(), originalOnclick);
            };
            
            // Remove existing listeners and add new one
            button.removeEventListener('click', clickHandler);
            button.addEventListener('click', clickHandler);
        });
    }

    async handleDownload(fileId, originalOnclick) {
        const now = Date.now();
        const timeRemaining = this.downloadCooldown - (now - this.lastDownloadTime);

        if (timeRemaining > 0 && this.lastDownloadTime > 0) {
            const seconds = Math.ceil(timeRemaining / 1000);
            this.showMessage(`يرجى الانتظار ${seconds} ثانية قبل تحميل ملف آخر`, 'warning');
            this.startCooldownTimer(timeRemaining);
            return;
        }

        try {
            // Set last download time first
            this.lastDownloadTime = now;
            
            // Execute original download
            eval(originalOnclick);
            
            // Update download count with optimized approach
            this.incrementDownloadCountOptimized(fileId).catch(error => {
                console.warn('Could not update download count:', error.message);
            });
            
            // Start cooldown timer
            this.startCooldownTimer(this.downloadCooldown);
            
            this.showMessage('تم بدء التحميل بنجاح!', 'success');
            
        } catch (error) {
            console.error('Error handling download:', error);
            this.showMessage('خطأ في تسجيل التحميل', 'error');
        }
    }

    // Optimized download count increment with Supabase
    async incrementDownloadCountOptimized(fileId) {
        try {
            // Update UI immediately (optimistic update)
            const currentData = this.cache.downloads.get(fileId) || { count: 0 };
            const newCount = currentData.count + 1;
            
            // Update cache
            this.cache.downloads.set(fileId, { ...currentData, count: newCount });
            
            // Update display immediately
            this.updateDownloadDisplay(fileId, newCount);
            
            // Update database in background using Supabase upsert
            const { data, error } = await this.supabase
                .from('downloads')
                .upsert({ 
                    id: fileId,
                    count: newCount,
                    last_download: new Date().toISOString()
                }, { 
                    onConflict: 'id',
                    ignoreDuplicates: false 
                })
                .select();
            
            if (error) {
                // Revert optimistic update on database error
                console.warn('Database update failed, reverting UI update:', error);
                this.cache.downloads.set(fileId, currentData);
                this.updateDownloadDisplay(fileId, currentData.count);
                throw error;
            }
            
        } catch (error) {
            console.warn('Could not increment download count for', fileId, ':', error.message);
            throw error;
        }
    }

    startCooldownTimer(duration) {
        this.disableAllDownloadButtons();
        
        const startTime = Date.now();
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const seconds = Math.ceil(remaining / 1000);
            
            if (remaining <= 0) {
                clearInterval(timer);
                this.enableAllDownloadButtons();
                this.updateDownloadButtonsText('تحميل');
            } else {
                this.updateDownloadButtonsText(`انتظر ${seconds} ثواني `);
            }
        }, 100);
    }

    disableAllDownloadButtons() {
        // Only disable buttons for files with valid IDs
        const validFileItems = document.querySelectorAll('.file-item[data-file-id]');
        validFileItems.forEach(item => {
            const fileId = item.dataset.fileId;
            if (fileId && fileId.trim() !== '') {
                const button = item.querySelector('.download-btn');
                if (button) {
                    button.disabled = true;
                    button.classList.add('disabled');
                }
            }
        });
    }

    enableAllDownloadButtons() {
        // Only enable buttons for files with valid IDs
        const validFileItems = document.querySelectorAll('.file-item[data-file-id]');
        validFileItems.forEach(item => {
            const fileId = item.dataset.fileId;
            if (fileId && fileId.trim() !== '') {
                const button = item.querySelector('.download-btn');
                if (button) {
                    button.disabled = false;
                    button.classList.remove('disabled');
                }
            }
        });
    }

    updateDownloadButtonsText(text) {
        // Only update buttons for files with valid IDs
        const validFileItems = document.querySelectorAll('.file-item[data-file-id]');
        validFileItems.forEach(item => {
            const fileId = item.dataset.fileId;
            if (fileId && fileId.trim() !== '') {
                const button = item.querySelector('.download-btn');
                if (button) {
                    button.textContent = text;
                }
            }
        });
    }

    highlightStars(stars, rating) {
        stars.forEach((star, index) => {
            star.classList.remove('hover', 'filled');
            if (index < rating) {
                star.classList.add('hover');
            }
        });
    }

    clearHighlight(stars) {
        stars.forEach(star => {
            star.classList.remove('hover');
        });
    }

    showCurrentRating(stars, fileId) {
        const item = document.querySelector(`[data-file-id="${fileId}"]`);
        if (!item) return;
        
        const scoreElement = item.querySelector('.rating-score');
        if (!scoreElement) return;
        
        const currentRating = parseFloat(scoreElement.textContent) || 0;
        
        stars.forEach((star, index) => {
            star.classList.remove('filled');
            if (index < Math.round(currentRating)) {
                star.classList.add('filled');
            }
        });
    }

    async rateFile(fileId, rating) {
        try {
            // Show loading
            this.showLoadingForFile(fileId);
            
            // Get current rating data
            const { data: currentData, error: selectError } = await this.supabase
                .from('ratings')
                .select('*')
                .eq('id', fileId)
                .single();
            
            if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = not found
                throw selectError;
            }
            
            if (currentData) {
                // Check if user already rated
                if (currentData.raters && currentData.raters.includes(this.userFingerprint)) {
                    this.showMessage('لقد قمت بتقييم هذا الملف مسبقاً!', 'warning');
                    this.hideLoadingForFile(fileId);
                    return;
                }
                
                // Update existing rating
                const newTotal = currentData.total + rating;
                const newCount = currentData.count + 1;
                const newAverage = newTotal / newCount;
                const newRaters = [...(currentData.raters || []), this.userFingerprint];
                
                const newData = {
                    total: newTotal,
                    count: newCount,
                    average: newAverage,
                    raters: newRaters,
                    updated_at: new Date().toISOString()
                };
                
                const { error: updateError } = await this.supabase
                    .from('ratings')
                    .update(newData)
                    .eq('id', fileId);
                
                if (updateError) throw updateError;
                
                // Update cache
                this.cache.ratings.set(fileId, { id: fileId, ...newData });
                this.updateRatingDisplay(fileId, newData);
                
            } else {
                // Create new rating
                const newData = {
                    id: fileId,
                    total: rating,
                    count: 1,
                    average: rating,
                    raters: [this.userFingerprint]
                };
                
                const { error: insertError } = await this.supabase
                    .from('ratings')
                    .insert([newData]);
                
                if (insertError) throw insertError;
                
                // Update cache
                this.cache.ratings.set(fileId, newData);
                this.updateRatingDisplay(fileId, newData);
            }
            
            // Disable further rating for this user
            this.disableRating(fileId);
            
            // Hide loading
            this.hideLoadingForFile(fileId);
            
            // Show success message
            this.showMessage('شكراً لك على التقييم!', 'success');
            
        } catch (error) {
            console.error('Error rating file:', error);
            this.hideLoadingForFile(fileId);
            this.showMessage('خطأ في حفظ التقييم. حاول مرة أخرى.', 'error');
        }
    }

    updateRatingDisplay(fileId, data) {
        const item = document.querySelector(`[data-file-id="${fileId}"]`);
        if (!item) return;

        const scoreElement = item.querySelector('.rating-score');
        const countElement = item.querySelector('.rating-count');
        const stars = item.querySelectorAll('.star');

        if (scoreElement) {
            scoreElement.textContent = (data.average || 0).toFixed(1);
        }
        
        if (countElement) {
            countElement.textContent = `(${data.count || 0} تقييم)`;
        }

        // Update stars display
        stars.forEach((star, index) => {
            star.classList.remove('filled');
            if (index < Math.round(data.average || 0)) {
                star.classList.add('filled');
            }
        });
    }

    updateDownloadDisplay(fileId, count) {
        const item = document.querySelector(`[data-file-id="${fileId}"]`);
        if (!item) return;

        // Check if download count element exists, if not create it
        let downloadCountElement = item.querySelector('.download-count');
        if (!downloadCountElement) {
            downloadCountElement = document.createElement('div');
            downloadCountElement.className = 'download-count';
            
            // Insert it before the download button
            const downloadBtn = item.querySelector('.download-btn');
            if (downloadBtn && downloadBtn.parentNode) {
                downloadBtn.parentNode.insertBefore(downloadCountElement, downloadBtn);
            }
        }

        downloadCountElement.innerHTML = `تم تحميله ${count} مرة <span style="display:inline-block; width:20px;"></span>`;
    }

    disableRating(fileId) {
        const item = document.querySelector(`[data-file-id="${fileId}"]`);
        if (!item) return;

        const stars = item.querySelectorAll('.star');
        stars.forEach(star => {
            star.classList.add('disabled');
        });
    }

    showLoadingForFile(fileId) {
        const item = document.querySelector(`[data-file-id="${fileId}"]`);
        if (!item) return;

        const scoreElement = item.querySelector('.rating-score');
        if (scoreElement) {
            scoreElement.innerHTML = '<div class="rating-loading"></div>';
        }
    }

    hideLoadingForFile(fileId) {
        // Rating will be updated by updateRatingDisplay method
    }

    showMessage(text, type = 'success') {
        // Remove existing message
        const existingMessage = document.getElementById('ratingMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.id = 'ratingMessage';
        messageEl.className = `rating-message ${type}`;
        messageEl.textContent = text;
        document.body.appendChild(messageEl);

        // Show message
        setTimeout(() => messageEl.classList.add('show'), 100);

        // Hide message after 3 seconds
        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 300);
        }, 3000);
    }

    // Method to clear cache manually if needed
    clearCache() {
        this.cache.ratings.clear();
        this.cache.downloads.clear();
        this.cache.lastUpdate = 0;
    }

    // Method to refresh data
    async refreshData() {
        this.clearCache();
        const validFileIds = this.getValidFileIds();
        if (validFileIds.length > 0) {
            await this.loadAllDataOptimized(validFileIds);
        }
    }

    // BONUS: Real-time updates (optional)
    enableRealTimeUpdates() {
        // Subscribe to ratings changes
        this.supabase
            .channel('ratings-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'ratings' }, 
                (payload) => {
                    console.log('Rating updated:', payload);
                    if (payload.new) {
                        this.cache.ratings.set(payload.new.id, payload.new);
                        this.updateRatingDisplay(payload.new.id, payload.new);
                    }
                }
            )
            .subscribe();

        // Subscribe to downloads changes
        this.supabase
            .channel('downloads-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'downloads' }, 
                (payload) => {
                    console.log('Download updated:', payload);
                    if (payload.new) {
                        this.cache.downloads.set(payload.new.id, payload.new);
                        this.updateDownloadDisplay(payload.new.id, payload.new.count);
                    }
                }
            )
            .subscribe();
    }
}

// Initialize the rating system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.ratingSystem = new GlobalRatingSystem();
    
    // Optional: Enable real-time updates after 30 seconds
    setTimeout(() => {
        if (window.ratingSystem) {
            window.ratingSystem.enableRealTimeUpdates();
        }
    }, 30000);
});

// Export for use in other scripts if needed
window.GlobalRatingSystem = GlobalRatingSystem;
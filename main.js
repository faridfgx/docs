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
        
        // Ad configuration
        this.adConfig = {
            publisherId: 'ca-pub-3226170133878150',
            adSlotId: '2205854958',
            minWaitTime: 6000,  // Minimum 5 seconds
            maxWaitTime: 10000, // Maximum 10 seconds (auto-close)
            skipAfter: 6000     // Can close after 5 seconds
        };
        
        this.pendingDownload = null;
        this.adModalCreated = false;
        
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
            // Import Supabase from CDN with better dependency resolution
            //const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

            // Initialize Supabase client
            this.supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
            
            // Generate user fingerprint
            this.userFingerprint = await this.generateUserFingerprint();
            
            // Create ad modal
            this.createAdModal();
            
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

    createAdModal() {
        if (this.adModalCreated) return;
        
        const modalHTML = `
            <div id="download-ad-modal" class="ad-modal" style="display: none; height: 100vh;">
                <div class="ad-modal-overlay"></div>
                <div class="ad-modal-content">
                    <div class="ad-modal-header">
                        <h3> جاري تحضير التحميل...</h3>
                        <p class="countdown-text">
                            سيبدأ التحميل تلقائياً بعد <span id="auto-countdown" class="countdown-number">10</span> ثواني
                        </p>
                    </div>
                    
                    <!-- AdSense Ad Unit -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3226170133878150"
     crossorigin="anonymous"></script>
<!-- Downloadad -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-3226170133878150"
     data-ad-slot="2205854958"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
                    
                    <div class="ad-modal-footer">
                        <button id="close-ad-btn" class="close-ad-btn" disabled>
                            <span class="btn-icon">⏱️</span>
                            <span id="close-countdown-text">يمكنك الإغلاق بعد <span id="close-countdown">5</span> ثواني</span>
                        </button>
                        <p class="ad-info"> دعم الموقع من خلال مشاهدة الإعلان</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addAdModalStyles();
        this.attachAdModalListeners();
        this.adModalCreated = true;
    }

    addAdModalStyles() {
        const styles = `
            <style>
                .ad-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Noto Sans Arabic', sans-serif;
                }
                
.ad-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
}
                
                .ad-modal-content {
                    position: relative;
                    background: linear-gradient(145deg, #ffffff, #f8f9fa);
                    border-radius: 20px;
                    padding: 35px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                    animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    direction: rtl;
                }
                
                @keyframes modalSlideIn {
                    from {
                        transform: translateY(-100px) scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                }
                
                .ad-modal-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .ad-modal-header h3 {
                    color: #1e3c72;
                    font-size: 26px;
                    margin-bottom: 12px;
                    font-weight: 700;
                }
                
                .countdown-text {
                    color: #555;
                    font-size: 17px;
                    line-height: 1.6;
                }
                
                .countdown-number {
                    color: #e74c3c;
                    font-weight: bold;
                    font-size: 20px;
                    display: inline-block;
                    min-width: 30px;
                    text-align: center;
                }
                
                .ad-container {
                    min-height: 280px;
                    margin: 25px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f5f7fa;
                    border-radius: 12px;
                    padding: 25px;
                    border: 2px dashed #cbd5e0;
                    position: relative;
                }
                
                .ad-container::before {
                    content: "📢 إعلان";
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    color: #666;
                    font-weight: 600;
                }
                
                .ad-modal-footer {
                    text-align: center;
                    margin-top: 25px;
                }
                
                .close-ad-btn {
                    width: 100%;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 12px;
                    font-size: 18px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: linear-gradient(135deg, #95a5a6, #7f8c8d);
                    color: white;
                    box-shadow: 0 4px 15px rgba(149, 165, 166, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .close-ad-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: scale(0.98);
                }
                
                .close-ad-btn:not(:disabled) {
                    background: linear-gradient(135deg, #27ae60, #229954);
                    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
                    animation: pulseButton 2s infinite;
                }
                
                .close-ad-btn:not(:disabled):hover {
                    background: linear-gradient(135deg, #229954, #1e8449);
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(39, 174, 96, 0.5);
                }
                
                @keyframes pulseButton {
                    0%, 100% {
                        box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
                    }
                    50% {
                        box-shadow: 0 4px 25px rgba(39, 174, 96, 0.6);
                    }
                }
                
                .btn-icon {
                    font-size: 22px;
                }
                
                .ad-info {
                    margin-top: 15px;
                    color: #7f8c8d;
                    font-size: 14px;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .ad-modal-content {
                        padding: 25px 20px;
                        width: 95%;
                    }
                    
                    .ad-modal-header h3 {
                        font-size: 22px;
                    }
                    
                    .countdown-text {
                        font-size: 15px;
                    }
                    
                    .close-ad-btn {
                        font-size: 16px;
                        padding: 12px 20px;
                    }
                }
            </style>
        `;
        
        if (!document.getElementById('ad-modal-styles')) {
            const styleEl = document.createElement('div');
            styleEl.id = 'ad-modal-styles';
            styleEl.innerHTML = styles;
            document.head.appendChild(styleEl);
        }
    }

    attachAdModalListeners() {
        const closeBtn = document.getElementById('close-ad-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (!closeBtn.disabled) {
                    this.startDownload();
                }
            });
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

    async loadAllDataOptimized(fileIds) {
        if (fileIds.length === 0) return;

        const now = Date.now();
        const isCacheValid = (now - this.cache.lastUpdate) < this.cache.cacheDuration;
        
        if (isCacheValid && this.cache.ratings.size > 0) {
            console.log('Using cached data');
            this.updateDisplaysFromCache(fileIds);
            return;
        }

        try {
            await Promise.all([
                this.loadRatingsData(fileIds),
                this.loadDownloadsData(fileIds)
            ]);
            
            this.cache.lastUpdate = now;
            this.updateAllDisplays(fileIds);
            
        } catch (error) {
            console.error('Error loading data optimized:', error);
            await this.loadDataMinimal(fileIds);
        }
    }

    async loadRatingsData(fileIds) {
        try {
            const chunks = this.chunkArray(fileIds, 100);
            
            const promises = chunks.map(async (chunk) => {
                const { data, error } = await this.supabase
                    .from('ratings')
                    .select('*')
                    .in('id', chunk);
                
                if (error) {
                    console.warn('Error loading ratings batch:', error);
                    return [];
                }
                
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

    async loadDataMinimal(fileIds) {
        console.warn('Using minimal fallback loading');
        
        const visibleFileIds = fileIds.slice(0, 20);
        
        try {
            await Promise.all([
                this.loadRatingsData(visibleFileIds),
                this.loadDownloadsData(visibleFileIds)
            ]);
            
            this.updateAllDisplays(visibleFileIds);
            
            if (fileIds.length > 20) {
                setTimeout(() => {
                    const remainingIds = fileIds.slice(20);
                    this.loadRatingsData(remainingIds);
                    this.loadDownloadsData(remainingIds);
                }, 2000);
            }
            
        } catch (error) {
            console.error('Minimal loading failed:', error);
            this.setDefaultValues(fileIds);
        }
    }

    updateDisplaysFromCache(fileIds) {
        fileIds.forEach(fileId => {
            const ratingData = this.cache.ratings.get(fileId) || { average: 0, count: 0 };
            this.updateRatingDisplay(fileId, ratingData);
            
            if (ratingData.raters && ratingData.raters.includes(this.userFingerprint)) {
                this.disableRating(fileId);
            }
            
            const downloadData = this.cache.downloads.get(fileId);
            const count = downloadData ? (downloadData.count || 0) : 0;
            this.updateDownloadDisplay(fileId, count);
        });
    }

    updateAllDisplays(fileIds) {
        fileIds.forEach(fileId => {
            const ratingData = this.cache.ratings.get(fileId) || { average: 0, count: 0 };
            this.updateRatingDisplay(fileId, ratingData);
            
            if (ratingData.raters && ratingData.raters.includes(this.userFingerprint)) {
                this.disableRating(fileId);
            }
            
            const downloadData = this.cache.downloads.get(fileId);
            const count = downloadData ? (downloadData.count || 0) : 0;
            this.updateDownloadDisplay(fileId, count);
        });
    }

    setDefaultValues(fileIds) {
        fileIds.forEach(fileId => {
            this.updateRatingDisplay(fileId, { average: 0, count: 0 });
            this.updateDownloadDisplay(fileId, 0);
        });
    }

    async generateUserFingerprint() {
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
        
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
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
        const fileItems = document.querySelectorAll('.file-item[data-file-id]');
        
        fileItems.forEach(item => {
            const fileId = item.dataset.fileId;
            
            if (!fileId || fileId.trim() === '') {
                return;
            }
            
            const stars = item.querySelectorAll('.star');
            
            stars.forEach(star => {
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
            
            if (!fileItem) {
                return;
            }
            
            const fileId = fileItem.dataset.fileId;
            
            if (!fileId || fileId.trim() === '') {
                return;
            }
            
            const originalOnclick = button.getAttribute('onclick');
            
            if (!originalOnclick) {
                return;
            }
            
            button.removeAttribute('onclick');
            
            const clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Store the download action
                this.pendingDownload = {
                    fileId: fileId.trim(),
                    action: originalOnclick
                };
                
                // Show ad modal
                this.showAdModal();
            };
            
            button.removeEventListener('click', clickHandler);
            button.addEventListener('click', clickHandler);
        });
    }

    showAdModal() {
        const modal = document.getElementById('download-ad-modal');
        if (!modal) return;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        modal.style.display = 'flex';
        
        // Load AdSense ad
        this.loadAd();
        
        // Start countdown timers
        this.startAdCountdowns();
    }

    loadAd() {
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.warn('AdSense not loaded:', e);
        }
    }

    startAdCountdowns() {
        const autoCountdownEl = document.getElementById('auto-countdown');
        const closeCountdownEl = document.getElementById('close-countdown');
        const closeCountdownText = document.getElementById('close-countdown-text');
        const closeBtn = document.getElementById('close-ad-btn');
        
        let autoCounter = Math.floor(this.adConfig.maxWaitTime / 1000); // 10 seconds
        let closeCounter = Math.floor(this.adConfig.skipAfter / 1000);  // 5 seconds
        
        // Update initial display
        if (autoCountdownEl) autoCountdownEl.textContent = autoCounter;
        if (closeCountdownEl) closeCountdownEl.textContent = closeCounter;
        
        // Auto-close countdown (10 seconds)
        const autoInterval = setInterval(() => {
            autoCounter--;
            if (autoCountdownEl) {
                autoCountdownEl.textContent = autoCounter;
            }
            
            if (autoCounter <= 0) {
                clearInterval(autoInterval);
                this.startDownload();
            }
        }, 1000);
        
        // Close button countdown (5 seconds)
        const closeInterval = setInterval(() => {
            closeCounter--;
            if (closeCountdownEl) {
                closeCountdownEl.textContent = closeCounter;
            }
            
            if (closeCounter <= 0) {
                clearInterval(closeInterval);
                if (closeBtn) {
                    closeBtn.disabled = false;
                    closeBtn.querySelector('.btn-icon').textContent = '';
                    closeCountdownText.innerHTML = 'ابدأ التحميل الآن';
                }
            }
        }, 1000);
    }

    startDownload() {
        if (!this.pendingDownload) return;
        
        const now = Date.now();
        const timeRemaining = this.downloadCooldown - (now - this.lastDownloadTime);

        // Check cooldown
        if (timeRemaining > 0 && this.lastDownloadTime > 0) {
            const seconds = Math.ceil(timeRemaining / 1000);
            this.closeAdModal();
            this.showMessage(`يرجى الانتظار ${seconds} ثانية قبل تحميل ملف آخر`, 'warning');
            this.startCooldownTimer(timeRemaining);
            return;
        }

        try {
            this.lastDownloadTime = now;
            
            // Execute original download
            eval(this.pendingDownload.action);
            
            // Update download count
            this.incrementDownloadCountOptimized(this.pendingDownload.fileId).catch(error => {
                console.warn('Could not update download count:', error.message);
            });
            
            // Close modal
            this.closeAdModal();
            
            // Start cooldown timer
            this.startCooldownTimer(this.downloadCooldown);
            
            this.showMessage('تم بدء التحميل بنجاح!', 'success');
            
        } catch (error) {
            console.error('Error handling download:', error);
            this.closeAdModal();
            this.showMessage('خطأ في تسجيل التحميل', 'error');
        }
        
        // Clear pending download
        this.pendingDownload = null;
    }

    closeAdModal() {
        const modal = document.getElementById('download-ad-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    async incrementDownloadCountOptimized(fileId) {
        try {
            const currentData = this.cache.downloads.get(fileId) || { count: 0 };
            const newCount = currentData.count + 1;
            
            this.cache.downloads.set(fileId, { ...currentData, count: newCount });
            this.updateDownloadDisplay(fileId, newCount);
            
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
                this.updateDownloadButtonsText(`انتظر ${seconds} ثواني`);
            }
        }, 100);
    }

    disableAllDownloadButtons() {
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
            this.showLoadingForFile(fileId);
            
            const { data: currentData, error: selectError } = await this.supabase
                .from('ratings')
                .select('*')
                .eq('id', fileId)
                .single();
            
            if (selectError && selectError.code !== 'PGRST116') {
                throw selectError;
            }
            
            if (currentData) {
                if (currentData.raters && currentData.raters.includes(this.userFingerprint)) {
                    this.showMessage('لقد قمت بتقييم هذا الملف مسبقاً!', 'warning');
                    this.hideLoadingForFile(fileId);
                    return;
                }
                
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
                
                this.cache.ratings.set(fileId, { id: fileId, ...newData });
                this.updateRatingDisplay(fileId, newData);
                
            } else {
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
                
                this.cache.ratings.set(fileId, newData);
                this.updateRatingDisplay(fileId, newData);
            }
            
            this.disableRating(fileId);
            this.hideLoadingForFile(fileId);
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

        let downloadCountElement = item.querySelector('.download-count');
        if (!downloadCountElement) {
            downloadCountElement = document.createElement('div');
            downloadCountElement.className = 'download-count';
            
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
        const existingMessage = document.getElementById('ratingMessage');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.id = 'ratingMessage';
        messageEl.className = `rating-message ${type}`;
        messageEl.textContent = text;
        document.body.appendChild(messageEl);

        setTimeout(() => messageEl.classList.add('show'), 100);

        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 300);
        }, 3000);
    }

    clearCache() {
        this.cache.ratings.clear();
        this.cache.downloads.clear();
        this.cache.lastUpdate = 0;
    }

    async refreshData() {
        this.clearCache();
        const validFileIds = this.getValidFileIds();
        if (validFileIds.length > 0) {
            await this.loadAllDataOptimized(validFileIds);
        }
    }

    enableRealTimeUpdates() {
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












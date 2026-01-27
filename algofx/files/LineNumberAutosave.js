        // ============================================
        // Line Numbers and Basic Editor Functions
        // ============================================
        const editor = document.getElementById('codeEditor');
        const lineNumbers = document.getElementById('lineNumbers');

        function updateLineNumbers() {
            const lines = editor.value.split('\n').length;
            lineNumbers.textContent = Array.from({length: lines}, (_, i) => i + 1).join('\n');
        }

        // Sync scrolling between editor and line numbers
        editor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = editor.scrollTop;
        });

        // Update on input
        editor.addEventListener('input', updateLineNumbers);

        // Initialize
        updateLineNumbers();

        // Theme toggle
        function toggleTheme() {
            const root = document.documentElement;
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', newTheme);
            document.getElementById('themeIcon').textContent = newTheme === 'light' ? '☀️' : '🌙';
        }

        // ============================================
        // AUTO-SAVE SYSTEM
        // ============================================
        
        // Auto-save configuration
        const AUTOSAVE_DELAY = 3000; // 2 seconds after typing stops
        let autoSaveTimer = null;
        let lastManualSave = '';
        let isOpenedFile = false; // Track if current content is from an opened file

        // ============================================
        // 1. Check for auto-save on page load
        // ============================================
        function checkAutoSaveOnLoad() {
            const savedCode = localStorage.getItem('algofx_autosave');
            const timestamp = localStorage.getItem('algofx_autosave_timestamp');
            
            if (savedCode && savedCode.trim() !== '') {
                showRestoreNotification(timestamp);
            }
        }

        // ============================================
        // 2. Show restore notification banner
        // ============================================
		function showRestoreNotification(timestamp) {
		const banner = document.createElement('div');
		banner.id = 'autoSaveBanner';
		banner.className = 'autosave-banner';


		let timeText = 'récemment';


		if (timestamp) {
		const seconds = Math.floor((Date.now() - Number(timestamp)) / 1000);


		if (seconds < 30) {
		timeText = 'il y a quelques secondes';
		} else {
		const minutes = Math.floor(seconds / 60);


		if (minutes < 60) {
		timeText = `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
		} else {
		const hours = Math.floor(minutes / 60);


		if (hours < 24) {
		timeText = `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
		} else {
		const days = Math.floor(hours / 24);
		timeText = `il y a ${days} jour${days > 1 ? 's' : ''}`;
		}
		}
		}
		}


		banner.innerHTML = `
		<div class="banner-content">
		<span>Code non sauvegardé détecté (${timeText})</span>
		<div class="banner-actions">
		<button class="banner-btn btn-restore" onclick="restoreAutoSave()">Restaurer</button>
		<button class="banner-btn btn-ignore" onclick="ignoreAutoSave()">Ignorer</button>
		</div>
		</div>
		`;


		const menuBar = document.querySelector('.menu-bar');
		menuBar.parentNode.insertBefore(banner, menuBar.nextSibling);
		}

        // ============================================
        // 3. Restore auto-saved content
        // ============================================
        function restoreAutoSave() {
            const savedCode = localStorage.getItem('algofx_autosave');
            if (savedCode) {
                document.getElementById('codeEditor').value = savedCode;
                updateLineNumbers(); // Update line numbers
                isOpenedFile = false;
                lastManualSave = ''; // Mark as unsaved
            }
            removeRestoreBanner();
            showAutoSaveStatus('Code restauré');
			refreshEditor();
        }

        // ============================================
        // 4. Ignore auto-save and clear it
        // ============================================
        function ignoreAutoSave() {
            clearAutoSaveStorage();
            removeRestoreBanner();
        }

        function removeRestoreBanner() {
            const banner = document.getElementById('autoSaveBanner');
            if (banner) banner.remove();
        }

        // ============================================
        // 5. Setup auto-save on typing
        // ============================================
        function setupAutoSave() {
            const editor = document.getElementById('codeEditor');
            
            editor.addEventListener('input', () => {
                // Only auto-save if it's new work (not an opened file)
                if (!isOpenedFile) {
                    clearTimeout(autoSaveTimer);
                    autoSaveTimer = setTimeout(() => {
                        saveToLocalStorage();
                    }, AUTOSAVE_DELAY);
                }
            });
        }

        // ============================================
        // 6. Save to localStorage
        // ============================================
        function saveToLocalStorage() {
            const code = document.getElementById('codeEditor').value;
            
            // Only save if there's content and it's different from last manual save
            if (code.trim() !== '' && code !== lastManualSave) {
                localStorage.setItem('algofx_autosave', code);
                localStorage.setItem('algofx_autosave_timestamp', Date.now().toString());
                showAutoSaveStatus('Auto-sauvegardé');
            }
        }

        // ============================================
        // 7. Show auto-save status indicator
        // ============================================
        function showAutoSaveStatus(message) {
            let indicator = document.getElementById('autoSaveIndicator');
            
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'autoSaveIndicator';
                indicator.className = 'autosave-indicator';
                document.querySelector('.controls').appendChild(indicator);
            }
            
            indicator.textContent = `✓ ${message}`;
            indicator.style.opacity = '1';
            
            // Fade out after 3 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 3000);
        }

        // ============================================
        // 8. Clear auto-save storage
        // ============================================
        function clearAutoSaveStorage() {
            localStorage.removeItem('algofx_autosave');
            localStorage.removeItem('algofx_autosave_timestamp');
        }

        // ============================================
        // 9. Handle page close warning
        // ============================================
        function setupBeforeUnload() {
            window.addEventListener('beforeunload', (e) => {
                const currentCode = document.getElementById('codeEditor').value;
                
                // Check if there are unsaved changes
                if (currentCode.trim() !== '' && currentCode !== lastManualSave) {
                    // Save to localStorage before leaving
                    saveToLocalStorage();
                    
                    // Show browser warning
                    e.preventDefault();
                    e.returnValue = 'Vous avez des modifications non sauvegardées. Quitter?';
                    return e.returnValue;
                }
            });
        }

        // ============================================
        // 10. Wrap existing functions with auto-save logic
        // ============================================
        
        // Store original functions
        const originalSaveFile = window.saveFile;
        const originalOpenFile = window.openFile;
        const originalNewFile = window.newFile;

        // Wrap saveFile
        if (typeof originalSaveFile === 'function') {
            window.saveFile = function() {
                originalSaveFile();
                // After successful save
                lastManualSave = document.getElementById('codeEditor').value;
                clearAutoSaveStorage();
                isOpenedFile = false;
                showAutoSaveStatus('Sauvegardé manuellement');
            };
        }

        // Wrap openFile
        if (typeof originalOpenFile === 'function') {
            window.openFile = function(event) {
                originalOpenFile(event);
                // After opening file
                setTimeout(() => {
                    lastManualSave = document.getElementById('codeEditor').value;
                    isOpenedFile = true;
                    clearAutoSaveStorage();
                    removeRestoreBanner();
					refreshEditor();
                }, 100);
            };
        }

        // Wrap newFile
        if (typeof originalNewFile === 'function') {
            window.newFile = function() {
                originalNewFile();
                // Reset tracking
                lastManualSave = '';
                isOpenedFile = false;
                clearAutoSaveStorage();
            };
        }

        // ============================================
        // 11. Initialize on page load
        // ============================================
        document.addEventListener('DOMContentLoaded', () => {
            checkAutoSaveOnLoad();
            setupAutoSave();
            setupBeforeUnload();
        });
function refreshEditor() {
    updateLineNumbers();
    editor.dispatchEvent(new Event('input', { bubbles: true }));
}

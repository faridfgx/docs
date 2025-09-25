// PDF Viewer Script for Lab Rules Page
document.addEventListener('DOMContentLoaded', function() {
    // Remove the unused function
    // createViewContainer function is no longer needed

    // Add view buttons to PDF files
    function addViewButtons() {
        const fileItems = document.querySelectorAll('.file-item');
        
        fileItems.forEach(item => {
            const fileIcon = item.querySelector('.file-icon');
            const downloadBtn = item.querySelector('.download-btn');
            
            // Check if it's a PDF file - look for both 'pdf' class and 'PDF' text content
            const isPDF = (fileIcon && fileIcon.classList.contains('pdf')) || 
                         (fileIcon && fileIcon.textContent && fileIcon.textContent.includes('PDF'));
            
            if (isPDF && downloadBtn) {
                // Check if device is mobile or mobile view
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                                window.innerWidth <= 768;
                
                // Only add view button if NOT mobile
                if (!isMobile) {
                    // Check if view button already exists to avoid duplicates
                    if (!item.querySelector('.view-btn')) {
                        // Create view button with same style as download button
                        const viewBtn = document.createElement('button');
                        viewBtn.className = 'viewpdf-btn';
                        viewBtn.textContent = 'معاينة';
                        
                        // Get PDF URL from download button - handle different onclick patterns
                        const onclickAttr = downloadBtn.getAttribute('onclick');
                        let pdfUrl = null;
                        
                        if (onclickAttr) {
                            // Try to extract URL from different patterns
                            const urlMatch = onclickAttr.match(/window\.open\(['"]([^'"]+)['"]/) || 
                                           onclickAttr.match(/open\(['"]([^'"]+)['"]/) ||
                                           onclickAttr.match(/href=['"]([^'"]+)['"]/);
                            
                            if (urlMatch && urlMatch[1]) {
                                pdfUrl = urlMatch[1];
                            }
                        }
                        
                        if (pdfUrl) {
                            // Add click event
                            viewBtn.addEventListener('click', function(e) {
                                e.preventDefault();
                                const fileName = item.querySelector('.file-name').textContent || 'ملف PDF';
                                openPDFViewer(pdfUrl, fileName);
                            });
                            
                            // Insert view button before download button
                            downloadBtn.parentNode.insertBefore(viewBtn, downloadBtn);
                        }
                    }
                }
            }
        });
    }

    // Create popup overlay
    function createPopupOverlay() {
        if (!document.querySelector('.pdf-popup-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'pdf-popup-overlay';
            overlay.innerHTML = `
                <div class="pdf-popup">
                    <div class="pdf-popup-header">
                        <h3 id="pdf-popup-title">معاينة الملف</h3>
                        <button class="pdf-popup-close" onclick="closePDFPopup()">×</button>
                    </div>
                    <div class="pdf-popup-content" id="pdf-popup-content">
                        <!-- PDF viewer will be inserted here -->
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }

    // Open PDF viewer popup
    window.openPDFViewer = function(pdfUrl, fileName) {
        createPopupOverlay();
        const overlay = document.querySelector('.pdf-popup-overlay');
        const title = document.getElementById('pdf-popup-title');
        const content = document.getElementById('pdf-popup-content');
        
        // Update title
        title.textContent = `معاينة: ${fileName}`;
        
        // Show loading
        content.innerHTML = `
            <div class="pdf-loading">
                <div class="loading-spinner"></div>
                <p>جاري تحميل الملف...</p>
            </div>
        `;
        
        // Show popup
        overlay.style.display = 'flex';
        overlay.style.opacity = '0';
        
        // Animate entrance
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.opacity = '1';
            
            // Load PDF after animation
            setTimeout(() => {
                // For desktop, use direct PDF embedding
                content.innerHTML = `
                    <div class="pdf-viewer-popup">
                        <iframe 
                            src="${pdfUrl}" 
                            width="100%" 
                            height="100%" 
                            style="border: none;"
                            type="application/pdf"
                            onload="hidePDFLoading()"
                            onerror="showPDFError('${pdfUrl}', '${fileName}')">
                        </iframe>
                        <div class="pdf-popup-controls">

                            <button onclick="closePDFPopup()" class="pdf-control-btn secondary">
                                ❌ إغلاق
                            </button>
                        </div>
                    </div>
                `;
            }, 200);
        }, 10);
    };

    // Close popup
    window.closePDFPopup = function() {
        const overlay = document.querySelector('.pdf-popup-overlay');
        if (overlay) {
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.opacity = '0';
            
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    };

    // Hide loading (called when iframe loads successfully)
    window.hidePDFLoading = function() {
        // This function can be used for additional loading state management
        console.log('PDF loaded successfully');
    };

    // Download PDF function
    window.downloadPDF = function(pdfUrl, fileName) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Add CSS styles
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* PDF Popup Overlay */
            .pdf-popup-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(4px);
            }
            
            /* PDF Popup */
            .pdf-popup {
                background: white;
                width: 90%;
                height: 90%;
                max-width: 1200px;
                max-height: 800px;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                overflow: hidden;
            }
            
            /* PDF Popup Header */
            .pdf-popup-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }
            
            .pdf-popup-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .pdf-popup-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .pdf-popup-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }
            
            /* PDF Popup Content */
            .pdf-popup-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .pdf-viewer-popup {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .pdf-viewer-popup iframe {
                flex: 1;
                width: 100%;
            }
            
            /* Loading Spinner */
            .pdf-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #666;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 15px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* PDF Controls */
            .pdf-popup-controls {
                background: #f8f9fa;
                padding: 15px;
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
                border-top: 1px solid #dee2e6;
                flex-shrink: 0;
            }
            
            .pdf-control-btn {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }
            
            .pdf-control-btn.secondary {
                background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            }
            
            .pdf-control-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
            }
            
            .pdf-control-btn.secondary:hover {
                box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
            }
            
            /* PDF Not Supported Message */
            .pdf-not-supported {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                text-align: center;
                padding: 40px;
                color: #666;
            }
            
            .pdf-not-supported h4 {
                color: #e74c3c;
                margin-bottom: 10px;
            }
            
            /* Error Containers */
            .pdf-error-container, .pdf-final-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }
            
            .pdf-error-content h4 {
                color: #e74c3c;
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .mobile-hint {
                background: #e3f2fd;
                color: #1976d2;
                padding: 10px;
                border-radius: 6px;
                font-size: 13px;
                margin: 15px 0;
                border-left: 4px solid #2196f3;
            }
            
            .error-actions, .final-error-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 20px;
            }
            
            .error-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .pdf-final-error h3 {
                color: #e74c3c;
                margin-bottom: 10px;
            }
            
            .pdf-control-btn.large {
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 600;
            }
            
            /* View Button Styling */
            .view-btn {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
                margin-left: 8px !important;
            }
            
            .view-btn:hover {
                background: linear-gradient(135deg, #218838 0%, #1abc9c 100%) !important;
                transform: translateY(-2px);
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .pdf-popup {
                    width: 95%;
                    height: 95%;
                    border-radius: 8px;
                }
                
                .pdf-popup-header {
                    padding: 12px 15px;
                }
                
                .pdf-popup-header h3 {
                    font-size: 16px;
                }
                
                .pdf-popup-close {
                    width: 30px;
                    height: 30px;
                    font-size: 16px;
                }
                
                .pdf-popup-controls {
                    padding: 12px;
                    gap: 8px;
                }
                
                .pdf-control-btn {
                    padding: 8px 16px;
                    font-size: 13px;
                    flex: 1;
                    justify-content: center;
                    min-width: 120px;
                }
                
                .view-btn {
                    margin-left: 5px !important;
                    font-size: 12px !important;
                    padding: 6px 12px !important;
                }
            }
            
            @media (max-width: 480px) {
                .pdf-popup {
                    width: 100%;
                    height: 100%;
                    border-radius: 0;
                }
                
                .pdf-popup-controls {
                    flex-direction: column;
                }
                
                .pdf-control-btn {
                    width: 100%;
                    margin: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize the script
    function init() {
        addStyles();
        addViewButtons();
        
        // Re-run addViewButtons when collapsible sections are opened (for notes page)
        const collapsibleHeaders = document.querySelectorAll('.collapsible-section h4');
        collapsibleHeaders.forEach(header => {
            header.addEventListener('click', function() {
                // Wait for the section to expand, then add view buttons
                setTimeout(() => {
                    addViewButtons();
                }, 300);
            });
        });
        
        // Add keyboard support for closing popup
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closePDFPopup();
            }
        });
        
        // Close popup when clicking outside
        document.addEventListener('click', function(e) {
            const popup = document.querySelector('.pdf-popup');
            const overlay = document.querySelector('.pdf-popup-overlay');
            if (overlay && 
                overlay.style.display === 'flex' && 
                !popup.contains(e.target) &&
                e.target === overlay) {
                closePDFPopup();
            }
        });
    }

    // Run initialization
    init();
    
    // Console log for debugging
    console.log('PDF Viewer Script loaded successfully');
});

// Additional utility functions
window.PDFViewer = {
    // Check if browser supports PDF viewing
    supportsPDF: function() {
        const testPdf = 'data:application/pdf;base64,';
        const iframe = document.createElement('iframe');
        iframe.src = testPdf;
        return iframe.contentDocument !== null;
    },
    
    // Get PDF info (basic)
    getPDFInfo: function(url) {
        return {
            url: url,
            name: url.split('/').pop(),
            size: 'غير معروف'
        };
    },
    
    // Error handling
    handleError: function(error, container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e74c3c;">
                <h4>خطأ في تحميل الملف</h4>
                <p>حدث خطأ أثناء محاولة عرض الملف. يرجى المحاولة مرة أخرى أو تحميل الملف مباشرة.</p>
                <button onclick="location.reload()" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                ">إعادة المحاولة</button>
            </div>
        `;
    }
};



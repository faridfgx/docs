// -------------------------
// Navigation functionality
// -------------------------
function showDocument(documentId) {
    // إخفاء الصفحة الرئيسية
    document.getElementById('home-view').classList.add('hidden');
    
    // إخفاء جميع صفحات التفاصيل
    const details = document.querySelectorAll('.document-detail');
    details.forEach(detail => {
        detail.classList.remove('active');
    });

    // إظهار الصفحة المطلوبة
    document.getElementById(documentId).classList.add('active');

    // التمرير إلى الأعلى بسلاسة
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHome() {
    // إظهار الصفحة الرئيسية
    document.getElementById('home-view').classList.remove('hidden');
    
    // إخفاء جميع صفحات التفاصيل
    const details = document.querySelectorAll('.document-detail');
    details.forEach(detail => {
        detail.classList.remove('active');
    });
}

function downloadFile(fileName) {
    // محاكاة تحميل الملف
    alert('🎯 جاري تحميل: ' + fileName + '\n\nملاحظة: هذا موقع تجريبي - في النسخة الحقيقية سيتم تحميل الملف الفعلي');
}

// -------------------------
// Section toggle
// -------------------------
function toggleSection(header) {
    header.classList.toggle("collapsed");
    const content = header.nextElementSibling;
    if (content) {
        content.classList.toggle("collapsed");
    }
}

// -------------------------
// Card animations
// -------------------------
function initCardAnimations() {
    const cards = document.querySelectorAll('.document-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = (index * 0.1) + 's';
        card.style.animation = 'fadeIn 0.6s ease forwards';
    });
}

// -------------------------
// Back-to-top button
// -------------------------
function initBackToTopButton() {
    const backToTopButton = document.getElementById('backToTop');
    if (!backToTopButton) return;
    
    // Scroll handler
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
    
    // Click handler
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// -------------------------
// Enhanced Mobile Navigation
// -------------------------
let isInteracting = false;
let touchStartY = 0;
let touchStartX = 0;
let dropdownScrollTop = 0;
let interactionTimeout;

function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    const isOpen = dropdown.classList.contains('show');
    
    if (isOpen) {
        dropdown.classList.remove('show');
        document.body.style.overflow = '';
    } else {
        dropdown.classList.add('show');
        // Prevent body scroll when dropdown is open on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
    }
}

// Initialize dropdown functionality
function initDropdownFunctionality() {
    // Get the dropdown element
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (!dropdownMenu) return; // Exit if dropdown doesn't exist

    // Track interaction state
    function setInteracting(value) {
        isInteracting = value;
        clearTimeout(interactionTimeout);
        if (value) {
            interactionTimeout = setTimeout(() => {
                isInteracting = false;
            }, 300);
        }
    }

    // Handle touch start
    dropdownMenu.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        dropdownScrollTop = this.scrollTop;
        setInteracting(true);
        e.stopPropagation();
    }, { passive: true });

    // Handle touch move (scrolling)
    dropdownMenu.addEventListener('touchmove', function(e) {
        setInteracting(true);
        
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        const deltaY = touchStartY - touchY;
        const deltaX = Math.abs(touchStartX - touchX);
        
        // If horizontal swipe is detected, prevent vertical scroll
        if (deltaX > Math.abs(deltaY)) {
            e.preventDefault();
            return;
        }
        
        // Prevent closing when scrolling
        const isAtTop = this.scrollTop <= 0;
        const isAtBottom = this.scrollTop + this.clientHeight >= this.scrollHeight - 1;
        
        // Prevent pull-to-refresh or bounce effect
        if ((isAtTop && deltaY < 0) || (isAtBottom && deltaY > 0)) {
            e.preventDefault();
        }
        
        e.stopPropagation();
    }, { passive: false });

    // Handle touch end
    dropdownMenu.addEventListener('touchend', function(e) {
        e.stopPropagation();
        // Keep interaction state for a bit longer
        setTimeout(() => {
            setInteracting(false);
        }, 100);
    }, { passive: true });

    // Handle mouse events for desktop
    dropdownMenu.addEventListener('mousedown', function(e) {
        setInteracting(true);
        e.stopPropagation();
    });

    dropdownMenu.addEventListener('mouseup', function(e) {
        e.stopPropagation();
        setTimeout(() => {
            setInteracting(false);
        }, 100);
    });

    // Handle scroll events
    dropdownMenu.addEventListener('scroll', function(e) {
        setInteracting(true);
        e.stopPropagation();
    }, { passive: true });

    // Prevent clicks inside dropdown from closing it
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Initialize dropdown items functionality
function initDropdownItems() {
    // Prevent dropdown from closing when interacting with links
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    if (dropdownItems.length > 0) {
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // Allow navigation but close dropdown
                const dropdown = document.getElementById('dropdownMenu');
                if (dropdown) {
                    dropdown.classList.remove('show');
                    document.body.style.overflow = '';
                }
            });
        });
    }
}

// -------------------------
// Global event listeners
// -------------------------
function initGlobalEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (isInteracting) return;
        
        const navMenu = document.querySelector('.nav-menu');
        const dropdown = document.getElementById('dropdownMenu');
        
        if (navMenu && dropdown && !navMenu.contains(e.target) && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Handle touch outside on mobile
    document.addEventListener('touchstart', function(e) {
        if (isInteracting) return;
        
        const navMenu = document.querySelector('.nav-menu');
        const dropdown = document.getElementById('dropdownMenu');
        
        if (navMenu && dropdown && !navMenu.contains(e.target) && !dropdown.contains(e.target) && dropdown.classList.contains('show')) {
            // Add a small delay to ensure it's not accidental
            setTimeout(() => {
                if (!isInteracting) {
                    dropdown.classList.remove('show');
                    document.body.style.overflow = '';
                }
            }, 50);
        }
    }, { passive: true });

    // Keyboard support
    document.addEventListener('keydown', function(e) {
        const dropdown = document.getElementById('dropdownMenu');
        if (dropdown && e.key === 'Escape' && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        const dropdown = document.getElementById('dropdownMenu');
        if (dropdown && dropdown.classList.contains('show') && window.innerWidth > 768) {
            document.body.style.overflow = '';
        }
    });
}

// -------------------------
// Initialization
// -------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality when DOM is ready
    initCardAnimations();
    initBackToTopButton();
    initDropdownFunctionality();
    initDropdownItems();
    initGlobalEventListeners();
});
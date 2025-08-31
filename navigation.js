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
// Initialize everything
// -------------------------
document.addEventListener('DOMContentLoaded', function() {
    initCardAnimations();
    initBackToTopButton();
});

function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const navMenu = document.querySelector('.nav-menu');
    const dropdown = document.getElementById('dropdownMenu');
    
    if (!navMenu.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Prevent dropdown from closing when clicking inside it on mobile
document.getElementById('dropdownMenu').addEventListener('click', function(event) {
    event.stopPropagation();
});

// Handle touch events for better mobile interaction
let touchStartY = 0;
document.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

// Close dropdown on swipe up
document.addEventListener('touchend', function(e) {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown.classList.contains('show')) {
        const touchEndY = e.changedTouches[0].clientY;
        const swipeDistance = touchStartY - touchEndY;
        
        // If swipe up more than 50px, close dropdown
        if (swipeDistance > 50) {
            dropdown.classList.remove('show');
        }
    }
}, { passive: true });

// Better keyboard support
document.addEventListener('keydown', function(event) {
    const dropdown = document.getElementById('dropdownMenu');
    
    if (event.key === 'Escape' && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        document.querySelector('.nav-toggle').focus();
    }
});

// Focus management for accessibility
document.querySelector('.nav-toggle').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleDropdown();
    }
});
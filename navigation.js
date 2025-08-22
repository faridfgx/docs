// Navigation functionality
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

// تأثيرات بصرية إضافية
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.document-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = (index * 0.1) + 's';
        card.style.animation = 'fadeIn 0.6s ease forwards';
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
function toggleSection(element) {
    const content = element.nextElementSibling;
    const isCollapsed = content.classList.contains('collapsed');
    
    if (isCollapsed) {
        content.classList.remove('collapsed');
        element.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        element.classList.add('collapsed');
    }
}
function toggleSection(header) {
  header.classList.toggle("collapsed");
  const content = header.nextElementSibling;
  content.classList.toggle("collapsed");
}

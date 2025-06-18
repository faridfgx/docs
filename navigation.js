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
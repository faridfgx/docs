// popup.js - Fixed version with proper 24-hour control

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if 24 hours have passed since last popup show
    checkAndShowPopup();
});

// Check timestamp and show popup if needed
function checkAndShowPopup() {
    const lastShown = localStorage.getItem("popupLastShown");
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Show popup if it's never been shown OR if 24+ hours have passed
    if (!lastShown || (now - parseInt(lastShown)) > oneDay) {
        setTimeout(showMainPopup, 1000); // Show after 1 second delay
    }
}

// Show main popup function
function showMainPopup() {
    const popup = document.getElementById('popup');
    const popupBox = document.getElementById('popup-box');
    
    // Check if elements exist before manipulating them
    if (popup && popupBox) {
        popup.style.display = 'flex';
        
        // Add animation with a small delay
        setTimeout(() => {
            popupBox.style.transform = 'scale(1)';
            popupBox.style.opacity = '1';
        }, 50);
    } else {
        console.warn('Main popup elements not found. Make sure popup HTML exists.');
    }
}

// Close main popup function
function closePopup() {
    const popup = document.getElementById('popup');
    const popupBox = document.getElementById('popup-box');
    
    if (popup && popupBox) {
        // Add closing animation
        popupBox.style.transform = 'scale(0.85)';
        popupBox.style.opacity = '0';
        
        // Hide after animation and store timestamp
        setTimeout(() => {
            popup.style.display = 'none';
            // Store current timestamp when popup is closed
            localStorage.setItem("popupLastShown", Date.now().toString());
        }, 400);
    }
}

// Alternative function names for backward compatibility
function showPopup() {
    showMainPopup();
}

// Global popup functions for footer and other elements
function openPopup(type) {
    const overlay = document.getElementById('popup-overlay');
    const body = document.getElementById('popup-body');
    
    // Check if elements exist
    if (!overlay || !body) {
        console.warn('Popup overlay elements not found');
        return;
    }
    
    let content = '';
    
    switch(type) {
        case 'contact':
            content = `
    
<div class="contact-section">
    <h2>اتصل بنا</h2>
    <p>
        يمكنك <a href="contact.html">زيارة صفحة التواصل معنا</a>
        أو إرسال بريد إلكتروني إلى:
        <a href="#">faridmezane@gmail.com</a>
    </p>
</div>

    
            `;
            break;
        
        case 'faq':
            content = `
                <h2>الأسئلة الشائعة</h2>
                <div class="faq-item">
                    <div class="faq-question">كيف يمكنني تحميل الملفات؟</div>
                    <div class="faq-answer">يمكنك تحميل الملفات من خلال النقر على أحد أقسام الموقع، ثم فتح إحدى القوائم المتوفرة، والنقر على زر "تحميل". في أغلب الحالات، سيبدأ التحميل مباشرة، أو سيتم فتح الملف في تبويب جديد إذا كان بصيغة PDF. أما في حالة الملفات الكبيرة، فسيتم فتح تبويب خاص بصفحة التحميل المباشر.</div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">هل المحتوى مجاني؟</div>
                    <div class="faq-answer">نعم، جميع المواد الملفات المتاحة على الموقع مجانية تماما.</div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">كيف يمكنني المساهمة في الموقع؟</div>
                    <div class="faq-answer">يمكنك المساهمة عبر إرسال اقتراحاتك أو مواد تعليمية جديدة من خلال صفحة "اتصل بنا".</div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">كم مرة يتم تحديث المحتوى؟</div>
                    <div class="faq-answer">نقوم بتحديث المحتوى بانتظام ودوريا بأضافة مواد جديدة حسب الحاجة.</div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">ماهو الهدف من الموقع؟</div>
                    <div class="faq-answer">هدف الموقع هو دعم الأساتذة، خاصة الجدد منهم، من خلال توفير موارد وأدوات تعليمية تساعدهم في تدريس مادة المعلوماتية، والمساهمة في تطوير هذه المادة والارتقاء بمستواها في الوسط التربوي.</div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">بماذا أقوم لو صادفت رابطًا معطلاً أو واجهت أي مشكل في الموقع؟</div>
                    <div class="faq-answer">في حال صادفت رابطًا معطلاً أو واجهت أي مشكل في الموقع، يُرجى التواصل معنا عبر صفحة "اتصل بنا" أو من خلال البريد الإلكتروني المخصص للدعم، وسنعمل على معالجة الخلل في أقرب وقت ممكن. مساهمتك تساعدنا في تحسين الموقع وخدمتك بشكل أفضل.</div>
                </div>
            `;
            break;
        
        case 'help':
            content = `

            `;
            break;

        case 'privacy':
            content = `
                <h2>سياسة الخصوصية</h2>
                <p>نحن في CSdocs.space نقدر خصوصيتك ونلتزم بحماية بياناتك الشخصية.</p>
                <h3>جمع المعلومات:</h3>
                <ul>
                    <li>لا نجمع أي معلومات شخصية دون موافقتك</li>
                    <li>نستخدم ملفات تعريف الارتباط فقط لتحسين تجربتك</li>
                    <li>لا نشارك بياناتك مع أي طرف أخر</li>
                </ul>
                <h3>حقوقك:</h3>
                <ul>
                    <li>يمكنك طلب حذف بياناتك او ملفاتك في أي وقت فقط لعلمك قد يستغرق حذف الملفات بعد الوقت</li>
                    <li>يمكنك المشاركة في إثراء الموقع من خلال مراسلة مسير الموقع</li> 
                    
                </ul>
            `;
            break;

        case 'terms':
            content = `
                <h2>شروط الاستخدام</h2>
                <p>باستخدام موقع CSdocs.space، فإنك توافق على الشروط التالية:</p>
                <h3>الاستخدام المسموح:</h3>
                <ul>
                    <li>استخدام الموقع للأغراض التعليمية</li>
                    <li>تحميل الملفات فقط للإستخدام الشخصي</li>
                    <li>شارك الموقع مع زملائك وأعتبر نفسط طرفا في تطوير محتواه</li>
					<li>حاول تقييم المحتوى حسب ماتراه مناسبا</li>
                </ul>
                <h3>الاستخدام المحظور:</h3>
                <ul>
                    <li>إعادة نشر المحتوى تجاريا</li>
                    <li>تعديل المحتوى وإعادة توزيعه</li>
                    <li>استخدام المحتوى لأغراض ضارة أو دعائية دون اذن</li>
                </ul>
            `;
            break;

        case 'sitemap':
            content = `
<h2>خريطة الموقع</h2>

<h3>الأقسام التعليمية:</h3>
<ul class="footer-links">
    <li><strong><a href="notes.html">المذكرات:</a></strong> مذكرات تربوية لجميع الدروس والوحدات</li>
    <li><strong><a href="lessons.html">الدروس والتطبيقات:</a></strong> محتوى الدروس والتطبيقات مفصل ومنظم</li>
    <li><strong><a href="presentations.html">العروض التقديمية:</a></strong> عروض PowerPoint جاهزة للاستخدام</li>
    <li><strong><a href="assessment-templates.html">نماذج لفروض و اختبارات:</a></strong> فروض، اختبارات، وتقويمات تشخيصية</li>
    <li><strong><a href="textbook.html">الكتاب المدرسي:</a></strong> الكتاب المقرر وملحقاته</li>
</ul>

<h3>التخطيط والتنظيم:</h3>
<ul class="footer-links">
    <li><strong><a href="annual-progression.html">التدرج السنوي:</a></strong> توزيع المنهج على أشهر السنة</li>
    <li><strong><a href="annual-distribution.html">التوزيع السنوي:</a></strong> خطة توزيع الدروس والأنشطة</li>
    <li><strong><a href="daily-journal.html">الدفتر اليومي:</a></strong> تسجيل الأنشطة اليومية</li>
    <li><strong><a href="grade-book.html">دفتر التنقيط:</a></strong> سجلات الدرجات والتقييم</li>
    <li><strong><a href="seating-plan.html">مخطط الجلوس:</a></strong> تنظيم أماكن جلوس التلاميذ</li>
</ul>

<h3>التكوين والامتحانات:</h3>
<ul class="footer-links">
    <li><strong><a href="training-book.html">دفتر التكوين:</a></strong> سجل وملخصات التكوين المهني</li>
    <li><strong><a href="inspection-prep.html">التحضير للتفتيش:</a></strong> نماذج وتوجيهات للتثبيت والزيارات</li>
</ul>

<h3>المخبر والتجهيزات:</h3>
<ul class="footer-links">
    <li><strong><a href="lab-tracking.html">دفتر متابعة المخبر:</a></strong> تتبع الأنشطة والصيانة</li>
    <li><strong><a href="lab-rules.html">القانون الداخلي للمخبر:</a></strong> قواعد الاستخدام والتنظيم</li>
    <li><strong><a href="lab-guide.html">دليل تسيير مخبر الإعلام الآلي:</a></strong> تنظيم وإدارة المخبر</li>
</ul>

<h3>البرامج والأدوات:</h3>
<ul class="footer-links">
    <li><strong><a href="programs.html">البرامج:</a></strong> أدوات وبرمجيات تعليمية</li>
    <li><strong><a href="useful-websites.html">مواقع مفيدة:</a></strong> روابط لمواقع تعليمية وأدوات مساعدة</li>
</ul>

<h3>المكتبة:</h3>
<ul class="footer-links">
    <li><strong><a href="libririe.html">مكتبة الأستاذ:</a></strong> كتب في التربية، التشريع، وعلم النفس</li>
</ul>

<h3>وثائق إضافية:</h3>
<ul class="footer-links">
    <li><strong><a href="other-docs.html">وثائق أخرى:</a></strong> ملفات إدارية وتعليمية متنوعة</li>
</ul>

            `;
            break;

        // Social Media Popups
        case 'facebook':
            content = `
                <h2>تابعنا على فيسبوك</h2>
                <p>صفحة الفيسبوك الخاصة بنا قريباً!</p>
                <p>سنقوم بنشر آخر التحديثات والمواد التعليمية الجديدة.</p>
                <p>ابقوا على تواصل معنا للحصول على أحدث الأخبار.</p>
            `;
            break;

        case 'twitter':
            content = `
                <h2>تابعنا على تويتر</h2>
                <p>حساب تويتر الخاص بنا قريباً!</p>
                <p>سنشارك نصائح تعليمية سريعة وتحديثات يومية.</p>
            `;
            break;

        case 'youtube':
            content = `
                <h2>قناتنا على يوتيوب</h2>
                <p>قناة اليوتيوب الخاصة بنا قريباً!</p>
                <p>سنقدم شروحات فيديو للدروس والبرامج التعليمية.</p>
            `;
            break;

        case 'telegram':
            content = `
                <h2>قناتنا على تيليجرام</h2>
                <p>قناة التيليجرام الخاصة بنا قريباً!</p>
                <p>للحصول على إشعارات فورية بالمحتوى الجديد.</p>
            `;
            break;

        case 'suggestion':
            content = `
                <h2>اقتراحك مهم لنا</h2>
                <form class="contact-form" onsubmit="handleSuggestion(event)">
                    <div class="form-group">
                        <label>الاسم (اختياري)</label>
                        <input type="text" placeholder="اسمك">
                    </div>
                    <div class="form-group">
                        <label>البريد الإلكتروني (اختياري)</label>
                        <input type="email" placeholder="بريدك الإلكتروني">
                    </div>
                    <div class="form-group">
                        <label>اقتراحك أو ملاحظتك</label>
                        <textarea rows="6" required placeholder="شاركنا اقتراحك لتحسين الموقع أو أي ملاحظات لديك..."></textarea>
                    </div>
                    <button type="submit" class="submit-btn">إرسال الاقتراح</button>
                </form>
            `;
            break;

        default:
            content = `
                <h2>قسم ${type}</h2>
                <p>هذا القسم قيد التطوير. سيكون متاحاً قريباً!</p>
            `;
    }
    
    body.innerHTML = content;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close footer popup function (different from main popup)
function closeFooterPopup() {
    const overlay = document.getElementById('popup-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Handle form submissions
function handleSubmit(event) {
    event.preventDefault();
    alert('شكراً لك! تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.');
    closeFooterPopup();
}

function handleSuggestion(event) {
    event.preventDefault();
    alert('شكراً لك على اقتراحك! سنأخذه بعين الاعتبار لتطوير الموقع.');
    closeFooterPopup();
}

// Event listeners for popup interactions
document.addEventListener('DOMContentLoaded', function() {
    // Footer popup overlay click handler
    const footerOverlay = document.getElementById('popup-overlay');
    if (footerOverlay) {
        footerOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeFooterPopup();
            }
        });
    }
    
    // Footer popup content click handler (prevent closing)
    const footerPopupContent = document.getElementById('popup-content');
    if (footerPopupContent) {
        footerPopupContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Main popup overlay click handler
    const mainPopup = document.getElementById('popup');
    if (mainPopup) {
        mainPopup.addEventListener('click', function(e) {
            if (e.target === this) {
                closePopup();
            }
        });
    }
    
    // Escape key handler for both popups
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close footer popup first if open
            const footerOverlay = document.getElementById('popup-overlay');
            if (footerOverlay && footerOverlay.classList.contains('active')) {
                closeFooterPopup();
            }
            // Otherwise close main popup
            else {
                closePopup();
            }
        }
    });
    
    // Optional: Add button hover effect
    const button = document.querySelector('#popup button');
    if (button) {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 16px rgba(30,60,114,0.4)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(30,60,114,0.3)';
        });
    }
});

// Debug function to manually reset the popup timer (for testing)
function resetPopupTimer() {
    localStorage.removeItem("popupLastShown");
    console.log("Popup timer reset. Refresh page to see popup again.");
}

// Debug function to check popup status
function checkPopupStatus() {
    const lastShown = localStorage.getItem("popupLastShown");
    if (!lastShown) {
        console.log("Popup has never been shown");
        return;
    }
    
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const timeSinceLastShown = now - parseInt(lastShown);
    const hoursRemaining = Math.max(0, (oneDay - timeSinceLastShown) / (1000 * 60 * 60));
    
    console.log(`Last shown: ${new Date(parseInt(lastShown))}`);
    console.log(`Hours until next show: ${hoursRemaining.toFixed(1)}`);
}
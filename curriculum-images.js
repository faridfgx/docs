// نظام عرض صور التدرج السنوي للمجالات والوحدات

// روابط الصور لكل مجال ووحدة وشعبة
const CURRICULUM_IMAGES = {
    'بيئة التعامل مع الحاسوب': {
        'تقنية المعلومات': {
            'ج م ع ت': 'imgs/ت م ج م ع ت.jpg',
            'ج م أ': 'imgs2/ت م ج م أ.jpg'
        },
        'تجميع الحاسوب': {
            'ج م ع ت': 'imgs/ت ح ج م ع ت.jpg',
            'ج م أ': 'imgs2/ت ح ج م أ.jpg'
        },
        'نظام التشغيل': {
            'ج م ع ت': 'imgs/ن ت ج م ع ت.jpg',
            'ج م أ': 'imgs2/ن ت ج م أ.jpg'
        },
        'لوحة التحكم': {
            'ج م ع ت': 'imgs/ل ت ج م ع ت.jpg',
            'ج م أ': 'imgs2/ل ت ج م أ.jpg'
        },
        'حماية الحاسوب': {
            'ج م ع ت': 'imgs/ح ح ج م ع ت.jpg',
            'ج م أ': 'imgs2/ح ح ج م أ.jpg'
        },
        'الشبكة المحلية': {
            'ج م ع ت': 'imgs/ش م ج م ع ت.jpg',
            'ج م أ': 'imgs2/ش م ج م أ.jpg'
        }
    },
    'المخططات الانسيابية والخوارزميات': {
        'المخطط الإنسيابي': {
            'ج م ع ت': 'imgs/م إ ج م ع ت.jpg',
            'ج م أ': ''
        },
        'إنشاء المخطط الإنسيابي': {
            'ج م ع ت': 'imgs/إ م إ ج م ع ت.jpg',
            'ج م أ': ''
        },
        'مدخل للخوارزمية': {
            'ج م ع ت': 'imgs/م ا خ ج م ع ت.jpg',
            'ج م أ': ''
        },
        'التعليمات الأساسية': {
            'ج م ع ت': 'imgs/ت أ ج م ع ت.jpg',
            'ج م أ': ''
        }
    },
    'تقنيات الويب': {
        'المتصفح': {
            'ج م ع ت': 'imgs/م ج م ع ت.jpg',
            'ج م أ': 'imgs2/م ج م أ.jpg'
        },
        'البريد الإلكتروني': {
            'ج م ع ت': 'imgs/ب إ ج م ع ت.jpg',
            'ج م أ': 'imgs2/ب إ ج م أ.jpg'
        },
        'إنشاء صفحة ويب': {
            'ج م ع ت': 'imgs/إ ص و ج م ع ت.jpg',
            'ج م أ': 'imgs2/ا ص و ج م أ.jpg'
        },
        'استغلال وسائل التواصل': {
            'ج م ع ت': 'imgs/إ أ ت ج م ع ت.jpg',
            'ج م أ': 'imgs2/ا أ ت ج م أ.jpg'
        }
    },
    'المكتبية': {
        'معالج النصوص 1': {
            'ج م ع ت': 'imgs/م ن 1 ج م ع ت.jpg',
            'ج م أ': 'imgs2/م ن 1 ج م أ.jpg'
        },
        'معالج النصوص 2': {
            'ج م ع ت': 'imgs/م ن 2  ج م ع ت.jpg',
            'ج م أ': 'imgs2/م ن 2 ج م أ.jpg'
        },
        'جداول البيانات 1': {
            'ج م ع ت': 'imgs/ج ب 1 ج م ع ت.jpg',
            'ج م أ': 'imgs2/ج ب 1 ج م أ.jpg'
        },
        'جداول البيانات 2': {
            'ج م ع ت': 'imgs/ج ب 2 ج م ع ت.jpg',
            'ج م أ': 'imgs2/ج ب 2 ج م أ.jpg'
        },
        'العروض التقديمية 1': {
            'ج م ع ت': 'imgs/ع ت 1 ج م ع ت.jpg',
            'ج م أ': 'imgs2/ع ت 1 ج م أ.jpg'
        },
        'العروض التقديمية 2': {
            'ج م ع ت': 'imgs/ع ت 2 ج م ع ت.jpg',
            'ج م أ': 'imgs2/ع ت 2 ج م أ.jpg'
        }
    }
};


// إنشاء نافذة عرض صورة التدرج
function createImageViewerModal() {
    const modalHTML = `
        <div id="curriculumImageModal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow: hidden;">
                <button class="close-btn" onclick="closeCurriculumImage()">×</button>
                <h2 id="imageTitle" style="margin-bottom: 20px; color: #333;">التدرج السنوي</h2>
                
                <div style="text-align: center; background: #f8fafc; padding: 20px; border-radius: 8px; min-height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div id="imageLoadingState" style="display: none;">
                        <div style="font-size: 48px; margin-bottom: 15px;">⏳</div>
                        <p style="color: #64748b;">جاري تحميل الصورة...</p>
                    </div>
                    
                    <div id="imageErrorState" style="display: none;">
                        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                        <p style="color: #ef4444; font-weight: 600;">عذراً، لم يتم رفع صورة التدرج لهذه الوحدة بعد</p>
                        <p style="color: #64748b; margin-top: 10px; font-size: 0.9em;">الرجاء التواصل مع الإدارة لرفع الصور المطلوبة</p>
                    </div>
                    
                    <img id="curriculumImage" 
                         style="max-width: 100%; max-height: 600px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: none;"
                         alt="التدرج السنوي">
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="downloadCurriculumImage()" id="downloadBtn" style="display: none;">
                        📥 تحميل الصورة
                    </button>
                    <button class="btn" onclick="closeCurriculumImage()" style="background: #6b7280;">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// الحصول على رابط صورة التدرج
function getCurriculumImageUrl(area, unit, classType) {
    if (CURRICULUM_IMAGES[area] && CURRICULUM_IMAGES[area][unit]) {
        const unitData = CURRICULUM_IMAGES[area][unit];
        
        // إذا كانت البيانات تحتوي على شعب مختلفة
        if (typeof unitData === 'object' && unitData[classType]) {
            return unitData[classType];
        }
        
        // إذا كان رابط واحد فقط (للتوافق مع الإصدارات القديمة)
        if (typeof unitData === 'string') {
            return unitData;
        }
    }
    return null;
}

// عرض صورة التدرج
function showCurriculumImage() {
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    const classType = document.querySelector('input[name="classType"]:checked').value;
    
    if (!area || !unit) {
        alert('الرجاء اختيار المجال والوحدة أولاً');
        return;
    }
    
    if (!document.getElementById('curriculumImageModal')) {
        createImageViewerModal();
    }
    
    const modal = document.getElementById('curriculumImageModal');
    const imageTitle = document.getElementById('imageTitle');
    const img = document.getElementById('curriculumImage');
    const loadingState = document.getElementById('imageLoadingState');
    const errorState = document.getElementById('imageErrorState');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // تحديث العنوان
    imageTitle.textContent = `التدرج السنوي - ${area} - ${unit} - ${classType}`;
    
    // إخفاء كل العناصر
    img.style.display = 'none';
    errorState.style.display = 'none';
    downloadBtn.style.display = 'none';
    loadingState.style.display = 'block';
    
    // فتح النافذة
    modal.style.display = 'block';
    
    // الحصول على رابط الصورة حسب الشعبة
    const imageUrl = getCurriculumImageUrl(area, unit, classType);
    
    if (!imageUrl) {
        // لا توجد صورة
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        return;
    }
    
    // تحميل الصورة
    img.onload = function() {
        loadingState.style.display = 'none';
        img.style.display = 'block';
        downloadBtn.style.display = 'inline-block';
    };
    
    img.onerror = function() {
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
    };
    
    img.src = imageUrl;
}

// تحميل صورة التدرج
function downloadCurriculumImage() {
    const img = document.getElementById('curriculumImage');
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    const classType = document.querySelector('input[name="classType"]:checked').value;
    
    if (!img.src) return;
    
    const link = document.createElement('a');
    link.href = img.src;
    link.download = `التدرج_${area}_${unit}_${classType}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// إغلاق نافذة الصورة
function closeCurriculumImage() {
    const modal = document.getElementById('curriculumImageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// إضافة زر التدرج إلى النموذج
function addCurriculumButton() {
    // البحث عن المكان المناسب لإضافة الزر (بعد اختيار الوحدة)
    const unitFormGroup = document.querySelector('#unit').closest('.form-group');
    
    if (unitFormGroup && !document.getElementById('viewCurriculumBtn')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'viewCurriculumBtn';
        button.className = 'btn btn-secondary';
        button.onclick = showCurriculumImage;
        button.innerHTML = '📋 عرض التدرج السنوي';
        button.style.cssText = 'margin-top: 10px; width: 100%;';
        
        unitFormGroup.appendChild(button);
    }
    
    // إضافة مستمع للتغيير في اختيار الشعبة
    setupClassTypeListener();
}

// إعداد مستمع لتغيير الشعبة
function setupClassTypeListener() {
    const classTypeRadios = document.querySelectorAll('input[name="classType"]');
    
    classTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            filterAreasByClassType(this.value);
        });
    });
    
    // تطبيق التصفية عند التحميل
    const selectedClassType = document.querySelector('input[name="classType"]:checked');
    if (selectedClassType) {
        filterAreasByClassType(selectedClassType.value);
    }
}

// تصفية المجالات حسب الشعبة
function filterAreasByClassType(classType) {
    const areaSelect = document.getElementById('area');
    if (!areaSelect) return;
    
    const currentValue = areaSelect.value;
    
    // إعادة بناء قائمة المجالات
    areaSelect.innerHTML = '<option value="">اختر المجال</option>';
    
    // إذا كانت الشعبة "ج م أ"، نخفي مجال "المخططات الانسيابية والخوارزميات"
    const areas = [
        'بيئة التعامل مع الحاسوب',
        'المخططات الانسيابية والخوارزميات',
        'تقنيات الويب',
        'المكتبية'
    ];
    
    areas.forEach(area => {
        // إخفاء مجال المخططات للشعبة "ج م أ"
        if (classType === 'ج م أ' && area === 'المخططات الانسيابية والخوارزميات') {
            return; // تخطي هذا المجال
        }
        
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        areaSelect.appendChild(option);
    });
    
    // إذا كان المجال المحدد سابقاً لا يزال متاحاً، نعيد تحديده
    if (currentValue && Array.from(areaSelect.options).some(opt => opt.value === currentValue)) {
        areaSelect.value = currentValue;
    } else {
        // إذا كان المجال المحدد غير متاح (مثلاً تم التبديل من ج م ع ت إلى ج م أ)
        areaSelect.value = '';
        document.getElementById('unit').innerHTML = '<option value="">اختر المجال أولاً</option>';
        document.getElementById('objectives').value = '';
        document.getElementById('competency').value = '';
    }
}

// تهيئة النظام عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // الانتظار قليلاً لضمان تحميل النموذج
        setTimeout(addCurriculumButton, 500);
    });
} else {
    setTimeout(addCurriculumButton, 500);
}

// إغلاق النافذة عند النقر خارجها
window.addEventListener('click', (event) => {
    const modal = document.getElementById('curriculumImageModal');
    if (event.target === modal) {
        closeCurriculumImage();
    }
});

// دالة لتحديث روابط الصور (للمسؤولين)
function updateCurriculumImage(area, unit, classType, imageUrl) {
    if (CURRICULUM_IMAGES[area] && CURRICULUM_IMAGES[area][unit]) {
        if (typeof CURRICULUM_IMAGES[area][unit] === 'object') {
            CURRICULUM_IMAGES[area][unit][classType] = imageUrl;
        } else {
            // تحويل إلى كائن يحتوي على الشعب
            CURRICULUM_IMAGES[area][unit] = {
                'ج م ع ت': imageUrl,
                'ج م أ': imageUrl
            };
        }
        console.log(`تم تحديث صورة التدرج: ${area} - ${unit} - ${classType}`);
        return true;
    }
    return false;
}

// تصدير الدوال للاستخدام
window.showCurriculumImage = showCurriculumImage;
window.closeCurriculumImage = closeCurriculumImage;
window.downloadCurriculumImage = downloadCurriculumImage;
window.updateCurriculumImage = updateCurriculumImage;
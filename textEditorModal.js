// نظام محرر النص المنسق مع مساعد بلوم
let currentEditingElement = null;
let currentFieldType = null;

// Enhanced Bloom's Taxonomy with Arabic descriptions
const BLOOMS_TAXONOMY = {
    'تذكر (Remember)': 'استرجاع المعلومات الأساسية والحقائق',
    'فهم (Understand)': 'شرح الأفكار والمفاهيم بكلماتهم الخاصة',
    'تطبيق (Apply)': 'استخدام المعرفة في مواقف جديدة',
    'تحليل (Analyze)': 'تفكيك المعلومات وفحص العلاقات',
    'تقييم (Evaluate)': 'إصدار أحكام بناءً على معايير محددة',
    'إبداع (Create)': 'إنتاج عمل جديد أو أفكار أصيلة'
};

// إنشاء نافذة المحرر المنبثقة
function createEditorModal() {
    const modalHTML = `
        <div id="textEditorModal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 800px;">
                <button class="close-btn" onclick="closeTextEditor()">×</button>
                <h2 id="editorTitle" style="margin-bottom: 20px;">محرر النص</h2>
                
                <!-- شريط الأدوات -->
                <div id="editorToolbar" style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 8px; border: 1px solid #e2e8f0;">
                    <button type="button" class="editor-btn" onclick="formatText('bold')" title="عريض">
                        <strong>B</strong>
                    </button>
                    <button type="button" class="editor-btn" onclick="formatText('italic')" title="مائل">
                        <em>I</em>
                    </button>
                    <button type="button" class="editor-btn" onclick="formatText('underline')" title="تحته خط">
                        <u>U</u>
                    </button>
                    <span style="border-left: 2px solid #cbd5e1; margin: 0 4px;"></span>
                    <button type="button" class="editor-btn" onclick="insertList('ul')" title="قائمة نقطية">
                        • قائمة
                    </button>
                    <button type="button" class="editor-btn" onclick="insertList('ol')" title="قائمة مرقمة">
                        1. قائمة
                    </button>
                    <span style="border-left: 2px solid #cbd5e1; margin: 0 4px;"></span>
                    <button type="button" class="editor-btn" onclick="clearFormatting()" title="مسح التنسيق">
                        ⟲ مسح
                    </button>
                </div>

                <!-- مساعد بلوم (يظهر فقط لحقل بلوم) -->
                <div id="bloomHelper" style="display: none; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #1e40af;">🎯 اختر مستوى بلوم:</h4>
                    <div id="bloomButtons" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    </div>
                </div>

                <!-- منطقة النص -->
                <div style="margin-bottom: 20px;">
                    <div id="editorContent" 
                         contenteditable="true" 
                         style="min-height: 200px; max-height: 400px; overflow-y: auto; padding: 15px; border: 2px solid #e2e8f0; border-radius: 8px; background: white; line-height: 1.6; font-size: 15px;"
                         placeholder="اكتب هنا...">
                    </div>
                    <div style="font-size: 0.85em; color: #64748b; margin-top: 8px;">
                        💡 نصيحة: استخدم أزرار التنسيق لتحسين مظهر النص
                    </div>
                </div>

                <!-- أزرار الحفظ والإلغاء -->
                <div style="display: flex; gap: 12px;">
                    <button class="btn" onclick="saveEditorContent()" style="flex: 1;">
                        ✓ حفظ
                    </button>
                    <button class="btn" onclick="closeTextEditor()" style="flex: 1; background: #6b7280;">
                        ✕ إلغاء
                    </button>
                </div>
            </div>
        </div>
    `;

    // إضافة النافذة إلى الصفحة
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // إنشاء أزرار بلوم
    createBloomButtons();
    
    // إضافة الأنماط
    addEditorStyles();
}

// إنشاء أزرار تصنيف بلوم
function createBloomButtons() {
    const container = document.getElementById('bloomButtons');
    if (!container) return;
    
    container.innerHTML = Object.entries(BLOOMS_TAXONOMY).map(([level, description]) => `
        <button type="button" class="bloom-btn" onclick="insertBloomLevel('${level}')" 
                title="${description}">
            <div style="font-weight: 600; margin-bottom: 4px;">${level}</div>
            <div style="font-size: 0.85em; color: #64748b;">${description}</div>
        </button>
    `).join('');
}

// إضافة أنماط CSS للمحرر
function addEditorStyles() {
    const styleId = 'textEditorStyles';
    if (document.getElementById(styleId)) return;
    
    const styles = `
        <style id="${styleId}">
            .editor-btn {
                padding: 8px 12px;
                border: 1px solid #cbd5e1;
                background: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .editor-btn:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
            }
            
            .editor-btn:active {
                background: #e2e8f0;
                transform: scale(0.95);
            }
            
            .bloom-btn {
                padding: 12px;
                border: 2px solid #dbeafe;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                text-align: right;
                transition: all 0.2s;
            }
            
            .bloom-btn:hover {
                background: #dbeafe;
                border-color: #3b82f6;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
            }
            
            #editorContent:focus {
                outline: none;
                border-color: #3b82f6;
            }
            
            #editorContent[contenteditable]:empty:before {
                content: attr(placeholder);
                color: #94a3b8;
                font-style: italic;
            }
            
            #editorContent ul, #editorContent ol {
                margin: 10px 0;
                padding-right: 25px;
            }
            
            #editorContent li {
                margin: 5px 0;
            }
            
            #editorContent strong {
                font-weight: 700;
                color: #1e293b;
            }
            
            #editorContent em {
                font-style: italic;
                color: #475569;
            }
            
            #editorContent u {
                text-decoration: underline;
            }
            
            /* أنماط عرض النص المنسق في الجدول */
            .formatted-text {
                white-space: pre-wrap;
                line-height: 1.5;
            }
            
            .formatted-text strong,
            .formatted-text b {
                font-weight: 700;
                color: #1e293b;
            }
            
            .formatted-text em,
            .formatted-text i {
                font-style: italic;
            }
            
            .formatted-text u {
                text-decoration: underline;
            }
            
            .formatted-text ul,
            .formatted-text ol {
                margin: 5px 0;
                padding-right: 20px;
            }
            
            .formatted-text li {
                margin: 3px 0;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// تنظيف HTML مع الحفاظ على التنسيق الأساسي
function cleanHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // إزالة العناصر غير المرغوبة
    temp.querySelectorAll('script, style, iframe').forEach(el => el.remove());
    
    // تنظيف السمات غير الضرورية
    temp.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (!['class', 'style'].includes(attr.name)) {
                el.removeAttribute(attr.name);
            }
        });
    });
    
    return temp.innerHTML.trim();
}

// فتح محرر النص
function openTextEditor(element, fieldType) {
    if (!document.getElementById('textEditorModal')) {
        createEditorModal();
    }
    
    currentEditingElement = element;
    currentFieldType = fieldType;
    
    const modal = document.getElementById('textEditorModal');
    const editorContent = document.getElementById('editorContent');
    const editorTitle = document.getElementById('editorTitle');
    const bloomHelper = document.getElementById('bloomHelper');
    
    // تحديد عنوان المحرر
    const titles = {
        'resources': 'تحرير الموارد',
        'teacherRole': 'تحرير دور المعلم',
        'studentRole': 'تحرير دور المتعلم',
        'evaluation': 'تحرير التقويم المرحلي',
        'bloomLevel': 'تحرير مستوى بلوم'
    };
    
    editorTitle.textContent = titles[fieldType] || 'محرر النص';
    
    // إظهار مساعد بلوم فقط لحقل بلوم
    bloomHelper.style.display = fieldType === 'bloomLevel' ? 'block' : 'none';
    
    // تحميل المحتوى الحالي
    const currentValue = element.value || '';
    editorContent.innerHTML = currentValue;
    
    modal.style.display = 'block';
    editorContent.focus();
}

// تنسيق النص
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('editorContent').focus();
}

// إدراج قائمة
function insertList(type) {
    const listCommand = type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList';
    document.execCommand(listCommand, false, null);
    document.getElementById('editorContent').focus();
}

// مسح التنسيق
function clearFormatting() {
    const editorContent = document.getElementById('editorContent');
    const text = editorContent.innerText;
    editorContent.innerHTML = text.replace(/\n/g, '<br>');
    editorContent.focus();
}

// إدراج مستوى بلوم
function insertBloomLevel(level) {
    const editorContent = document.getElementById('editorContent');
    const description = BLOOMS_TAXONOMY[level];
    editorContent.innerHTML = `<strong>${level}</strong>: ${description}`;
    editorContent.focus();
}

// حفظ محتوى المحرر
function saveEditorContent() {
    if (!currentEditingElement) return;
    
    const editorContent = document.getElementById('editorContent');
    
    // حفظ HTML المنظف
    const cleanedHTML = cleanHTML(editorContent.innerHTML);
    currentEditingElement.value = cleanedHTML;
    
    // تحديث العرض في الحقل
    updateFieldDisplay(currentEditingElement);
    
    closeTextEditor();
}

// تحديث عرض الحقل بالتنسيق
function updateFieldDisplay(element) {
    if (element.tagName === 'TEXTAREA') {
        // إخفاء textarea وإظهار div منسق
        const displayDiv = element.nextElementSibling;
        if (displayDiv && displayDiv.classList.contains('formatted-display')) {
            displayDiv.innerHTML = element.value || '';
        } else {
            // إنشاء div للعرض
            const newDiv = document.createElement('div');
            newDiv.className = 'formatted-display formatted-text';
            newDiv.innerHTML = element.value || '';
            newDiv.style.cssText = 'min-height: 50px; padding: 8px; cursor: pointer;';
            
            element.style.display = 'none';
            element.parentNode.insertBefore(newDiv, element.nextSibling);
            
            // عند النقر على div، فتح المحرر
            newDiv.onclick = () => {
                openTextEditor(element, element.dataset.field);
            };
        }
    } else if (element.tagName === 'INPUT') {
        // للحقول النصية، عرض النص المنسق
        const displaySpan = element.nextElementSibling;
        if (displaySpan && displaySpan.classList.contains('formatted-display')) {
            displaySpan.innerHTML = element.value || '';
        } else {
            const newSpan = document.createElement('span');
            newSpan.className = 'formatted-display formatted-text';
            newSpan.innerHTML = element.value || '';
            newSpan.style.cssText = 'display: inline-block; cursor: pointer;';
            
            element.style.display = 'none';
            element.parentNode.insertBefore(newSpan, element.nextSibling);
            
            newSpan.onclick = () => {
                openTextEditor(element, element.dataset.field);
            };
        }
    }
}

// إغلاق محرر النص
function closeTextEditor() {
    const modal = document.getElementById('textEditorModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingElement = null;
    currentFieldType = null;
}

// تعديل الجدول لإضافة أيقونة المحرر
function enhanceTableInputs() {
    const table = document.getElementById('lessonTable');
    if (!table) return;
    
    // إضافة أيقونات المحرر للحقول المحددة
    const observer = new MutationObserver(() => {
        addEditorIcons();
    });
    
    observer.observe(table, { childList: true, subtree: true });
    addEditorIcons();
}

// إضافة أيقونات المحرر
function addEditorIcons() {
    const fields = ['resources', 'teacherRole', 'studentRole', 'evaluation', 'bloomLevel'];
    
    fields.forEach(field => {
        const elements = document.querySelectorAll(`[data-field="${field}"]`);
        elements.forEach(element => {
            if (element.dataset.editorEnhanced) return;
            
            element.dataset.editorEnhanced = 'true';
            const parent = element.parentElement;
            
            if (!parent.querySelector('.editor-icon')) {
                const icon = document.createElement('button');
                icon.type = 'button';
                icon.className = 'editor-icon';
                icon.innerHTML = '✏️';
                icon.title = 'فتح المحرر المتقدم';
                icon.style.cssText = `
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                    z-index: 10;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                `;
                
                icon.onmouseover = () => icon.style.opacity = '1';
                icon.onmouseout = () => icon.style.opacity = '0.7';
                icon.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openTextEditor(element, field);
                };
                
                parent.style.position = 'relative';
                parent.appendChild(icon);
            }
        });
    });
}

// تهيئة المحرر عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        enhanceTableInputs();
    });
} else {
    enhanceTableInputs();
}

// إغلاق النافذة عند النقر خارجها
window.addEventListener('click', (event) => {
    const modal = document.getElementById('textEditorModal');
    if (event.target === modal) {
        closeTextEditor();
    }
});
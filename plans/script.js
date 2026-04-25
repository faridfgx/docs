
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global variables
let currentEditId = null;
let currentUserFingerprint = null;
let lockCheckInterval = null;
let currentPlanForPrint = null;
let aiButtonUsed = false;

// Helper functions
function getUserFingerprint() {
    if (currentUserFingerprint) return currentUserFingerprint;
    
    const nav = navigator;
    const screen = window.screen;
    const fingerprint = `${nav.userAgent}-${nav.language}-${screen.width}x${screen.height}`;
    currentUserFingerprint = btoa(fingerprint).substring(0, 32);
    return currentUserFingerprint;
}

async function supabaseRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);
    return await response.json();
}

async function acquireLock(planId) {
    const userFingerprint = getUserFingerprint();
    const lockExpiry = new Date(Date.now() + LOCK_DURATION).toISOString();
    
    console.log('Attempting to acquire lock for plan:', planId, 'by user:', userFingerprint);
    
    try {
        const currentLockStatus = await checkLockStatus(planId);
        
        if (currentLockStatus.isLocked && !currentLockStatus.isLockedByCurrentUser) {
            console.log('Lock already held by another user');
            return false;
        }
        
        const result = await supabaseRequest(
            `course_plans?id=eq.${planId}`,
            'PATCH',
            {
                locked_by: userFingerprint,
                locked_at: new Date().toISOString(),
                lock_expires_at: lockExpiry
            }
        );
        
        console.log('Lock acquisition result:', result);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        const verifyLock = await supabaseRequest(`course_plans?id=eq.${planId}&select=locked_by`);
        
        if (verifyLock && verifyLock.length > 0) {
            const acquired = verifyLock[0].locked_by === userFingerprint;
            console.log('Lock verification:', acquired ? 'SUCCESS' : 'FAILED');
            return acquired;
        }
        return false;
    } catch (error) {
        console.error('Error acquiring lock:', error);
        return false;
    }
}

async function releaseLock(planId) {
    try {
        await supabaseRequest(
            `course_plans?id=eq.${planId}`,
            'PATCH',
            {
                locked_by: null,
                locked_at: null,
                lock_expires_at: null
            }
        );
    } catch (error) {
        console.error('Error releasing lock:', error);
    }
}

async function checkLockStatus(planId) {
    try {
        const plan = await supabaseRequest(`course_plans?id=eq.${planId}&select=locked_by,locked_at,lock_expires_at`);
        
        console.log('Lock status check for plan:', planId, plan);
        
        if (plan && plan.length > 0) {
            const lockData = plan[0];
            
            if (lockData.locked_by && lockData.lock_expires_at) {
                const lockExpiry = new Date(lockData.lock_expires_at);
                const now = new Date();
                
                console.log('Lock expiry:', lockExpiry, 'Now:', now);
                
                if (lockExpiry > now) {
                    const isLockedByCurrentUser = lockData.locked_by === getUserFingerprint();
                    console.log('Lock is active. Locked by current user?', isLockedByCurrentUser);
                    return {
                        isLocked: true,
                        lockedBy: lockData.locked_by,
                        isLockedByCurrentUser: isLockedByCurrentUser
                    };
                } else {
                    console.log('Lock has expired, releasing...');
                    await releaseLock(planId);
                }
            }
        }
        return { isLocked: false };
    } catch (error) {
        console.error('Error checking lock status:', error);
        return { isLocked: false };
    }
}

function startLockMonitoring(planId) {
    if (lockCheckInterval) {
        clearInterval(lockCheckInterval);
    }
    
    lockCheckInterval = setInterval(async () => {
        const lockStatus = await checkLockStatus(planId);
        if (lockStatus.isLocked && !lockStatus.isLockedByCurrentUser) {
            clearInterval(lockCheckInterval);
            showToast("تم قفل هذه المذكرة من قبل مستخدم آخر. سيتم إغلاق النموذج.");
            closeCreateModal();
        }
    }, 30000);
}

function stopLockMonitoring() {
    if (lockCheckInterval) {
        clearInterval(lockCheckInterval);
        lockCheckInterval = null;
    }
}

function updateUnits() {
    const area = document.getElementById('area').value;
    const unitSelect = document.getElementById('unit');
    
    unitSelect.innerHTML = '<option value="">اختر الوحدة</option>';
    
    if (area && AREAS_UNITS[area]) {
        AREAS_UNITS[area].forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            unitSelect.appendChild(option);
        });
    }
    
    document.getElementById('objectives').value = '';
    document.getElementById('competency').value = '';
    updateAIButtonState();
}

function autoFillCurriculumData() {
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    
    if (area && unit) {
        const data = getCurriculumData(area, unit);
        
        if (data) {
            document.getElementById('competency').value = data.competency;
            document.getElementById('objectives').value = data.objectives;
            
            const competencyField = document.getElementById('competency');
            const objectivesField = document.getElementById('objectives');
            
            competencyField.style.backgroundColor = '#d1fae5';
            objectivesField.style.backgroundColor = '#d1fae5';
            
            setTimeout(() => {
                competencyField.style.backgroundColor = '';
                objectivesField.style.backgroundColor = '';
            }, 1000);
        } else {
            document.getElementById('objectives').value = '';
            document.getElementById('competency').value = '';
        }
    }
    updateAIButtonState();
}

function showCreateModal() {
    currentEditId = null;
    aiButtonUsed = false;
    document.querySelector('#createModal h2').textContent = 'إنشاء مذكرة درس جديدة';
    document.getElementById('createModal').style.display = 'block';
    setTimeout(updateAIButtonState, 100);
}

function closeCreateModal() {
    if (currentEditId) {
        releaseLock(currentEditId);
    }
    
    stopLockMonitoring();
    document.getElementById('createModal').style.display = 'none';
    currentEditId = null;
    resetForm();
}

async function showEditModal(plan) {
    const lockStatus = await checkLockStatus(plan.id);
    
    if (lockStatus.isLocked && !lockStatus.isLockedByCurrentUser) {
        showToast("هذه المذكرة قيد التعديل حالياً من قبل مستخدم آخر. يرجى المحاولة لاحقاً.");
        return;
    }
    
    const lockAcquired = await acquireLock(plan.id);
    
    if (!lockAcquired) {
        showToast("لم نتمكن من قفل المذكرة للتعديل. يرجى المحاولة مرة أخرى.");
        return;
    }
    
    currentEditId = plan.id;
    aiButtonUsed = true;
    document.querySelector('#createModal h2').textContent = 'تعديل مذكرة الدرس';
    
    const lockIndicator = document.createElement('div');
    lockIndicator.id = 'lockIndicator';
    lockIndicator.style.cssText = 'background: #10b981; color: white; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 600;';
    lockIndicator.textContent = '🔒 أنت تقوم بتعديل هذه المذكرة الآن';
    
    const modalContent = document.querySelector('#createModal .modal-content');
    const existingIndicator = document.getElementById('lockIndicator');
    if (existingIndicator) existingIndicator.remove();
    modalContent.insertBefore(lockIndicator, modalContent.children[1]);
    
    document.getElementById('area').value = plan.area;
    updateUnits();
    document.getElementById('unit').value = plan.unit;
    document.getElementById('lessonName').value = plan.lesson_name;
    document.getElementById('objectives').value = plan.learning_objectives || '';
    document.getElementById('competency').value = plan.target_competency || '';
    document.getElementById('usedResources').value = plan.used_resources || '';
    document.getElementById('lessonDuration').value = plan.lesson_duration || '';
    document.getElementById('usedStrategies').value = plan.used_strategies || '';
    document.querySelector(`input[name="classType"][value="${plan.class_type}"]`).checked = true;
    document.querySelector(`input[name="planType"][value="${plan.plan_type}"]`).checked = true;
    
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (plan.table_data && plan.table_data.length > 0) {
plan.table_data.forEach(row => {
    const tr = document.createElement('tr');

    const fields = [
        { tag: 'input',    field: 'situation',   value: row.situation   || '' },
        { tag: 'textarea', field: 'resources',   value: row.resources   || '' },
        { tag: 'textarea', field: 'teacherRole', value: row.teacherRole || '' },
        { tag: 'textarea', field: 'studentRole', value: row.studentRole || '' },
        { tag: 'input',    field: 'bloomLevel',  value: row.bloomLevel  || '' },
        { tag: 'textarea', field: 'evaluation',  value: row.evaluation  || '' },
        { tag: 'input',    field: 'duration',    value: row.duration    || '', placeholder: 'مثال: 10' },
    ];

    fields.forEach(f => {
        const td = document.createElement('td');
        const el = document.createElement(f.tag);
        el.dataset.field = f.field;
        el.value = f.value;
        if (f.placeholder) el.placeholder = f.placeholder;
        td.appendChild(el);
        tr.appendChild(td);
    });

    const deleteTd = document.createElement('td');
    deleteTd.style.textAlign = 'center';
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-danger';
    delBtn.textContent = '✕';
    delBtn.onclick = () => removeTableRow(delBtn);
    deleteTd.appendChild(delBtn);
    tr.appendChild(deleteTd);

    tbody.appendChild(tr);
});
    } else {
        addTableRow();
    }
    
    updateDeleteButtons();
    document.getElementById('createModal').style.display = 'block';
    startLockMonitoring(plan.id);
    updateAIButtonState();
}

function showDetailModal(plan) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    checkLockStatus(plan.id).then(lockStatus => {
        let lockWarning = '';
        let editButtonDisabled = '';
        
        if (lockStatus.isLocked && !lockStatus.isLockedByCurrentUser) {
            lockWarning = `
                <div style="background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                    ⚠️ هذه المذكرة قيد التعديل حالياً من قبل مستخدم آخر
                </div>
            `;
            editButtonDisabled = 'disabled style="opacity: 0.5; cursor: not-allowed;"';
        }
        
        let tableRows = '';
        if (plan.table_data) {
            plan.table_data.forEach(row => {
                tableRows += `
                    <tr>
                        <td style="font-weight: bold;">${row.situation || ''}</td>
                        <td>${row.resources || ''}</td>
                        <td>${row.teacherRole || ''}</td>
                        <td>${row.studentRole || ''}</td>
                        <td>${row.bloomLevel || ''}</td>
                        <td>${row.evaluation || ''}</td>
                        <td style="text-align: center;">${row.duration || ''}</td>
                    </tr>
                `;
            });
        }

        content.innerHTML = `
            <h2 style="margin-bottom: 20px; color: #333;">${plan.lesson_name}</h2>
            
            ${lockWarning}
            
            <div style="margin-bottom: 20px; display: flex; gap: 10px;">
                <button class="btn" onclick='editPlan(${JSON.stringify(plan).replace(/'/g, "&apos;")})' ${editButtonDisabled}>✏️ تعديل المذكرة</button>
                <button class="btn btn-secondary" onclick='showPrintModal(${JSON.stringify(plan).replace(/'/g, "&apos;")})'>🖨️ طباعة المذكرة</button>
            </div>
            
            <div class="detail-section">
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>المجال التعليمي</strong>
                        ${plan.area}
                    </div>
                    <div class="detail-item">
                        <strong>الوحدة التعليمية</strong>
                        ${plan.unit}
                    </div>
                    <div class="detail-item">
                        <strong>الشعبة</strong>
                        ${plan.class_type}
                    </div>
                    <div class="detail-item">
                        <strong>نوع المذكرة</strong>
                        ${plan.plan_type}
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-grid">
                    ${plan.used_resources ? `
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <strong>الوسائل المستخدمة</strong>
                        ${plan.used_resources}
                    </div>
                    ` : ''}
                    ${plan.lesson_duration ? `
                    <div class="detail-item">
                        <strong>المدة</strong>
                        ${plan.lesson_duration}
                    </div>
                    ` : ''}
                    ${plan.used_strategies ? `
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <strong>الاستراتيجيات المستعملة</strong>
                        ${plan.used_strategies}
                    </div>
                    ` : ''}
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <strong>الأهداف التعلمية</strong>
                        ${plan.learning_objectives || 'غير محدد'}
                    </div>
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <strong>الكفاءة المستهدفة</strong>
                        ${plan.target_competency || 'غير محدد'}
                    </div>
                </div>
            </div>

            <h3 style="margin: 20px 0; color: #333;">السير المنهجي للدرس</h3>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">الوضعيات التعليمية</th>
                            <th colspan="3">السير المنهجي للدرس</th>
                            <th rowspan="2">مستوى بلوم/<br>المهارة المستهدفة</th>
                            <th rowspan="2">التقويم المرحلي</th>
                            <th rowspan="2">المدة<br>(دقيقة)</th>
                        </tr>
                        <tr>
                            <th>الموارد</th>
                            <th>دور المعلم</th>
                            <th>دور المتعلم</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    });
    
    modal.style.display = 'block';
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function showPrintModal(plan) {
    currentPlanForPrint = JSON.parse(JSON.stringify(plan));
    document.getElementById('printInfoModal').style.display = 'block';
}

function closePrintInfoModal() {
    document.getElementById('printInfoModal').style.display = 'none';
    document.getElementById('teacherName').value = '';
    document.getElementById('schoolName').value = '';
    currentPlanForPrint = null;
}



function addTableRow() {
    const tbody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" data-field="situation"></td>
        <td><textarea data-field="resources"></textarea></td>
        <td><textarea data-field="teacherRole"></textarea></td>
        <td><textarea data-field="studentRole"></textarea></td>
        <td><input type="text" data-field="bloomLevel"></td>
        <td><textarea data-field="evaluation"></textarea></td>
        <td><input type="text" data-field="duration" placeholder="مثال: 10"></td>
        <td style="text-align: center;">
            <button class="btn-danger" onclick="removeTableRow(this)">✕</button>
        </td>
    `;
    tbody.appendChild(row);
    updateDeleteButtons();
}

function removeTableRow(btn) {
    btn.closest('tr').remove();
    updateDeleteButtons();
}

function updateDeleteButtons() {
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach((row, index) => {
        const deleteBtn = row.querySelector('.btn-danger');
        deleteBtn.disabled = rows.length === 1;
    });
}

function resetForm() {
    document.getElementById('area').value = '';
    document.getElementById('unit').innerHTML = '<option value="">اختر المجال أولاً</option>';
    document.getElementById('lessonName').value = '';
    document.getElementById('objectives').value = '';
    document.getElementById('competency').value = '';
    document.getElementById('usedResources').value = '';
    document.getElementById('lessonDuration').value = '';
    document.getElementById('usedStrategies').value = '';
    document.querySelector('input[name="classType"][value="ج م ع ت"]').checked = true;
    document.querySelector('input[name="planType"][value="تطبيقية"]').checked = true;
    
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `
        <tr>
            <td><input type="text" value="وضعية الانطلاق" data-field="situation"></td>
            <td><textarea data-field="resources"></textarea></td>
            <td><textarea data-field="teacherRole"></textarea></td>
            <td><textarea data-field="studentRole"></textarea></td>
            <td><input type="text" data-field="bloomLevel"></td>
            <td><textarea data-field="evaluation"></textarea></td>
            <td><input type="text" data-field="duration" placeholder="مثال: 10"></td>
            <td style="text-align: center;">
                <button class="btn-danger" onclick="removeTableRow(this)" disabled>✕</button>
            </td>
        </tr>
    `;
}

async function saveCoursePlan() {
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    const lessonName = document.getElementById('lessonName').value.trim();
    const objectives = document.getElementById('objectives').value;
    const competency = document.getElementById('competency').value;
    const usedResources = document.getElementById('usedResources').value;
    const lessonDuration = document.getElementById('lessonDuration').value;
    const usedStrategies = document.getElementById('usedStrategies').value;
    const classType = document.querySelector('input[name="classType"]:checked').value;
    const planType = document.querySelector('input[name="planType"]:checked').value;

    if (!area || !unit || !lessonName) {
        showToast("الرجاء إدخال جميع البيانات المطلوبة (المجال، الوحدة، عنوان الدرس)");
        return;
    }

    if (currentEditId) {
        const lockStatus = await checkLockStatus(currentEditId);
        if (lockStatus.isLocked && !lockStatus.isLockedByCurrentUser) {
            showToast("لقد فقدت القفل على هذه المذكرة. تم تعديلها من قبل مستخدم آخر.");
            closeCreateModal();
            return;
        }
    }

    const rows = document.querySelectorAll('#tableBody tr');
    const tableData = [];
    rows.forEach(row => {
        const data = {};
        row.querySelectorAll('[data-field]').forEach(input => {
            data[input.dataset.field] = input.value;
        });
        tableData.push(data);
    });

    const coursePlan = {
        area,
        unit,
        class_type: classType,
        plan_type: planType,
        lesson_name: lessonName,
        learning_objectives: objectives,
        target_competency: competency,
        used_resources: usedResources,
        lesson_duration: lessonDuration,
        used_strategies: usedStrategies,
        table_data: tableData,
        created_by: getUserFingerprint()
    };

    try {
        if (currentEditId) {
            await supabaseRequest(`course_plans?id=eq.${currentEditId}`, 'PATCH', {
                ...coursePlan,
                locked_by: null,
                locked_at: null,
                lock_expires_at: null
            });
            showToast("تم تحديث المذكرة بنجاح!");
        } else {
            await supabaseRequest('course_plans', 'POST', [coursePlan]);
            showToast("تم حفظ المذكرة بنجاح!");
        }
        closeCreateModal();
        closeDetailModal();
        loadCoursePlans();
    } catch (error) {
        console.error('Error saving plan:', error);
        showToast("حدث خطأ أثناء الحفظ");
    }
}

function editPlan(plan) {
    closeDetailModal();
    showEditModal(plan);
}

async function deletePlan(planId) {
    if (!confirm('هل أنت متأكد من حذف هذه المذكرة؟ لا يمكن التراجع عن هذا الإجراء.')) {
        return;
    }

    try {
        await supabaseRequest(`course_plans?id=eq.${planId}`, 'DELETE');
        showToast("تم حذف المذكرة بنجاح!");
        closeDetailModal();
        loadCoursePlans();
    } catch (error) {
        console.error('Error deleting plan:', error);
        showToast("حدث خطأ أثناء الحذف");
    }
}

async function loadCoursePlans(filterArea = '') {
    try {
        let endpoint = 'course_plans?order=created_at.desc';
        
        if (filterArea) {
            endpoint = `course_plans?area=eq.${encodeURIComponent(filterArea)}&order=created_at.desc`;
        }
        
        const data = await supabaseRequest(endpoint);
        
        const container = document.getElementById('plansContainer');
        const emptyState = document.getElementById('emptyState');
        const loading = document.getElementById('loading');

        loading.style.display = 'none';

        if (data && data.length > 0) {
            container.style.display = 'grid';
            emptyState.style.display = 'none';
            
            container.innerHTML = data.map(plan => `
                <div class="plan-card" onclick='showDetailModal(${JSON.stringify(plan).replace(/'/g, "&apos;")})'>
                    <div class="plan-header ${plan.plan_type === 'تطبيقية' ? 'practical' : ''}">
                        <h3>${plan.lesson_name}</h3>
                        <div class="plan-badges">
                            <span class="badge">${plan.plan_type}</span>
                            <span class="badge">${plan.class_type}</span>
                        </div>
                    </div>
                    <div class="plan-body">
                        <div class="plan-info">
                            <p><strong>المجال:</strong> ${plan.area}</p>
                            <p><strong>الوحدة:</strong> ${plan.unit}</p>
                            <p style="font-size: 0.8em; color: #999; margin-top: 10px;">
                                ${new Date(plan.created_at).toLocaleDateString('en-GB')}
                            </p>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            if (filterArea) {
                document.querySelector('#emptyState h2').textContent = 'لا توجد مذكرات في هذا المجال';
                document.querySelector('#emptyState p').textContent = 'جرب تصفية مجال آخر أو أنشئ مذكرة جديدة';
            } else {
                document.querySelector('#emptyState h2').textContent = 'لا توجد مذكرات بعد';
                document.querySelector('#emptyState p').textContent = 'ابدأ بإنشاء مذكرتك الأولى!';
            }
        }
    } catch (error) {
        console.error('Error loading plans:', error);
        document.getElementById('loading').textContent = 'حدث خطأ في التحميل';
    }
}

window.onclick = function(event) {
    const createModal = document.getElementById('createModal');
    const detailModal = document.getElementById('detailModal');
    const printInfoModal = document.getElementById('printInfoModal');
    
    if (event.target === createModal) {
        closeCreateModal();
    }
    if (event.target === detailModal) {
        closeDetailModal();
    }
    if (event.target === printInfoModal) {
        closePrintInfoModal();
    }
};

function filterByArea() {
    const selectedArea = document.getElementById('areaFilter').value;
    loadCoursePlans(selectedArea);
}

// ==================== AI GENERATION FUNCTIONS ====================

function updateAIButtonState() {
    const aiButton = document.getElementById('generateWithAI');
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    
    if (aiButton) {
        aiButton.disabled = aiButtonUsed || !area || !unit;
        
        if (aiButtonUsed) {
            aiButton.textContent = '✓  تم اضافة النص من قبل المساعد الذكي';
            aiButton.style.background = '#10b981';
        } else if (!area || !unit) {
            aiButton.textContent = '✓ حدد المجال والوحدة ونوع المذكرة اولا';
            aiButton.style.background = '#6b7280';
        } else {
            aiButton.textContent = '  انشاء بواسطة المساعد الذكي';
            aiButton.style.background = '#8b5cf6';
        }
    }
}

async function generateLessonPlanWithAI() {
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    
    if (!area || !unit) {
        showToast("الرجاء اختيار المجال والوحدة أولاً");
        return;
    }
    
    if (aiButtonUsed) {
        showToast("تم استخدام المساعد الذكي مسبقا لهاته المذكرة");
        return;
    }
    
    const curriculumData = getCurriculumData(area, unit);
    
    if (!curriculumData) {
        showToast("لا توجد بيانات متاحة لهذه الوحدة");
        return;
    }
    
    const promptText = customPromptText || buildPromptText(area, unit, curriculumData);
    await executeAIGeneration(promptText);
}

function updateAIButton() {
    const aiButton = document.getElementById('generateWithAI');
    if (aiButton && !aiButtonUsed) {
        aiButton.innerHTML = '🤖 اقتراح المحتوى بواسطة المساعد الذكي';
        
        // Add edit button next to AI button
        if (!document.getElementById('editPromptBtn')) {
            const editBtn = document.createElement('button');
            editBtn.id = 'editPromptBtn';
            editBtn.className = 'btn-secondary';
            editBtn.innerHTML = '✏️ تعديل النص';
            editBtn.onclick = openPromptEditor;
            editBtn.style.marginRight = '10px';
            aiButton.parentElement.insertBefore(editBtn, aiButton);
        }
    }
}

// Initialize on page load
loadCoursePlans();

// Configuration
const SUPABASE_URL = 'https://brtylfnzrcljicppargr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydHlsZm56cmNsamljcHBhcmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjU2OTMsImV4cCI6MjA3NzMwMTY5M30.cUFqyzyOlrJuM_CxdQcokXfj5-5NUnLorIriEHWDl2I';

let currentEditId = null;
let currentUserFingerprint = null;
let lockCheckInterval = null;

const LOCK_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

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
    
    console.log('Attempting to acquire lock for plan:', planId, 'by user:', userFingerprint); // Debug log
    
    try {
        // First check current lock status
        const currentLockStatus = await checkLockStatus(planId);
        
        if (currentLockStatus.isLocked && !currentLockStatus.isLockedByCurrentUser) {
            console.log('Lock already held by another user'); // Debug log
            return false;
        }
        
        // Try to acquire lock
        const result = await supabaseRequest(
            `course_plans?id=eq.${planId}`,
            'PATCH',
            {
                locked_by: userFingerprint,
                locked_at: new Date().toISOString(),
                lock_expires_at: lockExpiry
            }
        );
        
        console.log('Lock acquisition result:', result); // Debug log
        
        // Verify lock was acquired
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure DB update
        const verifyLock = await supabaseRequest(`course_plans?id=eq.${planId}&select=locked_by`);
        
        if (verifyLock && verifyLock.length > 0) {
            const acquired = verifyLock[0].locked_by === userFingerprint;
            console.log('Lock verification:', acquired ? 'SUCCESS' : 'FAILED'); // Debug log
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
        
        console.log('Lock status check for plan:', planId, plan); // Debug log
        
        if (plan && plan.length > 0) {
            const lockData = plan[0];
            
            // Check if lock exists and hasn't expired
            if (lockData.locked_by && lockData.lock_expires_at) {
                const lockExpiry = new Date(lockData.lock_expires_at);
                const now = new Date();
                
                console.log('Lock expiry:', lockExpiry, 'Now:', now); // Debug log
                
                if (lockExpiry > now) {
                    const isLockedByCurrentUser = lockData.locked_by === getUserFingerprint();
                    console.log('Lock is active. Locked by current user?', isLockedByCurrentUser); // Debug log
                    return {
                        isLocked: true,
                        lockedBy: lockData.locked_by,
                        isLockedByCurrentUser: isLockedByCurrentUser
                    };
                } else {
                    // Lock has expired, release it
                    console.log('Lock has expired, releasing...'); // Debug log
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
    // Clear any existing interval
    if (lockCheckInterval) {
        clearInterval(lockCheckInterval);
    }
    
    // Check lock status every 30 seconds
    lockCheckInterval = setInterval(async () => {
        const lockStatus = await checkLockStatus(planId);
        if (lockStatus.isLocked && !lockStatus.isLockedByCurrentUser) {
            clearInterval(lockCheckInterval);
            alert('تم قفل هذه المذكرة من قبل مستخدم آخر. سيتم إغلاق النموذج.');
            closeCreateModal();
        }
    }, 30000); // Check every 30 seconds
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
    
    // Clear objectives and competency when area changes
    document.getElementById('objectives').value = '';
    document.getElementById('competency').value = '';
}

function autoFillCurriculumData() {
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    
    if (area && unit) {
        const data = getCurriculumData(area, unit);
        
        if (data) {
            // Auto-fill the fields
            document.getElementById('competency').value = data.competency;
            document.getElementById('objectives').value = data.objectives;
            
            // Visual feedback
            const competencyField = document.getElementById('competency');
            const objectivesField = document.getElementById('objectives');
            
            competencyField.style.backgroundColor = '#d1fae5';
            objectivesField.style.backgroundColor = '#d1fae5';
            
            setTimeout(() => {
                competencyField.style.backgroundColor = '';
                objectivesField.style.backgroundColor = '';
            }, 1000);
        } else {
            // Clear if no data found
            document.getElementById('objectives').value = '';
            document.getElementById('competency').value = '';
        }
    }
}

function showCreateModal() {
    currentEditId = null;
    document.querySelector('#createModal h2').textContent = 'إنشاء مذكرة درس جديدة';
    document.getElementById('createModal').style.display = 'block';
}

function closeCreateModal() {
    // Release lock if editing
    if (currentEditId) {
        releaseLock(currentEditId);
    }
    
    stopLockMonitoring();
    document.getElementById('createModal').style.display = 'none';
    currentEditId = null;
    resetForm();
}

async function showEditModal(plan) {
    // Check if the lesson is locked
    const lockStatus = await checkLockStatus(plan.id);
    
    if (lockStatus.isLocked && !lockStatus.isLockedByCurrentUser) {
        alert('هذه المذكرة قيد التعديل حالياً من قبل مستخدم آخر. يرجى المحاولة لاحقاً.');
        return;
    }
    
    // Try to acquire lock
    const lockAcquired = await acquireLock(plan.id);
    
    if (!lockAcquired) {
        alert('لم نتمكن من قفل المذكرة للتعديل. يرجى المحاولة مرة أخرى.');
        return;
    }
    
    currentEditId = plan.id;
    document.querySelector('#createModal h2').textContent = 'تعديل مذكرة الدرس';
    
    // Add lock indicator
    const lockIndicator = document.createElement('div');
    lockIndicator.id = 'lockIndicator';
    lockIndicator.style.cssText = 'background: #10b981; color: white; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 600;';
    lockIndicator.textContent = '🔒 أنت تقوم بتعديل هذه المذكرة الآن';
    
    const modalContent = document.querySelector('#createModal .modal-content');
    const existingIndicator = document.getElementById('lockIndicator');
    if (existingIndicator) existingIndicator.remove();
    modalContent.insertBefore(lockIndicator, modalContent.children[1]);
    
    // Fill form with existing data
    document.getElementById('area').value = plan.area;
    updateUnits();
    document.getElementById('unit').value = plan.unit;
    document.getElementById('lessonName').value = plan.lesson_name;
    document.getElementById('objectives').value = plan.learning_objectives || '';
    document.getElementById('competency').value = plan.target_competency || '';
    document.querySelector(`input[name="classType"][value="${plan.class_type}"]`).checked = true;
    document.querySelector(`input[name="planType"][value="${plan.plan_type}"]`).checked = true;
    
    // Fill table data
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (plan.table_data && plan.table_data.length > 0) {
        plan.table_data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" value="${row.situation || ''}" data-field="situation"></td>
                <td><textarea data-field="resources">${row.resources || ''}</textarea></td>
                <td><textarea data-field="teacherRole">${row.teacherRole || ''}</textarea></td>
                <td><textarea data-field="studentRole">${row.studentRole || ''}</textarea></td>
                <td><input type="text" value="${row.bloomLevel || ''}" data-field="bloomLevel"></td>
                <td><textarea data-field="evaluation">${row.evaluation || ''}</textarea></td>
                <td><input type="text" value="${row.duration || ''}" data-field="duration" placeholder="مثال: 10"></td>
                <td style="text-align: center;">
                    <button class="btn-danger" onclick="removeTableRow(this)">✕</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        addTableRow();
    }
    
    updateDeleteButtons();
    document.getElementById('createModal').style.display = 'block';
    
    // Start monitoring the lock
    startLockMonitoring(plan.id);
}

function showDetailModal(plan) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    // Check lock status for the edit button
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
				<button class="btn btn-secondary" onclick='printPlan(${JSON.stringify(plan).replace(/'/g, "&apos;")})'>🖨️ طباعة المذكرة</button>
                <!--<button class="btn btn-danger" onclick="deletePlan('${plan.id}')" style="margin-right: 10px;">🗑️ حذف المذكرة</button>-->
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
    const classType = document.querySelector('input[name="classType"]:checked').value;
    const planType = document.querySelector('input[name="planType"]:checked').value;

    if (!area || !unit || !lessonName) {
        alert('الرجاء إدخال جميع البيانات المطلوبة (المجال، الوحدة، عنوان الدرس)');
        return;
    }

    // If editing, verify we still have the lock
    if (currentEditId) {
        const lockStatus = await checkLockStatus(currentEditId);
        if (lockStatus.isLocked && !lockStatus.isLockedByCurrentUser) {
            alert('لقد فقدت القفل على هذه المذكرة. تم تعديلها من قبل مستخدم آخر.');
            closeCreateModal();
            return;
        }
    }

    // Collect table data
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
        table_data: tableData,
        created_by: getUserFingerprint()
    };

    try {
        if (currentEditId) {
            // Update existing plan and release lock
            await supabaseRequest(`course_plans?id=eq.${currentEditId}`, 'PATCH', {
                ...coursePlan,
                locked_by: null,
                locked_at: null,
                lock_expires_at: null
            });
            alert('تم تحديث المذكرة بنجاح!');
        } else {
            // Create new plan
            await supabaseRequest('course_plans', 'POST', [coursePlan]);
            alert('تم حفظ المذكرة بنجاح!');
        }
        closeCreateModal();
        closeDetailModal();
        loadCoursePlans();
    } catch (error) {
        console.error('Error saving plan:', error);
        alert('حدث خطأ أثناء الحفظ');
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
        alert('تم حذف المذكرة بنجاح!');
        closeDetailModal();
        loadCoursePlans();
    } catch (error) {
        console.error('Error deleting plan:', error);
        alert('حدث خطأ أثناء الحذف');
    }
}

async function loadCoursePlans(filterArea = '') {
    try {
        let endpoint = 'course_plans?order=created_at.desc';
        
        // Add filter if area is selected
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
// Close modals on outside click
window.onclick = function(event) {
    const createModal = document.getElementById('createModal');
    const detailModal = document.getElementById('detailModal');
    if (event.target === createModal) {
        closeCreateModal();
    }
    if (event.target === detailModal) {
        closeDetailModal();
    }
};
function filterByArea() {
    const selectedArea = document.getElementById('areaFilter').value;
    loadCoursePlans(selectedArea);
}

function printPlan(plan) {
    const printWindow = window.open('', '_blank');
    
    let tableRows = '';
    if (plan.table_data) {
        plan.table_data.forEach(row => {
            tableRows += `
                <tr>
                    <td style="font-weight: bold; padding: 10px; border: 1px solid #333;">${row.situation || ''}</td>
                    <td style="padding: 10px; border: 1px solid #333;">${row.resources || ''}</td>
                    <td style="padding: 10px; border: 1px solid #333;">${row.teacherRole || ''}</td>
                    <td style="padding: 10px; border: 1px solid #333;">${row.studentRole || ''}</td>
                    <td style="padding: 10px; border: 1px solid #333;">${row.bloomLevel || ''}</td>
                    <td style="padding: 10px; border: 1px solid #333;">${row.evaluation || ''}</td>
                    <td style="text-align: center; padding: 10px; border: 1px solid #333;">${row.duration || ''}</td>
                </tr>
            `;
        });
    }
    
    const printContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>طباعة - ${plan.lesson_name}</title>
            <style>
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #000;
                    padding: 20px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #000;
                    padding-bottom: 20px;
                }
                
                .header h1 {
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                
                .header h2 {
                    font-size: 18px;
                    font-weight: normal;
                    color: #333;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                    border: 2px solid #333;
                    padding: 15px;
                }
                
                .info-item {
                    display: flex;
                    align-items: baseline;
                }
                
                .info-item strong {
                    min-width: 150px;
                    font-weight: bold;
                }
                
                .section {
                    margin-bottom: 20px;
                    border: 1px solid #333;
                    padding: 15px;
                }
                
                .section h3 {
                    font-size: 16px;
                    margin-bottom: 10px;
                    color: #000;
                    border-bottom: 2px solid #333;
                    padding-bottom: 5px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    page-break-inside: auto;
                }
                
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                
                th {
                    background: #f0f0f0;
                    color: #000;
                    padding: 10px;
                    text-align: center;
                    font-weight: bold;
                    border: 2px solid #333;
                    font-size: 14px;
                }
                
                td {
                    padding: 10px;
                    border: 1px solid #333;
                    vertical-align: top;
                    font-size: 13px;
                }
                
                .print-button {
                    display: block;
                    margin: 20px auto;
                    padding: 10px 30px;
                    background: #4f46e5;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                }
                
                @media print {
                    .print-button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <button class="print-button" onclick="window.print()">🖨️ طباعة</button>
            
            <div class="header">
                <h1>مذكرة درس</h1>
                <h2>${plan.lesson_name}</h2>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <strong>المجال التعليمي:</strong>
                    <span>${plan.area}</span>
                </div>
                <div class="info-item">
                    <strong>الوحدة التعليمية:</strong>
                    <span>${plan.unit}</span>
                </div>
                <div class="info-item">
                    <strong>الشعبة:</strong>
                    <span>${plan.class_type}</span>
                </div>
                <div class="info-item">
                    <strong>نوع المذكرة:</strong>
                    <span>${plan.plan_type}</span>
                </div>
            </div>
            
            ${plan.learning_objectives ? `
                <div class="section">
                    <h3>الأهداف التعلمية</h3>
                    <p>${plan.learning_objectives}</p>
                </div>
            ` : ''}
            
            ${plan.target_competency ? `
                <div class="section">
                    <h3>الكفاءة المستهدفة</h3>
                    <p>${plan.target_competency}</p>
                </div>
            ` : ''}
            
            <div class="section">
                <h3>السير المنهجي للدرس</h3>
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
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}
loadCoursePlans();
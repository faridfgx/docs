// Print Utilities with Style Selection

function getAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed
    
    // إذا كان الشهر من سبتمبر إلى ديسمبر، السنة الدراسية تبدأ من السنة الحالية
    // إذا كان من يناير إلى أغسطس، السنة الدراسية بدأت من السنة الماضية
    if (month >= 8) {
        return `${year + 1}-${year}`;
    } else {
        return `${year}-${year - 1}`;
    }
}

function showStyleSelector(callback) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, sans-serif;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        width: 90%;
        direction: rtl;
        text-align: center;
    `;
    
    modal.innerHTML = `
        <h2 style="margin-bottom: 20px; color: #333;">اختر نمط الطباعة</h2>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <button class="style-btn" data-style="classic" style="
                padding: 15px 20px;
                font-size: 16px;
                border: 2px solid #4f46e5;
                background: white;
                color: #4f46e5;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <strong>كلاسيكي</strong>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">نمط تقليدي بسيط ومريح للعين</div>
            </button>
            
            <button class="style-btn" data-style="modern" style="
                padding: 15px 20px;
                font-size: 16px;
                border: 2px solid #10b981;
                background: white;
                color: #10b981;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <strong>عصري</strong>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">تصميم حديث مع ألوان متدرجة وظلال</div>
            </button>
            
            <button class="style-btn" data-style="formal" style="
                padding: 15px 20px;
                font-size: 16px;
                border: 2px solid #ef4444;
                background: white;
                color: #ef4444;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <strong>رسمي</strong>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">نمط رسمي بحدود سميكة ومظهر احترافي</div>
            </button>
            
            <button class="style-btn" data-style="colorful" style="
                padding: 15px 20px;
                font-size: 16px;
                border: 2px solid #f59e0b;
                background: white;
                color: #f59e0b;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            ">
                <strong>ملون</strong>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">تصميم نابض بالحياة والألوان</div>
            </button>
        </div>
        
        <button id="cancelBtn" style="
            margin-top: 20px;
            padding: 10px 30px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        ">إلغاء</button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add hover effects
    const styleButtons = modal.querySelectorAll('.style-btn');
    styleButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        });
        
        btn.addEventListener('click', () => {
            const style = btn.getAttribute('data-style');
            document.body.removeChild(overlay);
            callback(style);
        });
    });
    
    // Cancel button
    modal.querySelector('#cancelBtn').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

function printPlan(plan, teacherName, schoolName) {
    // التحقق من وجود البيانات
    if (!plan) {
        alert('خطأ: لا توجد بيانات للطباعة');
        return;
    }
    
    // Show style selector and wait for user choice
    showStyleSelector((selectedStyle) => {
        executePrint(plan, teacherName, schoolName, selectedStyle);
    });
}

function executePrint(plan, teacherName, schoolName, printStyle) {
    const printWindow = window.open('', '_blank');
    const academicYear = getAcademicYear();
    
    // بناء صفوف الجدول
    let tableRows = '';
    if (plan.table_data && Array.isArray(plan.table_data)) {
        plan.table_data.forEach(row => {
            tableRows += `
                <tr>
                    <td>${row.situation || ''}</td>
                    <td>${row.resources || ''}</td>
                    <td>${row.teacherRole || ''}</td>
                    <td>${row.studentRole || ''}</td>
                    <td>${row.bloomLevel || ''}</td>
                    <td>${row.evaluation || ''}</td>
                    <td>${row.duration || ''}</td>
                </tr>
            `;
        });
    }
    
    // بناء محتوى الطباعة
    const printContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>طباعة - ${plan.lesson_name || 'مذكرة'}</title>

<style>
    ${getStyleCSS(printStyle)}
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()">🖨️ طباعة</button>

<!-- TITLE -->
<div style="text-align:center; margin-bottom:5px;">
    <h1 style="font-size:18px;margin-bottom:5px;margin-top: 3px;">مذكرة ${plan.plan_type || ''}</h1>
</div>

<!-- COMBINED INFORMATION BOX -->
<div class="info-box">
    <div class="info-grid">
        <div class="info-item"><strong>الثانوية:</strong> ${schoolName}</div>
        <div class="info-item"><strong>المجال التعليمي:</strong> ${plan.area || ''}</div>
        <div class="info-item"><strong>الأستاذ:</strong> ${teacherName}</div>
        <div class="info-item"><strong>الوحدة التعليمية:</strong> ${plan.unit || ''}</div>
        <div class="info-item"><strong>المادة:</strong> المعلوماتية</div>
        <div class="info-item"><strong>المدة:</strong> ${plan.lesson_duration || ''}</div>
        <div class="info-item"><strong>الشعبة:</strong> ${plan.class_type || ''}</div>
        <div class="info-item"><strong>الوسائل:</strong> ${plan.used_resources || ''}</div>
        <div class="info-item"><strong>السنة الدراسية:</strong> ${academicYear}</div>
        <div class="info-item"><strong>الاستراتيجيات:</strong> ${plan.used_strategies || ''}</div>
    </div>
</div>

<!-- الكفاءة + الأهداف (SIDE BY SIDE) -->
<div class="two-col-section">
    ${plan.target_competency ? `
    <div class="section">
        <h3 style="margin-top: 1px;">الكفاءة المستهدفة</h3>
        <p style="font-size:12px; margin-top: 5px; margin-bottom: 5px;">${plan.target_competency}</p>
    </div>` : ''}

    ${plan.learning_objectives ? `
    <div class="section">
        <h3 style="margin-top: 1px;">الأهداف التعلمية</h3>
        <p style="font-size:12px;margin-top: 5px; margin-bottom: 5px;">${plan.learning_objectives}</p>
    </div>` : ''}
</div>

<!-- TABLE -->
<div class="section">
    <h3 style="margin-top: 1px;">السير المنهجي للدرس</h3>

    <table>
        <thead>
            <tr>
                <th rowspan="2">الوضعيات التعليمية</th>
                <th colspan="3">السير المنهجي</th>
                <th rowspan="2">بلوم/مهارة</th>
                <th rowspan="2">التقويم</th>
                <th rowspan="2">المدة</th>
            </tr>
            <tr>
                <th>الموارد</th>
                <th>دور المعلم</th>
                <th>دور المتعلم</th>
            </tr>
        </thead>
        <tbody>${tableRows}</tbody>
    </table>
</div>

</body>
</html>`;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

function getStyleCSS(style) {
    const baseStyles = `
    @media print {
        @page { size: A4; margin: 12mm; size: landscape; }
        .print-btn {
            display: none !important;
            visibility: hidden !important;
        }
    }
    
    p {
        margin-top: 5px;
        margin-bottom: 5px;
    }
    h3 {
        margin-top: 1px;
    }
    ul {
        margin-top: 5px;
        margin-bottom: 5px;
        padding-right: 20px;
    }
    tr { page-break-inside: avoid; }
    
    .print-btn {
        display: block;
        margin: 5px auto;
        background: #4f46e5;
        color: white;
        border: none;
        padding: 5px 5px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
    }
    `;
    
    if (style === 'colorful') {
        return baseStyles + `
    body {
        font-family: 'Segoe UI', 'Arial', sans-serif;
        color: #1e293b;
        padding: 8px;
        line-height: 1.6;
        background: #fff;
    }

    .info-box {
        border: 2px solid #93c5fd;
        background: #eff6ff;
        padding: 8px 10px;
        border-radius: 8px;
        margin-bottom: 8px;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px 12px;
        font-size: 12px;
    }

    .info-item {
        padding: 3px 0;
    }

    .info-item strong {
        display: inline-block;
        min-width: 100px;
        font-weight: 600;
        color: #1e40af;
    }

    .two-col-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 8px;
    }

    .section {
        border: 2px solid #a78bfa;
        background: #faf5ff;
        padding: 8px;
        border-radius: 8px;
    }

    .section h3 {
        font-size: 14px;
        color: white;
        background: #8b5cf6;
        padding: 6px;
        margin-bottom: 8px;
        margin-top: 3px;
        text-align: center;
        font-weight: 600;
        border-radius: 6px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        font-size: 11px;
    }
    
    th, td {
        border: 1px solid #d1d5db;
        padding: 6px 8px;
        vertical-align: top;
    }
    
    td:first-child {
        text-align: center;
        vertical-align: middle;
        font-weight: 600;
        background: #fef3c7;
        color: #92400e;
    }
    
    th {
        background: #3b82f6;
        text-align: center;
        font-weight: 600;
        vertical-align: middle;
        color: white;
    }
    
    tbody tr:nth-child(odd) {
        background: #f0fdf4;
    }
    
    tbody tr:nth-child(even) {
        background: #eff6ff;
    }
        `;
    } else if (style === 'modern') {
        return baseStyles + `
    body {
        font-family: 'Segoe UI', 'Arial', sans-serif;
        color: #1f2937;
        padding: 8px;
        line-height: 1.6;
        background: #fff;
    }

    .info-box {
        border: 1px solid #d1d5db;
        background: #f9fafb;
        padding: 8px 10px;
        border-radius: 8px;
        margin-bottom: 8px;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px 12px;
        font-size: 12px;
    }

    .info-item strong {
        display: inline-block;
        min-width: 100px;
        font-weight: 600;
        color: #374151;
    }

    .two-col-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 8px;
    }

    .section {
        border: 1px solid #e5e7eb;
        background: #ffffff;
        padding: 8px;
        border-radius: 8px;
    }

    .section h3 {
        font-size: 14px;
        color: #111827;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 6px;
        margin-bottom: 8px;
        margin-top: 3px;
        text-align: center;
        font-weight: 600;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        font-size: 11px;
    }
    
    th, td {
        border: 1px solid #d1d5db;
        padding: 6px 8px;
        vertical-align: top;
    }
    
    td:first-child {
        text-align: center;
        vertical-align: middle;
        font-weight: 600;
        background: #f9fafb;
    }
    
    th {
        background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
        text-align: center;
        font-weight: 600;
        vertical-align: middle;
        color: #1f2937;
    }
        `;
    } else if (style === 'formal') {
        return baseStyles + `
    body {
        font-family: 'Traditional Arabic', 'Times New Roman', serif;
        color: #000;
        padding: 5px;
        line-height: 1.5;
        background: #fff;
    }

    .info-box {
        border: 2.5px double #000;
        padding: 6px 8px;
        border-radius: 0;
        margin-bottom: 6px;
        background: #fafafa;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 10px;
        font-size: 12px;
    }

    .info-item strong {
        display: inline-block;
        min-width: 100px;
        font-weight: bold;
        text-decoration: underline;
    }

    .two-col-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 6px;
    }

    .section {
        border: 2px solid #000;
        padding: 6px;
        border-radius: 0;
        background: #fff;
    }

    .section h3 {
        font-size: 14px;
        border-bottom: 3px double #000;
        padding-bottom: 4px;
        margin-bottom: 6px;
        margin-top: 2px;
        text-align: center;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        font-size: 11px;
        border: 2px solid #000;
    }
    
    th, td {
        border: 1.5px solid #000;
        padding: 5px 6px;
        vertical-align: top;
    }
    
    td:first-child {
        text-align: center;
        vertical-align: middle;
        font-weight: bold;
        background: #f5f5f5;
    }
    
    th {
        background: #e8e8e8;
        text-align: center;
        font-weight: bold;
        vertical-align: middle;
        border: 2px solid #000;
    }
        `;
    } else {
        // Classic style (original)
        return baseStyles + `
    body {
        font-family: 'Segoe UI', Tahoma, sans-serif;
        color: #000;
        padding: 5px;
        line-height: 1.5;
    }

    .info-box {
        border: 2px solid #000;
        padding: 5px 5px;
        border-radius: 5px;
        margin-bottom: 5px;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5px 5px;
        font-size: 12px;
    }

    .section h3 {
        text-align: center !important;
    }

    .info-item strong {
        display: inline-block;
        min-width: 100px;
        font-weight: bold;
    }

    .two-col-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 5px;
    }

    .section {
        border: 1.5px solid #333;
        padding: 5px;
        border-radius: 6px;
    }

    .section h3 {
        font-size: 14px;
        border-bottom: 2px solid #222;
        padding-bottom: 5px;
        margin-bottom: 5px;
        margin-top: 5px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        font-size: 12px;
    }
    th, td {
        border: 1px solid #333;
        padding: 5px 5px;
        vertical-align: top;
    }
    td:first-child {
        text-align: center;
        vertical-align: middle;
        font-weight: bold;
    }
    th {
        background: #ececec;
        text-align: center;
        font-weight: bold;
        vertical-align: middle;
    }
        `;
    }
}
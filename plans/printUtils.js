// Print Utilities

function getAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed
    
    // إذا كان الشهر من سبتمبر إلى ديسمبر، السنة الدراسية تبدأ من السنة الحالية
    // إذا كان من يناير إلى أغسطس، السنة الدراسية بدأت من السنة الماضية
    if (month >= 8) {
        return `${year + 1}-${year }`;
    } else {
        return `${year }-${year - 1}`;
    }
}

function printPlan(plan, teacherName, schoolName) {
    // التحقق من وجود البيانات
    if (!plan) {
        alert('خطأ: لا توجد بيانات للطباعة');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const academicYear = getAcademicYear();
    
    let tableRows = '';
    if (plan.table_data && Array.isArray(plan.table_data)) {
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
    
    const printContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>طباعة - ${plan.lesson_name || 'مذكرة'}</title>

<style>
    @media print {
        @page { size: A4; margin: 12mm; }
        .print-btn {
            display: none !important;
            visibility: hidden !important;
        }
    }

    body {
        font-family: 'Segoe UI', Tahoma, sans-serif;
        color: #000;
        padding: 10px;
        line-height: 1.6;
    }

    /* ======= INFO BOX ======= */
    .info-box {
        border: 2px solid #000;
        padding: 15px 20px;
        border-radius: 6px;
        margin-bottom: 10px;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 5px 15px;
        font-size: 13px;
    }

    .section h3 {
        text-align: center !important;
    }

    .info-item strong {
        display: inline-block;
        min-width: 140px;
        font-weight: bold;
    }

    /* ===== SECTION HALF/HALF ===== */
    .two-col-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 10px;
    }

    .section {
        border: 1.5px solid #333;
        padding: 12px;
        border-radius: 6px;
    }

    .section h3 {
        font-size: 14px;
        border-bottom: 2px solid #222;
        padding-bottom: 5px;
        margin-bottom: 8px;
		margin-top: 5px;
    }

    /* ===== TABLE ===== */
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        font-size: 12px;
    }
    th, td {
        border: 1px solid #333;
        padding: 8px 10px;
        vertical-align: top;
    }
    th {
        background: #ececec;
        text-align: center;
        font-weight: bold;
    }

    tr { page-break-inside: avoid; }

    .print-btn {
        display: block;
        margin: 5px auto;
        background: #4f46e5;
        color: white;
        border: none;
        padding: 10px 25px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    }
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()">🖨️ طباعة</button>

<!-- TITLE -->
<div style="text-align:center; margin-bottom:5px;">
    <h1 style="font-size:20px;margin-bottom:5px;margin-top: 5px;">مذكرة ${plan.plan_type || ''}</h1>
</div>

<!-- COMBINED INFORMATION BOX -->
<div class="info-box">
    <div class="info-grid">
        <div class="info-item"><strong>الثانوية:</strong> ${schoolName}</div>
        <div class="info-item"><strong>المجال التعليمي:</strong> ${plan.area || ''}</div>
        <div class="info-item"><strong>الأستاذ:</strong> ${teacherName}</div>
        <div class="info-item"><strong>الوحدة التعليمية:</strong> ${plan.unit || ''}</div>
        <div class="info-item"><strong>المادة:</strong> المعلوماتية</div>
        <div class="info-item"><strong>المدة:</strong> ${plan.lesson_duration}</div>
        <div class="info-item"><strong>الشعبة:</strong> ${plan.class_type || ''}</div>
        <div class="info-item"><strong>الوسائل:</strong> ${plan.used_resources}</div>
        <div class="info-item"><strong>السنة الدراسية:</strong> ${academicYear}</div>
        <div class="info-item"><strong>الاستراتيجيات:</strong> ${plan.used_strategies}</div>
    </div>
</div>

<!-- الكفاءة + الأهداف (SIDE BY SIDE) -->
<div class="two-col-section">
    ${plan.target_competency ? `
    <div class="section">
        <h3>الكفاءة المستهدفة</h3>
        <p>${plan.target_competency}</p>
    </div>` : ''}

    ${plan.learning_objectives ? `
    <div class="section">
        <h3>الأهداف التعلمية</h3>
        <p>${plan.learning_objectives}</p>
    </div>` : ''}
</div>

<!-- TABLE -->
<div class="section">
    <h3>السير المنهجي للدرس</h3>

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
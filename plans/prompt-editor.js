// Prompt Editor Functionality
let customPromptText = null;

const DEFAULT_PROMPT_TEMPLATE = `أنت خبير تربوي متخصص في إعداد مذكرات الدروس للتعليم الثانوي في الجزائر.

المعطيات المتوفرة:
- المجال التعلمي: \${area}
- الوحدة التعلمية: \${unit}
- نوع المذكرة: \${planType}
\${planTypeContext}
- الكفاءة المستهدفة: \${competency}
- الأهداف التعلمية: \${objectives}
\${targetedResources}
\${progression}
\${duration}
\${stageEvaluation}
\${finalTask}

المطلوب منك:
1. اقترح الوسائل المستخدمة (أدوات، تجهيزات، برمجيات)
2. اقترح المدة المناسبة للدرس
3. اقترح الاستراتيجيات البيداغوجية المستعملة
4. أنشئ جدول السير المنهجي للدرس بـ 4 مراحل:
   - وضعية الانطلاق
   - بناء التعلمات
   - وضعية التطبيق
   - التقويم الختامي

لكل مرحلة، قدم:
- الموارد المستخدمة
- دور المعلم (بشكل واضح ومحدد)
- دور المتعلم (بشكل واضح ومحدد)
- مستوى بلوم أو المهارة المستهدفة
- التقويم المرحلي
- المدة بالدقائق

الرجاء الإجابة بصيغة JSON فقط بهذا الشكل بدون أي نص إضافي:
{
  "usedResources": "نص الوسائل المستخدمة",
  "lessonDuration": "المدة",
  "usedStrategies": "الاستراتيجيات المستعملة",
  "stages": [
    {
      "situation": "وضعية الانطلاق",
      "resources": "الموارد",
      "teacherRole": "دور المعلم",
      "studentRole": "دور المتعلم",
      "bloomLevel": "مستوى بلوم",
      "evaluation": "التقويم",
      "duration": "5"
    }
  ]
}`;

function buildPromptText(area, unit, curriculumData) {
    let prompt = DEFAULT_PROMPT_TEMPLATE;
    
    // Get lesson type
    const planType = document.querySelector('input[name="planType"]:checked').value;
    
    // Add context based on lesson type
    let planTypeContext = '';
    if (planType === 'تطبيقية') {
        planTypeContext = '- السياق: هذا درس تطبيقي يُدرّس في قاعة خاصة مجهزة بأجهزة حاسوب (جهاز لكل طالب أو جهاز لكل طالبين). يركز على التطبيق العملي للمفاهيم النظرية المكتسبة.';
    } else {
        planTypeContext = '- السياق: هذا درس نظري يُدرّس في قاعة عادية بسبورة وقد يتضمن جهاز عرض أو حاسوب واحد للشرح. يركز على تقديم المفاهيم والمعارف النظرية.';
    }
    
    // Replace main variables
    prompt = prompt.replace('${area}', area);
    prompt = prompt.replace('${unit}', unit);
    prompt = prompt.replace('${planType}', planType);
    prompt = prompt.replace('${planTypeContext}', planTypeContext);
    prompt = prompt.replace('${competency}', curriculumData.competency);
    prompt = prompt.replace('${objectives}', curriculumData.objectives);
    
    // Replace optional fields
    const targetedResources = curriculumData.targeted_ressourses 
        ? `- الموارد المستهدفة: ${curriculumData.targeted_ressourses.join(', ')}` 
        : '';
    prompt = prompt.replace('${targetedResources}', targetedResources);
    
    const progression = curriculumData.progression 
        ? `- التدرج البيداغوجي: ${curriculumData.progression.join(', ')}` 
        : '';
    prompt = prompt.replace('${progression}', progression);
    
    const duration = curriculumData.duration 
        ? `- المدة المقترحة: ${curriculumData.duration}` 
        : '';
    prompt = prompt.replace('${duration}', duration);
    
    const stageEvaluation = curriculumData.stage_evaluation 
        ? `- التقويم المرحلي: ${curriculumData.stage_evaluation}` 
        : '';
    prompt = prompt.replace('${stageEvaluation}', stageEvaluation);
    
    const finalTask = curriculumData.final_task 
        ? `- المهمة النهائية: ${curriculumData.final_task}` 
        : '';
    prompt = prompt.replace('${finalTask}', finalTask);
    
    return prompt;
}

function openPromptEditor() {
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    
    if (!area || !unit) {
        showToast("الرجاء اختيار المجال والوحدة أولاً");
        return;
    }
    
    const curriculumData = getCurriculumData(area, unit);
    
    if (!curriculumData) {
        showToast("لا توجد بيانات متاحة لهذه الوحدة");
        return;
    }
    
    const promptText = customPromptText || buildPromptText(area, unit, curriculumData);
    
    document.getElementById('promptEditor').value = promptText;
    document.getElementById('promptEditorModal').style.display = 'flex';
}

function closePromptEditor() {
    document.getElementById('promptEditorModal').style.display = 'none';
}

function resetPromptToDefault() {
    const area = document.getElementById('area').value;
    const unit = document.getElementById('unit').value;
    const curriculumData = getCurriculumData(area, unit);
    
    if (curriculumData) {
        const promptText = buildPromptText(area, unit, curriculumData);
        document.getElementById('promptEditor').value = promptText;
        customPromptText = null;
        showToast("تم استعادة النص الافتراضي");
    }
}

async function generateWithCustomPrompt() {
    const promptText = document.getElementById('promptEditor').value.trim();
    
    if (!promptText) {
        showToast("الرجاء إدخال نص الطلب");
        return;
    }
    
    customPromptText = promptText;
    closePromptEditor();
    
    // Call the main AI generation function with custom prompt
    await executeAIGeneration(promptText);
}

async function executeAIGeneration(promptText) {
    const aiButton = document.getElementById('generateWithAI');
    aiButton.disabled = true;
    aiButton.textContent = '⏳ جاري الإنشاء...';
    aiButton.classList.add('loading');
    document.getElementById("loadingOverlay").style.display = "flex";

    try {
        const { data, error } = await supabaseClient.functions.invoke('chat-with-ai', {
            body: {
                prompt: promptText,
                history: []
            }
        });

        if (error) throw error;

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('استجابة غير صالحة من AI');
        }

        let aiResponse = data.candidates[0].content.parts[0].text.trim();
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const lessonPlan = JSON.parse(aiResponse);
        
        // Fill form fields
        if (lessonPlan.usedResources) {
            const field = document.getElementById('usedResources');
            field.value = lessonPlan.usedResources;
            field.classList.add('ai-filled');
            setTimeout(() => field.classList.remove('ai-filled'), 2000);
        }
        
        if (lessonPlan.lessonDuration) {
            const field = document.getElementById('lessonDuration');
            field.value = lessonPlan.lessonDuration;
            field.classList.add('ai-filled');
            setTimeout(() => field.classList.remove('ai-filled'), 2000);
        }
        
        if (lessonPlan.usedStrategies) {
            const field = document.getElementById('usedStrategies');
            field.value = lessonPlan.usedStrategies;
            field.classList.add('ai-filled');
            setTimeout(() => field.classList.remove('ai-filled'), 2000);
        }
        
        // Fill table
        if (lessonPlan.stages && lessonPlan.stages.length > 0) {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            
            lessonPlan.stages.forEach((stage, index) => {
                const tr = document.createElement('tr');
                tr.className = 'ai-generated-row';
                tr.style.animationDelay = `${index * 0.1}s`;
                tr.innerHTML = `
                    <td><input type="text" value="${stage.situation || ''}" data-field="situation"></td>
                    <td><textarea data-field="resources">${stage.resources || ''}</textarea></td>
                    <td><textarea data-field="teacherRole">${stage.teacherRole || ''}</textarea></td>
                    <td><textarea data-field="studentRole">${stage.studentRole || ''}</textarea></td>
                    <td><input type="text" value="${stage.bloomLevel || ''}" data-field="bloomLevel"></td>
                    <td><textarea data-field="evaluation">${stage.evaluation || ''}</textarea></td>
                    <td><input type="text" value="${stage.duration || ''}" data-field="duration" placeholder="مثال: 10"></td>
                    <td style="text-align: center;">
                        <button class="btn-danger" onclick="removeTableRow(this)">✕</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            updateDeleteButtons();
        }
        
        aiButtonUsed = true;
        updateAIButtonState();
        aiButton.classList.remove('loading');
        aiButton.classList.add('success');
        document.getElementById("loadingOverlay").style.display = "none";
        showToast("✓ تم إنشاء خطة الدرس بنجاح بواسطة AI!");
        
    } catch (error) {
        console.error('Error generating lesson plan:', error);
        showToast("حدث خطأ أثناء إنشاء خطة الدرس: " + error.message);
        aiButton.disabled = false;
        aiButton.textContent = '🤖 إنشاء بواسطة AI';
        aiButton.classList.remove('loading');
        document.getElementById("loadingOverlay").style.display = "none";
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('promptEditorModal');
    if (event.target === modal) {
        closePromptEditor();
    }
});
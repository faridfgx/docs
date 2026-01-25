/* ===============================
   DOWNLOAD WARNING MODAL
   =============================== */

function downoff() {
    const modal = document.getElementById("browserWarning");
    if (!modal) return;
    modal.classList.add("active");
}

function closeWarning() {
    const modal = document.getElementById("browserWarning");
    if (!modal) return;
    modal.classList.remove("active");
}

function confirmDownload() {
    closeWarning();

    const link = document.createElement("a");
    link.href = "algofx_web.zip";   // adjust path if needed
    link.download = "algofx_web.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ===============================
   THEME TOGGLE (LIGHT / DARK)
   =============================== */

function toggleTheme() {
    const root = document.documentElement;
    const themeIcon = document.getElementById("themeIcon");
    if (!themeIcon) return;

    const currentTheme = root.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", nextTheme);
    themeIcon.textContent = nextTheme === "light" ? "☀️" : "🌙";
    localStorage.setItem("theme", nextTheme);
}

/* ===============================
   LOAD SAVED THEME (EARLY)
   =============================== */

(function loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const root = document.documentElement;

    root.setAttribute("data-theme", savedTheme);

    // Update icon after DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
        const themeIcon = document.getElementById("themeIcon");
        if (themeIcon) {
            themeIcon.textContent = savedTheme === "light" ? "☀️" : "🌙";
        }
    });
})();

function showStepUI() {
    document.getElementById('variablePanel').style.display = 'block';
    document.getElementById('nextStepBtn').style.display = 'inline-block';
    document.getElementById('stopStepBtn').style.display = 'inline-block';
}

function hideStepUI() {
    document.getElementById('variablePanel').style.display = 'none';
    document.getElementById('nextStepBtn').style.display = 'none';
    document.getElementById('stopStepBtn').style.display = 'none';
}


// Step-by-step execution variables
let stepMode = false;
let stepPaused = false;
let stepResolve = null;
let currentLineIndex = -1;
let processedLines = [];
let previousVariables = {};

// Initialize step-by-step execution
async function runStepByStep() {
    showStepUI(); 
    stepMode = true;
    stepPaused = true;
    currentLineIndex = -1;
    previousVariables = {};
    
    document.getElementById('nextStepBtn').disabled = false;
    document.getElementById('stopStepBtn').disabled = false;
    document.querySelector('.btn-run').disabled = true;
    
    // Run the algorithm
    await runAlgorithm();
    
    // Reset after completion
    stopStepExecution();
}

// Stop step-by-step execution
function stopStepExecution() {
    stepMode = false;
    stepPaused = false;
    currentLineIndex = -1;
    
    document.getElementById('nextStepBtn').disabled = true;
    document.getElementById('stopStepBtn').disabled = true;
    document.querySelector('.btn-run').disabled = false;
    
    // Remove line highlighting
    removeLineHighlight();
    hideStepUI(); 
    if (stepResolve) {
        stepResolve();
        stepResolve = null;
    }
}

// Execute next step
function nextStep() {
    if (stepResolve) {
        stepResolve();
        stepResolve = null;
    }
}

// Wait for user to click next step
async function waitForStep(lineIndex) {
    if (!stepMode) return;
    
    currentLineIndex = lineIndex;
    highlightCurrentLine(lineIndex);
    updateVariablePanel();
    
    return new Promise((resolve) => {
        stepResolve = resolve;
    });
}

// Highlight current line in editor
function highlightCurrentLine(lineIndex) {
    removeLineHighlight();
    
    const highlightLayer = document.getElementById('highlightLayer');
    const lines = highlightLayer.innerHTML.split('\n');
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
        lines[lineIndex] = `<span class="highlight-current-line">${lines[lineIndex]}</span>`;
        highlightLayer.innerHTML = lines.join('\n');
    }
}

// Remove line highlighting
function removeLineHighlight() {
    const highlightLayer = document.getElementById('highlightLayer');
    highlightLayer.innerHTML = highlightLayer.innerHTML.replace(
        /<span class="highlight-current-line">(.*?)<\/span>/g, 
        '$1'
    );
}

// Update variable visualization panel
function updateVariablePanel() {
    const panel = document.getElementById('variableList');
    panel.innerHTML = '';
    
    // Combine constants and variables
    const allVars = {...constants, ...variables};
    
    if (Object.keys(allVars).length === 0) {
        panel.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">Aucune variable</div>';
        return;
    }
    
    for (let [name, value] of Object.entries(allVars)) {
        const item = document.createElement('div');
        item.className = 'variable-item';
        
        // Check if value changed
        if (previousVariables[name] !== undefined && previousVariables[name] !== value) {
            item.classList.add('changed');
        }
        
        const type = variableTypes[name] || 'const';
        const displayValue = typeof value === 'string' ? `"${value}"` : String(value);
        
        item.innerHTML = `
            <span class="variable-name">${name}</span>
            <span>
                <span class="variable-value">${displayValue}</span>
                <span class="variable-type">(${type})</span>
            </span>
        `;
        
        panel.appendChild(item);
    }
    
    // Update previous variables
    previousVariables = {...allVars};
}

// MODIFY the existing executeLines function
// Replace the entire executeLines function with this version:

async function executeLines(lines, start, end) {
    let i = start;
    
    while (i <= end) {
        let line = lines[i].trim();
        
        if (!line || line.startsWith('//')) {
            i++;
            continue;
        }
        
        // Wait for step if in step mode
        if (stepMode) {
            await waitForStep(i);
        }
        
        // Assignment
        if (line.includes('<-')) {
            const [varName, expr] = line.split('<-').map(s => s.trim().replace(';', ''));
            const value = evaluateExpression(expr);
            checkTypeAssignment(varName, value);
            variables[varName] = value;
        }

        // Read input
        else if (line.startsWith('lire(')) {
            const varsStr = line.match(/lire\((.*?)\)/)[1];
            const varNames = varsStr.split(',').map(v => v.trim());
            
            for (let varName of varNames) {
                checkVariableDeclared(varName);
                const expectedType = variableTypes[varName];
                const value = await readInput(`Entrez ${varName} (${expectedType}):`);
                
                try {
                    let parsedValue;
                    if (expectedType === TYPES.CHAINE || expectedType === TYPES.CARACTERE) {
                        parsedValue = value;
                    } else {
                        parsedValue = parseValue(value, expectedType);
                    }
                    checkTypeAssignment(varName, parsedValue);
                    variables[varName] = parsedValue;
                } catch (e) {
                    throw new Error(`Erreur de lecture pour '${varName}': ${e.message}`);
                }
            }
        }
        // Write output
        else if (line.startsWith('ecrire(')) {
            const content = line.match(/ecrire\((.*?)\);?$/)[1];
            const parts = [];
            let current = '';
            let inString = false;
            
            for (let j = 0; j < content.length; j++) {
                const char = content[j];
                
                if (char === '"') {
                    inString = !inString;
                    current += char;
                } else if (char === ',' && !inString) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current) parts.push(current.trim());
            
            const outputParts = [];
            for (let part of parts) {
                if (part.startsWith('"') && part.endsWith('"')) {
                    outputParts.push(part.slice(1, -1));
                } else {
                    outputParts.push(evaluateExpression(part));
                }
            }
            
            print(outputParts.join(' '));
        }
        // If statement
        else if (line.startsWith('si ')) {
            const condition = line.match(/si\s+(.*?)\s+alors/)[1];
            const result = evaluateExpression(condition);
            
            if (typeof result !== 'boolean') {
                throw new Error(`La condition doit être booléenne, reçu: ${typeof result}`);
            }
            
            let siEnd = findBlockEnd(lines, i, 'si', 'finsi');
            let sinonIndex = findSinon(lines, i, siEnd);
            
            if (result) {
                await executeLines(lines, i + 1, sinonIndex !== -1 ? sinonIndex - 1 : siEnd - 1);
            } else if (sinonIndex !== -1) {
                await executeLines(lines, sinonIndex + 1, siEnd - 1);
            }
            
            i = siEnd;
        }
        // While loop
        else if (line.startsWith('tantque ')) {
            const condition = line.match(/tantque\s+(.*?)\s+faire/)[1];
            const loopEnd = findBlockEnd(lines, i, 'tantque', 'fintantque');
            
            while (true) {
                const result = evaluateExpression(condition);
                if (typeof result !== 'boolean') {
                    throw new Error(`La condition doit être booléenne, reçu: ${typeof result}`);
                }
                if (!result) break;
                
                try {
                    await executeLines(lines, i + 1, loopEnd - 1);
                } catch (e) {
                    if (e.message === 'BREAK') break;
                    throw e;
                }
            }
            
            i = loopEnd;
        }
        // For loop
        else if (line.startsWith('pour ')) {
            const match = line.match(/pour\s+(\w+)\s+de\s+(.+?)\s+a\s+(.+?)(?:\s+pas\s+(.+?))?\s+faire/);
            const varName = match[1];
            
            checkVariableDeclared(varName);
            if (variableTypes[varName] !== TYPES.ENTIER) {
                throw new Error(`La variable de boucle '${varName}' doit être de type entier`);
            }
            
            const start = evaluateExpression(match[2]);
            const end = evaluateExpression(match[3]);
            const step = match[4] ? evaluateExpression(match[4]) : 1;
            
            if (!Number.isInteger(start) || !Number.isInteger(end) || !Number.isInteger(step)) {
                throw new Error(`Les bornes de boucle doivent être des entiers`);
            }
            
            const loopEnd = findBlockEnd(lines, i, 'pour', 'finpour');
            
            for (let val = start; step > 0 ? val <= end : val >= end; val += step) {
                variables[varName] = val;
                try {
                    await executeLines(lines, i + 1, loopEnd - 1);
                } catch (e) {
                    if (e.message === 'BREAK') break;
                    throw e;
                }
            }
            
            i = loopEnd;
        }
        // Break statement
        else if (line === 'sortir;') {
            throw new Error('BREAK');
        }
        
        i++;
    }
}




// Syntax Checker for Algorithm Language

function checkSyntax(code) {
    const processedCode = lowercasePreservingStrings(code);
    const lines = processedCode.split('\n');
    
    // Track block structure
    const blockStack = [];
    let hasAlgorithme = false;
    let hasDebut = false;
    let hasFin = false;
    let debutLine = -1;
    let finLine = -1;
    
    // Track sections
    let currentSection = null;
    let inVar = false;
    let inConst = false;
    let afterDebut = false;
    
    // Declared variables and constants
    const declaredVars = new Set();
    const declaredConsts = new Set();
    
    // Valid types
    const validTypes = ['entier', 'reel', 'chaine', 'caractere', 'booleen', 'tableau'];
    
    for (let i = 0; i < lines.length; i++) {
        const originalLine = lines[i];
        const line = originalLine.trim();
        const lineNum = i + 1;
        
        // Skip empty lines and comments
        if (!line || line.startsWith('//')) continue;
        
        // 1. Check for Algorithm declaration
        if (line.startsWith('algorithme ')) {
            if (hasAlgorithme) {
                return createError('DUPLICATE_ALGORITHM', lineNum, line,
                    'Déclaration "Algorithme" en double',
                    'Un seul "Algorithme" est autorisé au début du fichier',
                    'Algorithme MonAlgorithme;');
            }
            
            const match = line.match(/^algorithme\s+([a-z0-9_]+)\s*;?\s*$/i);
            if (!match) {
                return createError('INVALID_ALGORITHM', lineNum, line,
                    'Syntaxe invalide pour la déclaration d\'algorithme',
                    'Format attendu: Algorithme NomAlgorithme;',
                    'Algorithme MonAlgorithme;');
            }
            
            hasAlgorithme = true;
            continue;
        }
        
        // 2. Check for Var section
        if (line === 'var') {
            if (afterDebut) {
                return createError('VAR_AFTER_DEBUT', lineNum, line,
                    'Section "Var" après "Debut"',
                    'La section "Var" doit être déclarée avant "Debut"',
                    'Var\n    x: entier;\nDebut');
            }
            inVar = true;
            inConst = false;
            currentSection = 'var';
            continue;
        }
        
        // 3. Check for Const section
        if (line === 'const') {
            if (afterDebut) {
                return createError('CONST_AFTER_DEBUT', lineNum, line,
                    'Section "Const" après "Debut"',
                    'La section "Const" doit être déclarée avant "Debut"',
                    'Const\n    PI = 3.14;\nDebut');
            }
            inConst = true;
            inVar = false;
            currentSection = 'const';
            continue;
        }
        
        // 4. Check for Debut
        if (line === 'debut') {
            if (hasDebut) {
                return createError('DUPLICATE_DEBUT', lineNum, line,
                    'Mot-clé "Debut" en double',
                    'Un seul "Debut" est autorisé',
                    'Debut\n    // votre code\nFin');
            }
            if (!hasAlgorithme) {
                return createError('DEBUT_WITHOUT_ALGORITHM', lineNum, line,
                    '"Debut" sans déclaration d\'algorithme',
                    'Vous devez déclarer l\'algorithme avant "Debut"',
                    'Algorithme MonAlgorithme;\nDebut');
            }
            hasDebut = true;
            debutLine = lineNum;
            afterDebut = true;
            inVar = false;
            inConst = false;
            currentSection = 'debut';
            continue;
        }
        
        // 5. Check for Fin
        if (line === 'fin') {
            if (!hasDebut) {
                return createError('FIN_WITHOUT_DEBUT', lineNum, line,
                    '"Fin" sans "Debut"',
                    'Vous devez avoir un "Debut" avant "Fin"',
                    'Debut\n    // votre code\nFin');
            }
            if (hasFin) {
                return createError('DUPLICATE_FIN', lineNum, line,
                    'Mot-clé "Fin" en double',
                    'Un seul "Fin" est autorisé',
                    'Debut\n    // votre code\nFin');
            }
            
            // Check if all blocks are closed
            if (blockStack.length > 0) {
                const unclosed = blockStack[blockStack.length - 1];
                return createError('UNCLOSED_BLOCK', lineNum, line,
                    `Bloc "${unclosed.type}" non fermé (ligne ${unclosed.line})`,
                    `Vous devez fermer le bloc "${unclosed.type}" avec "${unclosed.closer}"`,
                    getBlockExample(unclosed.type));
            }
            
            hasFin = true;
            finLine = lineNum;
            currentSection = 'fin';
            continue;
        }
        
        // 6. Check variable declarations (in Var section)
        if (inVar && currentSection === 'var') {
            const varMatch = line.match(/^([a-z_][a-z0-9_,\s]*)\s*:\s*([a-z]+)\s*;?\s*$/i);
            if (!varMatch) {
                return createError('INVALID_VAR_DECLARATION', lineNum, line,
                    'Déclaration de variable invalide',
                    'Format attendu: nomVariable: type;',
                    'x, y: entier;\nnom: chaine;');
            }
            
            const varNames = varMatch[1].split(',').map(v => v.trim());
            const varType = varMatch[2].trim().toLowerCase();
            
            if (!validTypes.includes(varType)) {
                return createError('INVALID_TYPE', lineNum, line,
                    `Type "${varType}" invalide`,
                    `Types valides: ${validTypes.join(', ')}`,
                    'x: entier;\ny: reel;\nnom: chaine;');
            }
            
            for (let varName of varNames) {
                if (!varName.match(/^[a-z_][a-z0-9_]*$/i)) {
                    return createError('INVALID_VAR_NAME', lineNum, line,
                        `Nom de variable "${varName}" invalide`,
                        'Les noms doivent commencer par une lettre ou "_" et contenir uniquement lettres, chiffres et "_"',
                        'maVariable: entier;\n_compteur: entier;');
                }
                declaredVars.add(varName);
            }
            continue;
        }
        
        // 7. Check constant declarations (in Const section)
        if (inConst && currentSection === 'const') {
            const constMatch = line.match(/^([a-z_][a-z0-9_]*)\s*=\s*(.+?)\s*;?\s*$/i);
            if (!constMatch) {
                return createError('INVALID_CONST_DECLARATION', lineNum, line,
                    'Déclaration de constante invalide',
                    'Format attendu: NOM = valeur;',
                    'PI = 3.14;\nMAX = 100;');
            }
            
            const constName = constMatch[1].trim();
            if (!constName.match(/^[a-z_][a-z0-9_]*$/i)) {
                return createError('INVALID_CONST_NAME', lineNum, line,
                    `Nom de constante "${constName}" invalide`,
                    'Les noms doivent commencer par une lettre ou "_"',
                    'PI = 3.14;\nMAX_VALUE = 100;');
            }
            
            declaredConsts.add(constName);
            continue;
        }
        
        // 8. Check statements (after Debut)
        if (afterDebut && !hasFin) {
            
            // Check Si statement
            if (line.startsWith('si ')) {
                const siMatch = line.match(/^si\s+(.+?)\s+alors\s*$/);
                if (!siMatch) {
                    return createError('INVALID_SI', lineNum, line,
                        'Structure "Si" invalide',
                        'Format attendu: si condition alors',
                        'si x > 10 alors\n    ecrire("Grand");\nfinsi');
                }
                blockStack.push({ type: 'si', line: lineNum, closer: 'finsi' });
                continue;
            }
            
            // Check Sinon
            if (line === 'sinon') {
                if (blockStack.length === 0 || blockStack[blockStack.length - 1].type !== 'si') {
                    return createError('SINON_WITHOUT_SI', lineNum, line,
                        '"Sinon" sans "Si" correspondant',
                        '"Sinon" doit être précédé d\'un bloc "Si"',
                        'si condition alors\n    // code\nsinon\n    // code\nfinsi');
                }
                // Mark that we've seen sinon for this si
                blockStack[blockStack.length - 1].hasSinon = true;
                continue;
            }
            
            // Check FinSi
            if (line === 'finsi') {
                if (blockStack.length === 0 || blockStack[blockStack.length - 1].type !== 'si') {
                    return createError('FINSI_WITHOUT_SI', lineNum, line,
                        '"FinSi" sans "Si" correspondant',
                        'Chaque "FinSi" doit fermer un bloc "Si"',
                        'si condition alors\n    // code\nfinsi');
                }
                blockStack.pop();
                continue;
            }
            
            // Check Pour loop
            if (line.startsWith('pour ')) {
                const pourMatch = line.match(/^pour\s+([a-z_][a-z0-9_]*)\s+de\s+(.+?)\s+a\s+(.+?)(?:\s+pas\s+(.+?))?\s+faire\s*$/i);
                if (!pourMatch) {
                    return createError('INVALID_POUR', lineNum, line,
                        'Structure "Pour" invalide',
                        'Format attendu: pour variable de debut a fin faire\nOU: pour variable de debut a fin pas increment faire',
                        'pour i de 1 a 10 faire\n    ecrire(i);\nfinpour');
                }
                blockStack.push({ type: 'pour', line: lineNum, closer: 'finpour' });
                continue;
            }
            
            // Check FinPour
            if (line === 'finpour') {
                if (blockStack.length === 0 || blockStack[blockStack.length - 1].type !== 'pour') {
                    return createError('FINPOUR_WITHOUT_POUR', lineNum, line,
                        '"FinPour" sans "Pour" correspondant',
                        'Chaque "FinPour" doit fermer un bloc "Pour"',
                        'pour i de 1 a 10 faire\n    // code\nfinpour');
                }
                blockStack.pop();
                continue;
            }
            
            // Check TantQue loop
            if (line.startsWith('tantque ')) {
                const tantqueMatch = line.match(/^tantque\s+(.+?)\s+faire\s*$/);
                if (!tantqueMatch) {
                    return createError('INVALID_TANTQUE', lineNum, line,
                        'Structure "TantQue" invalide',
                        'Format attendu: tantque condition faire',
                        'tantque x < 10 faire\n    x <- x + 1;\nfintantque');
                }
                blockStack.push({ type: 'tantque', line: lineNum, closer: 'fintantque' });
                continue;
            }
            
            // Check FinTantQue
            if (line === 'fintantque') {
                if (blockStack.length === 0 || blockStack[blockStack.length - 1].type !== 'tantque') {
                    return createError('FINTANTQUE_WITHOUT_TANTQUE', lineNum, line,
                        '"FinTantQue" sans "TantQue" correspondant',
                        'Chaque "FinTantQue" doit fermer un bloc "TantQue"',
                        'tantque condition faire\n    // code\nfintantque');
                }
                blockStack.pop();
                continue;
            }
            
            // Check assignment
            if (line.includes('<-')) {
                const assignMatch = line.match(/^([a-z_][a-z0-9_]*)\s*<-\s*(.+?)\s*;?\s*$/i);
                if (!assignMatch) {
                    return createError('INVALID_ASSIGNMENT', lineNum, line,
                        'Affectation invalide',
                        'Format attendu: variable <- expression;',
                        'x <- 10;\ny <- x + 5;');
                }
                continue;
            }
            
            // Check lire statement
            if (line.startsWith('lire(')) {
                const lireMatch = line.match(/^lire\(([^)]+)\)\s*;?\s*$/);
                if (!lireMatch) {
                    return createError('INVALID_LIRE', lineNum, line,
                        'Instruction "lire" invalide',
                        'Format attendu: lire(variable1, variable2, ...);',
                        'lire(x);\nlire(nom, age);');
                }
                continue;
            }
            
            // Check ecrire statement
            if (line.startsWith('ecrire(')) {
                const ecrireMatch = line.match(/^ecrire\((.+)\)\s*;?\s*$/);
                if (!ecrireMatch) {
                    return createError('INVALID_ECRIRE', lineNum, line,
                        'Instruction "ecrire" invalide',
                        'Format attendu: ecrire(expression1, expression2, ...);',
                        'ecrire("Bonjour");\necrire("Valeur:", x);');
                }
                continue;
            }
            
            // Check sortir statement
            if (line === 'sortir;' || line === 'sortir') {
                continue;
            }
            
            // If we reach here, it's an unrecognized statement
            if (line !== 'sinon' && line !== 'finsi' && line !== 'finpour' && line !== 'fintantque') {
                return createError('UNKNOWN_STATEMENT', lineNum, line,
                    'Instruction non reconnue',
                    'Vérifiez la syntaxe de cette ligne',
                    'Instructions valides: ecrire(), lire(), <-, si, pour, tantque, etc.');
            }
        }
    }
    
    // Final checks
    if (!hasAlgorithme) {
        return createError('MISSING_ALGORITHM', 1, '',
            'Déclaration "Algorithme" manquante',
            'Vous devez commencer par déclarer l\'algorithme',
            'Algorithme MonAlgorithme;');
    }
    
    if (!hasDebut) {
        return createError('MISSING_DEBUT', lines.length, '',
            'Mot-clé "Debut" manquant',
            'Vous devez avoir un bloc "Debut"',
            'Debut\n    // votre code\nFin');
    }
    
    if (!hasFin) {
        return createError('MISSING_FIN', lines.length, '',
            'Mot-clé "Fin" manquant',
            'Vous devez terminer avec "Fin"',
            'Debut\n    // votre code\nFin');
    }
    
    if (blockStack.length > 0) {
        const unclosed = blockStack[blockStack.length - 1];
        return createError('UNCLOSED_BLOCK_END', unclosed.line, '',
            `Bloc "${unclosed.type}" non fermé (ligne ${unclosed.line})`,
            `Vous devez fermer le bloc "${unclosed.type}" avec "${unclosed.closer}"`,
            getBlockExample(unclosed.type));
    }
    
    // All checks passed!
    return { isValid: true, errors: [] };
}

function createError(errorType, lineNumber, lineContent, title, description, example) {
    return {
        isValid: false,
        error: {
            type: errorType,
            line: lineNumber,
            content: lineContent,
            title: title,
            description: description,
            example: example
        }
    };
}

function getBlockExample(blockType) {
    const examples = {
        'si': 'si condition alors\n    // code\nfinsi',
        'pour': 'pour i de 1 a 10 faire\n    // code\nfinpour',
        'tantque': 'tantque condition faire\n    // code\nfintantque'
    };
    return examples[blockType] || '';
}

        // Show syntax error in modal
        function showSyntaxError(errorResult) {
            const error = errorResult.error;
            const modalBox = document.getElementById('modalBox');
            const modalIcon = document.getElementById('modalIcon');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            const modalBtn = document.getElementById('modalBtn');
            
            // Set error styling
            modalBox.classList.remove('success');
            modalIcon.textContent = '';
            modalTitle.textContent = 'Erreur de Syntaxe';
            modalBtn.className = 'modal-btn error';
            modalBtn.textContent = 'OK';
            
            // Build content
            let content = `
                <div class="error-line-info">
                     <strong>Ligne ${error.line}</strong>
                </div>
                
                <div class="error-title">
                    ❌ ${error.title}
                </div>
                
                <div class="error-desc">
                    ${error.description}
                </div>
            `;
            
            // Add wrong code if available
            if (error.content) {
                content += `
                    <div class="code-block">
                        <div class="code-label">Code Erroné:</div>
                        <div class="code-box wrong">
                            <pre>${escapeHtml(error.content)}</pre>
                        </div>
                    </div>
                `;
            }
            
            // Add correct example
            content += `
                <div class="code-block">
                    <div class="code-label"> Exemple Correct:</div>
                    <div class="code-box correct">
                        <pre>${escapeHtml(error.example)}</pre>
                    </div>
                </div>
            `;
            
            modalContent.innerHTML = content;
            document.getElementById('syntaxModal').classList.add('active');
        }

        // Show syntax success in modal
        function showSyntaxSuccess() {
            const modalBox = document.getElementById('modalBox');
            const modalIcon = document.getElementById('modalIcon');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            const modalBtn = document.getElementById('modalBtn');
            
            // Set success styling
            modalBox.classList.add('success');
            modalIcon.textContent = '';
            modalTitle.textContent = 'Syntaxe Correcte!';
            modalBtn.className = 'modal-btn success';
            modalBtn.textContent = 'OK';
            
            // Build content
            modalContent.innerHTML = `
                <div class="success-message">
                    <p>
                         <strong>Aucune erreur détectée!</strong><br><br>
                        Votre algorithme est prêt à être exécuté.
                    </p>
                </div>
            `;
            
            document.getElementById('syntaxModal').classList.add('active');
        }

        // Close modal
        function closeSyntaxModal() {
            document.getElementById('syntaxModal').classList.remove('active');
        }

        // Helper function to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Update validateAndRun to use modal for empty editor
        function validateAndRun() {
            const code = document.getElementById('codeEditor').value;
            
            if (!code.trim()) {
                showSyntaxError({
                    isValid: false,
                    error: {
                        type: 'EMPTY_EDITOR',
                        line: 0,
                        content: '',
                        title: 'L\'éditeur est vide',
                        description: 'Veuillez écrire un algorithme avant de l\'exécuter.',
                        example: 'Algorithme MonAlgorithme;\nVar\n    x: entier;\nDebut\n    ecrire("Hello");\nFin'
                    }
                });
                return;
            }
            
            const result = checkSyntax(code);
            
            if (result.isValid) {
                runAlgorithm();
            } else {
                showSyntaxError(result);
            }
        }

        // Update checkSyntaxOnly to use modal
        function checkSyntaxOnly() {
            const code = document.getElementById('codeEditor').value;
            
            if (!code.trim()) {
                showSyntaxError({
                    isValid: false,
                    error: {
                        type: 'EMPTY_EDITOR',
                        line: 0,
                        content: '',
                        title: 'L\'éditeur est vide',
                        description: 'Veuillez écrire un algorithme avant de vérifier la syntaxe.',
                        example: 'Algorithme MonAlgorithme;\nVar\n    x: entier;\nDebut\n    ecrire("Hello");\nFin'
                    }
                });
                return;
            }
            
            const result = checkSyntax(code);
            
            if (result.isValid) {
                showSyntaxSuccess();
            } else {
                showSyntaxError(result);
            }
        }

        // Close modal when clicking outside
        document.getElementById('syntaxModal')?.addEventListener('click', function(e) {
            if (e.target === this) {
                closeSyntaxModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeSyntaxModal();
            }
        });
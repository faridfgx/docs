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
        // Global step counter to prevent infinite loops across all contexts
        globalSteps++;
        if (globalSteps > MAX_STEPS) {
            throw new Error(
                `Exécution interrompue : boucle infinie probable (plus de ${MAX_STEPS} instructions)`
            );
        }
        
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
                // Check global step count before each TantQue iteration
                globalSteps++;
                if (globalSteps > MAX_STEPS) {
                    throw new Error(
                        `Exécution interrompue : boucle infinie probable dans TantQue (plus de ${MAX_STEPS} instructions)`
                    );
                }
                
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
        // For loop - UPDATED to support all syntax variations
        else if (line.startsWith('pour ')) {
            const match = line.match(/pour\s+(\w+)\s*(?:de\s+|<-\s*)(.+?)\s+(?:allant\s+)?a\s+(.+?)(?:\s+pas\s+(.+?))?\s+faire/);
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
            
            // Detect obvious infinite loop conditions
            if (step === 0) {
                throw new Error(`Boucle infinie détectée! Le pas d'incrémentation ne peut pas être 0 (ligne ${i + 1})`);
            }
            
            if (step > 0 && start > end) {
                throw new Error(`Boucle invalide: début (${start}) > fin (${end}) avec pas positif (${step}) (ligne ${i + 1})`);
            }
            
            if (step < 0 && start < end) {
                throw new Error(`Boucle invalide: début (${start}) < fin (${end}) avec pas négatif (${step}) (ligne ${i + 1})`);
            }
            
            const loopEnd = findBlockEnd(lines, i, 'pour', 'finpour');
            
            for (let val = start; step > 0 ? val <= end : val >= end; val += step) {
                // Check global step count before each Pour iteration
                globalSteps++;
                if (globalSteps > MAX_STEPS) {
                    throw new Error(
                        `Exécution interrompue : boucle infinie probable dans Pour (plus de ${MAX_STEPS} instructions)`
                    );
                }
                
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


// Complete Enhanced Syntax Checker with Variable Declaration Checking

// Helper function to preserve strings while lowercasing
function lowercasePreservingStrings(code) {
    const stringPattern = /"([^"]*)"/g;
    const strings = [];
    let index = 0;
    
    // Extract strings
    const withPlaceholders = code.replace(stringPattern, (match) => {
        strings.push(match);
        return `__STRING_${index++}__`;
    });
    
    // Lowercase everything
    const lowercased = withPlaceholders.toLowerCase();
    
    // Restore strings
    let result = lowercased;
    for (let i = 0; i < strings.length; i++) {
        result = result.replace(`__string_${i}__`, strings[i]);
    }
    
    return result;
}

// Helper function to extract variable names from expressions
function extractVariablesFromExpression(expression, lineNum, usedVars, keywords) {
    // Remove string literals first to avoid false positives
    const withoutStrings = expression.replace(/"[^"]*"/g, '');
    
    // Match potential variable names (alphanumeric + underscore, starting with letter or underscore)
    const varPattern = /\b([a-z_][a-z0-9_]*)\b/gi;
    let match;
    
    while ((match = varPattern.exec(withoutStrings)) !== null) {
        const varName = match[1].toLowerCase();
        
        // Skip keywords and numbers
        if (!keywords.has(varName) && !/^\d+$/.test(varName)) {
            if (!usedVars.has(varName)) {
                usedVars.set(varName, lineNum);
            }
        }
    }
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

// Main syntax checker function
function checkSyntax(code) {
    const processedCode = lowercasePreservingStrings(code);
    const lines = processedCode.split('\n');
    
    let hasVar = false;
    let hasConst = false;

    let justSawVar = false;
    let justSawConst = false;
    
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
    
    // Track variable usage for undeclared variable checking
    const usedVars = new Map(); // Map<varName, lineNumber>
    
    // Valid types
    const validTypes = ['entier', 'reel', 'chaine', 'caractere', 'booleen', 'tableau'];
    
    // Keywords that should not be treated as variables
    const keywords = new Set([
        'algorithme', 'var', 'const', 'debut', 'fin', 'si', 'alors', 'sinon', 'finsi',
        'pour', 'de', 'a', 'pas', 'faire', 'finpour', 'tantque', 'fintantque',
        'ecrire', 'lire', 'vrai', 'faux', 'et', 'ou', 'non', 'div', 'mod', 'racine', 'sortir', 'allant'
    ]);
    
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

            hasVar = true;
            inVar = true;
            inConst = false;
            currentSection = 'var';

            justSawVar = true;
            justSawConst = false;
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

            hasConst = true;
            inConst = true;
            inVar = false;
            currentSection = 'const';

            justSawConst = true;
            justSawVar = false;
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
            const varMatch = line.match(
                /^([a-z_][a-z0-9_]*(?:\s*,\s*[a-z_][a-z0-9_]*)*)\s*:\s*([a-z]+)\s*;?\s*$/i
            );

            if (!varMatch) {
                return createError(
                    'INVALID_VAR_DECLARATION',
                    lineNum,
                    line,
                    'Déclaration de variable invalide',
                    'Format attendu: nomVariable: type;',
                    'x, y: entier;\nnom: chaine;'
                );
            }

            const varNames = varMatch[1].split(',').map(v => v.trim());
            const varType = varMatch[2].toLowerCase();

            if (!validTypes.includes(varType)) {
                return createError(
                    'INVALID_TYPE',
                    lineNum,
                    line,
                    `Type "${varType}" invalide`,
                    `Types valides: ${validTypes.join(', ')}`,
                    'x: entier;\ny: reel;\nnom: chaine;'
                );
            }

            for (const varName of varNames) {
                if (!/^[a-z_][a-z0-9_]*$/i.test(varName)) {
                    return createError(
                        'INVALID_VAR_NAME',
                        lineNum,
                        line,
                        `Nom de variable "${varName}" invalide`,
                        'Les noms doivent commencer par une lettre ou "_" et contenir uniquement lettres, chiffres et "_"',
                        'maVariable: entier;\n_compteur: entier;'
                    );
                }

                if (declaredVars.has(varName)) {
                    return createError(
                        'DUPLICATE_VARIABLE',
                        lineNum,
                        line,
                        `Variable "${varName}" déjà déclarée`,
                        'Une variable ne peut être déclarée qu\'une seule fois',
                        'x: entier;'
                    );
                }

                if (declaredConsts.has(varName)) {
                    return createError(
                        'VAR_CONST_CONFLICT',
                        lineNum,
                        line,
                        `Conflit de nom avec la constante "${varName}"`,
                        'Un identifiant ne peut pas être à la fois variable et constante',
                        'Var\n    x: entier;\nConst\n    PI = 3.14;'
                    );
                }

                declaredVars.add(varName);
            }

            continue;
        }
        
        // 7. Check constant declarations (in Const section)
        if (inConst && currentSection === 'const') {
            const constMatch = line.match(
                /^([a-z_][a-z0-9_]*)\s*=\s*(.+?)\s*;?\s*$/i
            );

            if (!constMatch) {
                return createError(
                    'INVALID_CONST_DECLARATION',
                    lineNum,
                    line,
                    'Déclaration de constante invalide',
                    'Format attendu: NOM = valeur;',
                    'PI = 3.14;\nMAX = 100;'
                );
            }

            const constName = constMatch[1];
            const constValue = constMatch[2].trim();

            if (!/^[a-z_][a-z0-9_]*$/i.test(constName)) {
                return createError(
                    'INVALID_CONST_NAME',
                    lineNum,
                    line,
                    `Nom de constante "${constName}" invalide`,
                    'Les noms doivent commencer par une lettre ou "_"',
                    'PI = 3.14;\nMAX_VALUE = 100;'
                );
            }

            if (declaredConsts.has(constName)) {
                return createError(
                    'DUPLICATE_CONSTANT',
                    lineNum,
                    line,
                    `Constante "${constName}" déjà déclarée`,
                    'Une constante ne peut être déclarée qu\'une seule fois',
                    'PI = 3.14;'
                );
            }

            if (declaredVars.has(constName)) {
                return createError(
                    'CONST_VAR_CONFLICT',
                    lineNum,
                    line,
                    `Conflit de nom avec la variable "${constName}"`,
                    'Un identifiant ne peut pas être à la fois variable et constante',
                    'Const\n    MAX = 100;'
                );
            }

            // Basic value validation (number, string, boolean)
            const isValidValue =
                /^-?\d+(\.\d+)?$/.test(constValue) ||                  // number
                /^".*"$/.test(constValue) ||                           // string
                /^(vrai|faux)$/i.test(constValue);                     // boolean

            if (!isValidValue) {
                return createError(
                    'INVALID_CONST_VALUE',
                    lineNum,
                    line,
                    `Valeur de constante invalide`,
                    'Une constante doit être un nombre, une chaîne ou un booléen',
                    'PI = 3.14;\nMSG = "Bonjour";\nOK = vrai;'
                );
            }

            declaredConsts.add(constName);
            continue;
        }
        
        // 8. Check statements (after Debut) and track variable usage
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
                // Extract variables from condition
                extractVariablesFromExpression(siMatch[1], lineNum, usedVars, keywords);
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
            
            // Check Pour loop - UPDATED to support all syntax variations
            if (line.startsWith('pour ')) {
                const pourMatch = line.match(/^pour\s+([a-z_][a-z0-9_]*)\s*(?:de\s+|<-\s*)(.+?)\s+(?:allant\s+)?a\s+(.+?)(?:\s+pas\s+(.+?))?\s+faire\s*$/i);
                if (!pourMatch) {
                    return createError('INVALID_POUR', lineNum, line,
                        'Structure "Pour" invalide',
                        'Formats attendus:\n- pour variable de debut a fin faire\n- pour variable <- debut a fin faire\n- pour variable de debut allant a fin faire\n- pour variable de debut a fin pas increment faire',
                        'pour i de 1 a 10 faire\n    ecrire(i);\nfinpour\n\npour i <- 1 a 10 faire\n    ecrire(i);\nfinpour\n\npour i de 1 allant a 10 faire\n    ecrire(i);\nfinpour\n\npour i de 1 a 10 pas 2 faire\n    ecrire(i);\nfinpour');
                }
                // Track loop variable
                const loopVar = pourMatch[1];
                usedVars.set(loopVar, lineNum);
                
                // Extract variables from expressions (de/a/pas)
                extractVariablesFromExpression(pourMatch[2], lineNum, usedVars, keywords);
                extractVariablesFromExpression(pourMatch[3], lineNum, usedVars, keywords);
                if (pourMatch[4]) {
                    extractVariablesFromExpression(pourMatch[4], lineNum, usedVars, keywords);
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
                // Extract variables from condition
                extractVariablesFromExpression(tantqueMatch[1], lineNum, usedVars, keywords);
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
                // Track variable on left side (being assigned to)
                const varName = assignMatch[1];
                usedVars.set(varName, lineNum);
                
                // Extract variables from right side expression
                extractVariablesFromExpression(assignMatch[2], lineNum, usedVars, keywords);
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
                // Track variables being read into
                const vars = lireMatch[1].split(',').map(v => v.trim());
                for (const varName of vars) {
                    if (/^[a-z_][a-z0-9_]*$/i.test(varName)) {
                        usedVars.set(varName, lineNum);
                    }
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
                // Extract variables from expressions
                extractVariablesFromExpression(ecrireMatch[1], lineNum, usedVars, keywords);
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
    
    if (!hasVar) {
        return createError(
            'MISSING_VAR',
            1,
            '',
            'Section "Var" manquante ou déclarée sur la même ligne',
            'La section "Var" est obligatoire et doit être déclarée sur une ligne séparée, même si aucune variable n est définie.',
            'Algorithme MonAlgorithme;\nVar\n    n: entier;\nDebut\n    // code\nFin'
        );
    }
    
    if (blockStack.length > 0) {
        const unclosed = blockStack[blockStack.length - 1];
        return createError('UNCLOSED_BLOCK_END', unclosed.line, '',
            `Bloc "${unclosed.type}" non fermé (ligne ${unclosed.line})`,
            `Vous devez fermer le bloc "${unclosed.type}" avec "${unclosed.closer}"`,
            getBlockExample(unclosed.type));
    }
    
    // Check for undeclared variables
    const allDeclared = new Set([...declaredVars, ...declaredConsts]);
    const undeclaredVars = [];
    
    for (const [varName, lineNum] of usedVars.entries()) {
        if (!allDeclared.has(varName) && !keywords.has(varName.toLowerCase())) {
            undeclaredVars.push({ name: varName, line: lineNum });
        }
    }
    
    if (undeclaredVars.length > 0) {
        // Report the first undeclared variable
        const firstUndeclared = undeclaredVars[0];
        const allUndeclaredNames = undeclaredVars.map(v => v.name).join(', ');
        
        return createError(
            'UNDECLARED_VARIABLE',
            firstUndeclared.line,
            '',
            `Variable(s) non déclarée(s): ${allUndeclaredNames}`,
            'Toutes les variables utilisées doivent être déclarées dans la section "Var" ou "Const"',
            `Var\n    ${firstUndeclared.name}: entier;\nDebut\n    ${firstUndeclared.name} <- 10;\nFin`
        );
    }
    
    // All checks passed!
    return { isValid: true, errors: [] };
}

// UI Functions for displaying results
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

function closeSyntaxModal() {
    document.getElementById('syntaxModal').classList.remove('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Function to check syntax only (without running)
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

// Function to validate and run (if you have a runAlgorithm function)
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
        // If you have a runAlgorithm function, call it here
        if (typeof runAlgorithm === 'function') {
            runAlgorithm();
        } else {
            showSyntaxSuccess();
        }
    } else {
        showSyntaxError(result);
    }
}
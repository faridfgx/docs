// Undo/Redo history
let history = [];
let historyIndex = -1;
let isUndoRedo = false;
let globalSteps = [];   // Used to store step-by-step execution if needed
const MAX_STEPS = 1000; // Maximum allowed steps to prevent infinite loops

// Variables for algorithm execution
let variables = {};
let variableTypes = {}; // Store declared types
let constants = {};
let output = [];
let waitingForInput = false;
let inputResolve = null;

// Type definitions
const TYPES = {
    ENTIER: 'entier',
    REEL: 'reel',
    CHAINE: 'chaine',
    CARACTERE: 'caractere',
    BOOLEEN: 'booleen'
};

// Initialize templates dropdown
function initTemplates() {
    const select = document.getElementById('templateSelect');
    if (typeof templates !== 'undefined') {
        templates.forEach((template, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = template.name;
            select.appendChild(option);
        });
    }
}

function loadTemplate() {
    const select = document.getElementById('templateSelect');
    const index = select.value;
    if (index !== '' && typeof templates !== 'undefined') {
        setEditorContent(templates[index].code);
        select.value = '';
    }
	updateLineNumbers();
}

// File operations
function newFile() {
    if (confirm('Créer un nouveau fichier? Les modifications non sauvegardées seront perdues.')) {
        setEditorContent('');
    }
}

function saveFile() {
    const content = document.getElementById('codeEditor').value;
    
    // Extract algorithm name from code
    let filename = 'algorithme';
    const lines = content.split('\n');
    
    for (let line of lines) {
        const trimmedLine = line.trim().toLowerCase();
        if (trimmedLine.startsWith('algorithme ')) {
            // Extract the name after "Algorithme"
            const match = line.trim().match(/algorithme\s+([a-z0-9_]+)/i);
            if (match && match[1]) {
                filename = match[1];
                break;
            }
        }
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.algo`;
    a.click();
    URL.revokeObjectURL(url);
}

function openFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            setEditorContent(e.target.result);
        };
        reader.readAsText(file);
    }
	updateLineNumbers();
}

// Undo/Redo functionality
function saveHistory() {
    if (isUndoRedo) return;
    
    const content = document.getElementById('codeEditor').value;
    
    history = history.slice(0, historyIndex + 1);
    history.push(content);
    historyIndex++;
    
    if (history.length > 50) {
        history.shift();
        historyIndex--;
    }
}

function undo() {
    if (historyIndex > 0) {
        isUndoRedo = true;
        historyIndex--;
        const editor = document.getElementById('codeEditor');
        editor.value = history[historyIndex];
        highlightCode(); // Update syntax highlighting
        isUndoRedo = false;
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        isUndoRedo = true;
        historyIndex++;
        const editor = document.getElementById('codeEditor');
        editor.value = history[historyIndex];
        highlightCode(); // Update syntax highlighting
        isUndoRedo = false;
    }
}

function setEditorContent(content) {
    document.getElementById('codeEditor').value = content;
    saveHistory();
    highlightCode();
}

// Define keywords for pseudocode language
const keywords = [
    'Algorithme', 'Var','Const', 'Debut', 'Fin', 
    'ecrire', 'lire', 
    'reel', 'entier', 'chaine', 'booleen', 'caractere', 'Tableau',
    'Si', 'Alors', 'Sinon', 'FinSi',
    'Pour', 'de', 'a', 'faire', 'FinPour', 'finpour', 'FinTantQue', 'TantQue', 'sortir'
];

// Helper function to escape HTML characters
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightCode() {
    const editor = document.getElementById('codeEditor');
    const highlightLayer = document.getElementById('highlightLayer');
    const code = editor.value;
    
    // Tokenize the code
    let tokens = [];
    let escaped = escapeHtml(code);
    
    // Match comments
    let regex = /\/\/.*/g;
    let match;
    while ((match = regex.exec(escaped)) !== null) {
        tokens.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'comment',
            text: match[0]
        });
    }
    
    // Match strings (with escaped quotes)
    regex = /"[^"]*"/g;
    while ((match = regex.exec(escaped)) !== null) {
        if (!isInsideToken(tokens, match.index)) {
            tokens.push({
                start: match.index,
                end: match.index + match[0].length,
                type: 'string',
                text: match[0]
            });
        }
    }
    
    regex = /'[^']*'/g;
    while ((match = regex.exec(escaped)) !== null) {
        if (!isInsideToken(tokens, match.index)) {
            tokens.push({
                start: match.index,
                end: match.index + match[0].length,
                type: 'string',
                text: match[0]
            });
        }
    }
    
    // Match numbers
    regex = /\b\d+\.?\d*\b/g;
    while ((match = regex.exec(escaped)) !== null) {
        if (!isInsideToken(tokens, match.index)) {
            tokens.push({
                start: match.index,
                end: match.index + match[0].length,
                type: 'number',
                text: match[0]
            });
        }
    }
    
    // Match keywords
    keywords.forEach(keyword => {
        regex = new RegExp('\\b' + keyword + '\\b', 'gi');
        while ((match = regex.exec(escaped)) !== null) {
            if (!isInsideToken(tokens, match.index)) {
                tokens.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    type: 'keyword',
                    text: match[0]
                });
            }
        }
    });
    
    // Match operators (handle HTML entities)
    const operators = [
        '&lt;-', '&lt;=', '&gt;=', '&lt;&gt;', '&lt;', '&gt;',
        '==', '!=', '\\+', '-', '\\*', '/', '%', '='
    ];
    
    operators.forEach(op => {
        regex = new RegExp(op, 'g');
        while ((match = regex.exec(escaped)) !== null) {
            if (!isInsideToken(tokens, match.index)) {
                tokens.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    type: 'operator',
                    text: match[0]
                });
            }
        }
    });
    
    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);
    
    // Build highlighted HTML
    let result = '';
    let lastIndex = 0;
    
    for (let token of tokens) {
        // Add unhighlighted text before this token
        result += escaped.substring(lastIndex, token.start);
        // Add highlighted token
        result += `<span class="${token.type}">${token.text}</span>`;
        lastIndex = token.end;
    }
    
    // Add remaining text
    result += escaped.substring(lastIndex);
    
    highlightLayer.innerHTML = result;
    syncScroll();
}

// Check if a position is already inside a token
function isInsideToken(tokens, position) {
    return tokens.some(token => position >= token.start && position < token.end);
}

// Function to sync scroll between editor and highlight layer
function syncScroll() {
    const editor = document.getElementById('codeEditor');
    const highlightLayer = document.getElementById('highlightLayer');
    highlightLayer.scrollTop = editor.scrollTop;
    highlightLayer.scrollLeft = editor.scrollLeft;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('codeEditor');
    
    // Set initial value if highlightLayer has content
    const highlightLayer = document.getElementById('highlightLayer');
    if (highlightLayer.textContent && !editor.value) {
        editor.value = highlightLayer.textContent;
    }
    
    // Load templates
    initTemplates();
    if (typeof templates !== 'undefined' && templates.length > 0 && !editor.value) {
        setEditorContent(templates[0].code);
		updateLineNumbers();
    } else {
        // Save initial state to history if not loading template
        saveHistory();
    }
    
    // Initial highlight
    highlightCode();
    
    // Update highlighting and save history on input
    let inputTimeout;
    editor.addEventListener('input', function() {
        highlightCode();
        
        // Debounce history saving to avoid too many entries while typing
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
            saveHistory();
        }, 300);
    });
    
    // Sync scrolling
    editor.addEventListener('scroll', syncScroll);
    
    // Add keyboard shortcuts for undo/redo
    document.addEventListener('keydown', function(e) {
        // Ctrl+Z or Cmd+Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        // Ctrl+Shift+Z or Cmd+Shift+Z for redo
        else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
            e.preventDefault();
            redo();
        }
        // Alternative: Ctrl+Y or Cmd+Y for redo
        else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
    });
});

// Algorithm execution functions
function print(message, type = '') {
    const className = type ? ` class="${type}"` : '';
    output.push(`<span${className}>${escapeHtml(String(message))}</span>`);
    updateOutput();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateOutput() {
    document.getElementById('output').innerHTML = output.join('\n');
    document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
}

async function readInput(prompt = '') {
    return new Promise((resolve) => {
        const inputArea = document.getElementById('inputArea');
        const inputPrompt = document.getElementById('inputPrompt');
        const userInput = document.getElementById('userInput');

        inputPrompt.textContent = prompt || 'Entrez une valeur:';
        inputArea.classList.add('active');
        userInput.value = '';
        userInput.focus();

        waitingForInput = true;
        inputResolve = resolve;
    });
}

function submitInput() {
    if (!waitingForInput) return;

    const userInput = document.getElementById('userInput');
    const value = userInput.value.trim();

    if (value === '') {
        print('⚠️ Veuillez entrer une valeur', 'error');
        return;
    }

    print(`> ${value}`, 'info');

    const inputArea = document.getElementById('inputArea');
    inputArea.classList.remove('active');

    waitingForInput = false;
    if (inputResolve) {
        inputResolve(value);
        inputResolve = null;
    }
}

document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitInput();
    }
});

// Type checking functions
function getValueType(value) {
    if (typeof value === 'boolean') return TYPES.BOOLEEN;
    if (typeof value === 'number') {
        return Number.isInteger(value) ? TYPES.ENTIER : TYPES.REEL;
    }
    if (typeof value === 'string') {
        return value.length === 1 ? TYPES.CARACTERE : TYPES.CHAINE;
    }
    return null;
}

function isTypeCompatible(value, expectedType) {
    const valueType = getValueType(value);
    
    // Exact match
    if (valueType === expectedType) return true;
    
    // Entier can be assigned to Reel
    if (expectedType === TYPES.REEL && valueType === TYPES.ENTIER) return true;
    
    // Caractere can be assigned to Chaine
    if (expectedType === TYPES.CHAINE && valueType === TYPES.CARACTERE) return true;
    
    return false;
}

function checkVariableDeclared(varName) {
    if (!variableTypes.hasOwnProperty(varName) && !constants.hasOwnProperty(varName)) {
        throw new Error(`Variable '${varName}' non déclarée`);
    }
}

function checkTypeAssignment(varName, value) {
    if (constants.hasOwnProperty(varName)) {
        throw new Error(`Impossible de modifier la constante '${varName}'`);
    }
    
    checkVariableDeclared(varName);
    
    const expectedType = variableTypes[varName];
    if (!isTypeCompatible(value, expectedType)) {
        throw new Error(`Type incompatible pour '${varName}': attendu ${expectedType}, reçu ${getValueType(value)}`);
    }
}

function parseValue(value, expectedType = null) {
    value = String(value).trim();
    
    // Boolean
    if (value === 'vrai') return true;
    if (value === 'faux') return false;
    
    // String
    if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1);
    }
    
    // Number
    if (!isNaN(value) && value !== '') {
        const num = value.includes('.') ? parseFloat(value) : parseInt(value);
        
        // Check type compatibility if expected type is provided
        if (expectedType) {
            if (expectedType === TYPES.ENTIER && !Number.isInteger(num)) {
                throw new Error(`Type incompatible: attendu entier, reçu ${num}`);
            }
        }
        
        return num;
    }
    
    return value;
}

function evaluateExpression(expr) {
    expr = String(expr).trim();
    
    // Handle string literals FIRST - extract and protect them
    const stringLiterals = [];
    let stringIndex = 0;
    
    // Replace all string literals with placeholders
    expr = expr.replace(/"[^"]*"/g, (match) => {
        const placeholder = `__STRING_${stringIndex}__`;
        stringLiterals.push({ placeholder, value: match.slice(1, -1) });
        stringIndex++;
        return `"${placeholder}"`;
    });
    
    expr = expr.replace(/'[^']*'/g, (match) => {
        const placeholder = `__STRING_${stringIndex}__`;
        stringLiterals.push({ placeholder, value: match.slice(1, -1) });
        stringIndex++;
        return `"${placeholder}"`;
    });
    
    // Replace boolean keywords
    expr = expr.replace(/\bvrai\b/g, 'true');
    expr = expr.replace(/\bfaux\b/g, 'false');
    
    // Extract all variable names from expression (now strings are protected)
    const varPattern = /\b([a-z_][a-z0-9_]*)\b/gi;
    const matches = expr.match(varPattern);
    
    if (matches) {
        const uniqueVars = [...new Set(matches.filter(v => 
            !['true', 'false', 'et', 'ou', 'non', 'mod', 'div', 'puissance', 'racine'].includes(v.toLowerCase()) &&
            !v.startsWith('__STRING_')
        ))];
        
        // Check all variables are declared
        for (let varName of uniqueVars) {
            checkVariableDeclared(varName);
        }
    }
    
    // Replace variables with their values
    for (let [key, value] of Object.entries({...constants, ...variables})) {
        const regex = new RegExp('\\b' + key + '\\b', 'g');
        const replacement = (typeof value === 'number' && value < 0) ? `(${value})` : JSON.stringify(value);
        expr = expr.replace(regex, replacement);
    }
    
    // Replace operators
    expr = expr.replace(/\bet\b/g, '&&');
    expr = expr.replace(/\bou\b/g, '||');
    expr = expr.replace(/\bnon\b/g, '!');
    expr = expr.replace(/==/g, '===');
    expr = expr.replace(/([^=!<>])=([^=])/g, '$1===$2');
    expr = expr.replace(/<>/g, '!==');
    expr = expr.replace(/\bmod\b/g, '%');
    expr = expr.replace(/(\S+)\s+div\s+(\S+)/g, 'Math.floor($1/$2)');
    expr = expr.replace(/\bpuissance\b/g, '**');
    expr = expr.replace(/racine\s*\(/g, 'Math.sqrt(');
    
    // Restore string literals
    for (let { placeholder, value } of stringLiterals) {
        expr = expr.replace(new RegExp(`"${placeholder}"`, 'g'), JSON.stringify(value));
    }
    
    try {
        return eval(expr);
    } catch (e) {
        throw new Error(`Erreur d'évaluation: ${expr}`);
    }
}

async function executeLines(lines, start, end) {
    let i = start;
    
    while (i <= end) {
        let line = lines[i].trim();
        
        if (!line || line.startsWith('//')) {
            i++;
            continue;
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
                    // For chaine and caractere types, accept raw input without quotes
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
		else if (line.toLowerCase().startsWith('pour ')) {
			// Match the 4 allowed variants
			const match = line.match(/pour\s+(\w+)\s*(?:<-|de)\s*(.+?)\s+a\s+(.+?)(?:\s+pas\s+(.+?))?\s+faire/i);
			if (!match) {
				throw new Error(`Syntaxe invalide pour la boucle POUR (ligne ${i + 1}). Exemples valides: 
					"pour i de 1 a n faire", 
					"pour i de 1 a n pas x faire", 
					"pour i <- 1 a n faire", 
					"pour i <- 1 a n pas x faire"`);
			}

			const varName = match[1];
			const startExpr = match[2];
			const endExpr = match[3];
			const stepExpr = match[4] ?? '1'; // Default step is 1

			checkVariableDeclared(varName);
			if (variableTypes[varName] !== TYPES.ENTIER) {
				throw new Error(`La variable de boucle '${varName}' doit être de type entier`);
			}

			const start = evaluateExpression(startExpr);
			const end = evaluateExpression(endExpr);
			const step = evaluateExpression(stepExpr);

			if (![start, end, step].every(Number.isInteger)) {
				throw new Error(`Les bornes et le pas de la boucle doivent être des entiers`);
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

			i = loopEnd; // Skip to end of loop
		}
        // Break statement
        else if (line === 'sortir;') {
            throw new Error('BREAK');
        }
        
        i++;
    }
}

function findBlockEnd(lines, start, startKeyword, endKeyword) {
    let depth = 1;
    for (let i = start + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith(startKeyword + ' ')) depth++;
        if (line === endKeyword) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return lines.length - 1;
}

function findSinon(lines, start, end) {
    let depth = 0;
    for (let i = start; i < end; i++) {
        const line = lines[i].trim();
        if (line.startsWith('si ')) depth++;
        if (line === 'finsi') depth--;
        if (line === 'sinon' && depth === 1) return i;
    }
    return -1;
}

function lowercasePreservingStrings(code) {
    let result = '';
    let inString = false;
    
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        
        if (char === '"') {
            inString = !inString;
            result += char;
        } else if (inString) {
            result += char;
        } else {
            result += char.toLowerCase();
        }
    }
    
    return result;
}

async function runAlgorithm() {
	if (!stepMode) {
    hideStepUI();
}
    const code = document.getElementById('codeEditor').value;
    
    variables = {};
    variableTypes = {};
    constants = {};
    output = [];
    
    document.getElementById('output').innerHTML = '';
    
    try {
        const processedCode = lowercasePreservingStrings(code);
        const lines = processedCode.split('\n');
        let inVar = false;
        let inConst = false;
        let debutIndex = -1;
        
        // Parse declarations
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line === 'var') {
                inVar = true;
                inConst = false;
            } else if (line === 'const') {
                inConst = true;
                inVar = false;
            } else if (line === 'debut') {
                debutIndex = i;
                break;
            } else if (inVar && line && !line.startsWith('//')) {
                const parts = line.split(':');
                if (parts.length === 2) {
                    const varNames = parts[0].split(',').map(v => v.trim());
                    const type = parts[1].replace(';', '').trim();
                    
                    if (!Object.values(TYPES).includes(type)) {
                        throw new Error(`Type inconnu: '${type}'. Types valides: ${Object.values(TYPES).join(', ')}`);
                    }
                    
                    for (let varName of varNames) {
                        variableTypes[varName] = type;
                        // Initialize with default value based on type
                        switch(type) {
                            case TYPES.ENTIER:
                            case TYPES.REEL:
                                variables[varName] = 0;
                                break;
                            case TYPES.CHAINE:
                                variables[varName] = '';
                                break;
                            case TYPES.CARACTERE:
                                variables[varName] = '';
                                break;
                            case TYPES.BOOLEEN:
                                variables[varName] = false;
                                break;
                        }
                    }
                }
            } else if (inConst && line && !line.startsWith('//')) {
                const match = line.match(/(\w+)\s*=\s*(.+?);?$/);
                if (match) {
                    const constName = match[1];
                    const value = parseValue(match[2]);
                    constants[constName] = value;
                }
            }
        }
        
        if (debutIndex === -1) {
            throw new Error('Mot-clé "Debut" non trouvé');
        }
        
        const finIndex = lines.findIndex((l, i) => i > debutIndex && l.trim() === 'fin');
        if (finIndex === -1) {
            throw new Error('Mot-clé "Fin" non trouvé');
        }
        
        print('=== Exécution de l\'algorithme ===\n', 'success');
        await executeLines(lines, debutIndex + 1, finIndex - 1);
        print('\n=== Terminé ===', 'success');
        
    } catch (e) {
        if (e.message !== 'BREAK') {
            print(`\n❌ Erreur: ${e.message}`, 'error');
        }
    }
}

function clearEditor() {
    if (confirm('Effacer tout le contenu de l\'éditeur?')) {
        setEditorContent('');
        document.getElementById('output').innerHTML = '';
        output = [];
    }
}

/**
 * AlgoFX - Enhanced Real-time Error Highlighting System v5
 * Comprehensive validation with strict rules for pseudocode syntax
 */

class AlgoErrorHighlighter {
    constructor() {
        this.editor = null;
        this.errorContainer = null;
        this.errors = [];
        this.debounceTimer = null;

        // Define all reserved keywords
        this.keywords = new Set([
            'algorithme', 'var', 'const', 'debut', 'fin',
            'si', 'alors', 'sinon', 'finsi',
            'pour', 'de', 'pas', 'faire', 'finpour',
            'tantque', 'fintantque',
            'ecrire', 'lire', 'sortir',
            'et', 'ou', 'non',
            'mod', 'div', 'puissance', 'racine',
            'vrai', 'faux',
            'entier', 'reel', 'chaine', 'caractere', 'booleen', 'tableau'
        ]);

        // Keywords that must be alone on their line (no semicolon)
        this.standaloneKeywords = new Set([
            'var', 'const', 'debut', 'fin', 'sinon', 'finsi', 'finpour', 'fintantque'
        ]);

        // Keywords that start control structures (no semicolon at end)
        this.controlStartKeywords = new Set([
            'si', 'pour', 'tantque'
        ]);

        // console.debug('[AlgoFX][Init] ErrorHighlighter created');
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.editor = document.getElementById('codeEditor');
        this.errorContainer = document.getElementById('errorIndicators');

        if (!this.editor || !this.errorContainer) {
            console.error('[AlgoFX][Init] Missing editor or error container');
            return;
        }

        // console.debug('[AlgoFX][Init] Elements found successfully');

        // Event listeners
        this.editor.addEventListener('input', () => {
            this.updateContainerHeight();
            this.debounce(() => this.validateCode(), 400);
        });

        this.editor.addEventListener('scroll', () => this.syncScroll());

        const codeArea = this.editor.closest('.code-area');
        if (codeArea) {
            codeArea.addEventListener('scroll', () => this.syncScroll());
        }

        // console.debug('[AlgoFX][Init] Event listeners attached');
        
        this.updateContainerHeight();
        this.validateCode();
        this.exposeGlobalMethods();
    }

    exposeGlobalMethods() {
        window.refreshErrorHighlighting = () => this.refresh();
        window.clearErrorHighlighting = () => this.clearErrors();
        // console.debug('[AlgoFX][Init] Global methods exposed');
    }

    debounce(fn, delay) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(fn, delay);
    }

    updateContainerHeight() {
        if (!this.editor || !this.errorContainer) return;

        const lineCount = this.editor.value.split('\n').length;
        const lineHeight = this.getLineHeight();
        const totalHeight = lineCount * lineHeight;
        const minHeight = this.editor.scrollHeight;
        const height = Math.max(totalHeight, minHeight, 100);

        this.errorContainer.style.height = `${height}px`;
        // console.debug('[AlgoFX][Height] Lines:', lineCount, 'Total:', height, 'px');
    }

    syncScroll() {
        if (!this.editor || !this.errorContainer) return;
        const scrollTop = this.editor.scrollTop;
        this.errorContainer.style.transform = `translateY(${-scrollTop}px)`;
    }

    /**
     * Remove comments and string literals from a line for validation
     */
    stripCommentsAndStrings(line) {
        let result = '';
        let inString = false;
        let stringChar = null;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            // Check for comment start (not in string)
            if (!inString && char === '/' && nextChar === '/') {
                break; // Rest of line is comment
            }
            
            // Toggle string state
            if ((char === '"' || char === "'") && (i === 0 || line[i-1] !== '\\')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                    result += ' '; // Replace string with space
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
                continue;
            }
            
            // If in string, replace with space
            if (inString) {
                result += ' ';
            } else {
                result += char;
            }
        }
        
        return result.trim();
    }

    /**
     * Check if an identifier is valid (variable, constant, or algorithm name)
     */
    isValidIdentifier(name) {
        // Must start with letter or underscore
        if (!/^[a-z_]/i.test(name)) {
            return { valid: false, reason: 'doit commencer par une lettre ou "_"' };
        }
        
        // Can only contain letters, digits, and underscores
        if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
            return { valid: false, reason: 'ne peut contenir que lettres, chiffres et "_"' };
        }
        
        // Cannot contain spaces
        if (/\s/.test(name)) {
            return { valid: false, reason: 'ne peut pas contenir d\'espaces' };
        }
        
        // Cannot be a keyword
        if (this.keywords.has(name.toLowerCase())) {
            return { valid: false, reason: 'est un mot-clé réservé' };
        }
        
        return { valid: true };
    }

    /**
     * Main validation function
     */
    validateCode() {
        if (!this.editor) return;

        const code = this.editor.value;
        const lines = code.split('\n');
        this.errors = [];

        if (!code.trim()) {
            // console.debug('[AlgoFX][Validate] Empty code - clearing errors');
            this.renderErrors();
            return;
        }

        let hasAlgorithme = false;
        let hasVar = false;
        let hasConst = false;
        let hasDebut = false;
        let inVarSection = false;
        let inConstSection = false;
        let afterDebut = false;

        lines.forEach((rawLine, i) => {
            const lineNum = i + 1;
            const originalLine = rawLine.trim();
            
            // Skip empty lines
            if (!originalLine) return;
            
            // Skip pure comment lines
            if (originalLine.startsWith('//')) return;
            
            // Process line (remove comments and strings)
            const line = this.stripCommentsAndStrings(originalLine).toLowerCase();
            
            // Skip if line becomes empty after stripping
            if (!line) return;

            // ========================================
            // 1. CHECK ALGORITHME DECLARATION (Line 1)
            // ========================================
            if (lineNum === 1) {
                const match = line.match(/^algorithme\s+(\w+)\s*;?\s*$/);
                if (!match) {
                    this.addError(lineNum, 'Ligne 1 doit être: Algorithme NomAlgo;', 'error');
                    return;
                } else {
                    hasAlgorithme = true;
                    const algoName = match[1];
                    const validation = this.isValidIdentifier(algoName);
                    if (!validation.valid) {
                        this.addError(lineNum, `Nom algorithme "${algoName}" ${validation.reason}`, 'error');
                    }
                }
                return;
            }

            // ========================================
            // 2. CHECK VAR SECTION
            // ========================================
            // Check if line starts with 'var' (with or without content after)
            if (line.startsWith('var')) {
                // Check if there's content after 'var' on the same line
                const afterVar = line.substring(3).trim();
                
                if (afterVar.length > 0) {
                    // There's content after 'var' - this is an error
                    this.addError(lineNum, 'Déclarez les variables sur les lignes suivantes, pas avec "Var"', 'error');
                    hasVar = true;
                    inVarSection = true;
                    inConstSection = false;
                    return;
                }
                
                // 'Var' is alone on the line - this is correct
                if (afterDebut) {
                    this.addError(lineNum, '"Var" doit être avant "Debut"', 'error');
                }
                hasVar = true;
                inVarSection = true;
                inConstSection = false;
                return;
            }

            // ========================================
            // 3. CHECK CONST SECTION
            // ========================================
            // Check if line starts with 'const' (with or without content after)
            if (line.startsWith('const')) {
                // Check if there's content after 'const' on the same line
                const afterConst = line.substring(5).trim();
                
                if (afterConst.length > 0) {
                    // There's content after 'const' - this is an error
                    this.addError(lineNum, 'Déclarez les constantes sur les lignes suivantes, pas avec "Const"', 'error');
                    hasConst = true;
                    inConstSection = true;
                    inVarSection = false;
                    return;
                }
                
                // 'Const' is alone on the line - this is correct
                if (afterDebut) {
                    this.addError(lineNum, '"Const" doit être avant "Debut"', 'error');
                }
                hasConst = true;
                inConstSection = true;
                inVarSection = false;
                return;
            }

            // ========================================
            // 4. CHECK DEBUT
            // ========================================
            if (line === 'debut') {
                if (!hasAlgorithme) {
                    this.addError(lineNum, '"Debut" sans déclaration Algorithme', 'error');
                }
                if (originalLine.toLowerCase() !== 'debut') {
                    this.addError(lineNum, '"Debut" doit être seul sur la ligne', 'error');
                }
                hasDebut = true;
                afterDebut = true;
                inVarSection = false;
                inConstSection = false;
                return;
            }

            // ========================================
            // 5. CHECK FIN
            // ========================================
            if (line === 'fin') {
                if (!hasDebut) {
                    this.addError(lineNum, '"Fin" sans "Debut"', 'error');
                }
                if (originalLine.toLowerCase() !== 'fin') {
                    this.addError(lineNum, '"Fin" doit être seul sur la ligne', 'error');
                }
                return;
            }

            // ========================================
            // 6. VARIABLE DECLARATIONS (in Var section)
            // ========================================
            if (inVarSection) {
                const varMatch = line.match(/^([a-z_][a-z0-9_,\s]*)\s*:\s*([a-z]+)\s*;?\s*$/i);
                if (!varMatch) {
                    this.addError(lineNum, 'Déclaration variable invalide (format: nom: type;)', 'error');
                    return;
                }

                const varNames = varMatch[1].split(',').map(v => v.trim());
                const varType = varMatch[2].toLowerCase();

                // Check if type is valid
                const validTypes = ['entier', 'reel', 'chaine', 'caractere', 'booleen', 'tableau'];
                if (!validTypes.includes(varType)) {
                    this.addError(lineNum, `Type "${varType}" invalide`, 'error');
                }

                // Validate each variable name
                varNames.forEach(varName => {
                    const validation = this.isValidIdentifier(varName);
                    if (!validation.valid) {
                        this.addError(lineNum, `Variable "${varName}" ${validation.reason}`, 'error');
                    }
                });

                // Check semicolon
                if (!originalLine.endsWith(';')) {
                    this.addError(lineNum, 'Point-virgule manquant', 'warning');
                }
                return;
            }

            // ========================================
            // 7. CONSTANT DECLARATIONS (in Const section)
            // ========================================
            if (inConstSection) {
                const constMatch = line.match(/^([a-z_][a-z0-9_]*)\s*=\s*(.+?)\s*;?\s*$/i);
                if (!constMatch) {
                    this.addError(lineNum, 'Déclaration constante invalide (format: NOM = valeur;)', 'error');
                    return;
                }

                const constName = constMatch[1];
                const validation = this.isValidIdentifier(constName);
                if (!validation.valid) {
                    this.addError(lineNum, `Constante "${constName}" ${validation.reason}`, 'error');
                }

                // Check semicolon
                if (!originalLine.endsWith(';')) {
                    this.addError(lineNum, 'Point-virgule manquant', 'warning');
                }
                return;
            }

            // ========================================
            // 8. STATEMENTS (after Debut)
            // ========================================
            if (afterDebut) {
                // Check standalone keywords
                if (this.standaloneKeywords.has(line)) {
                    if (line !== originalLine.toLowerCase()) {
                        this.addError(lineNum, `"${line}" doit être seul sur la ligne`, 'error');
                    }
                    return;
                }

                // Check Si statement
                if (line.startsWith('si ')) {
                    if (!line.includes(' alors')) {
                        this.addError(lineNum, 'Structure "Si" nécessite "alors"', 'error');
                    }
                    // Should not end with semicolon
                    if (originalLine.endsWith(';')) {
                        this.addError(lineNum, '"Si...alors" ne doit pas avoir de point-virgule', 'warning');
                    }
                    return;
                }

                // Check Pour loop
                if (line.startsWith('pour ')) {
                    if (!line.includes(' de ') || !line.includes(' a ') || !line.includes(' faire')) {
                        this.addError(lineNum, 'Structure "Pour" incomplète (pour X de A a B faire)', 'error');
                    }
                    // Should not end with semicolon
                    if (originalLine.endsWith(';')) {
                        this.addError(lineNum, '"Pour...faire" ne doit pas avoir de point-virgule', 'warning');
                    }
                    return;
                }

                // Check TantQue loop
                if (line.startsWith('tantque ')) {
                    if (!line.includes(' faire')) {
                        this.addError(lineNum, 'Structure "TantQue" nécessite "faire"', 'error');
                    }
                    // Should not end with semicolon
                    if (originalLine.endsWith(';')) {
                        this.addError(lineNum, '"TantQue...faire" ne doit pas avoir de point-virgule', 'warning');
                    }
                    return;
                }

                // Check lire() statement
                if (line.startsWith('lire(')) {
                    if (!line.includes(')')) {
                        this.addError(lineNum, 'Parenthèse fermante manquante pour lire()', 'error');
                    } else if (!originalLine.endsWith(';')) {
                        this.addError(lineNum, 'Point-virgule manquant après lire()', 'warning');
                    }
                    return;
                }

                // Check ecrire() statement
                if (line.startsWith('ecrire(')) {
                    if (!line.includes(')')) {
                        this.addError(lineNum, 'Parenthèse fermante manquante pour ecrire()', 'error');
                    } else if (!originalLine.endsWith(';')) {
                        this.addError(lineNum, 'Point-virgule manquant après ecrire()', 'warning');
                    }
                    return;
                }

                // Check sortir statement
                if (line === 'sortir' || line === 'sortir;') {
                    if (!originalLine.endsWith(';')) {
                        this.addError(lineNum, 'Point-virgule manquant après sortir', 'warning');
                    }
                    return;
                }

                // Check assignment (must have <-)
                if (line.includes('<-')) {
                    const assignMatch = line.match(/^([a-z_][a-z0-9_]*)\s*<-/i);
                    if (!assignMatch) {
                        this.addError(lineNum, 'Affectation invalide (format: variable <- expression;)', 'error');
                    } else if (!originalLine.endsWith(';')) {
                        this.addError(lineNum, 'Point-virgule manquant après affectation', 'warning');
                    }
                    return;
                }

                // Check for = instead of <-
                if (line.match(/^([a-z_][a-z0-9_]*)\s*=\s*[^=]/i) && !line.includes('==')) {
                    this.addError(lineNum, 'Utiliser "<-" pour affectation (pas "=")', 'error');
                    return;
                }

                // If line starts with identifier but no <-, it's an error
                const identMatch = line.match(/^([a-z_][a-z0-9_]*)\b/i);
                if (identMatch && !line.includes('<-') && !line.match(/^(lire|ecrire|sortir)/)) {
                    this.addError(lineNum, 'Instruction inconnue ou affectation "<-" manquante', 'error');
                }
            }
        });

        // console.debug('[AlgoFX][Validate]', this.errors.length, 'erreur(s) détectée(s)');
        this.renderErrors();
    }

    addError(line, message, severity) {
        // console.debug('[AlgoFX][Error]', { line, message, severity });
        this.errors.push({ line, message, severity });
    }

    renderErrors() {
        if (!this.errorContainer) return;

        this.errorContainer.innerHTML = '';
        const lh = this.getLineHeight();

        // console.debug('[AlgoFX][Render] Rendering', this.errors.length, 'errors');

        this.errors.forEach((err) => {
            const dot = document.createElement('div');
            dot.className = `error-indicator ${err.severity}`;
            
            const topPosition = (err.line - 1) * lh;
            dot.style.top = `${topPosition}px`;
            dot.dataset.tooltip = `Ligne ${err.line}: ${err.message}`;

            dot.addEventListener('click', () => {
                // console.debug('[AlgoFX][Click] Jumping to ligne', err.line);
                this.scrollToLine(err.line);
            });

            this.errorContainer.appendChild(dot);
        });

        this.syncScroll();
    }

    getLineHeight() {
        if (!this.editor) return 22;

        const computedStyle = getComputedStyle(this.editor);
        const lh = computedStyle.lineHeight;
        
        if (lh === 'normal') {
            const fontSize = parseFloat(computedStyle.fontSize);
            const lineHeight = fontSize * 1.5;
            return lineHeight;
        }
        
        return parseFloat(lh);
    }

    scrollToLine(n) {
        if (!this.editor) return;

        const lh = this.getLineHeight();
        const targetScroll = (n - 1) * lh - 40;
        
        this.editor.scrollTop = targetScroll;
        this.flashLine(n);
    }

    flashLine(n) {
        if (!this.editor) return;

        const parent = this.editor.parentElement;
        if (!parent) return;

        const lh = this.getLineHeight();

        const flash = document.createElement('div');
        flash.className = 'highlight-flash';
        flash.style.top = `${(n - 1) * lh}px`;
        flash.style.height = `${lh}px`;
        flash.style.transition = 'opacity 0.5s ease';

        parent.appendChild(flash);

        requestAnimationFrame(() => {
            flash.style.opacity = '1';
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 500);
            }, 150);
        });
    }

    clearErrors() {
        if (!this.errorContainer) return;
        this.errorContainer.innerHTML = '';
        this.errors = [];
        // console.debug('[AlgoFX][Clear] All errors cleared');
    }

    refresh() {
        // console.debug('[AlgoFX][Refresh] Manual refresh triggered');
        this.updateContainerHeight();
        this.validateCode();
    }
}

/* ===============================
   AUTO INIT
   =============================== */

window.algoErrorHighlighter = new AlgoErrorHighlighter();

window.refreshErrorHighlighting = function() {
    if (window.algoErrorHighlighter) {
        window.algoErrorHighlighter.refresh();
    }
};

window.clearErrorHighlighting = function() {
    if (window.algoErrorHighlighter) {
        window.algoErrorHighlighter.clearErrors();
    }
};

//console.log('[AlgoFX] Enhanced error highlighting system v5 loaded with comprehensive validation.');
// Add to your error indicator click handler
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('error-indicator')) {
        const message = e.target.getAttribute('data-tooltip');
        showToast(message);
    }
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
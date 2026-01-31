/**
 * AlgoFX - Real-time Error Highlighting System (FIXED)
 * Scroll-safe, pixel-aligned, debug-verbose
 */

class AlgoErrorHighlighter {
    constructor() {
        this.editor = null;
        this.errorContainer = null;
        this.errors = [];
        this.debounceTimer = null;

        console.debug('[AlgoFX][Init] ErrorHighlighter created');
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.editor = document.getElementById('codeEditor');
            this.errorContainer = document.getElementById('errorIndicators');

            if (!this.editor || !this.errorContainer) {
                console.error('[AlgoFX][Init] Missing editor or error container');
                return;
            }

            this.editor.addEventListener('input', () => {
                this.debounce(() => this.validateCode(), 400);
            });

            this.editor.addEventListener('scroll', () => this.syncScroll());

            console.debug('[AlgoFX][Init] Event listeners attached');
            this.validateCode();
        });
    }

    debounce(fn, delay) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(fn, delay);
    }

    syncScroll() {
        const y = this.editor.scrollTop;
        this.errorContainer.style.transform = `translateY(${-y}px)`;
        console.debug('[AlgoFX][Scroll] scrollTop =', y);
    }

    validateCode() {
        const lines = this.editor.value.split('\n');
        this.errors = [];

        lines.forEach((raw, i) => {
            const line = raw.trim();
            const n = i + 1;

            if (!line || line.startsWith('//')) return;

            if (n === 1) {
                if (!/^Algorithme\s+\w+\s*;$/i.test(line)) {
                    this.addError(n, 'Déclaration Algorithme invalide', 'error');
                }
                return;
            }

            if (!line.endsWith(';') &&
                !/(alors|faire|sinon|finsi|finpour|fintantque)$/i.test(line)) {
                this.addError(n, 'Point-virgule manquant', 'warning');
            }
        });

        console.debug('[AlgoFX][Validate]', this.errors.length, 'erreurs détectées');
        this.renderErrors();
    }

    addError(line, message, severity) {
        console.debug('[AlgoFX][Error]', { line, message, severity });
        this.errors.push({ line, message, severity });
    }

    renderErrors() {
        this.errorContainer.innerHTML = '';
        const lh = this.getLineHeight();

        console.debug('[AlgoFX][Render] lineHeight =', lh);

        this.errors.forEach(err => {
            const dot = document.createElement('div');
            dot.className = `error-indicator ${err.severity}`;
            dot.style.top = `${(err.line - 1) * lh}px`;
            dot.title = `Ligne ${err.line}: ${err.message}`;

            dot.addEventListener('click', () => {
                console.debug('[AlgoFX][Click] Ligne', err.line);
                this.scrollToLine(err.line);
            });

            this.errorContainer.appendChild(dot);
        });
    }

    getLineHeight() {
        const lh = getComputedStyle(this.editor).lineHeight;
        if (lh === 'normal') {
            console.warn('[AlgoFX][LineHeight] normal → fallback 22px');
            return 22;
        }
        return parseFloat(lh);
    }

    scrollToLine(n) {
        const lh = this.getLineHeight();
        this.editor.scrollTop = (n - 1) * lh - 40;
        this.flashLine(n);

        console.debug('[AlgoFX][ScrollTo] line', n);
    }

    flashLine(n) {
        const parent = this.editor.parentElement;
        const lh = this.getLineHeight();

        const flash = document.createElement('div');
        flash.className = 'highlight-flash';
        flash.style.top = `${(n - 1) * lh}px`;
        flash.style.height = `${lh}px`;

        parent.appendChild(flash);

        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 500);
        }, 150);

        console.debug('[AlgoFX][Flash] line', n);
    }
}

/* ===============================
   AUTO INIT
   =============================== */

window.algoErrorHighlighter = new AlgoErrorHighlighter();

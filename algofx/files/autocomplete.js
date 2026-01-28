if (typeof editor === "undefined") {
    console.error("Autocomplete: editor not found");
}

const box = document.getElementById("autocompleteBox");
const toggle = document.getElementById("autoCompleteToggle");

/* ================== AUTOCOMPLETE RULES ================== */

const FIRST_LINE_RULES = [
    { key: "al", value: "Algorithme " }
];

const VAR_TYPES = [
    { key: "en", value: "Entier;\n" },
    { key: "re", value: "Reel;\n" },
    { key: "ch", value: "Chaine;\n" },
    { key: "bo", value: "Boolean;\n" },
    { key: "ca", value: "Caractere;\n" }
];

const GENERAL_RULES = [
    { key: "var", value: "Var\n" },
    { key: "co", value: "Const\n" },
    { key: "de", value: "Debut\n" },
    { key: "fi", value: "Fin" }
];

const BODY_RULES = [
    { key: "li", value: "lire();" },
    { 
        key: "ec", 
        options: [ 
            { label: "Ecrire();", value: "Ecrire();" },
            { label: 'Ecrire("");', value: 'Ecrire("");' }
        ]
    },
    {
        key: "po",
        options: [
            {
                label: "pour … faire ",
                value: "pour i de 1 a n faire\n    \nfinpour"
            },
            {
                label: "pour … pas … faire",
                value: "pour i de 1 a n pas 2 faire\n    \nfinpour"
            }
        ]
    },
    {
        key: "si",
        options: [
            {
                label: "si … alors",
                value: "si condition alors\n    \nfinsi"
            },
            {
                label: "si … alors … sinon",
                value: "si condition alors\n    \nsinon\n    \nfinsi"
            }
        ]
    },
    {
        key: "ta",
        options: [
            {
                label: "tantque … faire",
                value: "tantque condition faire\n    \nfintantque"
            }
        ]
    },
    { key: "fs", value: "finsi" },
    { key: "ft", value: "fintantque" },
    { key: "fp", value: "finpour" }
];

let suggestions = [];
let selectedIndex = 0;
let replaceStart = 0;

/* ================== HELPER FUNCTIONS ================== */

function getLines(text) {
    return text.replace(/\r/g, '').split('\n');
}

function getContext() {
    const pos = editor.selectionStart;
    const text = editor.value;
    const before = text.substring(0, pos);
    const lines = getLines(before);

    const lineIndex = lines.length - 1;
    const currentLine = lines[lineIndex];

    let inVar = false;
    let inBody = false;

    for (let l of lines) {
        if (/^\s*Var\b/i.test(l)) inVar = true;
        if (/^\s*Debut\b/i.test(l)) { inVar = false; inBody = true; }
        if (/^\s*Fin\b/i.test(l)) inBody = false;
    }

    return { lineIndex, currentLine, inVar, inBody, pos };
}

/* Ensure autocomplete box is outside textarea */
if (box && box.parentElement.classList.contains("code-area")) {
    const editorWrapper = box.closest(".editor-wrapper");
    if (editorWrapper) {
        editorWrapper.appendChild(box);
    }
}

editor.addEventListener("input", handleAutoComplete);
editor.addEventListener("keydown", handleKeys);
editor.addEventListener("scroll", updateBoxPosition);

document.addEventListener("click", (e) => {
    if (!box.contains(e.target) && e.target !== editor) {
        hideBox();
    }
});

function handleAutoComplete() {
    if (!toggle.checked) return hideBox();

    const ctx = getContext();
    const line = ctx.currentLine;
    const pos = ctx.pos;

    suggestions = [];

    /* ---- FIRST LINE (Algorithme) ---- */
    if (ctx.lineIndex === 0) {
        const match = line.match(/(\w+)$/);
        if (!match) return hideBox();

        const key = match[1].toLowerCase();
        replaceStart = pos - key.length;

        FIRST_LINE_RULES.forEach(rule => {
            if (rule.key.startsWith(key)) {
                suggestions.push(rule.options || [rule.value]);
            }
        });

        if (suggestions.length) {
            suggestions = suggestions.flat();
            selectedIndex = 0;
            return positionAndShowBox();
        }
        return hideBox();
    }

    /* ---- VAR TYPES (after colon :) ---- */
    if (ctx.inVar) {
        const match = line.match(/:\s*(\w*)$/);
        if (match) {
            const key = match[1].toLowerCase();
            replaceStart = pos - key.length;

            VAR_TYPES.forEach(rule => {
                if (rule.key.startsWith(key)) {
                    suggestions.push(rule.value);
                }
            });

            if (suggestions.length) {
                selectedIndex = 0;
                return positionAndShowBox();
            }
        }
    }

    /* ---- GENERAL KEYWORDS (Var, Const, Debut, Fin) ---- */
    const generalMatch = line.match(/(?:^|\s)([a-zA-Z]{2,})$/);
    if (generalMatch) {
        const key = generalMatch[1].toLowerCase();
        replaceStart = pos - key.length;

        GENERAL_RULES.forEach(rule => {
            if (rule.key.startsWith(key)) {
                suggestions.push(rule.options || [rule.value]);
            }
        });

        if (suggestions.length) {
            suggestions = suggestions.flat();
            selectedIndex = 0;
            return positionAndShowBox();
        }
    }

    /* ---- BODY KEYWORDS ---- */
    if (ctx.inBody) {
        const match = line.match(/(?:^|\s)([a-zA-Z]{2,})$/);
        if (!match) return hideBox();

        const key = match[1].toLowerCase();
        replaceStart = pos - key.length;

        BODY_RULES.forEach(rule => {
            if (rule.key === key || rule.key.startsWith(key)) {
                suggestions.push(rule.options || [rule.value]);
            }
        });

        if (suggestions.length) {
            suggestions = suggestions.flat();
            selectedIndex = 0;
            return positionAndShowBox();
        }
    }

    hideBox();
}

function getCaretCoordinates() {
    const pos = editor.selectionStart;
    const textBeforeCursor = editor.value.substring(0, pos);
    const lines = textBeforeCursor.split("\n");

    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20;
    const paddingTop = parseFloat(getComputedStyle(editor).paddingTop) || 10;

    const top = paddingTop + (lines.length * lineHeight) - editor.scrollTop;
    const left = 50;

    return { top, left };
}

function positionAndShowBox() {
    const coords = getCaretCoordinates();
    box.style.top = `${coords.top}px`;
    box.style.left = `${coords.left}px`;
    showBox();
}

function updateBoxPosition() {
    if (box.style.display === "block") {
        positionAndShowBox();
    }
}

function showBox() {
    box.innerHTML = "";

    suggestions.forEach((item, i) => {
        const div = document.createElement("div");
        div.className = "autocomplete-item" + (i === selectedIndex ? " active" : "");

        const label = typeof item === "string"
            ? item.split("\n")[0] + (item.includes("\n") ? " ..." : "")
            : item.label;

        div.textContent = label;
        div.title = typeof item === "string" ? item : item.value;

        div.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            applySuggestion(typeof item === "string" ? item : item.value);
        };

        box.appendChild(div);
    });

    box.style.display = "block";
}

function hideBox() {
    box.style.display = "none";
    suggestions = [];
}

function applySuggestion(text) {
    const pos = editor.selectionStart;
    const before = editor.value.slice(0, replaceStart);
    const after = editor.value.slice(pos);

    editor.value = before + text + after;

    if (typeof updateHighlighting === "function") {
        updateHighlighting();
    }

    let cursorPos = before.length + text.length;

    // Smart cursor positioning
    if (text.includes("condition")) {
        const cPos = before.length + text.indexOf("condition");
        editor.selectionStart = cPos;
        editor.selectionEnd = cPos + 9;
    } else if (text.includes('""')) {
        const qPos = before.length + text.indexOf('""') + 1;
        editor.selectionStart = editor.selectionEnd = qPos;
    } else if (text.includes("i de")) {
        const iPos = before.length + text.indexOf("i de");
        editor.selectionStart = iPos;
        editor.selectionEnd = iPos + 1;
    } else if (text.includes("()")) {
        const pPos = before.length + text.indexOf("()") + 1;
        editor.selectionStart = editor.selectionEnd = pPos;
    } else {
        editor.selectionStart = editor.selectionEnd = cursorPos;
    }

    hideBox();
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.focus();
}

function handleKeys(e) {
    if (box.style.display !== "block") return;

    const items = box.children;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection(items);
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelection(items);
    } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const item = suggestions[selectedIndex];
        applySuggestion(typeof item === "string" ? item : item.value);
    } else if (e.key === "Escape") {
        e.preventDefault();
        hideBox();
    }
}

function updateSelection(items) {
    [...items].forEach((el, i) => {
        el.classList.toggle("active", i === selectedIndex);
    });
    items[selectedIndex].scrollIntoView({ block: "nearest" });
}
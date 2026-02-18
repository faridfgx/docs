function fixIndentation() {
    const editor = document.getElementById("codeEditor");
    const lines = editor.value.split("\n");

    const indentSize = 4;
    let indentLevel = 0;
    let section = null; // "var", "const", "debut"
    const result = [];

    const alwaysLevelZero = [
        /^algorithme\b/i,
        /^var$/i,
        /^const$/i,
        /^debut$/i,
        /^fin$/i
    ];

    const increaseAfter = [
        /^si .* alors$/i,
        /^pour .* faire$/i,
        /^tantque .* faire$/i,
        /^repeter$/i
    ];

    const decreaseBefore = [
        /^finsi$/i,
        /^finpour$/i,
        /^fintantque$/i,
        /^jusqua .*$/i,
        /^sinon$/i
    ];

    for (let rawLine of lines) {
        let line = rawLine.trim();

        if (line === "") {
            result.push("");
            continue;
        }

        /* ===== LEVEL 0 KEYWORDS ===== */
        if (/^algorithme\b/i.test(line)) {
            section = null;
            indentLevel = 0;
            result.push(line);
            continue;
        }

        if (/^var$/i.test(line)) {
            section = "var";
            indentLevel = 1;
            result.push(line);
            continue;
        }

        if (/^const$/i.test(line)) {
            section = "const";
            indentLevel = 1;
            result.push(line);
            continue;
        }

        if (/^debut$/i.test(line)) {
            section = "debut";
            indentLevel = 1;
            result.push(line);
            continue;
        }

        if (/^fin$/i.test(line)) {
            section = null;
            indentLevel = 0;
            result.push(line);
            continue;
        }

        /* ===== CONTROL STRUCTURE CLOSING ===== */
        if (decreaseBefore.some(rx => rx.test(line))) {
            indentLevel = Math.max(indentLevel - 1, 1);
        }

        result.push(" ".repeat(indentLevel * indentSize) + line);

        /* ===== CONTROL STRUCTURE OPENING ===== */
        if (
            increaseAfter.some(rx => rx.test(line)) ||
            /^sinon$/i.test(line)
        ) {
            indentLevel++;
        }
    }

    editor.value = result.join("\n");
    editor.dispatchEvent(new Event("input"));
}
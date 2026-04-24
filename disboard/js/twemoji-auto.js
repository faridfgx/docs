
(function () {
  // 1) Load Twemoji if not already loaded
  function loadTwemoji(callback) {
    if (window.twemoji) return callback();

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js";
    script.onload = callback;
    document.head.appendChild(script);
  }

  // 2) Inject CSS (fix emoji size)
  function injectStyles() {
    if (document.getElementById("twemoji-style")) return;

    const style = document.createElement("style");
    style.id = "twemoji-style";
    style.textContent = `
      img.emoji {
        width: 1em;
        height: 1em;
        vertical-align: -0.1em;
      }
    `;
    document.head.appendChild(style);
  }

  // 3) Parse a DOM node safely
function parseNode(node) {
  if (!node) return;

  // Handle TEXT nodes directly (this is your missing case)
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.parentNode) {
      twemoji.parse(node.parentNode);
    }
    return;
  }

  if (node.nodeType !== 1) return;

  twemoji.parse(node, {
    folder: "svg",
    ext: ".svg"
  });

  node.querySelectorAll("img.emoji").forEach(img => {
    img.loading = "lazy";
    img.decoding = "async";
  });
}

  // 4) Observe DOM changes (dynamic content)
  function observeDOM() {
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          parseNode(node);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 5) Init
  function init() {
    injectStyles();

    // Initial parse
    parseNode(document.body);

    // Watch for dynamic updates
    observeDOM();
  }

  // Run
  loadTwemoji(() => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  });

})();
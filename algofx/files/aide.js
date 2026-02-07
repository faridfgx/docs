// ========================================
// ADVANCED SEARCH CLASS
// ========================================

class AdvancedSearch {
    constructor() {
        this.searchIndex = [];
        this.searchCache = new Map();
        this.maxCacheSize = 100;
        this.buildSearchIndex();
    }

    // Build comprehensive search index with weighted content
    buildSearchIndex() {
        const sections = document.querySelectorAll('h2, h3, h4, p, li, pre code, .example-box');
        
        sections.forEach((element) => {
            const text = element.textContent.trim();
            if (!text || text.length < 3) return;
            
            const section = element.closest('section, .example-box');
            const heading = section?.querySelector('h2')?.textContent || 
                           element.closest('[id]')?.querySelector('h2, h3')?.textContent || '';
            const subheading = element.closest('[id]')?.querySelector('h3')?.textContent || '';
            const id = element.id || element.closest('[id]')?.id || '';
            
            // Determine content weight for relevance scoring
            let weight = 1;
            if (element.tagName === 'H2') weight = 10;
            else if (element.tagName === 'H3') weight = 7;
            else if (element.tagName === 'H4') weight = 5;
            else if (element.tagName === 'CODE' || element.classList.contains('example-box')) weight = 6;
            else if (element.tagName === 'LI') weight = 3;
            
            // Extract keywords for better matching
            const keywords = this.extractKeywords(text);
            
            this.searchIndex.push({
                text: text,
                heading: heading,
                subheading: subheading,
                id: id,
                element: element,
                weight: weight,
                keywords: keywords,
                type: element.tagName.toLowerCase()
            });
        });
    }

    // Extract important keywords from text
    extractKeywords(text) {
        const stopWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'est', 'et', 
                          'pour', 'que', 'dans', 'avec', 'par', 'sur', 'ce', 'cette', 'ces'];
        
        return text.toLowerCase()
            .replace(/[^\w\sàâäéèêëïîôùûüÿæœç]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word))
            .slice(0, 20);
    }

    // Levenshtein distance for fuzzy matching
    levenshteinDistance(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[len1][len2];
    }

    // Calculate fuzzy match score (0-1, higher is better)
    fuzzyMatch(query, target) {
        const distance = this.levenshteinDistance(query.toLowerCase(), target.toLowerCase());
        const maxLength = Math.max(query.length, target.length);
        return 1 - (distance / maxLength);
    }

    // Calculate comprehensive relevance score
    calculateRelevance(item, query, queryWords) {
        let score = 0;
        const lowerText = item.text.toLowerCase();
        const lowerQuery = query.toLowerCase();

        // Exact phrase match (highest priority)
        if (lowerText.includes(lowerQuery)) {
            score += 100 * item.weight;
            
            // Bonus for match at start
            if (lowerText.startsWith(lowerQuery)) {
                score += 50;
            }
            
            // Bonus for match in heading
            if (item.heading.toLowerCase().includes(lowerQuery)) {
                score += 75;
            }
        }

        // Individual word matches
        queryWords.forEach(word => {
            const wordLower = word.toLowerCase();
            
            // Exact word match
            const wordRegex = new RegExp(`\\b${wordLower}\\b`, 'gi');
            const matches = (lowerText.match(wordRegex) || []).length;
            score += matches * 10 * item.weight;

            // Heading word match
            if (item.heading.toLowerCase().includes(wordLower)) {
                score += 30;
            }

            // Keyword match
            if (item.keywords.some(kw => kw.includes(wordLower))) {
                score += 15;
            }

            // Fuzzy match for typos
            const bestFuzzyScore = item.keywords.reduce((best, keyword) => {
                if (keyword.length < 3 || wordLower.length < 3) return best;
                const fuzzyScore = this.fuzzyMatch(wordLower, keyword);
                return Math.max(best, fuzzyScore);
            }, 0);

            if (bestFuzzyScore > 0.7) {
                score += bestFuzzyScore * 20;
            }
        });

        // Penalty for very long texts (less relevant)
        if (item.text.length > 500) {
            score *= 0.8;
        }

        // Bonus for code examples
        if (item.type === 'code') {
            score *= 1.2;
        }

        return score;
    }

    // Main search function
    search(query) {
        // Check cache first
        if (this.searchCache.has(query)) {
            return this.searchCache.get(query);
        }

        if (query.length < 2) {
            return [];
        }

        // Split query into words for better matching
        const queryWords = query.trim().split(/\s+/).filter(w => w.length > 1);
        const results = [];

        // Score all items
        this.searchIndex.forEach(item => {
            const relevance = this.calculateRelevance(item, query, queryWords);
            
            if (relevance > 0) {
                results.push({
                    ...item,
                    relevance: relevance,
                    query: query
                });
            }
        });

        // Sort by relevance (descending)
        results.sort((a, b) => b.relevance - a.relevance);

        // Deduplicate by ID (keep highest score)
        const uniqueResults = [];
        const seenIds = new Set();
        
        results.forEach(result => {
            if (!seenIds.has(result.id)) {
                uniqueResults.push(result);
                seenIds.add(result.id);
            }
        });

        // Cache results
        if (this.searchCache.size >= this.maxCacheSize) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        this.searchCache.set(query, uniqueResults);

        return uniqueResults;
    }

    // Generate smart preview with context
    generatePreview(item, query) {
        const text = item.text;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const queryWords = query.split(/\s+/);

        // Find best match position
        let bestIndex = lowerText.indexOf(lowerQuery);
        
        if (bestIndex === -1) {
            // Try to find position of first query word
            for (let word of queryWords) {
                bestIndex = lowerText.indexOf(word.toLowerCase());
                if (bestIndex !== -1) break;
            }
        }

        if (bestIndex === -1) {
            bestIndex = 0;
        }

        // Calculate preview window
        const previewLength = 150;
        const startIndex = Math.max(0, bestIndex - 40);
        const endIndex = Math.min(text.length, startIndex + previewLength);
        
        let preview = text.substring(startIndex, endIndex);
        
        // Add ellipsis
        if (startIndex > 0) preview = '...' + preview;
        if (endIndex < text.length) preview = preview + '...';

        return preview.trim();
    }

    // Highlight matching terms in text
    highlightMatches(text, query) {
        const queryWords = query.split(/\s+/).filter(w => w.length > 1);
        let highlighted = text;

        // Sort by length (descending) to highlight longer matches first
        queryWords.sort((a, b) => b.length - a.length);

        queryWords.forEach(word => {
            const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>');
        });

        return highlighted;
    }

    // Escape special regex characters
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Get search suggestions based on popular terms
    getSuggestions(query) {
        const suggestions = [
            'boucle pour', 'boucle tantque', 'variable', 'condition si',
            'lecture lire', 'écriture ecrire', 'tableau', 'factorielle',
            'fibonacci', 'palindrome', 'pgcd', 'moyenne', 'équation',
            'nombres premiers', 'conversion', 'température'
        ];

        if (!query || query.length < 2) {
            return suggestions.slice(0, 5);
        }

        const lowerQuery = query.toLowerCase();
        return suggestions
            .filter(s => s.toLowerCase().includes(lowerQuery))
            .slice(0, 5);
    }
}

// ========================================
// INITIALIZE SEARCH
// ========================================

const advancedSearch = new AdvancedSearch();

// ========================================
// DOM ELEMENTS
// ========================================

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const clearSearch = document.getElementById('clearSearch');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');
const fabNav = document.getElementById('fabNav');
const backToTop = document.getElementById('backToTop');
const navLinks = document.querySelectorAll('.nav-menu a');

// ========================================
// DEBOUNCE FUNCTION
// ========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// SIDEBAR FUNCTIONS
// ========================================

function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    fabNav.classList.add('open');
    fabNav.querySelector('.fab-icon').textContent = '✕';
    document.body.classList.add('sidebar-open');
    
    // Close search results when sidebar opens
    searchResults.style.display = 'none';
    searchInput.value = '';
    clearSearch.style.display = 'none';
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    fabNav.classList.remove('open');
    fabNav.querySelector('.fab-icon').textContent = '☰';
    document.body.classList.remove('sidebar-open');
}

function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// ========================================
// SEARCH FUNCTIONS
// ========================================

function performSearch(query) {
    if (query.length < 2) {
        searchResults.style.display = 'none';
        clearSearch.style.display = 'none';
        return;
    }

    // Close sidebar when user starts searching
    closeSidebar();

    clearSearch.style.display = 'block';

    // Show loading state
    searchResults.innerHTML = '<div class="search-loading">🔍 Recherche...</div>';
    searchResults.style.display = 'block';

    // Perform search (with small delay for loading animation)
    setTimeout(() => {
        const results = advancedSearch.search(query);

        if (results.length === 0) {
            const suggestions = advancedSearch.getSuggestions(query);
            searchResults.innerHTML = `
                <div class="search-empty">
                    <div class="search-empty-icon">🔍</div>
                    <div class="search-empty-text">Aucun résultat pour "${query}"</div>
                    <div class="search-suggestions">
                        Suggestions : ${suggestions.map(s => 
                            `<strong onclick="document.getElementById('searchInput').value='${s}'; performSearch('${s}')">${s}</strong>`
                        ).join(', ')}
                    </div>
                </div>
            `;
        } else {
            const resultHTML = results.slice(0, 20).map(result => {
                const preview = advancedSearch.generatePreview(result, query);
                const highlightedPreview = advancedSearch.highlightMatches(preview, query);
                const highlightedHeading = advancedSearch.highlightMatches(result.heading, query);

                return `
                    <div class="search-result-item" onclick="scrollToElement('${result.id}')">
                        <div class="search-result-title">${highlightedHeading}</div>
                        <div class="search-result-preview">${highlightedPreview}</div>
                    </div>
                `;
            }).join('');

            searchResults.innerHTML = `
                <div class="search-result-count">
                    ${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}
                </div>
                ${resultHTML}
            `;
        }
    }, 100);
}

const debouncedSearch = debounce(performSearch, 300);

// ========================================
// SCROLL TO ELEMENT WITH 15% OFFSET
// ========================================

function scrollToElement(id) {
    const target = document.getElementById(id);
    if (!target) return;

    // Close mobile sidebar if open
    closeSidebar();

    // Calculate 15% offset from viewport height
    const viewportHeight = window.innerHeight;
    const offset = viewportHeight * 0.15;

    // Get element position
    const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    // Smooth scroll to position with offset
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });

    // Close search results
    searchResults.style.display = 'none';
    searchInput.value = '';
    clearSearch.style.display = 'none';

    // Highlight element briefly
    target.style.transition = 'background-color 0.3s';
    target.style.backgroundColor = '#fff176';
    setTimeout(() => {
        target.style.backgroundColor = '';
        setTimeout(() => {
            target.style.transition = '';
        }, 300);
    }, 2000);
}

// ========================================
// EVENT LISTENERS
// ========================================

// FAB Navigation Button
fabNav.addEventListener('click', toggleSidebar);

// Sidebar Overlay
sidebarOverlay.addEventListener('click', closeSidebar);

// Sidebar Close Button
sidebarClose.addEventListener('click', closeSidebar);

// Navigation Links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            // Always close sidebar when clicking a link
            closeSidebar();
            
            // Calculate 15% offset from viewport height
            const viewportHeight = window.innerHeight;
            const offset = viewportHeight * 0.15;
            
            // Get element position
            const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;
            
            // Smooth scroll to position with offset
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Toggle submenu
            const submenu = link.nextElementSibling;
            if (submenu && submenu.classList.contains('nav-submenu')) {
                submenu.classList.toggle('show');
            }
        }
    });
});

// Search Input
searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// Search Input Focus - close sidebar
searchInput.addEventListener('focus', () => {
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    }
});

// Search Keyboard Shortcuts
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchInput.value = '';
        searchResults.style.display = 'none';
        clearSearch.style.display = 'none';
    } else if (e.key === 'Enter') {
        const firstResult = searchResults.querySelector('.search-result-item');
        if (firstResult) {
            firstResult.click();
        }
    }
});

// Clear Search Button
clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchResults.style.display = 'none';
    clearSearch.style.display = 'none';
    searchInput.focus();
});

// Click Outside to Close Search
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchResults.style.display = 'none';
    }
});

// Global Keyboard Shortcut (Ctrl+K or Cmd+K)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
        closeSidebar();
    }
});

// ========================================
// SCROLL SPY
// ========================================

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(link => {
                if (link.getAttribute('href') === `#${id}`) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('section[id], h3[id]').forEach(section => {
    observer.observe(section);
});

// ========================================
// BACK TO TOP BUTTON
// ========================================

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTop.style.display = 'flex';
    } else {
        backToTop.style.display = 'none';
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ========================================
// TOUCH GESTURES
// ========================================

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        // Swipe left - close sidebar
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        }
    }
    if (touchEndX > touchStartX + 50) {
        // Swipe right - open sidebar (only from edge)
        if (touchStartX < 50 && !sidebar.classList.contains('open')) {
            openSidebar();
        }
    }
}

// ========================================
// PREVENT ZOOM ON DOUBLE-TAP (iOS)
// ========================================

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// ========================================
// CODE BLOCK COPY FUNCTIONALITY
// ========================================

function initCodeCopyButtons() {
    // Find all code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach((codeBlock, index) => {
        const pre = codeBlock.parentElement;
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.setAttribute('aria-label', 'Copier le code');
        copyButton.innerHTML = `
            <span class="copy-icon">📋</span>
            <span class="copy-text">Copier</span>
        `;
        
        // Insert button into pre element
        pre.style.position = 'relative';
        pre.insertBefore(copyButton, pre.firstChild);
        
        // Copy functionality
        copyButton.addEventListener('click', async () => {
            const code = codeBlock.textContent;
            
            try {
                // Modern clipboard API
                await navigator.clipboard.writeText(code);
                
                // Visual feedback
                copyButton.classList.add('copied');
                copyButton.innerHTML = `
                    <span class="copy-icon">✓</span>
                    <span class="copy-text">Copié!</span>
                `;
                
                // Reset after 2 seconds
                setTimeout(() => {
                    copyButton.classList.remove('copied');
                    copyButton.innerHTML = `
                        <span class="copy-icon">📋</span>
                        <span class="copy-text">Copier</span>
                    `;
                }, 2000);
                
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    textArea.remove();
                    
                    // Visual feedback
                    copyButton.classList.add('copied');
                    copyButton.innerHTML = `
                        <span class="copy-icon">✓</span>
                        <span class="copy-text">Copié!</span>
                    `;
                    
                    setTimeout(() => {
                        copyButton.classList.remove('copied');
                        copyButton.innerHTML = `
                            <span class="copy-icon">📋</span>
                            <span class="copy-text">Copier</span>
                        `;
                    }, 2000);
                    
                } catch (err) {
                    console.error('Failed to copy:', err);
                    copyButton.innerHTML = `
                        <span class="copy-icon">✗</span>
                        <span class="copy-text">Erreur</span>
                    `;
                    
                    setTimeout(() => {
                        copyButton.innerHTML = `
                            <span class="copy-icon">📋</span>
                            <span class="copy-text">Copier</span>
                        `;
                    }, 2000);
                }
            }
        });
    });
}

// Initialize copy buttons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCodeCopyButtons();
});
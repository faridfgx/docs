// Search functionality JavaScript
class DocumentSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.clearSearch = document.getElementById('clearSearch');
        this.searchResults = document.getElementById('searchResults');
        
        // Document data - you can expand this with your actual documents
        this.documents = [
            {
                id: 'annual-progression',
                title: 'التدرج السنوي',
                description: 'توزيع المنهج على أشهر السنة الدراسية',
                icon: '📅',
                keywords: ['تدرج', 'سنوي', 'منهج', 'توزيع', 'أشهر', 'سنة', 'دراسية'],
                status: 'مكتمل'
            },
            {
                id: 'textbook',
                title: 'الكتاب المدرسي',
                description: 'الكتاب المقرر وملحقاته',
                icon: '📖',
                keywords: ['كتاب', 'مدرسي', 'مقرر', 'ملحقات', 'منهج'],
                status: 'مكتمل'
            },
            {
                id: 'annual-distribution',
                title: 'التوزيع السنوي',
                description: 'خطة توزيع الدروس والأنشطة',
                icon: '🗓️',
                keywords: ['توزيع', 'سنوي', 'دروس', 'أنشطة', 'خطة', 'تنظيم'],
                status: 'مكتمل'
            },
            {
                id: 'grade-book',
                title: 'دفتر التنقيط',
                description: 'سجلات الدرجات والتقييم',
                icon: '📊',
                keywords: ['دفتر', 'تنقيط', 'درجات', 'تقييم', 'علامات', 'نتائج','التقويم المستمر'],
                status: 'مكتمل'
            },
            {
                id: 'training-book',
                title: 'دفتر التكوين',
                description: 'سجل التطوير المهني والتدريب',
                icon: '🎓',
                keywords: ['تكوين', 'تطوير', 'مهني', 'تدريب', 'دورات', 'تأهيل'],
                status: 'جديد'
            },
            {
                id: 'daily-journal',
                title: 'الدفتر اليومي',
                description: 'تسجيل الأنشطة اليومية',
                icon: '📝',
                keywords: ['دفتر', 'يومي', 'أنشطة', 'تسجيل', 'يومية', 'حصص'],
                status: 'جديد'
            },
            {
                id: 'lab-tracking',
                title: 'دفتر متابعة المخبر',
                description: 'تتبع أنشطة المختبر والصيانة',
                icon: '🔬',
                keywords: ['مخبر', 'متابعة', 'مختبر', 'صيانة', 'أنشطة', 'تتبع'],
                status: 'مكتمل'
            },
            {
                id: 'programs',
                title: 'البرامج',
                description: 'البرمجيات التعليمية والأدوات',
                icon: '💻',
                keywords: ['برامج', 'برمجيات', 'تعليمية', 'أدوات', 'تطبيقات', 'سوفتوير','algobox','larp','Essentials virtual desktop','algofx','netsupport school'],
                status: 'محدث'
            },
            {
                id: 'lab-rules',
                title: 'القانون الداخلي للمخبر',
                description: 'قوانين وقواعد استخدام المختبر',
                icon: '⚖️',
                keywords: ['قانون', 'داخلي', 'مخبر', 'قوانين', 'قواعد', 'مختبر'],
                status: 'مكتمل'
            },
            {
                id: 'lab-guide',
                title: 'دليل تسيير مخبر المعلوماتية',
                description: 'إرشادات وتنظيمات تسيير المخبر بالتفصيل',
                icon: '🖥️',
                keywords: ['دليل', 'تسيير', 'مخبر', 'معلوماتية', 'إرشادات', 'تنظيمات'],
                status: 'مكتمل'
            },
            {
                id: 'seating-plan',
                title: 'مخطط الجلوس',
                description: 'تنظيم أماكن جلوس التلاميذ داخل المخبر',
                icon: '🪑',
                keywords: ['مخطط', 'جلوس', 'تلاميذ', 'مخبر', 'تنظيم', 'أماكن'],
                status: 'مكتمل'
            },
            {
                id: 'other-docs',
                title: 'وثائق أخرى',
                description: 'ملفات ووثائق إدارية أو تعليمية إضافية',
                icon: '📎',
                keywords: ['وثائق', 'أخرى', 'إدارية', 'تعليمية', 'إضافية', 'ملفات','تقرير','مرافقة','تربص'],
                status: 'جديد'
            },
            // Documents that are not implemented yet
            {
                id: 'notes',
                title: 'المذكرات',
                description: 'مذكرات تربوية لجميع الدروس والوحدات',
                icon: '📝',
                keywords: ['مذكرات', 'تربوية', 'دروس', 'وحدات', 'تحضير'],
                status: 'غير متوفر'
            },
            {
                id: 'lessons',
                title: 'الدروس',
                description: 'محتوى الدروس مفصل ومنظم',
                icon: '📚',
                keywords: ['دروس', 'محتوى', 'مفصل', 'منظم', 'تعليم'],
                status: 'غير متوفر'
            },
            {
                id: 'presentations',
                title: 'العروض التقديمية',
                description: 'عروض PowerPoint جاهزة للاستخدام',
                icon: '🎯',
                keywords: ['عروض', 'تقديمية', 'powerpoint', 'باور بوينت', 'جاهزة'],
                status: 'غير متوفر'
            }
        ];

        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim()) {
                this.showResults();
            }
        });

        // Clear search button
        this.clearSearch.addEventListener('click', () => {
            this.clearSearchInput();
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideResults();
            }
        });

        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });
    }

    handleSearch(query) {
        if (query.length === 0) {
            this.hideResults();
            this.hideClearButton();
            return;
        }

        this.showClearButton();
        
        if (query.length < 2) {
            return;
        }

        const results = this.searchDocuments(query);
        this.displayResults(results, query);
    }

    searchDocuments(query) {
        const searchTerms = query.toLowerCase().trim().split(/\s+/);
        
        return this.documents.filter(doc => {
            const searchableText = [
                doc.title,
                doc.description,
                ...doc.keywords
            ].join(' ').toLowerCase();

            return searchTerms.some(term => 
                searchableText.includes(term)
            );
        }).sort((a, b) => {
            // Sort by relevance (exact matches first, then partial matches)
            const aRelevance = this.calculateRelevance(a, query);
            const bRelevance = this.calculateRelevance(b, query);
            return bRelevance - aRelevance;
        });
    }

    calculateRelevance(doc, query) {
        const queryLower = query.toLowerCase();
        let score = 0;

        // Title exact match
        if (doc.title.toLowerCase().includes(queryLower)) {
            score += 10;
        }

        // Keywords exact match
        doc.keywords.forEach(keyword => {
            if (keyword.includes(queryLower)) {
                score += 5;
            }
        });

        // Description match
        if (doc.description.toLowerCase().includes(queryLower)) {
            score += 3;
        }

        return score;
    }

    displayResults(results, query) {
        if (results.length === 0) {
            this.showNoResults(query);
            return;
        }

        const resultsHTML = `
            <div class="search-stats">
                تم العثور على ${results.length} نتيجة
            </div>
            ${results.map((doc, index) => `
                <div class="search-result-item" data-doc-id="${doc.id}" style="animation-delay: ${index * 0.1}s">
                    <span class="search-result-icon">${doc.icon}</span>
                    <div class="search-result-content">
                        <div class="search-result-title">
                            ${this.highlightText(doc.title, query)}
                        </div>
                        <div class="search-result-description">
                            ${this.highlightText(doc.description, query)}
                        </div>
                        <div class="search-result-status" style="margin-top: 0.3rem;">
                            <span style="background: ${this.getStatusColor(doc.status)}; color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">
                                ${doc.status}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;

        this.searchResults.innerHTML = resultsHTML;
        this.showResults();
        this.bindResultEvents();
    }

    showNoResults(query) {
        this.searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <div>لم يتم العثور على نتائج لـ "<strong>${query}</strong>"</div>
                <div style="margin-top: 1rem; color: #adb5bd; font-size: 0.9rem;">
                    جرب البحث بكلمات مختلفة أو تحقق من الإملاء
                </div>
            </div>
        `;
        this.showResults();
    }

    highlightText(text, query) {
        if (!query) return text;
        
        const searchTerms = query.toLowerCase().trim().split(/\s+/);
        let highlightedText = text;

        searchTerms.forEach(term => {
            if (term.length > 1) {
                const regex = new RegExp(`(${term})`, 'gi');
                highlightedText = highlightedText.replace(regex, '<span class="search-highlight">$1</span>');
            }
        });

        return highlightedText;
    }

    getStatusColor(status) {
        const colors = {
            'مكتمل': '#28a745',
            'جديد': '#17a2b8',
            'محدث': '#ffc107',
            'غير متوفر': '#6c757d'
        };
        return colors[status] || '#6c757d';
    }

    bindResultEvents() {
        const resultItems = this.searchResults.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const docId = item.dataset.docId;
                this.handleResultClick(docId);
            });
        });
    }

    handleResultClick(docId) {
        // Hide search results
        this.hideResults();
        
        // Clear search input
        this.searchInput.value = '';
        this.hideClearButton();

        // Navigate to document (you'll need to integrate this with your existing navigation)
        if (typeof showDocument === 'function') {
            showDocument(docId);
        } else {
            // Fallback - scroll to element or show alert
            console.log('Navigate to:', docId);
            // You can customize this behavior based on your app structure
        }
    }

    showResults() {
        this.searchResults.classList.add('show');
    }

    hideResults() {
        this.searchResults.classList.remove('show');
    }

    showClearButton() {
        this.clearSearch.classList.add('show');
    }

    hideClearButton() {
        this.clearSearch.classList.remove('show');
    }

    clearSearchInput() {
        this.searchInput.value = '';
        this.hideResults();
        this.hideClearButton();
        this.searchInput.focus();
    }

    handleKeyNavigation(e) {
        const resultItems = this.searchResults.querySelectorAll('.search-result-item');
        
        if (e.key === 'Escape') {
            this.clearSearchInput();
        } else if (e.key === 'Enter' && resultItems.length > 0) {
            // Select first result on Enter
            const firstResult = resultItems[0];
            const docId = firstResult.dataset.docId;
            this.handleResultClick(docId);
        }
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocumentSearch();
});
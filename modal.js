// Modal functionality
function showNotice() {
    document.getElementById('noticeModal').classList.add('show');
}

function closeNotice() {
    document.getElementById('noticeModal').classList.remove('show');
}

// Close modal when clicking outside content
document.getElementById('noticeModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeNotice();
    }
});

// Function to get file extension and create appropriate icon
function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'PDF',
        'docx': 'DOC',
        'doc': 'DOC',
        'xlsx': 'XLS',
        'xls': 'XLS',
        'pptx': 'PPT',
        'ppt': 'PPT',
        'exe': 'EXE',
        'msi': 'MSI',
        'zip': 'ZIP',
        'rar': 'RAR',
        '7z': '7Z'
    };
    
    const iconText = iconMap[extension] || 'FILE';
    return `<div class="file-icon ${extension}">${iconText}</div>`;
}

// Auto-add icons to existing file items (optional)
document.addEventListener('DOMContentLoaded', function() {
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        const fileName = item.querySelector('.file-name').textContent;
        const fileSize = item.querySelector('.file-size').textContent;
        const extension = fileSize.split(' - ')[0].toLowerCase();
        
        if (!item.querySelector('.file-icon')) {
            const iconDiv = document.createElement('div');
            iconDiv.className = `file-icon ${extension}`;
            iconDiv.textContent = extension.toUpperCase();
            item.insertBefore(iconDiv, item.firstChild);
        }
    });
});
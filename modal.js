// Modal functionality
function showNotice() {
    const modal = document.getElementById('popup');
    if (modal) {
        modal.style.display = 'flex';
        // Add animation
        setTimeout(() => {
            const popupBox = document.getElementById('popup-box');
            if (popupBox) {
                popupBox.style.transform = 'scale(1)';
                popupBox.style.opacity = '1';
            }
        }, 10);
    }
}

function closeNotice() {
    const modal = document.getElementById('popup');
    const popupBox = document.getElementById('popup-box');
    
    if (popupBox) {
        popupBox.style.transform = 'scale(0.85)';
        popupBox.style.opacity = '0';
    }
    
    setTimeout(() => {
        if (modal) {
            modal.style.display = 'none';
        }
    }, 300);
}

// Close modal when clicking outside content
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('popup');
    if (modal) {
        modal.addEventListener('click', function(e) {
            // Check if clicked element is the modal overlay (not the popup box)
            if (e.target === modal) {
                closeNotice();
            }
        });
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
        const fileNameElement = item.querySelector('.file-name');
        const fileSizeElement = item.querySelector('.file-size');
        
        if (fileNameElement && fileSizeElement) {
            const fileName = fileNameElement.textContent;
            const fileSize = fileSizeElement.textContent;
            const extension = fileSize.split(' - ')[0].toLowerCase();
            
            if (!item.querySelector('.file-icon')) {
                const iconDiv = document.createElement('div');
                iconDiv.className = `file-icon ${extension}`;
                iconDiv.textContent = extension.toUpperCase();
                item.insertBefore(iconDiv, item.firstChild);
            }
        }
    });
});
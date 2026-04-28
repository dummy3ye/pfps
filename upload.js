function setupTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    function updateIcons() {
        if (document.documentElement.classList.contains('dark')) {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }

    if (themeToggle) {
        themeToggle.onclick = () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.theme = isDark ? 'dark' : 'light';
            updateIcons();
        };
    }
    
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateIcons();
}

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const dropContent = document.getElementById('drop-content');
const previewContent = document.getElementById('preview-content');
const imagePreview = document.getElementById('image-preview');
const removeFile = document.getElementById('remove-file');
const form = document.getElementById('upload-form');
const status = document.getElementById('status');
const statusContainer = document.getElementById('status-container');
const categorySelect = document.getElementById('category-select');
const categoryNew = document.getElementById('category-new');

let selectedFile = null;

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        if (!categorySelect) return;

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load categories:', err);
    }
}

if (categorySelect) {
    categorySelect.onchange = () => {
        if (categorySelect.value === 'new') {
            categoryNew.classList.remove('hidden');
            categoryNew.required = true;
            categoryNew.focus();
        } else {
            categoryNew.classList.add('hidden');
            categoryNew.required = false;
        }
    };
}

if (dropZone) {
    dropZone.onclick = () => !selectedFile && fileInput.click();
    
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-blue-500/5');
    };

    dropZone.ondragleave = () => {
        dropZone.classList.remove('border-blue-500', 'bg-blue-500/5');
    };

    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-blue-500/5');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    };
}

if (fileInput) {
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    };
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) return showStatus('Please select a valid image file.', 'error');
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        dropContent.classList.add('hidden');
        previewContent.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

if (removeFile) {
    removeFile.onclick = (e) => {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = '';
        dropContent.classList.remove('hidden');
        previewContent.classList.add('hidden');
    };
}

function showStatus(message, type = 'info') {
    statusContainer.classList.remove('hidden');
    status.textContent = message;
    
    if (type === 'error') {
        status.className = 'p-4 rounded-lg text-sm font-bold text-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800';
    } else if (type === 'success') {
        status.className = 'p-4 rounded-lg text-sm font-bold text-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800';
    } else {
        status.className = 'p-4 rounded-lg text-sm font-bold text-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
    }
}

if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return showStatus('Please select a file first.', 'error');

        let category = categorySelect.value;
        if (category === 'new') {
            category = categoryNew.value.trim();
            if (!category) return showStatus('Please enter a new folder name.', 'error');
        }
        if (!category) return showStatus('Please select or create a folder.', 'error');

        const imageName = document.getElementById('name').value.trim();
        const source = document.getElementById('source').value.trim();
        const tags = document.getElementById('tags').value.trim();

        const formData = new FormData();
        formData.append('name', imageName);
        formData.append('category', category);
        formData.append('source', source);
        formData.append('tags', tags);
        formData.append('image', selectedFile);

        showStatus('Uploading and syncing...', 'info');
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.opacity = '0.5';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                showStatus('Success! Image added to library.', 'success');
                form.reset();
                selectedFile = null;
                setTimeout(() => window.location.href = '/', 1200);
            } else {
                showStatus(result.message || 'Upload failed.', 'error');
                submitBtn.disabled = false;
                submitBtn.opacity = '1';
            }
        } catch (err) {
            console.error('Upload error:', err);
            showStatus('Upload failed. Server error.', 'error');
            submitBtn.disabled = false;
            submitBtn.opacity = '1';
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    loadCategories();
});

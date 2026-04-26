// Theme Management
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

// File Handling
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const dropContent = document.getElementById('drop-content');
const previewContent = document.getElementById('preview-content');
const imagePreview = document.getElementById('image-preview');
const removeFile = document.getElementById('remove-file');
const form = document.getElementById('upload-form');
const status = document.getElementById('status');

let selectedFile = null;

if (dropZone) {
    dropZone.onclick = () => !selectedFile && fileInput.click();
    
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'dark:border-blue-400');
    };

    dropZone.ondragleave = () => {
        dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
    };

    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    };
}

if (fileInput) {
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    };
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) return alert('Please select an image file.');
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

// Form Submission
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert('Please select a file first.');

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('name', document.getElementById('name').value);
        formData.append('category', document.getElementById('category').value);
        formData.append('source', document.getElementById('source').value);
        formData.append('tags', document.getElementById('tags').value);

        status.textContent = 'Uploading...';
        status.className = 'mt-4 text-sm text-center text-gray-500';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                status.textContent = 'Successfully uploaded and synced!';
                status.className = 'mt-4 text-sm text-center text-green-500';
                form.reset();
                selectedFile = null;
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                status.textContent = result.message || 'Upload failed.';
                status.className = 'mt-4 text-sm text-center text-red-500';
            }
        } catch (err) {
            status.textContent = 'Upload failed. Is the server running?';
            status.className = 'mt-4 text-sm text-center text-red-500';
        }
    };
}

// Start
document.addEventListener('DOMContentLoaded', setupTheme);

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
const categorySelect = document.getElementById('category-select');
const categoryNew = document.getElementById('category-new');

let selectedFile = null;

async function loadCategories() {
    console.log('Fetching categories...');
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        console.log('Categories received:', categories);
        
        if (!categorySelect) {
            console.error('category-select element not found!');
            return;
        }

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

if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert('Please select a file first.');

        let category = categorySelect.value;
        if (category === 'new') {
            category = categoryNew.value.trim();
            if (!category) return alert('Please enter a new folder name.');
        }
        if (!category) return alert('Please select or create a folder.');

        const imageName = document.getElementById('name').value.trim();
        const source = document.getElementById('source').value.trim();
        const tags = document.getElementById('tags').value.trim();

        // CRITICAL: Append fields BEFORE the file so Multer can see them during diskStorage
        const formData = new FormData();
        formData.append('name', imageName);
        formData.append('category', category);
        formData.append('source', source);
        formData.append('tags', tags);
        formData.append('image', selectedFile);

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
            console.error('Upload error:', err);
            status.textContent = 'Upload failed. Check console for details.';
            status.className = 'mt-4 text-sm text-center text-red-500';
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    loadCategories();
});

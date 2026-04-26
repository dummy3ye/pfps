let allData = {};
let currentCategory = 'all';
let searchQuery = '';
let selectedImage = null;

async function init() {
    setupTheme();
    setupSearch();
    await fetchData();
    renderCategories();
    applyFilters();
}

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

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchQuery = e.target.value.toLowerCase();
            applyFilters();
        };
    }
}

async function fetchData() {
    try {
        const res = await fetch('data.json');
        allData = await res.json();
    } catch (e) {
        console.error('Failed to load data.json', e);
        const grid = document.getElementById('pfp-grid');
        if (grid) grid.innerHTML = '<p class="text-red-500">Error loading library data.</p>';
    }
}

function renderCategories() {
    const list = document.getElementById('category-list');
    if (!list) return;
    list.innerHTML = '';
    
    ['all', ...Object.keys(allData)].forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'block w-full text-left px-3 py-2 text-sm rounded capitalize transition-colors hover:bg-gray-200 dark:hover:bg-zinc-800';
        btn.textContent = cat;
        btn.onclick = () => selectCategory(cat);
        list.appendChild(btn);
    });
}

function selectCategory(cat) {
    currentCategory = cat;
    document.getElementById('current-category').textContent = cat;
    
    const buttons = document.querySelectorAll('#category-list button');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase() === cat.toLowerCase()) {
            btn.classList.add('bg-gray-200', 'dark:bg-zinc-800', 'font-semibold');
        } else {
            btn.classList.remove('bg-gray-200', 'dark:bg-zinc-800', 'font-semibold');
        }
    });

    applyFilters();
}

function applyFilters() {
    let filtered = [];
    
    if (currentCategory === 'all') {
        filtered = Object.values(allData).flat();
    } else {
        filtered = allData[currentCategory] || [];
    }

    if (searchQuery) {
        filtered = filtered.filter(img => {
            const nameMatch = img.name.toLowerCase().includes(searchQuery);
            const pathMatch = img.path.toLowerCase().includes(searchQuery);
            const tagMatch = img.tags.some(tag => tag.toLowerCase().includes(searchQuery));
            return nameMatch || pathMatch || tagMatch;
        });
    }

    renderGrid(filtered);
}

function renderGrid(images) {
    const grid = document.getElementById('pfp-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (images.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 italic col-span-full py-12 text-center">No images match your search</p>';
        return;
    }

    images.forEach(img => {
        const card = document.createElement('div');
        card.className = 'aspect-square bg-gray-100 dark:bg-zinc-900 rounded-lg cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all';
        card.innerHTML = `<img src="${img.path}" class="w-full h-full object-cover" loading="lazy" decoding="async" alt="${img.name}">`;
        card.onclick = () => {
            document.querySelectorAll('#pfp-grid > div').forEach(c => c.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500/20'));
            card.classList.add('border-blue-500', 'ring-2', 'ring-blue-500/20');
            showDetails(img);
        };
        grid.appendChild(card);
    });
}

function showDetails(img) {
    selectedImage = img;
    document.getElementById('details-empty').classList.add('hidden');
    const content = document.getElementById('details-content');
    content.classList.remove('hidden');
    
    document.getElementById('detail-image').src = img.path;
    document.getElementById('detail-name').textContent = img.name;
    document.getElementById('detail-path').textContent = img.path;
    document.getElementById('detail-resolution').textContent = img.resolution || 'N/A';
    document.getElementById('detail-size').textContent = img.size || 'N/A';
    document.getElementById('detail-date').textContent = img.dateAdded || 'N/A';
    document.getElementById('detail-source').textContent = img.source || 'N/A';

    const tagsContainer = document.getElementById('detail-tags');
    tagsContainer.innerHTML = '';
    if (img.tags && img.tags.length > 0) {
        img.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-[10px] font-bold rounded uppercase border dark:border-zinc-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-colors';
            span.textContent = tag;
            span.onclick = (e) => {
                e.stopPropagation();
                searchQuery = tag.toLowerCase();
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = tag;
                applyFilters();
            };
            tagsContainer.appendChild(span);
        });
    } else {
        tagsContainer.innerHTML = '<span class="text-[10px] text-gray-400 italic">No tags</span>';
    }

    document.getElementById('download-btn').onclick = () => {
        if (!selectedImage) return;
        
        const repoOwner = 'dummy3ye';
        const repoName = 'pfps';
        const branch = 'main';
        const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${selectedImage.path}`;

        const link = document.createElement('a');
        link.href = rawUrl;
        link.download = selectedImage.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const btn = document.getElementById('download-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Downloading...';
        setTimeout(() => btn.textContent = originalText, 2000);
    };
}

if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) uploadBtn.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);

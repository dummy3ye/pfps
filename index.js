let allData = {};
let currentCategory = 'all';
let searchQuery = '';
let selectedImage = null;

async function init() {
    setupTheme();
    setupSearch();
    setupMobileInteractions();
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

function setupMobileInteractions() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const closeDetails = document.getElementById('close-details');
    const detailsOverlay = document.getElementById('details-overlay');

    const toggleSidebar = () => {
        document.body.classList.toggle('sidebar-open');
        const isOpen = document.body.classList.contains('sidebar-open');
        sidebarOverlay.classList.toggle('hidden', !isOpen);
        setTimeout(() => sidebarOverlay.classList.toggle('opacity-100', isOpen), 10);
    };

    const closeAll = () => {
        document.body.classList.remove('sidebar-open', 'details-open');
        sidebarOverlay.classList.add('hidden');
        detailsOverlay.classList.add('hidden');
        sidebarOverlay.classList.remove('opacity-100');
        detailsOverlay.classList.remove('opacity-100');
    };

    if (menuToggle) menuToggle.onclick = toggleSidebar;
    if (closeSidebar) closeSidebar.onclick = closeAll;
    if (sidebarOverlay) sidebarOverlay.onclick = closeAll;
    if (closeDetails) closeDetails.onclick = closeAll;
    if (detailsOverlay) detailsOverlay.onclick = closeAll;

    // ESC key to close everything
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });
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
    
    const categories = ['all', ...Object.keys(allData)];
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg capitalize transition-all duration-200 group';
        
        const isActive = currentCategory.toLowerCase() === cat.toLowerCase();
        if (isActive) {
            btn.classList.add('bg-blue-500', 'text-white', 'shadow-lg', 'shadow-blue-500/20');
        } else {
            btn.classList.add('text-zinc-500', 'hover:bg-zinc-200/50', 'dark:hover:bg-zinc-800/50', 'hover:text-zinc-900', 'dark:hover:text-zinc-100');
        }

        btn.innerHTML = `
            <span class="flex-grow text-left">${cat}</span>
        `;


        btn.onclick = () => {
            selectCategory(cat);
            if (window.innerWidth < 1024) {
                document.body.classList.remove('sidebar-open');
                document.getElementById('sidebar-overlay').classList.add('hidden');
            }
        };
        list.appendChild(btn);
    });
}

function selectCategory(cat) {
    currentCategory = cat;
    document.getElementById('current-category').textContent = cat;
    renderCategories();
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
        grid.innerHTML = `
            <div class="col-span-full py-20 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                <svg class="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <p class="text-sm font-medium">No images found matching your search</p>
            </div>
        `;
        return;
    }

    images.forEach(img => {
        const card = document.createElement('div');
        card.className = 'group aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-lg cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-500 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/10';
        card.innerHTML = `<img src="${img.path}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" alt="${img.name}">`;
        card.onclick = () => {
            document.querySelectorAll('#pfp-grid > div').forEach(c => c.classList.remove('border-blue-500', 'ring-4', 'ring-blue-500/10'));
            card.classList.add('border-blue-500', 'ring-4', 'ring-blue-500/10');
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
    
    // Open modal on mobile
    if (window.innerWidth < 1024) {
        document.body.classList.add('details-open');
        const overlay = document.getElementById('details-overlay');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
    }

    document.getElementById('detail-image').src = img.path;
    document.getElementById('detail-name').textContent = img.name;
    document.getElementById('detail-path').textContent = img.path;
    document.getElementById('detail-resolution').textContent = img.resolution || 'N/A';
    document.getElementById('detail-size').textContent = img.size || 'N/A';
    document.getElementById('detail-date').textContent = img.dateAdded || 'N/A';
    
    const sourceContainer = document.getElementById('source-container');
    if (img.source) {
        sourceContainer.classList.remove('hidden');
        document.getElementById('detail-source').textContent = img.source;
    } else {
        sourceContainer.classList.add('hidden');
    }

    const tagsContainer = document.getElementById('detail-tags');
    tagsContainer.innerHTML = '';
    if (img.tags && img.tags.length > 0) {
        img.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black rounded-lg uppercase border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all';
            span.textContent = tag;
            span.onclick = (e) => {
                e.stopPropagation();
                searchQuery = tag.toLowerCase();
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = tag;
                applyFilters();
                if (window.innerWidth < 1024) {
                    document.body.classList.remove('details-open');
                    document.getElementById('details-overlay').classList.add('hidden');
                }
            };
            tagsContainer.appendChild(span);
        });
    } else {
        tagsContainer.innerHTML = '<span class="text-[10px] text-zinc-400 italic">No tags</span>';
    }

    document.getElementById('download-btn').onclick = async () => {
        if (!selectedImage) return;
        
        const btn = document.getElementById('download-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Preparing...';
        btn.disabled = true;

        try {
            const response = await fetch(selectedImage.path);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            const ext = selectedImage.path.split('.').pop();
            link.download = `${selectedImage.name}.${ext}`;
            
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            btn.textContent = 'Success!';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
        } catch (err) {
            console.error('Download failed:', err);
            window.open(selectedImage.path, '_blank');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    };
}

if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) uploadBtn.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', init);

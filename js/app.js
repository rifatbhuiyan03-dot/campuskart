/**
 * CampusKart - Main Application Logic
 * Powers search, filtering, item rendering, posting new items, and interactions.
 */

// Storage keys
const STORAGE_ITEMS_KEY = 'campuskart_listings_v1';
const STORAGE_WISHLIST_KEY = 'campuskart_wishlist_v1';

// State
let items = [];
let wishlist = new Set();
let activeFilters = {
  searchQuery: '',
  courseCode: 'All Courses',
  category: 'All Categories',
  transaction: 'All',
  condition: 'All',
  sortBy: 'featured',
  showWishlistOnly: false
};

// Preset images for easy item posting
const PRESET_IMAGES = [
  { label: 'Textbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Calculator / Tech', url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80' },
  { label: 'Lab / STEM Kit', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dorm / Living', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80' },
  { label: 'Study Notes / Binder', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Headphones / Gear', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' }
];

// Initialize application on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initUI();
  populateDropdowns();
  bindEvents();
  renderItems();
  updateWishlistCount();
});

/**
 * Load items and wishlist from localStorage or fallback to default dataset
 */
function loadData() {
  try {
    const savedItems = localStorage.getItem(STORAGE_ITEMS_KEY);
    if (savedItems) {
      items = JSON.parse(savedItems);
    } else {
      items = [...INITIAL_ITEMS];
      saveItemsToStorage();
    }

    const savedWishlist = localStorage.getItem(STORAGE_WISHLIST_KEY);
    if (savedWishlist) {
      wishlist = new Set(JSON.parse(savedWishlist));
    }
  } catch (err) {
    console.error('Error reading localStorage', err);
    items = [...INITIAL_ITEMS];
    wishlist = new Set();
  }
}

function saveItemsToStorage() {
  try {
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not save items to localStorage', e);
  }
}

function saveWishlistToStorage() {
  try {
    localStorage.setItem(STORAGE_WISHLIST_KEY, JSON.stringify(Array.from(wishlist)));
  } catch (e) {
    console.warn('Could not save wishlist to localStorage', e);
  }
}

/**
 * Populate Course Code & Category Dropdowns
 */
function populateDropdowns() {
  const courseFilter = document.getElementById('filterCourse');
  const modalCourse = document.getElementById('postCourse');
  const categoryFilter = document.getElementById('filterCategory');
  const modalCategory = document.getElementById('postCategory');
  const quickCourseChips = document.getElementById('quickCourseChips');

  // Dynamic course list based on existing items + standard COURSE_CODES
  const allCourses = Array.from(new Set([...COURSE_CODES, ...items.map(i => i.courseCode)])).filter(Boolean);

  if (courseFilter) {
    courseFilter.innerHTML = allCourses.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  if (modalCourse) {
    const selectableCourses = allCourses.filter(c => c !== 'All Courses');
    modalCourse.innerHTML = `<option value="">Select or type course...</option>` +
      selectableCourses.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  if (categoryFilter) {
    categoryFilter.innerHTML = CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  if (modalCategory) {
    const selectableCats = CATEGORIES.filter(c => c !== 'All Categories');
    modalCategory.innerHTML = `<option value="">Select category...</option>` +
      selectableCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  // Quick course chips for 1-click filter
  if (quickCourseChips) {
    const popularCourses = ['All Courses', 'MATH 201', 'CS 101', 'CS 201', 'CHEM 121', 'BIO 110', 'ECON 101'];
    quickCourseChips.innerHTML = popularCourses.map(course => {
      const isActive = activeFilters.courseCode === course;
      return `
        <button type="button" 
                data-course="${course}" 
                class="quick-course-chip px-3 py-1 text-xs font-medium rounded-full transition-all border ${
                  isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                }">
          ${course === 'All Courses' ? '<i class="fa-solid fa-layer-group mr-1"></i>All Courses' : `<i class="fa-solid fa-graduation-cap mr-1 text-indigo-400"></i>${course}`}
        </button>
      `;
    }).join('');

    // Attach click events to quick chips
    quickCourseChips.querySelectorAll('.quick-course-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selected = e.currentTarget.getAttribute('data-course');
        activeFilters.courseCode = selected;
        if (courseFilter) courseFilter.value = selected;
        updateQuickCourseChipsUI();
        renderItems();
      });
    });
  }
}

function updateQuickCourseChipsUI() {
  const chips = document.querySelectorAll('.quick-course-chip');
  chips.forEach(chip => {
    const c = chip.getAttribute('data-course');
    if (c === activeFilters.courseCode) {
      chip.className = 'quick-course-chip px-3 py-1 text-xs font-medium rounded-full transition-all border bg-indigo-600 text-white border-indigo-600 shadow-sm';
    } else {
      chip.className = 'quick-course-chip px-3 py-1 text-xs font-medium rounded-full transition-all border bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50';
    }
  });
}

/**
 * Initialize UI Elements & Presets
 */
function initUI() {
  // Populate image quick-pick selector in modal
  const presetContainer = document.getElementById('presetImagePickers');
  if (presetContainer) {
    presetContainer.innerHTML = PRESET_IMAGES.map((preset, idx) => `
      <button type="button" 
              class="preset-image-btn text-left p-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 transition-all group flex items-center space-x-2 ${idx === 0 ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500' : 'bg-white'}" 
              data-url="${preset.url}">
        <img src="${preset.url}" class="w-8 h-8 rounded object-cover shadow-xs" alt="${preset.label}" />
        <span class="text-xs font-medium text-slate-700 group-hover:text-indigo-600">${preset.label}</span>
      </button>
    `).join('');

    presetContainer.querySelectorAll('.preset-image-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        presetContainer.querySelectorAll('.preset-image-btn').forEach(b => {
          b.classList.remove('border-indigo-500', 'bg-indigo-50/40', 'ring-1', 'ring-indigo-500');
          b.classList.add('border-slate-200', 'bg-white');
        });
        const current = e.currentTarget;
        current.classList.add('border-indigo-500', 'bg-indigo-50/40', 'ring-1', 'ring-indigo-500');
        current.classList.remove('border-slate-200', 'bg-white');
        
        const urlInput = document.getElementById('postImageUrl');
        if (urlInput) {
          urlInput.value = current.getAttribute('data-url');
          updatePostImagePreview(current.getAttribute('data-url'));
        }
      });
    });
  }
}

function updatePostImagePreview(url) {
  const preview = document.getElementById('postImagePreview');
  if (preview) {
    if (url) {
      preview.src = url;
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
    }
  }
}

/**
 * Event Listeners
 */
function bindEvents() {
  // Main Search Input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeFilters.searchQuery = e.target.value.trim().toLowerCase();
      renderItems();
    });
  }

  // Course Code Filter Dropdown
  const filterCourse = document.getElementById('filterCourse');
  if (filterCourse) {
    filterCourse.addEventListener('change', (e) => {
      activeFilters.courseCode = e.target.value;
      updateQuickCourseChipsUI();
      renderItems();
    });
  }

  // Category Filter Dropdown
  const filterCategory = document.getElementById('filterCategory');
  if (filterCategory) {
    filterCategory.addEventListener('change', (e) => {
      activeFilters.category = e.target.value;
      updateCategoryPillsUI();
      renderItems();
    });
  }

  // Category Pills in Toolbar
  const categoryPills = document.querySelectorAll('.category-pill');
  categoryPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      const selected = e.currentTarget.getAttribute('data-category');
      activeFilters.category = selected;
      if (filterCategory) filterCategory.value = selected;
      updateCategoryPillsUI();
      renderItems();
    });
  });

  // Transaction Tabs (All, Sell, Borrow, Exchange)
  const transactionTabs = document.querySelectorAll('.transaction-tab');
  transactionTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      transactionTabs.forEach(t => {
        t.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
        t.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
      });
      const current = e.currentTarget;
      current.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');
      current.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');

      activeFilters.transaction = current.getAttribute('data-transaction');
      renderItems();
    });
  });

  // Condition Filter Dropdown
  const filterCondition = document.getElementById('filterCondition');
  if (filterCondition) {
    filterCondition.addEventListener('change', (e) => {
      activeFilters.condition = e.target.value;
      renderItems();
    });
  }

  // Sort Dropdown
  const sortBy = document.getElementById('sortBy');
  if (sortBy) {
    sortBy.addEventListener('change', (e) => {
      activeFilters.sortBy = e.target.value;
      renderItems();
    });
  }

  // Reset Filters Button
  const btnReset = document.getElementById('btnResetFilters');
  if (btnReset) {
    btnReset.addEventListener('click', resetFilters);
  }

  // Wishlist Nav Button Toggle
  const wishlistNavBtn = document.getElementById('navWishlistBtn');
  if (wishlistNavBtn) {
    wishlistNavBtn.addEventListener('click', () => {
      activeFilters.showWishlistOnly = !activeFilters.showWishlistOnly;
      updateWishlistNavIndicator();
      renderItems();
      if (activeFilters.showWishlistOnly) {
        showToast(`Showing ${wishlist.size} saved items`, 'info');
      }
    });
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Modal: Open Post Item
  const openPostModalBtns = document.querySelectorAll('.open-post-modal-btn');
  const postModal = document.getElementById('postItemModal');
  const closePostModalBtn = document.getElementById('closePostModal');
  const cancelPostModalBtn = document.getElementById('cancelPostModal');

  openPostModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (postModal) {
        postModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
    });
  });

  if (closePostModalBtn) closePostModalBtn.addEventListener('click', closePostModal);
  if (cancelPostModalBtn) cancelPostModalBtn.addEventListener('click', closePostModal);

  // Dynamic Transaction fields in Post Item Modal
  const postTransactionInputs = document.querySelectorAll('input[name="postTransaction"]');
  postTransactionInputs.forEach(radio => {
    radio.addEventListener('change', updatePostModalFields);
  });

  // Image URL input live preview
  const postImageUrlInput = document.getElementById('postImageUrl');
  if (postImageUrlInput) {
    postImageUrlInput.addEventListener('input', (e) => {
      updatePostImagePreview(e.target.value.trim());
    });
  }

  // Submit Post Item Form
  const postItemForm = document.getElementById('postItemForm');
  if (postItemForm) {
    postItemForm.addEventListener('submit', handleNewListingSubmit);
  }

  // Close Modals on backdrop click or Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePostModal();
      closeDetailsModal();
    }
  });

  const detailsModal = document.getElementById('itemDetailsModal');
  const closeDetailsModalBtn = document.getElementById('closeDetailsModal');
  if (closeDetailsModalBtn) closeDetailsModalBtn.addEventListener('click', closeDetailsModal);

  // Close modals when clicking backdrop
  [postModal, detailsModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closePostModal();
          closeDetailsModal();
        }
      });
    }
  });
}

function updateCategoryPillsUI() {
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => {
    const cat = p.getAttribute('data-category');
    if (cat === activeFilters.category) {
      p.classList.add('active', 'bg-indigo-600', 'text-white', 'border-indigo-600');
      p.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
    } else {
      p.classList.remove('active', 'bg-indigo-600', 'text-white', 'border-indigo-600');
      p.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
    }
  });
}

function updateWishlistNavIndicator() {
  const btn = document.getElementById('navWishlistBtn');
  if (!btn) return;
  if (activeFilters.showWishlistOnly) {
    btn.classList.add('bg-rose-50', 'text-rose-600', 'border-rose-300');
    btn.classList.remove('text-slate-600', 'border-slate-200');
  } else {
    btn.classList.remove('bg-rose-50', 'text-rose-600', 'border-rose-300');
    btn.classList.add('text-slate-600', 'border-slate-200');
  }
}

function resetFilters() {
  activeFilters = {
    searchQuery: '',
    courseCode: 'All Courses',
    category: 'All Categories',
    transaction: 'All',
    condition: 'All',
    sortBy: 'featured',
    showWishlistOnly: false
  };

  const searchInput = document.getElementById('searchInput');
  const filterCourse = document.getElementById('filterCourse');
  const filterCategory = document.getElementById('filterCategory');
  const filterCondition = document.getElementById('filterCondition');
  const sortBy = document.getElementById('sortBy');

  if (searchInput) searchInput.value = '';
  if (filterCourse) filterCourse.value = 'All Courses';
  if (filterCategory) filterCategory.value = 'All Categories';
  if (filterCondition) filterCondition.value = 'All';
  if (sortBy) sortBy.value = 'featured';

  // Reset transaction tabs UI
  const transactionTabs = document.querySelectorAll('.transaction-tab');
  transactionTabs.forEach(tab => {
    if (tab.getAttribute('data-transaction') === 'All') {
      tab.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
      tab.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');
    } else {
      tab.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
      tab.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
    }
  });

  updateCategoryPillsUI();
  updateQuickCourseChipsUI();
  updateWishlistNavIndicator();
  renderItems();
  showToast('Filters cleared', 'info');
}

/**
 * Filter & Sort Logic
 */
function getFilteredItems() {
  return items.filter(item => {
    // Wishlist filter
    if (activeFilters.showWishlistOnly && !wishlist.has(item.id)) {
      return false;
    }

    // Keyword Search (checks title, description, courseCode, category, seller location)
    if (activeFilters.searchQuery) {
      const q = activeFilters.searchQuery;
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCourse = item.courseCode.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchLocation = item.location.toLowerCase().includes(q);
      const matchSeller = item.seller.name.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCourse && !matchCategory && !matchLocation && !matchSeller) {
        return false;
      }
    }

    // Course Code Filter
    if (activeFilters.courseCode !== 'All Courses') {
      if (item.courseCode !== activeFilters.courseCode) {
        return false;
      }
    }

    // Category Filter
    if (activeFilters.category !== 'All Categories') {
      if (item.category !== activeFilters.category) {
        return false;
      }
    }

    // Transaction Tag Filter (Sell, Borrow, Exchange)
    if (activeFilters.transaction !== 'All') {
      if (item.transaction.toLowerCase() !== activeFilters.transaction.toLowerCase()) {
        return false;
      }
    }

    // Condition Filter (Brand New, Like New, Good, Fair)
    if (activeFilters.condition !== 'All') {
      if (item.condition.toLowerCase() !== activeFilters.condition.toLowerCase()) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (activeFilters.sortBy === 'price-asc') {
      return a.price - b.price;
    } else if (activeFilters.sortBy === 'price-desc') {
      return b.price - a.price;
    } else if (activeFilters.sortBy === 'newest') {
      return b.id.localeCompare(a.id);
    }
    // Default: featured first
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });
}

/**
 * Render items into the marketplace grid
 */
function renderItems() {
  const container = document.getElementById('itemsGrid');
  const countDisplay = document.getElementById('resultsCount');
  const activeFiltersContainer = document.getElementById('activeFilterPills');
  if (!container) return;

  const filtered = getFilteredItems();

  // Update counts
  if (countDisplay) {
    countDisplay.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'} available`;
  }

  // Render active filter badges
  if (activeFiltersContainer) {
    const badges = [];
    if (activeFilters.searchQuery) {
      badges.push(`Keyword: "${activeFilters.searchQuery}"`);
    }
    if (activeFilters.courseCode !== 'All Courses') {
      badges.push(`Course: ${activeFilters.courseCode}`);
    }
    if (activeFilters.category !== 'All Categories') {
      badges.push(`Category: ${activeFilters.category}`);
    }
    if (activeFilters.transaction !== 'All') {
      badges.push(`Type: ${activeFilters.transaction}`);
    }
    if (activeFilters.condition !== 'All') {
      badges.push(`Condition: ${activeFilters.condition}`);
    }
    if (activeFilters.showWishlistOnly) {
      badges.push(`Saved Wishlist`);
    }

    if (badges.length > 0) {
      activeFiltersContainer.innerHTML = `
        <div class="flex items-center flex-wrap gap-1.5 py-1">
          <span class="text-xs text-slate-500 font-medium mr-1">Active filters:</span>
          ${badges.map(b => `
            <span class="inline-flex items-center text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
              ${b}
            </span>
          `).join('')}
          <button onclick="resetFilters()" class="text-xs text-rose-600 hover:text-rose-700 font-medium ml-2 underline">
            Clear all
          </button>
        </div>
      `;
    } else {
      activeFiltersContainer.innerHTML = '';
    }
  }

  // Handle empty state
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 text-2xl">
          <i class="fa-solid fa-search"></i>
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-1">No items found</h3>
        <p class="text-sm text-slate-500 max-w-md mx-auto mb-6">
          We couldn't find any listings matching your active filters. Try adjusting your course code, transaction type, or keywords.
        </p>
        <div class="flex justify-center gap-3">
          <button onclick="resetFilters()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
            Reset Filters
          </button>
          <button class="open-post-modal-btn px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition">
            Post This Item Instead
          </button>
        </div>
      </div>
    `;

    // Re-bind modal open buttons created dynamically
    container.querySelectorAll('.open-post-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const postModal = document.getElementById('postItemModal');
        if (postModal) postModal.classList.remove('hidden');
      });
    });
    return;
  }

  // Render cards
  container.innerHTML = filtered.map(item => generateCardHtml(item)).join('');

  // Bind interactive card events (Wishlist heart, Quick View / Details modal)
  container.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.getAttribute('data-id');
      toggleWishlist(itemId, btn);
    });
  });

  container.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.getAttribute('data-id');
      openDetailsModal(itemId);
    });
  });
}

/**
 * Generate HTML string for single item card
 */
function generateCardHtml(item) {
  const isWishlisted = wishlist.has(item.id);

  // Condition Badge styling & icon
  let conditionClass = 'condition-good';
  let conditionIcon = 'fa-check-circle';
  if (item.condition === 'Brand New') {
    conditionClass = 'condition-brand-new';
    conditionIcon = 'fa-certificate';
  } else if (item.condition === 'Like New') {
    conditionClass = 'condition-like-new';
    conditionIcon = 'fa-sparkles';
  } else if (item.condition === 'Fair') {
    conditionClass = 'condition-fair';
    conditionIcon = 'fa-tag';
  }

  // Transaction Tag styling & icon
  let transactionClass = 'transaction-sell';
  let transactionIcon = 'fa-dollar-sign';
  let transactionBadgeLabel = 'FOR SALE';
  let priceSnippet = `<span class="text-xl font-bold text-slate-900">${item.priceLabel}</span>`;

  if (item.transaction === 'Borrow') {
    transactionClass = 'transaction-borrow';
    transactionIcon = 'fa-clock';
    transactionBadgeLabel = 'BORROW';
    priceSnippet = `
      <div class="flex flex-col">
        <span class="text-lg font-bold text-purple-700">${item.priceLabel}</span>
        <span class="text-[11px] text-purple-600/80 font-medium">Lending terms apply</span>
      </div>
    `;
  } else if (item.transaction === 'Exchange') {
    transactionClass = 'transaction-exchange';
    transactionIcon = 'fa-right-left';
    transactionBadgeLabel = 'EXCHANGE';
    priceSnippet = `
      <div class="flex flex-col">
        <span class="text-sm font-bold text-sky-700 flex items-center gap-1">
          <i class="fa-solid fa-arrows-rotate text-xs"></i> Trade Item
        </span>
        <span class="text-[11px] text-slate-500 truncate max-w-[170px]" title="${item.exchangeFor || 'Campus swap'}">
          ${item.exchangeFor || 'Open to offers'}
        </span>
      </div>
    `;
  }

  return `
    <article class="item-card bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-indigo-300">
      <div>
        <!-- Card Top: Media + Absolute Badges -->
        <div class="relative w-full h-48 bg-slate-100 overflow-hidden">
          <img src="${item.image}" 
               alt="${item.title}" 
               class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
               loading="lazy" 
               onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'" />
          
          <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/30 pointer-events-none"></div>

          <!-- Top-Left: Transaction Tag -->
          <div class="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            <span class="${transactionClass} px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid ${transactionIcon}"></i>
              ${transactionBadgeLabel}
            </span>
          </div>

          <!-- Top-Right: Wishlist Heart -->
          <button type="button" 
                  data-id="${item.id}" 
                  class="wishlist-toggle-btn absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-600 shadow-sm flex items-center justify-center transition-all ${isWishlisted ? 'text-rose-500' : 'text-slate-600'}"
                  title="${isWishlisted ? 'Remove from saved' : 'Save item'}">
            <i class="${isWishlisted ? 'fa-solid fa-heart text-rose-500' : 'fa-regular fa-heart'} text-sm transition-transform active:scale-125"></i>
          </button>

          <!-- Bottom bar on image: Condition Badge + Course Code -->
          <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
            <!-- Condition Badge -->
            <span class="${conditionClass} px-2 py-0.5 rounded-md font-semibold text-[11px] flex items-center gap-1 shadow-xs">
              <i class="fa-solid ${conditionIcon} text-[10px]"></i>
              ${item.condition}
            </span>

            <!-- Course Code Tag -->
            <span class="course-badge px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide bg-white/95 text-slate-800 shadow-xs">
              <i class="fa-solid fa-book-open text-indigo-600 mr-1 text-[10px]"></i>${item.courseCode}
            </span>
          </div>
        </div>

        <!-- Card Body Content -->
        <div class="p-4">
          <!-- Category & Posted Date -->
          <div class="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>${item.category}</span>
            <span><i class="fa-regular fa-clock mr-1"></i>${item.postedAt}</span>
          </div>

          <!-- Title -->
          <h3 class="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2" title="${item.title}">
            ${item.title}
          </h3>

          <!-- Description snippet -->
          <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            ${item.description}
          </p>

          <!-- Price / Transaction terms row -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between min-h-[46px]">
            <div>
              ${priceSnippet}
            </div>
            ${item.originalPrice ? `<span class="text-xs text-slate-400 line-through">${item.originalPrice}</span>` : ''}
          </div>
        </div>
      </div>

      <!-- Card Footer: Seller info + Action Button -->
      <div class="px-4 py-3 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2.5 min-w-0">
          <img src="${item.seller.avatar}" 
               alt="${item.seller.name}" 
               class="w-7 h-7 rounded-full object-cover ring-2 ring-white" 
               onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'" />
          <div class="min-w-0">
            <div class="flex items-center gap-1">
              <p class="text-xs font-semibold text-slate-800 truncate">${item.seller.name}</p>
              <i class="fa-solid fa-circle-check text-emerald-500 text-[10px]" title="Verified Student"></i>
            </div>
            <p class="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <i class="fa-solid fa-location-dot text-slate-300 text-[9px]"></i>
              ${item.location}
            </p>
          </div>
        </div>

        <button type="button" 
                data-id="${item.id}" 
                class="view-details-btn px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1">
          <span>View</span>
          <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
      </div>
    </article>
  `;
}

/**
 * Toggle Saved / Wishlist item
 */
function toggleWishlist(itemId, btnElement) {
  if (wishlist.has(itemId)) {
    wishlist.delete(itemId);
    showToast('Removed from your saved items', 'info');
  } else {
    wishlist.add(itemId);
    showToast('Added to your campus wishlist! ❤️', 'success');
  }

  saveWishlistToStorage();
  updateWishlistCount();

  // If we are currently filtering by wishlist, re-render immediately
  if (activeFilters.showWishlistOnly) {
    renderItems();
  } else {
    // Just toggle the heart button appearance without full grid flicker
    const icon = btnElement.querySelector('i');
    if (wishlist.has(itemId)) {
      btnElement.classList.add('text-rose-500');
      icon.className = 'fa-solid fa-heart text-rose-500 text-sm heart-bounce';
    } else {
      btnElement.classList.remove('text-rose-500');
      icon.className = 'fa-regular fa-heart text-sm';
    }
  }
}

function updateWishlistCount() {
  const countBadge = document.getElementById('navWishlistCount');
  if (countBadge) {
    countBadge.textContent = wishlist.size;
    if (wishlist.size > 0) {
      countBadge.classList.remove('hidden');
    } else {
      countBadge.classList.add('hidden');
    }
  }
}

/**
 * Item Details Modal
 */
function openDetailsModal(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const modal = document.getElementById('itemDetailsModal');
  const content = document.getElementById('itemDetailsContent');
  if (!modal || !content) return;

  // Condition styling for modal
  let conditionClass = 'condition-good';
  if (item.condition === 'Brand New') conditionClass = 'condition-brand-new';
  if (item.condition === 'Like New') conditionClass = 'condition-like-new';
  if (item.condition === 'Fair') conditionClass = 'condition-fair';

  // Transaction banner
  let transactionClass = 'transaction-sell';
  let transactionLabel = 'FOR SALE';
  let transactionAction = `Buy for ${item.priceLabel}`;
  if (item.transaction === 'Borrow') {
    transactionClass = 'transaction-borrow';
    transactionLabel = 'AVAILABLE FOR BORROW';
    transactionAction = `Request to Borrow (${item.priceLabel})`;
  } else if (item.transaction === 'Exchange') {
    transactionClass = 'transaction-exchange';
    transactionLabel = 'OPEN TO EXCHANGE';
    transactionAction = 'Propose a Trade';
  }

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Left Column: Large Image & Quick Specs -->
      <div>
        <div class="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 h-72 sm:h-80">
          <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover" />
          <div class="absolute top-3 left-3">
            <span class="${transactionClass} px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow">
              ${transactionLabel}
            </span>
          </div>
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span class="${conditionClass} px-2.5 py-1 rounded-lg font-semibold text-xs shadow-xs">
              Condition: ${item.condition}
            </span>
            <span class="course-badge px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 shadow-xs">
              Course: ${item.courseCode}
            </span>
          </div>
        </div>

        <!-- Campus Safety Guarantee Banner -->
        <div class="mt-4 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start space-x-3 text-xs text-emerald-900">
          <i class="fa-solid fa-shield-halved text-emerald-600 text-base mt-0.5"></i>
          <div>
            <p class="font-bold">Campus Safe Exchange Policy</p>
            <p class="text-emerald-800 text-[11px] mt-0.5">Meet at recommended campus zones (Student Union, Main Library Desk, Dining Commons). Check item condition in-person before transferring payment.</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Details & Seller Connect -->
      <div class="flex flex-col justify-between">
        <div>
          <!-- Category & Post time -->
          <div class="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span>${item.category}</span>
            <span>Posted ${item.postedAt} • ${item.views || 45} views</span>
          </div>

          <h2 class="text-xl font-bold text-slate-900 leading-snug mb-3">${item.title}</h2>

          <!-- Price & Terms Highlight -->
          <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl mb-4">
            <div class="flex items-baseline justify-between mb-1">
              <span class="text-2xl font-extrabold text-indigo-700">${item.priceLabel}</span>
              ${item.originalPrice ? `<span class="text-xs text-slate-400">Campus MSRP: ${item.originalPrice}</span>` : ''}
            </div>

            ${item.borrowTerms ? `
              <div class="mt-2 text-xs bg-purple-50 text-purple-800 p-2 rounded-lg border border-purple-200">
                <i class="fa-solid fa-clock mr-1"></i><strong>Borrow Terms:</strong> ${item.borrowTerms}
              </div>
            ` : ''}

            ${item.exchangeFor ? `
              <div class="mt-2 text-xs bg-sky-50 text-sky-800 p-2 rounded-lg border border-sky-200">
                <i class="fa-solid fa-arrows-rotate mr-1"></i><strong>Exchange Preference:</strong> ${item.exchangeFor}
              </div>
            ` : ''}
          </div>

          <!-- Description -->
          <div class="mb-4">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</h4>
            <p class="text-sm text-slate-700 leading-relaxed">${item.description}</p>
          </div>

          <!-- Pickup Location -->
          <div class="flex items-center text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mb-4">
            <i class="fa-solid fa-location-dot text-indigo-600 text-sm mr-2.5"></i>
            <div>
              <span class="font-bold text-slate-800">Campus Pickup Spot:</span>
              <p class="text-slate-500">${item.location}</p>
            </div>
          </div>

          <!-- Seller Profile Card -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <img src="${item.seller.avatar}" class="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-200" alt="${item.seller.name}" />
              <div>
                <div class="flex items-center gap-1.5">
                  <h4 class="text-xs font-bold text-slate-900">${item.seller.name}</h4>
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                    <i class="fa-solid fa-check text-[8px]"></i>${item.seller.badge || 'Verified'}
                  </span>
                </div>
                <p class="text-[11px] text-slate-500">${item.seller.major}</p>
              </div>
            </div>
            <div class="text-right text-[11px] text-slate-400">
              <div class="text-amber-500 font-bold"><i class="fa-solid fa-star text-xs mr-0.5"></i>${item.seller.rating || 5.0}</div>
              <span>${item.seller.responseTime || '< 15 mins'}</span>
            </div>
          </div>
        </div>

        <!-- Chat / Contact simulation box -->
        <div class="pt-3 border-t border-slate-200">
          <div class="flex gap-2 mb-2">
            <input type="text" 
                   id="studentChatInput" 
                   placeholder="Hi ${item.seller.name.split(' ')[0]}, is this still available?" 
                   value="Hi ${item.seller.name.split(' ')[0]}, can we meet at ${item.location}?" 
                   class="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" />
            <button type="button" 
                    id="sendCampusMessageBtn" 
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1">
              <i class="fa-solid fa-paper-plane text-[10px]"></i>
              <span>Send</span>
            </button>
          </div>
          <p class="text-[10px] text-slate-400 text-center">Messages are routed to the student's campus email.</p>
        </div>
      </div>
    </div>
  `;

  // Attach message send trigger
  const sendBtn = content.querySelector('#sendCampusMessageBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const input = content.querySelector('#studentChatInput');
      const val = input ? input.value.trim() : '';
      if (!val) {
        showToast('Please type a message first', 'warning');
        return;
      }
      sendBtn.innerHTML = `<i class="fa-solid fa-check mr-1"></i>Sent!`;
      sendBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
      sendBtn.classList.add('bg-emerald-600');
      showToast(`Message sent to ${item.seller.name}! They will receive it on their campus email.`, 'success');
      setTimeout(() => {
        closeDetailsModal();
      }, 1400);
    });
  }

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeDetailsModal() {
  const modal = document.getElementById('itemDetailsModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

/**
 * Post Item Modal Controls & Form Logic
 */
function closePostModal() {
  const modal = document.getElementById('postItemModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function updatePostModalFields() {
  const selectedTransaction = document.querySelector('input[name="postTransaction"]:checked')?.value || 'Sell';
  const priceContainer = document.getElementById('postPriceField');
  const borrowContainer = document.getElementById('postBorrowField');
  const exchangeContainer = document.getElementById('postExchangeField');

  if (priceContainer) priceContainer.classList.add('hidden');
  if (borrowContainer) borrowContainer.classList.add('hidden');
  if (exchangeContainer) exchangeContainer.classList.add('hidden');

  if (selectedTransaction === 'Sell' && priceContainer) {
    priceContainer.classList.remove('hidden');
  } else if (selectedTransaction === 'Borrow' && borrowContainer) {
    borrowContainer.classList.remove('hidden');
  } else if (selectedTransaction === 'Exchange' && exchangeContainer) {
    exchangeContainer.classList.remove('hidden');
  }
}

function handleNewListingSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('postTitle').value.trim();
  const category = document.getElementById('postCategory').value;
  const courseCode = document.getElementById('postCourse').value.trim() || 'General';
  const condition = document.querySelector('input[name="postCondition"]:checked')?.value || 'Good';
  const transaction = document.querySelector('input[name="postTransaction"]:checked')?.value || 'Sell';
  const location = document.getElementById('postLocation').value.trim() || 'Main Campus Library';
  const description = document.getElementById('postDescription').value.trim();
  const imageUrl = document.getElementById('postImageUrl').value.trim() || PRESET_IMAGES[0].url;
  const sellerName = document.getElementById('postSellerName').value.trim() || 'Campus Student';
  const sellerMajor = document.getElementById('postSellerMajor').value.trim() || 'Undergrad Student \'26';

  if (!title || !category || !description) {
    showToast('Please fill out the required title, category, and description fields.', 'warning');
    return;
  }

  // Construct price / borrow / exchange data
  let price = 0;
  let priceLabel = 'Free';
  let borrowTerms = null;
  let exchangeFor = null;

  if (transaction === 'Sell') {
    const rawPrice = parseFloat(document.getElementById('postPriceInput')?.value || 0);
    price = isNaN(rawPrice) ? 0 : rawPrice;
    priceLabel = `$${price}`;
  } else if (transaction === 'Borrow') {
    const rawRate = document.getElementById('postBorrowRateInput')?.value.trim() || '$5 / week';
    borrowTerms = document.getElementById('postBorrowTermsInput')?.value.trim() || 'Standard deposit required';
    priceLabel = rawRate;
    price = 5;
  } else if (transaction === 'Exchange') {
    exchangeFor = document.getElementById('postExchangeForInput')?.value.trim() || 'Open to course-related trades';
    priceLabel = 'Trade Only';
    price = 0;
  }

  const newItem = {
    id: `ck-${Date.now().toString().slice(-5)}`,
    title,
    category,
    courseCode: courseCode.toUpperCase(),
    condition,
    transaction,
    price,
    priceLabel,
    originalPrice: null,
    exchangeFor,
    borrowTerms,
    image: imageUrl,
    description,
    location,
    seller: {
      name: sellerName,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      major: sellerMajor,
      badge: 'Verified Student',
      rating: 5.0,
      reviewsCount: 1,
      responseTime: '< 5 mins'
    },
    postedAt: 'Just now',
    featured: true,
    views: 1
  };

  // Prepend new listing so it appears first
  items.unshift(newItem);
  saveItemsToStorage();

  // Reset form and close
  e.target.reset();
  closePostModal();

  // Reset filter to see all items if filtered
  activeFilters.searchQuery = '';
  activeFilters.courseCode = 'All Courses';
  activeFilters.category = 'All Categories';
  activeFilters.transaction = 'All';
  activeFilters.condition = 'All';
  activeFilters.showWishlistOnly = false;

  populateDropdowns();
  updateCategoryPillsUI();
  updateQuickCourseChipsUI();
  renderItems();

  showToast('🎉 Your listing is live on CampusKart!', 'success');

  // Smooth scroll to items grid
  const grid = document.getElementById('itemsGrid');
  if (grid) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  let iconClass = 'fa-solid fa-circle-info text-blue-500';
  let borderClass = 'border-blue-200';

  if (type === 'success') {
    iconClass = 'fa-solid fa-circle-check text-emerald-500';
    borderClass = 'border-emerald-200';
  } else if (type === 'warning') {
    iconClass = 'fa-solid fa-triangle-exclamation text-amber-500';
    borderClass = 'border-amber-200';
  }

  toast.className = `flex items-center space-x-3 bg-white px-4 py-3 rounded-xl shadow-lg border ${borderClass} text-slate-800 text-xs font-semibold animate-pop pointer-events-auto`;
  toast.innerHTML = `
    <i class="${iconClass} text-base shrink-0"></i>
    <span class="flex-1">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

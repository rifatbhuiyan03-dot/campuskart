/**
 * CampusKart - Main Application Logic
 * Powers search, filtering, item rendering, posting new items, and interactions.
 * Features:
 * 1. Strict university email authentication (@nub.ac.bd) for Northern University Bangladesh.
 * 2. Peer Exchange and Borrow/Return State Machine workflow (Available -> Requested -> Borrowed/In Exchange -> Returned).
 * 3. User Transactions Dashboard with real-time due date countdowns.
 * 4. Seller and Peer Rating System with dynamic star averages.
 */

// ============================================================================
// SUPABASE CLIENT CONFIGURATION & CLOUD PERSISTENCE
// ============================================================================
// Central Supabase configuration (fill credentials to enable real-time PostgreSQL persistence)
const SUPABASE_URL = ""; // e.g. "https://your-project.supabase.co"
const SUPABASE_ANON_KEY = ""; // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

let supabaseClientInstance = null;
let isSupabaseActive = false;

/**
 * Initializes the Supabase client safely with graceful fallback to localStorage.
 * If credentials are not filled or invalid, it runs without throwing any runtime errors.
 */
function initSupabase() {
  try {
    const hasValidUrl = typeof SUPABASE_URL === 'string' && 
                        SUPABASE_URL.trim().startsWith('https://') && 
                        SUPABASE_URL.trim().includes('.supabase.co');
    const hasValidKey = typeof SUPABASE_ANON_KEY === 'string' && 
                        SUPABASE_ANON_KEY.trim().length > 20;

    const sbLib = (typeof window !== 'undefined' && window.supabase) ? window.supabase : null;

    if (sbLib && typeof sbLib.createClient === 'function' && hasValidUrl && hasValidKey) {
      supabaseClientInstance = sbLib.createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      isSupabaseActive = true;
      console.log('✅ Supabase PostgreSQL connected via central app.js configuration.');
    } else {
      supabaseClientInstance = null;
      isSupabaseActive = false;
      console.log('⚡ Supabase credentials not configured. Gracefully operating with localStorage persistence.');
    }
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning (falling back to localStorage):', err);
    supabaseClientInstance = null;
    isSupabaseActive = false;
  }
}

// Storage keys (v2 with authentic NUB student listings & peer workflow switch)
const STORAGE_ITEMS_KEY = 'campuskart_listings_v2';
const STORAGE_WISHLIST_KEY = 'campuskart_wishlist_v2';
const STORAGE_AUTH_KEY = 'campuskart_auth_session_v2';
const STORAGE_USERS_KEY = 'campuskart_registered_users_v2';
const STORAGE_REVIEWS_KEY = 'campuskart_reviews_v2';

// Pre-seeded verified NUB student accounts for peer testing
const DEFAULT_NUB_USERS = [
  {
    id: "nub-user-rifat",
    name: "Rifat Hasan",
    email: "rifat.cse@nub.ac.bd",
    studentId: "202110045",
    department: "Computer Science & Engineering (CSE)",
    password: "campus123",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-01-10"
  },
  {
    id: "nub-user-ruma",
    name: "Ruma Akter",
    email: "ruma.cse@nub.ac.bd",
    studentId: "202220015",
    department: "Computer Science & Engineering (CSE)",
    password: "campus123",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-02-14"
  }
];

// State
let items = [];
let wishlist = new Set();
let registeredUsers = [];
let reviews = [];
let currentUser = null;
let pendingAuthAction = null;
let selectedApprovalDays = 7;
let currentDashListingFilter = 'all';

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
  { label: 'CSE Textbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', type: 'Textbook' },
  { label: 'Casio Calculator', url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80', type: 'Scientific Calculator' },
  { label: 'OS Lecture Notes', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80', type: 'Notes & Study Kit' },
  { label: 'VLSI & Lab Kit', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', type: 'Lab & Engineering' },
  { label: 'DLD Breadboard Kit', url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80', type: 'Lab & Engineering' },
  { label: 'Engineering Drawing', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', type: 'Drawing Tools' }
];

// Academic Presentation & Viva Defense Demo Items Dataset (Tailored for NUB CSE)
const CSE_DEMO_ITEMS = [
  {
    title: 'Casio fx-991MS Scientific Calculator (2-Line Display)',
    category: 'Tech & Electronics',
    courseCode: 'MATH 101',
    condition: 'Like New',
    transaction: 'Sell',
    price: 650,
    priceLabel: '৳650',
    borrowRate: null,
    borrowTerms: null,
    exchangeFor: null,
    location: 'NUB Central Library 2nd Fl (Ashkona)',
    description: 'Original Casio fx-991MS scientific calculator in pristine condition. Features 401 functions including matrix calculation, complex numbers, standard deviation, and differential integration. Slide-on hard protective cover and fresh battery included. Perfect for MATH 101, CSE 103, and EEE 101 semester exams.',
    image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
    previewType: 'Scientific Calculator',
    badge: 'Casio fx-991MS'
  },
  {
    title: 'Digital Logic Design Breadboard with IC 7408, 7432, 7404 Kit',
    category: 'Lab & Engineering',
    courseCode: 'CSE 123',
    condition: 'Like New',
    transaction: 'Borrow',
    borrowRate: '৳50 / week',
    borrowTerms: 'Complete TTL logic kit. Return all 4 ICs in foam protector with 65-pc jumper wire bundle.',
    price: 50,
    priceLabel: '৳50 / week',
    exchangeFor: null,
    location: 'NUB Hardware Lab 304, CSE Building (Ashkona)',
    description: 'Complete electronics kit for Digital Logic Design (CSE 123). Standard 830-point solderless breadboard with logic gates: IC 7408 (Quad 2-input AND), IC 7432 (Quad 2-input OR), IC 7404 (Hex Inverter NOT), and IC 7400 (Quad 2-input NAND). Includes 5mm red/green indicator LEDs, 330Ω resistors, and male-to-male jumper wire bundle.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    previewType: 'DLD Hardware Kit',
    badge: 'CSE 123 DLD Kit'
  },
  {
    title: 'CSE 3373 Operating Systems Notes & Solved Midterm Kit',
    category: 'Notes & Study Kits',
    courseCode: 'CSE 3373',
    condition: 'Like New',
    transaction: 'Exchange',
    exchangeFor: 'Looking to trade for CSE 311 (Database Systems) complete notes or lab manual',
    price: 0,
    priceLabel: 'Trade Only',
    borrowRate: null,
    borrowTerms: null,
    location: 'Ashkona Campus Study Zone / Library Ground Floor',
    description: 'Comprehensive spiral-bound handwritten lecture notes for CSE 3373 Operating Systems. Covers Process Synchronization, Semaphores, Deadlock Avoidance (Banker\'s Algorithm), CPU Scheduling algorithms (SJF, Round Robin), and Virtual Memory Paging. Includes past 4 semesters of solved NUB midterm & final exams with faculty answer keys.',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    previewType: 'OS Lecture Notes',
    badge: 'CSE 3373 OS Notes'
  },
  {
    title: 'Microprocessor 8086 Manual & CSE 3rd Semester Lecture Notes',
    category: 'Notes & Study Kits',
    courseCode: 'CSE 221',
    condition: 'Fair',
    transaction: 'Exchange',
    exchangeFor: 'Looking for Data Communications & Networking notes or textbook',
    price: 0,
    priceLabel: 'Trade Only',
    borrowRate: null,
    borrowTerms: null,
    location: 'NUB Ashkona Cafeteria & Student Lounge',
    description: 'Comprehensive handwritten and typed lecture notes for CSE 221 (Microprocessors & Assembly Language). Contains complete pin diagrams of Intel 8086, memory segmentation charts, addressing modes, and working MASM/EMU8086 assembly code routines.',
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
    previewType: 'Assembly Manual',
    badge: 'CSE 221 Microprocessor'
  },
  {
    title: 'Discrete Mathematics and Its Applications (Kenneth H. Rosen 7th Ed)',
    category: 'Textbooks',
    courseCode: 'CSE 103',
    condition: 'Good',
    transaction: 'Borrow',
    borrowRate: '৳30 / week',
    borrowTerms: 'Deposit ৳200 refundable upon clean return. Available for 1 to 4 weeks.',
    price: 30,
    priceLabel: '৳30 / week',
    exchangeFor: null,
    location: 'NUB Ashkona Cafeteria & Student Lounge',
    description: 'The core textbook for CSE 103 (Discrete Mathematics). Complete international edition covering propositional logic, set theory, predicate calculus, graph theory, trees, and Boolean algebra. Very clean text with pencil annotations on important solved problem sets.',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    previewType: 'Textbook',
    badge: 'CSE 103 Discrete Math'
  }
];

let currentDemoItemIndex = 0;
let currentUploadedImageDataUrl = null;

// Initialize application on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  loadAuthData();
  loadData();
  initUI();
  setupImageUploadAndPreview();
  bindDemoAndOfferEvents();
  populateDropdowns();
  bindEvents();
  bindAuthEvents();
  bindStateMachineEvents();
  renderItems();
  updateWishlistCount();
  updateAuthUI();
  updateNotificationBadges();
  // Real-Time Live Clock & Date initialization
  updateCampusClock();
  setInterval(updateCampusClock, 1000);
  setInterval(updateBorrowedCountdowns, 1000);

  // Initialize Featured Items Hero Carousel
  initHeroCarousel();
});

/**
 * =========================================================================
 * AUTHENTICATION SYSTEM & NUB VERIFICATION
 * =========================================================================
 */

function isValidNubEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const nubRegex = /^[a-zA-Z0-9._%+-]+@nub\.ac\.bd$/;
  return nubRegex.test(trimmed);
}

function loadAuthData() {
  try {
    const savedUsers = localStorage.getItem(STORAGE_USERS_KEY);
    if (savedUsers) {
      registeredUsers = JSON.parse(savedUsers);
      // Ensure Rifat and Ruma exist in registeredUsers pool
      DEFAULT_NUB_USERS.forEach(defUser => {
        if (!registeredUsers.some(u => u.studentId === defUser.studentId)) {
          registeredUsers.push(defUser);
        }
      });
      saveUsersToStorage();
    } else {
      registeredUsers = [...DEFAULT_NUB_USERS];
      saveUsersToStorage();
    }

    const savedSession = localStorage.getItem(STORAGE_AUTH_KEY);
    if (savedSession) {
      currentUser = JSON.parse(savedSession);
    } else {
      currentUser = null;
    }
  } catch (err) {
    console.error('Error loading auth data', err);
    registeredUsers = [...DEFAULT_NUB_USERS];
    currentUser = null;
  }
}

function saveUsersToStorage() {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(registeredUsers));
  } catch (e) {
    console.warn('Could not save users to localStorage', e);
  }
}

function saveSessionToStorage(user) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  } catch (e) {
    console.warn('Could not save session to localStorage', e);
  }
}

function updateAuthUI() {
  const navContainer = document.getElementById('navAuthContainer');
  const mobileContainer = document.getElementById('mobileAuthContainer');

  if (navContainer) {
    if (currentUser) {
      navContainer.innerHTML = `
        <div class="relative">
          <button type="button" 
                  id="userDropdownBtn" 
                  class="flex items-center space-x-2 py-1 px-2 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200 group">
            <div class="relative">
              <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}" 
                   alt="${currentUser.name}" 
                   class="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500 shadow-xs" 
                   onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'" />
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div class="text-left hidden xl:block">
              <div class="flex items-center gap-1">
                <span class="text-xs font-bold text-slate-800 leading-none group-hover:text-indigo-600 transition-colors">${currentUser.name.split(' ')[0]}</span>
                <i class="fa-solid fa-circle-check text-blue-600 text-[10px]" title="Verified @nub.ac.bd student"></i>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">ID: ${currentUser.studentId}</span>
            </div>
            <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors hidden sm:inline-block"></i>
          </button>

          <!-- Dropdown Profile Menu -->
          <div id="userDropdownMenu" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 profile-dropdown-menu">
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
              <div class="flex items-center gap-1.5">
                <p class="text-xs font-bold text-slate-900">${currentUser.name}</p>
                <span class="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded">NUB</span>
              </div>
              <p class="text-[11px] text-slate-500 truncate">${currentUser.email}</p>
              <div class="mt-1 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                <span>ID: <strong class="font-mono">${currentUser.studentId}</strong></span>
                <span class="text-emerald-600 font-bold"><i class="fa-solid fa-shield text-[9px]"></i> Active Student</span>
              </div>
              <p class="text-[10px] text-indigo-700 font-semibold mt-1 truncate">${currentUser.department || 'NUB Student'}</p>
            </div>

            <div class="py-1">
              <button type="button" 
                      id="menuDashboardBtn" 
                      class="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center justify-between transition">
                <span class="flex items-center gap-2"><i class="fa-solid fa-id-badge text-xs"></i> Profile & Dashboard</span>
                <span id="menuRequestBadge" class="hidden bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">0</span>
              </button>
              <button type="button" 
                      id="menuSavedItemsBtn" 
                      class="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5">
                <i class="fa-solid fa-heart text-slate-400 text-xs"></i>
                <span>My Saved Items</span>
              </button>
            </div>

            <div class="border-t border-slate-100 pt-1">
              <button type="button" 
                      id="menuLogoutBtn" 
                      class="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition">
                <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Bind dropdown toggle
      const btn = document.getElementById('userDropdownBtn');
      const menu = document.getElementById('userDropdownMenu');
      if (btn && menu) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          menu.classList.toggle('hidden');
        });
      }

      document.getElementById('menuDashboardBtn')?.addEventListener('click', () => {
        menu?.classList.add('hidden');
        openDashboard('listings');
      });

      document.getElementById('menuSavedItemsBtn')?.addEventListener('click', () => {
        menu?.classList.add('hidden');
        activeFilters.showWishlistOnly = true;
        updateWishlistNavIndicator();
        renderItems();
        showToast(`Showing ${wishlist.size} saved items`, 'info');
      });

      document.getElementById('menuLogoutBtn')?.addEventListener('click', () => {
        menu?.classList.add('hidden');
        handleLogout();
      });

    } else {
      // Guest state: Show Login & Sign Up buttons (clean Daraz-style, minimal on mobile)
      navContainer.innerHTML = `
        <div class="flex items-center space-x-1 sm:space-x-1.5">
          <button type="button" 
                  id="navLoginBtn" 
                  class="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50/50 transition flex items-center gap-1 border border-slate-200">
            <i class="fa-solid fa-arrow-right-to-bracket text-xs text-orange-500"></i>
            <span>Login</span>
          </button>
          <button type="button" 
                  id="navRegisterBtn" 
                  class="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition items-center gap-1.5 active:scale-95 shadow-xs">
            <i class="fa-solid fa-user-plus text-xs text-orange-400"></i>
            <span>Sign Up</span>
          </button>
        </div>
      `;

      document.getElementById('navLoginBtn')?.addEventListener('click', () => openAuthModal('login'));
      document.getElementById('navRegisterBtn')?.addEventListener('click', () => openAuthModal('register'));
    }
  }

  // Mobile Drawer Auth Container
  if (mobileContainer) {
    if (currentUser) {
      mobileContainer.innerHTML = `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <div class="flex items-center space-x-3 mb-2.5">
            <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}" class="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500" alt="${currentUser.name}" />
            <div>
              <div class="flex items-center gap-1">
                <p class="text-xs font-bold text-slate-900">${currentUser.name}</p>
                <i class="fa-solid fa-shield-check text-blue-600 text-[10px]"></i>
              </div>
              <p class="text-[10px] text-slate-500 font-mono">ID: ${currentUser.studentId}</p>
              <p class="text-[10px] text-indigo-600 font-medium truncate">${currentUser.department || 'NUB Student'}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <button type="button" onclick="openDashboard('listings')" class="py-1.5 px-2 bg-indigo-600 text-white rounded-xl text-xs font-bold text-center">
              Dashboard
            </button>
            <button type="button" onclick="handleLogout()" class="py-1.5 px-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold text-center">
              Sign Out
            </button>
          </div>
        </div>
      `;
    } else {
      mobileContainer.innerHTML = `
        <div class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-center">
          <p class="text-xs font-bold text-indigo-950 mb-0.5">Northern University Bangladesh</p>
          <p class="text-[11px] text-indigo-700 mb-2.5">Access verified marketplace with your @nub.ac.bd ID</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" onclick="openAuthModal('login')" class="py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold shadow-xs">
              Login
            </button>
            <button type="button" onclick="openAuthModal('register')" class="py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm">
              Sign Up
            </button>
          </div>
        </div>
      `;
    }
  }

  // Pre-fill / bind current user into "Post an Item" modal
  const postSellerName = document.getElementById('postSellerName');
  const postSellerMajor = document.getElementById('postSellerMajor');
  if (postSellerName && postSellerMajor) {
    if (currentUser) {
      postSellerName.value = `${currentUser.name} (${currentUser.studentId})`;
      postSellerMajor.value = `${currentUser.department || 'Undergrad'} (NUB)`;
    } else {
      postSellerName.value = "Guest Student";
      postSellerMajor.value = "NUB Student";
    }
  }

  updateNotificationBadges();
}

/**
 * =========================================================================
 * REAL-TIME LIVE CAMPUS CLOCK & DATE (12-Hour + AM/PM + Seconds)
 * =========================================================================
 */

function updateCampusClock() {
  const now = new Date();

  // 12-Hour format with AM/PM and seconds: e.g. "11:15:30 PM"
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const formattedHours = String(hours).padStart(2, '0');
  const timeString = `${formattedHours}:${minutes}:${seconds} ${ampm}`;

  // Date format: e.g. "20 Nov 2026"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNum = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();
  const dateShortString = `${dayNum} ${monthName} ${year}`;

  // Unified full clock string as requested: "11:15:30 PM • 20 Nov 2026"
  const fullClockString = `${timeString} • ${dateShortString}`;

  // Strict null-checked element updates to NEVER throw null reference errors
  const campusClockDisplay = document.getElementById('campusClockDisplay');
  if (campusClockDisplay) campusClockDisplay.textContent = fullClockString;

  const mobileClockDisplay = document.getElementById('mobileClockDisplay');
  if (mobileClockDisplay) mobileClockDisplay.textContent = fullClockString;

  const navClockText = document.getElementById('navClockText');
  if (navClockText) navClockText.textContent = fullClockString;

  const navClockTime = document.getElementById('campusClockTime');
  if (navClockTime) navClockTime.textContent = timeString;

  const navClockDate = document.getElementById('campusClockDate');
  if (navClockDate) navClockDate.textContent = dateShortString;

  const topTickerClockTime = document.getElementById('topTickerClockTime');
  if (topTickerClockTime) topTickerClockTime.textContent = timeString;

  const topTickerClockDate = document.getElementById('topTickerClockDate');
  if (topTickerClockDate) topTickerClockDate.textContent = dateShortString;

  const mobileClockTime = document.getElementById('mobileClockTime');
  if (mobileClockTime) mobileClockTime.textContent = timeString;

  const mobileClockDate = document.getElementById('mobileClockDate');
  if (mobileClockDate) mobileClockDate.textContent = dateShortString;
}

/**
 * =========================================================================
 * STUDENT DEMO SWITCHER & COMPATIBILITY HELPERS
 * =========================================================================
 */

function updateDemoSwitcherUI() {
  const rifatBtn = document.getElementById('demoSwitchRifatBtn');
  const rumaBtn = document.getElementById('demoSwitchRumaBtn');
  const isRifat = currentUser && (currentUser.studentId === '202110045' || currentUser.email?.includes('rifat'));
  const isRuma = currentUser && (currentUser.studentId === '202220015' || currentUser.email?.includes('ruma'));

  if (rifatBtn) {
    rifatBtn.className = isRifat 
      ? 'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition demo-btn-active' 
      : 'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition demo-btn-inactive';
  }

  if (rumaBtn) {
    rumaBtn.className = isRuma 
      ? 'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition demo-btn-active' 
      : 'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition demo-btn-inactive';
  }
}

function switchDemoUser(target) {
  let targetUser = null;
  if (target === 'rifat') {
    targetUser = registeredUsers.find(u => u.studentId === '202110045') || DEFAULT_NUB_USERS[0];
  } else if (target === 'ruma') {
    targetUser = registeredUsers.find(u => u.studentId === '202220015') || DEFAULT_NUB_USERS[1];
  }

  if (!targetUser) return;

  currentUser = { ...targetUser };
  saveSessionToStorage(currentUser);

  updateAuthUI();
  renderItems();
  updateNotificationBadges();

  const dashModal = document.getElementById('dashboardModal');
  if (dashModal && !dashModal.classList.contains('hidden')) {
    renderDashboard();
  }

  showToast(`Switched active student to ${currentUser.name} (${currentUser.studentId}) 🎓`, 'success');
}

function toggleStudentDemo() {
  if (currentUser && currentUser.studentId === '202110045') {
    switchDemoUser('ruma');
  } else {
    switchDemoUser('rifat');
  }
}

function openAuthModal(mode = 'login', noticeMessage = null) {
  const modal = document.getElementById('authModal');
  const noticeBox = document.getElementById('authNotice');
  const noticeText = document.getElementById('authNoticeText');
  const alertBox = document.getElementById('authAlert');

  if (!modal) return;
  if (alertBox) alertBox.classList.add('hidden');

  if (noticeBox && noticeText) {
    if (noticeMessage) {
      noticeText.textContent = noticeMessage;
      noticeBox.classList.remove('hidden');
    } else {
      noticeBox.classList.add('hidden');
    }
  }

  switchAuthTab(mode);
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function switchAuthTab(mode) {
  const tabLogin = document.getElementById('tabLoginBtn');
  const tabRegister = document.getElementById('tabRegisterBtn');
  const formLogin = document.getElementById('loginForm');
  const formRegister = document.getElementById('registerForm');
  const alertBox = document.getElementById('authAlert');

  if (alertBox) alertBox.classList.add('hidden');

  if (mode === 'login') {
    tabLogin?.classList.add('active', 'text-indigo-600');
    tabLogin?.classList.remove('text-slate-500');
    tabRegister?.classList.remove('active', 'text-indigo-600');
    tabRegister?.classList.add('text-slate-500');

    formLogin?.classList.remove('hidden');
    formRegister?.classList.add('hidden');
  } else {
    tabRegister?.classList.add('active', 'text-indigo-600');
    tabRegister?.classList.remove('text-slate-500');
    tabLogin?.classList.remove('active', 'text-indigo-600');
    tabLogin?.classList.add('text-slate-500');

    formRegister?.classList.remove('hidden');
    formLogin?.classList.add('hidden');
  }
}

function showAuthAlert(message, type = 'error') {
  const alertBox = document.getElementById('authAlert');
  const alertText = document.getElementById('authAlertText');
  const alertIcon = document.getElementById('authAlertIcon');
  if (!alertBox || !alertText) return;

  alertText.textContent = message;
  alertBox.classList.remove('hidden', 'bg-rose-50', 'text-rose-800', 'border', 'border-rose-200', 'bg-emerald-50', 'text-emerald-800', 'border-emerald-200');

  if (type === 'success') {
    alertBox.classList.add('bg-emerald-50', 'text-emerald-800', 'border', 'border-emerald-200');
    if (alertIcon) alertIcon.className = 'fa-solid fa-circle-check text-emerald-600 text-sm shrink-0 mt-0.5';
  } else {
    alertBox.classList.add('bg-rose-50', 'text-rose-800', 'border', 'border-rose-200');
    if (alertIcon) alertIcon.className = 'fa-solid fa-triangle-exclamation text-rose-600 text-sm shrink-0 mt-0.5';
  }
}

function bindAuthEvents() {
  document.getElementById('closeAuthModal')?.addEventListener('click', closeAuthModal);
  document.getElementById('tabLoginBtn')?.addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('tabRegisterBtn')?.addEventListener('click', () => switchAuthTab('register'));

  const regEmailInput = document.getElementById('regEmail');
  const emailMsg = document.getElementById('emailValidationMsg');
  const emailIcon = document.getElementById('emailValidationIcon');

  if (regEmailInput) {
    regEmailInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      if (!val) {
        regEmailInput.classList.remove('input-valid', 'input-invalid');
        if (emailMsg) {
          emailMsg.innerHTML = `<i class="fa-solid fa-circle-info text-[10px]"></i> Registration strictly requires your official <strong>@nub.ac.bd</strong> address`;
          emailMsg.className = 'text-[11px] mt-1 text-slate-500 flex items-center gap-1';
        }
        if (emailIcon) emailIcon.innerHTML = '';
        return;
      }

      if (isValidNubEmail(val)) {
        regEmailInput.classList.add('input-valid');
        regEmailInput.classList.remove('input-invalid');
        if (emailMsg) {
          emailMsg.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 text-[11px]"></i> Valid Northern University Bangladesh student email`;
          emailMsg.className = 'text-[11px] mt-1 text-emerald-600 font-semibold flex items-center gap-1';
        }
        if (emailIcon) {
          emailIcon.innerHTML = `<i class="fa-solid fa-check text-emerald-500 text-sm"></i>`;
        }
      } else {
        regEmailInput.classList.add('input-invalid');
        regEmailInput.classList.remove('input-valid');
        if (emailMsg) {
          emailMsg.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600 text-[11px]"></i> Must strictly end with <strong>@nub.ac.bd</strong> (e.g. yourname@nub.ac.bd)`;
          emailMsg.className = 'text-[11px] mt-1 text-rose-600 font-medium flex items-center gap-1';
        }
        if (emailIcon) {
          emailIcon.innerHTML = `<i class="fa-solid fa-xmark text-rose-500 text-sm"></i>`;
        }
      }
    });
  }

  document.getElementById('toggleLoginPassBtn')?.addEventListener('click', function() {
    togglePasswordVisibility('loginPassword', this);
  });
  document.getElementById('toggleRegPassBtn')?.addEventListener('click', function() {
    togglePasswordVisibility('regPassword', this);
  });
  document.getElementById('toggleRegConfirmPassBtn')?.addEventListener('click', function() {
    togglePasswordVisibility('regConfirmPassword', this);
  });

  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegisterSubmit);

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('userDropdownMenu');
    const btn = document.getElementById('userDropdownBtn');
    if (menu && !menu.classList.contains('hidden')) {
      if (btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
      }
    }
  });
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye-slash text-xs';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye text-xs';
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const emailOrId = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const remember = document.getElementById('loginRememberMe')?.checked;

  if (!emailOrId || !password) {
    showAuthAlert('Please enter your NUB email/Student ID and password.', 'error');
    return;
  }

  const user = registeredUsers.find(u => 
    (u.email.toLowerCase() === emailOrId.toLowerCase() || u.studentId.toLowerCase() === emailOrId.toLowerCase()) && 
    u.password === password
  );

  if (!user) {
    showAuthAlert('Invalid credentials. Check your @nub.ac.bd email/Student ID and password, or register an account.', 'error');
    return;
  }

  currentUser = { ...user };
  if (remember) {
    saveSessionToStorage(currentUser);
  }

  updateAuthUI();
  closeAuthModal();
  showToast(`Welcome back, ${user.name}! Verified as ${user.studentId} 🎓`, 'success');

  if (pendingAuthAction) {
    const action = pendingAuthAction;
    pendingAuthAction = null;
    action();
  }
}

function handleRegisterSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('regName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim().toLowerCase();
  const studentId = document.getElementById('regStudentId')?.value.trim();
  const department = document.getElementById('regDepartment')?.value;
  const password = document.getElementById('regPassword')?.value;
  const confirmPassword = document.getElementById('regConfirmPassword')?.value;
  const terms = document.getElementById('regTerms')?.checked;

  if (!isValidNubEmail(email)) {
    showAuthAlert('Registration restricted strictly to official university emails ending with @nub.ac.bd.', 'error');
    document.getElementById('regEmail')?.focus();
    return;
  }

  if (!name || !studentId || !password) {
    showAuthAlert('Please complete all required fields.', 'error');
    return;
  }

  if (studentId.length < 5) {
    showAuthAlert('Please enter a valid official Northern University Bangladesh Student ID.', 'error');
    return;
  }

  if (password.length < 6) {
    showAuthAlert('Password must be at least 6 characters.', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showAuthAlert('Passwords do not match. Please re-enter carefully.', 'error');
    return;
  }

  if (!terms) {
    showAuthAlert('Please confirm that you are an actively enrolled NUB student.', 'error');
    return;
  }

  const existingEmail = registeredUsers.find(u => u.email.toLowerCase() === email);
  if (existingEmail) {
    showAuthAlert('This @nub.ac.bd email is already registered. Please sign in instead.', 'error');
    return;
  }

  const existingId = registeredUsers.find(u => u.studentId.toLowerCase() === studentId.toLowerCase());
  if (existingId) {
    showAuthAlert('An account with this Student ID is already registered.', 'error');
    return;
  }

  const newUser = {
    id: `nub-user-${Date.now().toString().slice(-5)}`,
    name,
    email,
    studentId,
    department,
    password,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date().toISOString()
  };

  registeredUsers.push(newUser);
  saveUsersToStorage();

  currentUser = { ...newUser };
  saveSessionToStorage(currentUser);

  updateAuthUI();
  e.target.reset();
  closeAuthModal();

  showToast(`🎉 Registration successful! Welcome to CampusKart, ${name} (@nub.ac.bd verified)`, 'success');

  if (pendingAuthAction) {
    const action = pendingAuthAction;
    pendingAuthAction = null;
    action();
  }
}

function handleLogout() {
  currentUser = null;
  saveSessionToStorage(null);
  updateAuthUI();
  closeDashboardModal();
  showToast('You have been signed out safely.', 'info');
}

/**
 * =========================================================================
 * BORROW & EXCHANGE STATE MACHINE WORKFLOW
 * =========================================================================
 */

/**
 * Open Request Modal for Borrow or Exchange
 */
function openRequestModal(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  if (!currentUser) {
    pendingAuthAction = () => openRequestModal(itemId);
    openAuthModal('login', `Please sign in with your @nub.ac.bd account to request ${item.title}.`);
    return;
  }

  if (item.seller.studentId === currentUser.studentId) {
    showToast('You own this listing! You cannot request your own item.', 'warning');
    return;
  }

  if (item.status && item.status !== 'Available') {
    showToast(`This item is currently ${item.status.toLowerCase()}. You cannot request it right now.`, 'warning');
    return;
  }

  const modal = document.getElementById('requestModal');
  const preview = document.getElementById('requestItemPreview');
  const modalTitle = document.getElementById('requestModalTitle');
  const modalSub = document.getElementById('requestModalSub');
  const modalIcon = document.getElementById('requestModalIcon');
  const durationField = document.getElementById('requestDurationField');
  const exchangeField = document.getElementById('requestExchangeField');
  const itemIdInput = document.getElementById('requestItemId');

  if (!modal) return;

  itemIdInput.value = item.id;

  if (item.transaction === 'Exchange') {
    modalTitle.textContent = 'Propose an Exchange';
    modalSub.textContent = `Offer a trade item to ${item.seller.name}`;
    modalIcon.className = 'w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-lg';
    modalIcon.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i>`;
    durationField.classList.add('hidden');
    exchangeField.classList.remove('hidden');
  } else {
    modalTitle.textContent = 'Request to Borrow';
    modalSub.textContent = `Set duration to borrow from ${item.seller.name}`;
    modalIcon.className = 'w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg';
    modalIcon.innerHTML = `<i class="fa-solid fa-clock"></i>`;
    durationField.classList.remove('hidden');
    exchangeField.classList.add('hidden');
  }

  preview.innerHTML = `
    <img src="${item.image}" alt="${item.title}" class="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200" />
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-slate-900 truncate">${item.title}</span>
      </div>
      <p class="text-[11px] text-slate-500">Owner: <strong>${item.seller.name}</strong> • ${item.courseCode}</p>
      <p class="text-[11px] text-indigo-600 font-semibold">${item.priceLabel}</p>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeRequestModal() {
  const modal = document.getElementById('requestModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function handleRequestFormSubmit(e) {
  e.preventDefault();
  const itemId = document.getElementById('requestItemId')?.value;
  const item = items.find(i => i.id === itemId);
  if (!item || !currentUser) return;

  const duration = document.getElementById('requestDurationSelect')?.value;
  const offeredItem = document.getElementById('requestOfferedItemInput')?.value.trim();
  const note = document.getElementById('requestNoteInput')?.value.trim();

  if (item.transaction === 'Exchange' && !offeredItem) {
    showToast({
      title: 'Missing Trade Item',
      message: 'Please specify what item you are offering in trade.',
      type: 'warning'
    });
    return;
  }

  // State Transition: Available -> Requested
  item.status = 'Requested';
  item.activeRequest = {
    requesterId: currentUser.studentId,
    requesterName: currentUser.name,
    requesterEmail: currentUser.email,
    requesterDept: currentUser.department,
    requestDate: new Date().toISOString(),
    durationRequested: item.transaction === 'Exchange' ? null : duration,
    offeredItem: item.transaction === 'Exchange' ? offeredItem : null,
    note: note
  };

  saveItemsToStorage();
  closeRequestModal();
  renderItems();
  updateNotificationBadges();

  if (item.transaction === 'Exchange') {
    showToast({
      title: 'Offer submitted to seller! 💬',
      message: `Exchange proposal offering "${offeredItem}" submitted to ${item.seller.name}!`,
      type: 'success',
      actionType: 'offer_made',
      icon: 'fa-solid fa-handshake'
    });
  } else {
    showToast({
      title: 'Borrow request sent to owner! ⏳',
      message: `Borrow request (${duration}) for "${item.title}" sent to ${item.seller.name}! Awaiting approval.`,
      type: 'success',
      actionType: 'request_sent',
      icon: 'fa-solid fa-hourglass-half'
    });
  }
}

/**
 * =========================================================================
 * MAKE PRICE OFFER SYSTEM (FOR SALE ITEMS)
 * =========================================================================
 */

function openMakeOfferModal(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  if (!currentUser) {
    pendingAuthAction = () => openMakeOfferModal(itemId);
    openAuthModal('login', `Please sign in with your @nub.ac.bd account to make an offer on ${item.title}.`);
    return;
  }

  if (item.seller.studentId === currentUser.studentId) {
    showToast({
      title: 'Action Not Allowed',
      message: 'You cannot make an offer on your own listing!',
      type: 'warning'
    });
    return;
  }

  const modal = document.getElementById('makeOfferModal');
  const preview = document.getElementById('makeOfferItemPreview');
  const itemIdInput = document.getElementById('offerItemId');
  const priceInput = document.getElementById('offerPriceInput');
  const chipsContainer = document.getElementById('quickOfferChips');

  if (!modal) return;

  itemIdInput.value = item.id;
  const askingPrice = item.price || 500;
  const defaultOffer = Math.max(10, Math.round(askingPrice * 0.9));
  if (priceInput) {
    priceInput.value = defaultOffer;
  }

  if (preview) {
    preview.innerHTML = `
      <img src="${item.image}" alt="${item.title}" class="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200" />
      <div class="min-w-0 flex-1">
        <h4 class="text-xs font-bold text-slate-900 truncate">${item.title}</h4>
        <p class="text-[11px] text-slate-500">Seller: <strong>${item.seller.name}</strong> • ${item.courseCode}</p>
        <p class="text-xs text-orange-600 font-extrabold">Asking Price: ৳${askingPrice}</p>
      </div>
    `;
  }

  if (chipsContainer) {
    const offer90 = Math.max(10, Math.round(askingPrice * 0.9));
    const offer85 = Math.max(10, Math.round(askingPrice * 0.85));
    const offer80 = Math.max(10, Math.round(askingPrice * 0.8));
    chipsContainer.innerHTML = `
      <span class="text-[10px] text-slate-400 font-bold uppercase mr-1">Quick:</span>
      <button type="button" onclick="setOfferPrice(${offer90})" class="px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[10px] border border-orange-200 transition">৳${offer90} (-10%)</button>
      <button type="button" onclick="setOfferPrice(${offer85})" class="px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[10px] border border-orange-200 transition">৳${offer85} (-15%)</button>
      <button type="button" onclick="setOfferPrice(${offer80})" class="px-2 py-0.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[10px] border border-orange-200 transition">৳${offer80} (-20%)</button>
    `;
  }

  closeDetailsModal();
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function setOfferPrice(val) {
  const priceInput = document.getElementById('offerPriceInput');
  if (priceInput) priceInput.value = val;
}

function closeMakeOfferModal() {
  const modal = document.getElementById('makeOfferModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function handleMakeOfferFormSubmit(e) {
  e.preventDefault();
  const itemId = document.getElementById('offerItemId')?.value;
  const item = items.find(i => i.id === itemId);
  if (!item || !currentUser) return;

  const rawOffer = document.getElementById('offerPriceInput')?.value;
  const offeredPrice = parseFloat(rawOffer) || 0;
  const note = document.getElementById('offerNoteInput')?.value.trim();

  item.offers = item.offers || [];
  item.offers.push({
    buyerId: currentUser.studentId,
    buyerName: currentUser.name,
    buyerEmail: currentUser.email,
    offeredPrice: offeredPrice,
    note: note,
    date: new Date().toISOString()
  });

  saveItemsToStorage();
  closeMakeOfferModal();

  showToast({
    title: 'Offer submitted to seller! 💬',
    message: `Price offer of ৳${offeredPrice} submitted to ${item.seller.name} for "${item.title}"!`,
    type: 'success',
    actionType: 'offer_made',
    icon: 'fa-solid fa-comment-dollar'
  });
}

/**
 * Open Approval & Due Date Modal (for Owner)
 */
function openApprovalModal(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item || !item.activeRequest) return;

  const modal = document.getElementById('approvalModal');
  const preview = document.getElementById('approvalItemPreview');
  const itemIdInput = document.getElementById('approvalItemId');
  const customDateInput = document.getElementById('approvalCustomDueDate');

  if (!modal) return;

  itemIdInput.value = item.id;

  // Set default due date to 7 days from now
  selectedApprovalDays = 7;
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  if (customDateInput) {
    customDateInput.value = defaultDueDate.toISOString().split('T')[0];
    customDateInput.min = new Date().toISOString().split('T')[0];
  }

  preview.innerHTML = `
    <div class="flex items-center space-x-3 mb-2">
      <img src="${item.image}" alt="${item.title}" class="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200" />
      <div>
        <h4 class="font-bold text-slate-900">${item.title}</h4>
        <span class="text-indigo-600 font-semibold">${item.transaction === 'Exchange' ? 'Peer Exchange' : 'Borrow Request'}</span>
      </div>
    </div>
    <div class="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
      <p>Requester: <strong>${item.activeRequest.requesterName}</strong> (ID: ${item.activeRequest.requesterId})</p>
      <p>Email: <span class="font-mono">${item.activeRequest.requesterEmail}</span></p>
      ${item.activeRequest.durationRequested ? `<p>Duration requested: <strong class="text-purple-700">${item.activeRequest.durationRequested}</strong></p>` : ''}
      ${item.activeRequest.offeredItem ? `<p>Offered in trade: <strong class="text-sky-700">${item.activeRequest.offeredItem}</strong></p>` : ''}
      ${item.activeRequest.note ? `<p class="italic text-slate-500">"${item.activeRequest.note}"</p>` : ''}
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeApprovalModal() {
  const modal = document.getElementById('approvalModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function setApprovalDays(days) {
  selectedApprovalDays = days;
  const btns = document.querySelectorAll('.due-preset-btn');
  btns.forEach(btn => {
    btn.classList.remove('active', 'border-indigo-600', 'bg-indigo-50', 'text-indigo-700');
    btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
  });

  const activeBtn = Array.from(btns).find(b => b.textContent.includes(`${days} Days`));
  if (activeBtn) {
    activeBtn.classList.add('active', 'border-indigo-600', 'bg-indigo-50', 'text-indigo-700');
    activeBtn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
  }

  const customDateInput = document.getElementById('approvalCustomDueDate');
  if (customDateInput) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    customDateInput.value = d.toISOString().split('T')[0];
  }
}

function handleApprovalFormSubmit(e) {
  e.preventDefault();
  const itemId = document.getElementById('approvalItemId')?.value;
  const item = items.find(i => i.id === itemId);
  if (!item || !item.activeRequest) return;

  const customDate = document.getElementById('approvalCustomDueDate')?.value;
  const meetupNote = document.getElementById('approvalMeetupNote')?.value.trim();

  let finalDueDate;
  if (customDate) {
    finalDueDate = new Date(customDate).toISOString();
  } else {
    const d = new Date();
    d.setDate(d.getDate() + selectedApprovalDays);
    finalDueDate = d.toISOString();
  }

  // State Transition: Requested -> Borrowed / In Exchange
  const nextStatus = item.transaction === 'Exchange' ? 'In Exchange' : 'Borrowed';
  item.status = nextStatus;
  item.borrowDetails = {
    borrowerId: item.activeRequest.requesterId,
    borrowerName: item.activeRequest.requesterName,
    borrowerEmail: item.activeRequest.requesterEmail,
    borrowerDept: item.activeRequest.requesterDept,
    approvedDate: new Date().toISOString(),
    dueDate: finalDueDate,
    meetupNote: meetupNote,
    returnStatus: 'Active',
    isReviewed: false
  };
  item.activeRequest = null;

  saveItemsToStorage();
  closeApprovalModal();
  renderItems();
  renderDashboard();
  updateNotificationBadges();

  showToast({
    title: 'Borrow Status Updated',
    message: `Approved! Status changed to "${nextStatus}". Return due date set to ${formatDate(finalDueDate)}.`,
    type: 'success',
    actionType: 'status_updated',
    icon: 'fa-solid fa-calendar-check'
  });
}

function handleDeclineRequest(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  // Revert status to Available
  item.status = 'Available';
  item.activeRequest = null;

  saveItemsToStorage();
  renderItems();
  renderDashboard();
  updateNotificationBadges();

  showToast({
    title: 'Borrow Status Updated',
    message: `Request declined. "${item.title}" status reverted back to Available.`,
    type: 'info',
    actionType: 'status_updated',
    icon: 'fa-solid fa-arrows-rotate'
  });
}

/**
 * Mark as Returned (Owner completes the borrow cycle)
 */
function handleMarkAsReturned(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  // State Transition: Borrowed/In Exchange -> Available (Completed)
  item.status = 'Available';
  if (item.borrowDetails) {
    item.borrowDetails.returnStatus = 'Returned';
    item.borrowDetails.returnedDate = new Date().toISOString();
  }

  saveItemsToStorage();
  renderItems();
  renderDashboard();
  updateNotificationBadges();

  showToast({
    title: 'Status updated to Returned! ⭐',
    message: `Item "${item.title}" successfully marked as returned! Now available again on CampusKart.`,
    type: 'success',
    actionType: 'status_updated',
    icon: 'fa-solid fa-circle-check'
  });
}

/**
 * =========================================================================
 * SELLER & PEER RATING SYSTEM
 * =========================================================================
 */

function openReviewModal(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const modal = document.getElementById('reviewModal');
  const targetSub = document.getElementById('reviewTargetSub');
  const reviewSellerId = document.getElementById('reviewSellerId');
  const reviewItemId = document.getElementById('reviewItemId');

  if (!modal) return;

  reviewSellerId.value = item.seller.studentId;
  reviewItemId.value = item.id;

  targetSub.textContent = `Rate ${item.seller.name} for "${item.title}"`;
  setStarRating(5);

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function setStarRating(val) {
  const hiddenInput = document.getElementById('reviewRatingValue');
  const label = document.getElementById('starRatingLabel');
  const starBtns = document.querySelectorAll('.star-rating-btn');

  if (hiddenInput) hiddenInput.value = val;

  const labels = {
    1: '1 Star - Needs Improvement',
    2: '2 Stars - Below Average',
    3: '3 Stars - Acceptable Exchange',
    4: '4 Stars - Great Classmate!',
    5: '5 Stars - Outstanding Peer!'
  };

  if (label) label.textContent = labels[val] || `${val} Stars`;

  starBtns.forEach(btn => {
    const starVal = parseInt(btn.getAttribute('data-val') || 1);
    if (starVal <= val) {
      btn.className = 'star-rating-btn star-gold';
    } else {
      btn.className = 'star-rating-btn star-empty';
    }
  });
}

function appendReviewTag(tagText) {
  const textarea = document.getElementById('reviewCommentInput');
  if (!textarea) return;
  if (!textarea.value.includes(tagText)) {
    textarea.value = textarea.value.trim() ? `${textarea.value.trim()} • ${tagText}` : tagText;
  }
}

function handleReviewFormSubmit(e) {
  e.preventDefault();
  const itemId = document.getElementById('reviewItemId')?.value;
  const sellerId = document.getElementById('reviewSellerId')?.value;
  const rating = parseInt(document.getElementById('reviewRatingValue')?.value || 5);
  const comment = document.getElementById('reviewCommentInput')?.value.trim();

  const item = items.find(i => i.id === itemId);
  if (!item || !currentUser) return;

  const newReview = {
    id: `rev-${Date.now().toString().slice(-5)}`,
    sellerId: sellerId,
    reviewerId: currentUser.studentId,
    reviewerName: currentUser.name,
    rating: rating,
    comment: comment || 'Smooth and friendly peer transaction!',
    date: 'Just now',
    itemTitle: item.title
  };

  reviews.unshift(newReview);
  saveReviewsToStorage();

  // Mark as reviewed on the item
  if (item.borrowDetails) {
    item.borrowDetails.isReviewed = true;
  }

  // Recalculate average star rating for seller
  const sellerReviews = reviews.filter(r => r.sellerId === sellerId);
  const avg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
  const formattedAvg = parseFloat(avg.toFixed(1));

  // Update on all items owned by this seller
  items.forEach(it => {
    if (it.seller.studentId === sellerId) {
      it.seller.rating = formattedAvg;
      it.seller.reviewsCount = sellerReviews.length;
    }
  });

  saveItemsToStorage();
  closeReviewModal();
  renderItems();
  renderDashboard();

  showToast(`⭐ Thank you! Your ${rating}-star review for ${item.seller.name} has been published.`, 'success');
}

/**
 * =========================================================================
 * USER PROFILE & CAMPUS DASHBOARD SYSTEM
 * Three Organized Tabs:
 * (1) My Active Listings (with Edit, Delete & Mark as Sold)
 * (2) Borrowed Items (with Return Due-Date Countdown & 'Mark as Returned')
 * (3) Received Reviews (with Peer Ratings & Classmate Feedback)
 * =========================================================================
 */

function openDashboard(defaultTab = 'listings') {
  if (!currentUser) {
    pendingAuthAction = () => openDashboard(defaultTab);
    openAuthModal('login', 'Please sign in with your @nub.ac.bd account to view your user profile and dashboard.');
    return;
  }

  const modal = document.getElementById('dashboardModal');
  if (!modal) return;

  // Populate User Profile Header
  const userAvatar = document.getElementById('dashUserAvatar');
  const userName = document.getElementById('dashUserName');
  const userDept = document.getElementById('dashUserDept');
  const userIdBadge = document.getElementById('dashUserIdBadge');

  if (userAvatar) userAvatar.src = currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
  if (userName) userName.textContent = currentUser.name;
  if (userDept) userDept.textContent = currentUser.department || 'Computer Science & Engineering (CSE)';
  if (userIdBadge) userIdBadge.textContent = `ID: ${currentUser.studentId}`;

  // Switch to the requested tab
  if (defaultTab === 'requests') {
    switchDashboardTab('listings');
    filterDashListings('Requested');
  } else {
    switchDashboardTab(defaultTab);
  }

  renderDashboard();

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeDashboardModal() {
  const modal = document.getElementById('dashboardModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function switchDashboardTab(tabName) {
  const btnListings = document.getElementById('dashTabListingsBtn');
  const btnBorrowed = document.getElementById('dashTabBorrowedBtn');
  const btnReviews = document.getElementById('dashTabReviewsBtn');

  const panelListings = document.getElementById('dashListingsPanel');
  const panelBorrowed = document.getElementById('dashBorrowedPanel');
  const panelReviews = document.getElementById('dashReviewsPanel');

  [btnListings, btnBorrowed, btnReviews].forEach(b => {
    b?.classList.remove('active', 'border-indigo-600', 'text-indigo-600', 'bg-indigo-50/60');
    b?.classList.add('border-transparent', 'text-slate-600');
  });

  [panelListings, panelBorrowed, panelReviews].forEach(p => p?.classList.add('hidden'));

  if (tabName === 'listings' || tabName === 'requests') {
    btnListings?.classList.add('active', 'border-indigo-600', 'text-indigo-600', 'bg-indigo-50/60');
    btnListings?.classList.remove('border-transparent', 'text-slate-600');
    panelListings?.classList.remove('hidden');
    renderDashboardListingsPanel();
  } else if (tabName === 'borrowed') {
    btnBorrowed?.classList.add('active', 'border-indigo-600', 'text-indigo-600', 'bg-indigo-50/60');
    btnBorrowed?.classList.remove('border-transparent', 'text-slate-600');
    panelBorrowed?.classList.remove('hidden');
    renderDashboardBorrowedPanel();
  } else if (tabName === 'reviews') {
    btnReviews?.classList.add('active', 'border-indigo-600', 'text-indigo-600', 'bg-indigo-50/60');
    btnReviews?.classList.remove('border-transparent', 'text-slate-600');
    panelReviews?.classList.remove('hidden');
    renderDashboardReviewsPanel();
  }
}

function filterDashListings(status) {
  currentDashListingFilter = status;
  const btns = document.querySelectorAll('.dash-listing-filter');
  btns.forEach(b => {
    b.className = 'dash-listing-filter px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition';
  });

  const activeBtn = Array.from(btns).find(b => {
    const text = b.textContent.toLowerCase();
    if (status === 'all') return text === 'all';
    if (status === 'Available') return text === 'available';
    if (status === 'Sold') return text === 'sold';
    if (status === 'Requested') return text.includes('request');
    if (status === 'Borrowed') return text.includes('borrowed');
    return false;
  });

  if (activeBtn) {
    activeBtn.className = 'dash-listing-filter px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium shadow-xs';
  }

  renderDashboardListingsPanel();
}

function renderDashboard() {
  if (!currentUser) return;

  const myListings = items.filter(it => it.seller.studentId === currentUser.studentId);
  const myBorrows = items.filter(it => 
    (it.borrowDetails && it.borrowDetails.borrowerId === currentUser.studentId) ||
    (it.activeRequest && it.activeRequest.requesterId === currentUser.studentId)
  );
  const myReviews = reviews.filter(r => r.sellerId === currentUser.studentId);
  const incomingRequests = myListings.filter(it => it.status === 'Requested');

  // Update Header Metric Strip
  const statListings = document.getElementById('dashStatListings');
  const statBorrowed = document.getElementById('dashStatBorrowed');
  const statRating = document.getElementById('dashStatRating');
  const statReviewsCount = document.getElementById('dashStatReviewsCount');

  if (statListings) statListings.textContent = myListings.length;
  if (statBorrowed) statBorrowed.textContent = myBorrows.filter(it => it.status === 'Borrowed' || it.status === 'In Exchange').length;
  
  const avgRating = myReviews.length > 0 
    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1) 
    : '5.0';
  if (statRating) statRating.textContent = avgRating;
  if (statReviewsCount) statReviewsCount.textContent = `${myReviews.length} Review${myReviews.length === 1 ? '' : 's'}`;

  // Update Tab Badges
  const badgeListings = document.getElementById('dashListingsCountBadge');
  const badgeBorrowed = document.getElementById('dashBorrowedCountBadge');
  const badgeReviews = document.getElementById('dashReviewsCountBadge');

  if (badgeListings) badgeListings.textContent = myListings.length;
  if (badgeBorrowed) badgeBorrowed.textContent = myBorrows.length;
  if (badgeReviews) badgeReviews.textContent = myReviews.length;

  // Render Pending Requests Banner inside Listings Tab
  const banner = document.getElementById('dashPendingRequestsBanner');
  if (banner) {
    if (incomingRequests.length > 0) {
      banner.className = 'p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3 shadow-xs animate-pop';
      banner.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
            <i class="fa-solid fa-bell text-sm"></i>
          </div>
          <div>
            <p class="font-bold text-amber-950 text-xs sm:text-sm">
              ${incomingRequests.length} Pending Peer Request${incomingRequests.length === 1 ? '' : 's'}
            </p>
            <p class="text-amber-700 text-[11px]">Classmates have requested to borrow or trade your listings. Review proposal & set due dates.</p>
          </div>
        </div>
        <button type="button" onclick="filterDashListings('Requested')" class="self-start sm:self-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-clock text-[10px]"></i>
          <span>View Requests (${incomingRequests.length})</span>
        </button>
      `;
    } else {
      banner.className = 'hidden';
      banner.innerHTML = '';
    }
  }

  // Render the current active tab panel
  const panelListings = document.getElementById('dashListingsPanel');
  const panelBorrowed = document.getElementById('dashBorrowedPanel');
  const panelReviews = document.getElementById('dashReviewsPanel');

  if (panelListings && !panelListings.classList.contains('hidden')) {
    renderDashboardListingsPanel();
  } else if (panelBorrowed && !panelBorrowed.classList.contains('hidden')) {
    renderDashboardBorrowedPanel();
  } else if (panelReviews && !panelReviews.classList.contains('hidden')) {
    renderDashboardReviewsPanel();
  }

  updateNotificationBadges();
}

/**
 * =========================================================================
 * TAB 1: MY ACTIVE LISTINGS (with Edit, Delete & Mark as Sold)
 * =========================================================================
 */

function renderDashboardListingsPanel() {
  if (!currentUser) return;
  const myListings = items.filter(it => it.seller.studentId === currentUser.studentId);
  const container = document.getElementById('dashListingsContainer');
  const summaryText = document.getElementById('dashListingsSummaryText');

  let filtered = myListings;
  if (currentDashListingFilter === 'Available') {
    filtered = myListings.filter(it => it.status === 'Available');
  } else if (currentDashListingFilter === 'Sold') {
    filtered = myListings.filter(it => it.status === 'Sold');
  } else if (currentDashListingFilter === 'Requested') {
    filtered = myListings.filter(it => it.status === 'Requested');
  } else if (currentDashListingFilter === 'Borrowed') {
    filtered = myListings.filter(it => it.status === 'Borrowed' || it.status === 'In Exchange');
  }

  if (summaryText) {
    summaryText.textContent = `Showing ${filtered.length} of ${myListings.length} listing${myListings.length === 1 ? '' : 's'}`;
  }

  if (!container) return;

  if (myListings.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
        <div class="w-12 h-12 mx-auto mb-2 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-sm">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">No Listings Yet</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">Post your textbooks, engineering tools, lab components, or dorm supplies to start sharing on CampusKart.</p>
        <button type="button" onclick="closeDashboardModal(); openPostModal();" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition inline-flex items-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-plus text-[10px]"></i>
          <span>Create Your First Listing</span>
        </button>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-10 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
        <p class="text-xs text-slate-500">No listings match the "<strong>${currentDashListingFilter}</strong>" filter.</p>
        <button type="button" onclick="filterDashListings('all')" class="mt-2 text-xs font-bold text-indigo-600 hover:underline">Show All Listings</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(it => {
    // Dynamic Status Badge
    let statusBadge = `<span class="status-pill status-available"><i class="fa-solid fa-circle-check text-[10px]"></i> Available</span>`;
    let isSold = it.status === 'Sold';

    if (it.status === 'Sold') {
      statusBadge = `<span class="status-pill status-sold"><i class="fa-solid fa-bag-shopping text-[10px]"></i> Sold</span>`;
    } else if (it.status === 'Requested') {
      statusBadge = `<span class="status-pill status-requested"><i class="fa-solid fa-clock text-[10px]"></i> Request Pending</span>`;
    } else if (it.status === 'Borrowed' || it.status === 'In Exchange') {
      const remaining = it.borrowDetails ? getCountdownDetails(it.borrowDetails.dueDate) : { formattedText: 'Active Borrow', badgeClass: 'countdown-normal' };
      statusBadge = `
        <span class="status-pill status-borrowed"><i class="fa-solid fa-arrows-spin text-[10px]"></i> ${it.status}</span>
        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${remaining.badgeClass}">
          ${remaining.formattedText}
        </span>
      `;
    }

    // Transaction Pill
    const txLabel = it.transaction === 'Borrow' ? 'BORROW' : (it.transaction === 'Exchange' ? 'EXCHANGE' : 'FOR SALE');
    const txColor = it.transaction === 'Borrow' ? 'bg-purple-100 text-purple-700 border-purple-200' : (it.transaction === 'Exchange' ? 'bg-sky-100 text-sky-700 border-sky-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200');

    // Condition Pill
    const condColor = it.condition === 'Brand New' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (it.condition === 'Like New' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200');

    // Sold Toggle Button
    const soldButtonHtml = isSold
      ? `<button type="button" onclick="handleToggleSold('${it.id}')" title="Re-activate this listing on marketplace" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95">
           <i class="fa-solid fa-arrow-rotate-left text-[10px]"></i>
           <span>Relist as Available</span>
         </button>`
      : `<button type="button" onclick="handleToggleSold('${it.id}')" title="Mark this item as sold/completed" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 active:scale-95">
           <i class="fa-solid fa-tag text-[10px]"></i>
           <span>Mark as Sold</span>
         </button>`;

    // Review Request Action if Requested
    const reviewRequestHtml = it.status === 'Requested'
      ? `<button type="button" onclick="openApprovalModal('${it.id}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 animate-pulse">
           <i class="fa-solid fa-check-double text-[10px]"></i>
           <span>Review Request</span>
         </button>`
      : '';

    return `
      <div class="p-4 bg-white rounded-2xl border ${isSold ? 'border-slate-200/60 bg-slate-50/40 opacity-90' : 'border-slate-200/90 shadow-xs'} transition hover:border-indigo-200">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          
          <!-- Item Thumbnail & Info -->
          <div class="flex items-start space-x-3.5 min-w-0">
            <div class="relative shrink-0">
              <img src="${it.image}" alt="${it.title}" class="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 ${isSold ? 'grayscale-[50%]' : ''}" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'" />
              ${isSold ? '<span class="absolute inset-0 bg-slate-900/30 rounded-xl flex items-center justify-center text-white text-[9px] font-black uppercase tracking-wider">Sold</span>' : ''}
            </div>

            <div class="min-w-0 space-y-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                ${statusBadge}
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${txColor}">${txLabel}</span>
                <span class="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.2 rounded">${it.courseCode || 'General'}</span>
              </div>

              <h4 class="text-sm font-bold text-slate-900 truncate ${isSold ? 'line-through text-slate-500' : ''}" title="${it.title}">
                ${it.title}
              </h4>

              <div class="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                <span class="font-extrabold text-indigo-700">${it.priceLabel}</span>
                <span class="text-slate-300">&bull;</span>
                <span class="text-slate-500">${it.category}</span>
                <span class="text-slate-300">&bull;</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded font-semibold border ${condColor}">${it.condition}</span>
              </div>
            </div>
          </div>

          <!-- Organized Action Controls: Edit / Delete & Mark as Sold -->
          <div class="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto flex-wrap gap-y-1.5">
            ${reviewRequestHtml}
            ${soldButtonHtml}

            <!-- Edit Button -->
            <button type="button" 
                    onclick="openEditItemModal('${it.id}')" 
                    title="Edit listing details" 
                    class="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95">
              <i class="fa-solid fa-pen-to-square text-[10px]"></i>
              <span>Edit</span>
            </button>

            <!-- Delete Button -->
            <button type="button" 
                    onclick="handleDeleteListing('${it.id}')" 
                    title="Delete listing permanently" 
                    class="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95">
              <i class="fa-solid fa-trash-can text-[10px]"></i>
              <span>Delete</span>
            </button>

            <!-- View Details Button -->
            <button type="button" 
                    onclick="openDetailsModal('${it.id}')" 
                    title="View public details" 
                    class="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200 transition">
              <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
            </button>
          </div>

        </div>
      </div>
    `;
  }).join('');
}

/**
 * Handle Mark as Sold / Relist toggle
 */
function handleToggleSold(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item || !currentUser) return;

  if (item.seller.studentId !== currentUser.studentId) {
    showToast('You can only modify your own listings.', 'warning');
    return;
  }

  if (item.status === 'Sold') {
    item.status = 'Available';
    saveItemsToStorage();
    renderItems();
    renderDashboard();
    showToast({
      title: 'Borrow Status Updated',
      message: `Listing "${item.title}" relisted as Available on CampusKart!`,
      type: 'success',
      actionType: 'status_updated',
      icon: 'fa-solid fa-rotate'
    });
  } else {
    item.status = 'Sold';
    saveItemsToStorage();
    renderItems();
    renderDashboard();
    showToast({
      title: 'Borrow Status Updated',
      message: `"${item.title}" marked as Sold! Great job on your campus sale.`,
      type: 'success',
      actionType: 'status_updated',
      icon: 'fa-solid fa-bag-shopping'
    });
  }
}

/**
 * Handle Delete Listing with safe confirmation
 */
function handleDeleteListing(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item || !currentUser) return;

  if (item.seller.studentId !== currentUser.studentId) {
    showToast('You can only delete your own listings.', 'warning');
    return;
  }

  const confirmMsg = `Are you sure you want to delete "${item.title}" from CampusKart?\n\nThis will remove it from the student marketplace.`;
  if (confirm(confirmMsg)) {
    const idx = items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      items.splice(idx, 1);
      wishlist.delete(itemId);
      saveItemsToStorage();
      saveWishlistToStorage();
      renderItems();
      renderDashboard();
      updateWishlistCount();
      showToast(`🗑️ Listing "${item.title}" was successfully deleted.`, 'info');
    }
  }
}

/**
 * Open Dedicated Edit Listing Modal
 */
function openEditItemModal(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item || !currentUser) return;

  const modal = document.getElementById('editListingModal');
  const catSelect = document.getElementById('editCategorySelect');
  if (!modal) return;

  // Populate Categories
  if (catSelect) {
    const selectableCats = CATEGORIES.filter(c => c !== 'All Categories');
    catSelect.innerHTML = selectableCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  // Populate Values
  document.getElementById('editItemId').value = item.id;
  document.getElementById('editTitleInput').value = item.title || '';
  if (catSelect) catSelect.value = item.category || 'Textbooks';
  document.getElementById('editCourseInput').value = item.courseCode || '';
  document.getElementById('editConditionSelect').value = item.condition || 'Like New';
  document.getElementById('editTransactionSelect').value = item.transaction || 'Sell';
  document.getElementById('editPriceInput').value = item.price || 0;
  document.getElementById('editBorrowRateInput').value = item.borrowRate || '৳20 / week';
  document.getElementById('editBorrowTermsInput').value = item.borrowTerms || '';
  document.getElementById('editExchangeForInput').value = item.exchangeFor || '';
  document.getElementById('editLocationInput').value = item.location || 'NUB Central Library';
  document.getElementById('editDescriptionInput').value = item.description || '';
  
  const imgInput = document.getElementById('editImageUrlInput');
  const imgPreview = document.getElementById('editImagePreview');
  if (imgInput) imgInput.value = item.image || '';
  if (imgPreview) imgPreview.src = item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';

  updateEditModalFieldVisibility();

  modal.classList.remove('hidden');
}

function closeEditListingModal() {
  const modal = document.getElementById('editListingModal');
  if (modal) modal.classList.add('hidden');
}

function updateEditModalFieldVisibility() {
  const tx = document.getElementById('editTransactionSelect')?.value || 'Sell';
  const priceRow = document.getElementById('editPriceRow');
  const borrowRow = document.getElementById('editBorrowRow');
  const exchangeRow = document.getElementById('editExchangeRow');

  if (priceRow) priceRow.classList.add('hidden');
  if (borrowRow) borrowRow.classList.add('hidden');
  if (exchangeRow) exchangeRow.classList.add('hidden');

  if (tx === 'Sell' && priceRow) {
    priceRow.classList.remove('hidden');
  } else if (tx === 'Borrow' && borrowRow) {
    borrowRow.classList.remove('hidden');
  } else if (tx === 'Exchange' && exchangeRow) {
    exchangeRow.classList.remove('hidden');
  }
}

function handleEditListingSubmit(e) {
  e.preventDefault();
  const itemId = document.getElementById('editItemId')?.value;
  const item = items.find(i => i.id === itemId);
  if (!item || !currentUser) return;

  const title = document.getElementById('editTitleInput')?.value.trim();
  const category = document.getElementById('editCategorySelect')?.value;
  const courseCode = document.getElementById('editCourseInput')?.value.trim().toUpperCase() || 'General';
  const condition = document.getElementById('editConditionSelect')?.value;
  const transaction = document.getElementById('editTransactionSelect')?.value;
  const price = parseFloat(document.getElementById('editPriceInput')?.value) || 0;
  const borrowRate = document.getElementById('editBorrowRateInput')?.value.trim();
  const borrowTerms = document.getElementById('editBorrowTermsInput')?.value.trim();
  const exchangeFor = document.getElementById('editExchangeForInput')?.value.trim();
  const location = document.getElementById('editLocationInput')?.value.trim();
  const description = document.getElementById('editDescriptionInput')?.value.trim();
  const image = document.getElementById('editImageUrlInput')?.value.trim() || item.image;

  if (!title || !description) {
    showToast('Please provide both a title and description.', 'warning');
    return;
  }

  let priceLabel = 'Free';
  if (transaction === 'Sell') {
    priceLabel = `৳${price}`;
  } else if (transaction === 'Borrow') {
    priceLabel = borrowRate || '৳20 / week';
  } else if (transaction === 'Exchange') {
    priceLabel = 'Trade Item';
  }

  // Update Item fields
  item.title = title;
  item.category = category;
  item.courseCode = courseCode;
  item.condition = condition;
  item.transaction = transaction;
  item.transactionType = transaction;
  item.price = price;
  item.priceLabel = priceLabel;
  item.borrowRate = transaction === 'Borrow' ? borrowRate : null;
  item.borrowTerms = transaction === 'Borrow' ? borrowTerms : null;
  item.exchangeFor = transaction === 'Exchange' ? exchangeFor : null;
  item.location = location || 'NUB Campus';
  item.description = description;
  item.image = image;

  saveItemsToStorage();
  closeEditListingModal();
  renderItems();
  renderDashboard();

  showToast(`🎉 Listing "${item.title}" updated successfully!`, 'success');
}

/**
 * =========================================================================
 * TAB 2: BORROWED ITEMS (showing return due-date countdown & 'Mark as Returned' button)
 * =========================================================================
 */

function getCountdownDetails(dueDateISO) {
  if (!dueDateISO) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUrgent: false,
      isOverdue: false,
      formattedText: 'No Due Date Set',
      badgeClass: 'countdown-normal'
    };
  }

  const now = Date.now();
  const due = new Date(dueDateISO).getTime();
  const diffMs = due - now;

  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const d = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((overdueMs % (1000 * 60)) / 1000);
    const text = d > 0 ? `🚨 Overdue by ${d}d ${h}h ${m}m` : `🚨 Overdue by ${h}h ${m}m ${s}s`;
    return {
      days: -d,
      hours: -h,
      minutes: -m,
      seconds: -s,
      isUrgent: true,
      isOverdue: true,
      formattedText: text,
      badgeClass: 'countdown-overdue'
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const isUrgent = days < 2;
  let formattedText = '';
  if (days > 0) {
    formattedText = `⏳ ${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
  } else if (hours > 0) {
    formattedText = `⚠️ Due Today: ${hours}h ${minutes}m ${seconds}s left`;
  } else {
    formattedText = `🚨 Due very soon: ${minutes}m ${seconds}s left!`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isUrgent,
    isOverdue: false,
    formattedText,
    badgeClass: isUrgent ? 'countdown-urgent' : 'countdown-normal'
  };
}

function updateBorrowedCountdowns() {
  const elements = document.querySelectorAll('[data-due-countdown]');
  if (!elements || elements.length === 0) return;

  elements.forEach(el => {
    const itemId = el.getAttribute('data-due-countdown');
    const item = items.find(i => i.id === itemId);
    if (item && item.borrowDetails?.dueDate) {
      const countdown = getCountdownDetails(item.borrowDetails.dueDate);
      el.textContent = countdown.formattedText;
      const parentCard = el.closest('.countdown-container');
      if (parentCard) {
        parentCard.className = `countdown-container p-3 rounded-2xl border ${countdown.badgeClass} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`;
      }
    }
  });
}

function renderDashboardBorrowedPanel() {
  if (!currentUser) return;
  const container = document.getElementById('dashBorrowedPanel');
  const countBadge = document.getElementById('dashBorrowedCountBadge');

  // Items where currentUser is the borrower or has an active request
  const myBorrows = items.filter(it => 
    (it.borrowDetails && it.borrowDetails.borrowerId === currentUser.studentId) ||
    (it.activeRequest && it.activeRequest.requesterId === currentUser.studentId)
  );

  if (countBadge) countBadge.textContent = myBorrows.length;
  if (!container) return;

  if (myBorrows.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
        <div class="w-12 h-12 mx-auto mb-2 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shadow-sm">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">No Borrowed Items</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">You have no active borrows or peer exchanges. Find textbooks, calculators, and lab breadboards from classmates!</p>
        <button type="button" onclick="closeDashboardModal(); activeFilters.transaction = 'Borrow'; renderItems();" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition inline-flex items-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-magnifying-glass text-[10px]"></i>
          <span>Browse Available Borrows</span>
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = myBorrows.map(it => {
    let statusPill = '';
    let actionArea = '';
    let countdownArea = '';

    if (it.status === 'Requested') {
      statusPill = `<span class="status-pill status-requested"><i class="fa-solid fa-clock"></i> Awaiting Owner Approval</span>`;
      actionArea = `
        <span class="text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 font-semibold flex items-center gap-1">
          <i class="fa-solid fa-hourglass-half text-[10px]"></i> Pending Review
        </span>
      `;
    } else if (it.borrowDetails?.returnStatus === 'Returned') {
      statusPill = `<span class="status-pill status-completed"><i class="fa-solid fa-circle-check text-emerald-600"></i> Returned / Completed</span>`;
      
      if (!it.borrowDetails.isReviewed) {
        actionArea = `
          <button type="button" onclick="openReviewModal('${it.id}')" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-amber-500/30 flex items-center gap-1.5 transition active:scale-95 animate-pulse">
            <i class="fa-solid fa-star text-xs"></i>
            <span>Rate Lender</span>
          </button>
        `;
      } else {
        actionArea = `
          <span class="text-xs text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
            <i class="fa-solid fa-star text-xs"></i> Rated ★ 5.0
          </span>
        `;
      }
    } else if (it.status === 'Borrowed' || it.status === 'In Exchange') {
      const countdown = getCountdownDetails(it.borrowDetails.dueDate);
      statusPill = `<span class="status-pill status-borrowed"><i class="fa-solid fa-handshake"></i> ${it.status}</span>`;

      // Live Countdown display
      countdownArea = `
        <div class="countdown-container p-3 rounded-2xl border ${countdown.badgeClass} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 my-3 shadow-xs">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shrink-0 text-slate-700">
              <i class="fa-solid fa-stopwatch text-sm"></i>
            </div>
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-700">Return Due-Date Countdown</p>
              <p class="text-xs font-extrabold" data-due-countdown="${it.id}">
                ${countdown.formattedText}
              </p>
            </div>
          </div>
          <div class="text-right text-[11px] text-slate-600">
            <span>Official Due Date: <strong>${formatDate(it.borrowDetails.dueDate)}</strong></span>
          </div>
        </div>
      `;

      // 'Mark as Returned' Button
      actionArea = `
        <button type="button" 
                onclick="handleMarkAsReturnedByBorrower('${it.id}')" 
                class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-circle-check text-xs"></i>
          <span>Mark as Returned</span>
        </button>
      `;
    }

    return `
      <div class="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs transition hover:border-indigo-200">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-3.5">
          
          <!-- Item Thumbnail & Info -->
          <div class="flex items-start space-x-3.5 min-w-0">
            <img src="${it.image}" alt="${it.title}" class="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-200 shrink-0" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'" />
            <div class="min-w-0 space-y-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                ${statusPill}
                <span class="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.2 rounded">${it.courseCode || 'General'}</span>
                <span class="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.2 rounded-full border border-purple-200">${it.priceLabel}</span>
              </div>
              
              <h4 class="text-sm font-bold text-slate-900 leading-snug truncate" title="${it.title}">
                ${it.title}
              </h4>

              <!-- Lender Profile Info -->
              <div class="flex items-center gap-2 text-xs text-slate-600 flex-wrap pt-0.5">
                <span class="flex items-center gap-1">
                  <img src="${it.seller.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" class="w-4 h-4 rounded-full object-cover" alt="${it.seller.name}" />
                  Lender: <strong>${it.seller.name}</strong>
                </span>
                <span class="text-slate-300">&bull;</span>
                <span class="text-slate-500"><i class="fa-solid fa-location-dot text-rose-500 mr-1"></i>${it.location}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-2 shrink-0 self-end md:self-start">
            ${actionArea}
            <button type="button" onclick="openDetailsModal('${it.id}')" class="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200 transition" title="View details">
              <i class="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
            </button>
          </div>

        </div>

        <!-- Return Due-Date Countdown Area -->
        ${countdownArea}
      </div>
    `;
  }).join('');
}

/**
 * Handle borrower marking an item as returned
 */
function handleMarkAsReturnedByBorrower(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item || !currentUser) return;

  const confirmMsg = `Have you returned "${item.title}" to ${item.seller.name}?\n\nThis will mark the borrowing cycle as completed and prompt you to leave a peer rating for ${item.seller.name}.`;
  if (confirm(confirmMsg)) {
    item.status = 'Available';
    if (!item.borrowDetails) item.borrowDetails = {};
    item.borrowDetails.returnStatus = 'Returned';
    item.borrowDetails.returnedDate = new Date().toISOString();
    item.borrowDetails.isReviewed = false;

    saveItemsToStorage();
    renderItems();
    renderDashboard();

    showToast({
      title: 'Status updated to Returned! ⭐',
      message: `Item "${item.title}" successfully returned! Marked as completed on CampusKart.`,
      type: 'success',
      actionType: 'status_updated',
      icon: 'fa-solid fa-arrows-rotate'
    });

    // Automatically prompt review modal so borrower can review the peer lender
    setTimeout(() => {
      openReviewModal(itemId);
    }, 400);
  }
}

/**
 * =========================================================================
 * TAB 3: RECEIVED REVIEWS (displaying peer ratings & feedback)
 * =========================================================================
 */

function renderDashboardReviewsPanel() {
  if (!currentUser) return;
  const container = document.getElementById('dashReviewsPanel');
  const countBadge = document.getElementById('dashReviewsCountBadge');

  const myReviews = reviews.filter(r => r.sellerId === currentUser.studentId);
  if (countBadge) countBadge.textContent = myReviews.length;
  if (!container) return;

  if (myReviews.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
        <div class="w-12 h-12 mx-auto mb-2 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl shadow-sm">
          <i class="fa-solid fa-star"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">No Peer Reviews Yet</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">When classmates borrow, trade, or purchase items from your listings, their feedback ratings and peer reviews will appear here.</p>
        <button type="button" onclick="switchDashboardTab('listings')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition inline-flex items-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-boxes-stacked text-[10px]"></i>
          <span>View Your Active Listings</span>
        </button>
      </div>
    `;
    return;
  }

  // Calculate Overall Average & Star Breakdown
  const total = myReviews.length;
  const avg = (myReviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1);
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  myReviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  const starBarsHtml = [5, 4, 3, 2, 1].map(s => {
    const count = starCounts[s] || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div class="flex items-center gap-2 text-xs">
        <span class="w-12 font-bold text-slate-600 flex items-center gap-1">
          ${s} <i class="fa-solid fa-star text-amber-400 text-[10px]"></i>
        </span>
        <div class="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
          <div class="bg-amber-400 h-2 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>
        <span class="w-8 text-right text-slate-400 text-[11px] font-mono">${count}</span>
      </div>
    `;
  }).join('');

  const reviewsListHtml = myReviews.map(r => {
    const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
    const txPill = r.transactionType 
      ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${r.transactionType === 'Borrowed' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}">${r.transactionType}</span>` 
      : '';

    return `
      <div class="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-200 transition">
        <div class="flex items-start justify-between gap-3">
          
          <!-- Reviewer Info -->
          <div class="flex items-center space-x-3">
            <img src="${r.reviewerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" 
                 alt="${r.reviewerName}" 
                 class="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30" 
                 onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'" />
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <h5 class="text-xs sm:text-sm font-bold text-slate-900">${r.reviewerName}</h5>
                <span class="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">Verified Student</span>
                ${txPill}
              </div>
              <p class="text-[11px] text-slate-500">${r.reviewerDept || 'NUB Student'} &bull; <span class="text-slate-400 font-mono">${r.date || 'Recently'}</span></p>
            </div>
          </div>

          <!-- Star Rating -->
          <div class="text-right shrink-0">
            <div class="text-amber-400 text-xs sm:text-sm tracking-wider font-bold">
              ${stars}
            </div>
            <span class="text-[10px] text-slate-400 font-bold">${r.rating}.0 / 5.0</span>
          </div>
        </div>

        <!-- Reviewed Item tag -->
        ${r.itemTitle ? `
          <div class="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 font-medium">
            <i class="fa-solid fa-box text-slate-400 text-[10px]"></i>
            <span>Item: <strong>${r.itemTitle}</strong></span>
          </div>
        ` : ''}

        <!-- Classmate Feedback Comment -->
        <div class="mt-2 text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
          "${r.comment || 'Smooth, friendly and timely academic item exchange. Highly recommended classmate!'}"
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <!-- Peer Rating Overview Header Card -->
    <div class="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-200/80 rounded-2xl shadow-xs">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        <!-- Score Column -->
        <div class="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
          <div class="flex items-center justify-center md:justify-start gap-2">
            <span class="text-3xl sm:text-4xl font-black text-slate-900">${avg}</span>
            <div>
              <div class="text-amber-500 text-sm">★★★★★</div>
              <span class="text-[11px] text-slate-500 font-medium">out of 5.0</span>
            </div>
          </div>
          <p class="text-xs font-bold text-slate-800 mt-1">${total} Verified Peer Review${total === 1 ? '' : 's'}</p>
          <div class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            <i class="fa-solid fa-shield-check text-[9px]"></i> 100% Verified NUB Student Reviews
          </div>
        </div>

        <!-- Rating Distribution Progress Bars -->
        <div class="md:col-span-8 space-y-1.5">
          ${starBarsHtml}
        </div>

      </div>
    </div>

    <!-- Reviews List Header -->
    <div class="flex items-center justify-between pt-2">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
        <i class="fa-solid fa-comments text-indigo-600 text-xs"></i>
        <span>Classmate Feedback & Testimonials</span>
      </h4>
      <span class="text-[11px] text-slate-400 font-mono">${myReviews.length} record${myReviews.length === 1 ? '' : 's'}</span>
    </div>

    <!-- Review Cards Feed -->
    <div class="space-y-3">
      ${reviewsListHtml}
    </div>
  `;
}

function updateNotificationBadges() {
  if (!currentUser) {
    const navBadge = document.getElementById('navRequestsBadge');
    if (navBadge) navBadge.classList.add('hidden');
    return;
  }

  const pendingRequests = items.filter(it => it.seller.studentId === currentUser.studentId && it.status === 'Requested');
  const navBadge = document.getElementById('navRequestsBadge');
  const menuBadge = document.getElementById('menuRequestBadge');

  if (navBadge) {
    if (pendingRequests.length > 0) {
      navBadge.textContent = pendingRequests.length;
      navBadge.classList.remove('hidden');
    } else {
      navBadge.classList.add('hidden');
    }
  }

  if (menuBadge) {
    if (pendingRequests.length > 0) {
      menuBadge.textContent = `${pendingRequests.length} pending`;
      menuBadge.classList.remove('hidden');
    } else {
      menuBadge.classList.add('hidden');
    }
  }
}

function getDaysRemaining(dueDateISO) {
  if (!dueDateISO) return { days: 0, isUrgent: false, isOverdue: false, label: 'No Due Date' };
  const now = new Date();
  const due = new Date(dueDateISO);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, isUrgent: true, isOverdue: true, label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}!` };
  } else if (diffDays === 0) {
    return { days: 0, isUrgent: true, isOverdue: false, label: 'Due Today!' };
  } else if (diffDays <= 2) {
    return { days: diffDays, isUrgent: true, isOverdue: false, label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}` };
  } else {
    return { days: diffDays, isUrgent: false, isOverdue: false, label: `Due in ${diffDays} days` };
  }
}

function formatDate(dateISO) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function bindStateMachineEvents() {
  // Navigation button shortcut to Dashboard
  document.getElementById('navTransactionsBtn')?.addEventListener('click', () => openDashboard('listings'));
  document.getElementById('closeDashboardModal')?.addEventListener('click', closeDashboardModal);
  document.getElementById('dashPostShortcutBtn')?.addEventListener('click', () => {
    closeDashboardModal();
    openPostModal();
  });

  // Three Dashboard Tab Buttons
  document.getElementById('dashTabListingsBtn')?.addEventListener('click', () => switchDashboardTab('listings'));
  document.getElementById('dashTabBorrowedBtn')?.addEventListener('click', () => switchDashboardTab('borrowed'));
  document.getElementById('dashTabReviewsBtn')?.addEventListener('click', () => switchDashboardTab('reviews'));

  // Dedicated Edit Listing Modal Events
  document.getElementById('closeEditListingModal')?.addEventListener('click', closeEditListingModal);
  document.getElementById('cancelEditListingBtn')?.addEventListener('click', closeEditListingModal);
  document.getElementById('editListingForm')?.addEventListener('submit', handleEditListingSubmit);
  document.getElementById('editTransactionSelect')?.addEventListener('change', updateEditModalFieldVisibility);
  document.getElementById('editImageUrlInput')?.addEventListener('input', (e) => {
    const preview = document.getElementById('editImagePreview');
    if (preview) preview.src = e.target.value.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
  });

  // Request & Approval Modals
  document.getElementById('closeRequestModal')?.addEventListener('click', closeRequestModal);
  document.getElementById('requestForm')?.addEventListener('submit', handleRequestFormSubmit);

  document.getElementById('closeApprovalModal')?.addEventListener('click', closeApprovalModal);
  document.getElementById('approvalForm')?.addEventListener('submit', handleApprovalFormSubmit);

  // Review Modal
  document.getElementById('closeReviewModal')?.addEventListener('click', closeReviewModal);
  document.getElementById('reviewForm')?.addEventListener('submit', handleReviewFormSubmit);

  // Star selector clicks
  document.querySelectorAll('.star-rating-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = parseInt(e.currentTarget.getAttribute('data-val') || 5);
      setStarRating(val);
    });
  });

  // Modal backdrop click
  const dashboardModal = document.getElementById('dashboardModal');
  const editListingModal = document.getElementById('editListingModal');
  const requestModal = document.getElementById('requestModal');
  const approvalModal = document.getElementById('approvalModal');
  const reviewModal = document.getElementById('reviewModal');

  [dashboardModal, editListingModal, requestModal, approvalModal, reviewModal].forEach(m => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) {
          m.classList.add('hidden');
          document.body.classList.remove('overflow-hidden');
        }
      });
    }
  });
}

/**
 * =========================================================================
 * DATA INITIALIZATION & FILTERING
 * =========================================================================
 */

function loadData() {
  try {
    const savedItems = localStorage.getItem(STORAGE_ITEMS_KEY);
    if (savedItems) {
      items = JSON.parse(savedItems);
    }
  } catch (err) {
    console.error('Error reading localStorage', err);
    items = [];
  }

  // Synchronously ensure all default campus demo items are present immediately on startup
  if (!Array.isArray(items) || items.length === 0) {
    items = JSON.parse(JSON.stringify(INITIAL_ITEMS));
    saveItemsToStorage();
  } else {
    // If any core demo items are missing from previous test data, seamlessly restore them
    const existingTitles = new Set(items.map(it => (it.title || '').toLowerCase().trim()));
    let itemsAdded = false;
    INITIAL_ITEMS.forEach(initItem => {
      const initTitle = (initItem.title || '').toLowerCase().trim();
      if (!existingTitles.has(initTitle)) {
        items.push(JSON.parse(JSON.stringify(initItem)));
        existingTitles.add(initTitle);
        itemsAdded = true;
      }
    });
    if (itemsAdded) {
      saveItemsToStorage();
    }
  }

  try {
    const savedWishlist = localStorage.getItem(STORAGE_WISHLIST_KEY);
    if (savedWishlist) {
      wishlist = new Set(JSON.parse(savedWishlist));
    }

    const savedReviews = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (savedReviews) {
      reviews = JSON.parse(savedReviews);
    } else {
      reviews = typeof INITIAL_REVIEWS !== 'undefined' ? [...INITIAL_REVIEWS] : [];
      saveReviewsToStorage();
    }
  } catch (err) {
    console.error('Error reading secondary localStorage items', err);
    wishlist = new Set();
    reviews = typeof INITIAL_REVIEWS !== 'undefined' ? [...INITIAL_REVIEWS] : [];
  }

  // Ensure reviews are populated
  if (!reviews || reviews.length === 0) {
    reviews = typeof INITIAL_REVIEWS !== 'undefined' ? [...INITIAL_REVIEWS] : [];
    saveReviewsToStorage();
  }

  // Data Normalization pass to ensure compatibility
  if (items && items.length > 0) {
    items.forEach(it => {
      it.transaction = it.transaction || it.transactionType || 'Sell';
      it.transactionType = it.transaction;
      it.status = it.status || 'Available';
      if (!it.priceLabel) {
        if (it.transaction === 'Sell') {
          it.priceLabel = it.price ? `৳${it.price}` : 'Free';
        } else if (it.transaction === 'Borrow') {
          it.priceLabel = it.borrowRate || '৳20 / week';
        } else {
          it.priceLabel = 'Trade Item';
        }
      }
      if (it.seller && !it.seller.studentId) {
        if (it.seller.email?.includes('rifat') || it.seller.name?.includes('Rifat')) {
          it.seller.studentId = '202110045';
        } else if (it.seller.email?.includes('ruma') || it.seller.name?.includes('Ruma')) {
          it.seller.studentId = '202220015';
        } else {
          it.seller.studentId = '42240101512';
        }
      }
    });
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

function saveReviewsToStorage() {
  try {
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.warn('Could not save reviews to localStorage', e);
  }
}

function populateDropdowns() {
  const courseFilter = document.getElementById('filterCourse');
  const modalCourse = document.getElementById('postCourse');
  const categoryFilter = document.getElementById('filterCategory');
  const modalCategory = document.getElementById('postCategory');
  const quickCourseChips = document.getElementById('quickCourseChips');

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

  if (quickCourseChips) {
    const popularCourses = ['All Courses', 'CSE 111', 'MATH 201', 'CS 101', 'CHEM 121', 'EEE 101', 'BBA 202'];
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

function initUI() {
  const presetContainer = document.getElementById('presetImagePickers');
  if (presetContainer) {
    presetContainer.innerHTML = PRESET_IMAGES.map((preset, idx) => `
      <button type="button" 
              class="preset-image-btn text-left p-1.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all group flex items-center space-x-2 ${idx === 0 ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500' : 'bg-white'}" 
              data-url="${preset.url}"
              data-label="${preset.label}"
              data-type="${preset.type || 'Course Material'}">
        <img src="${preset.url}" class="w-8 h-8 rounded-lg object-cover shadow-xs shrink-0" alt="${preset.label}" />
        <div class="min-w-0 flex-1">
          <span class="block text-xs font-bold text-slate-700 group-hover:text-indigo-600 truncate">${preset.label}</span>
          <span class="block text-[9px] text-slate-400 truncate">${preset.type || 'Academic'}</span>
        </div>
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
        
        currentUploadedImageDataUrl = null;
        const uploadStatus = document.getElementById('uploadedFileStatus');
        if (uploadStatus) uploadStatus.classList.add('hidden');

        const urlInput = document.getElementById('postImageUrl');
        const selectedUrl = current.getAttribute('data-url');
        const selectedType = current.getAttribute('data-type');
        const selectedLabel = current.getAttribute('data-label');
        if (urlInput) {
          urlInput.value = selectedUrl;
        }
        updatePostImagePreview(selectedUrl, selectedType, selectedLabel);
      });
    });
  }
}

/**
 * Instant Image Preview Helper
 * Updates preview card, badge tags, source tag, and error handling
 */
function updatePostImagePreview(url, typeLabel = 'Preset Photo', titleSnippet = null) {
  const preview = document.getElementById('postImagePreview');
  const errorOverlay = document.getElementById('previewErrorOverlay');
  const typeText = document.getElementById('previewTypeText');
  const sourceText = document.getElementById('imageSourceText');
  const titleSnippetEl = document.getElementById('previewItemTitleSnippet');
  const subSnippetEl = document.getElementById('previewItemSubSnippet');
  const resolutionTag = document.getElementById('previewResolutionTag');
  const clearUrlBtn = document.getElementById('clearImageUrlBtn');

  const finalUrl = url || currentUploadedImageDataUrl || PRESET_IMAGES[0]?.url || '';

  if (clearUrlBtn) {
    if (url && url.trim().length > 0) clearUrlBtn.classList.remove('hidden');
    else clearUrlBtn.classList.add('hidden');
  }

  if (preview) {
    if (finalUrl) {
      if (errorOverlay) errorOverlay.classList.add('hidden');
      preview.src = finalUrl;
      preview.classList.remove('hidden');
    } else {
      preview.classList.add('hidden');
      if (errorOverlay) errorOverlay.classList.remove('hidden');
    }
  }

  if (typeText) typeText.textContent = typeLabel || 'Course Material';

  if (sourceText) {
    if (currentUploadedImageDataUrl) {
      sourceText.textContent = 'Device Photo Uploaded';
    } else if (url && url.startsWith('http')) {
      sourceText.textContent = 'Web URL Linked';
    } else {
      sourceText.textContent = 'Preset Loaded';
    }
  }

  if (titleSnippetEl) {
    const rawTitle = titleSnippet || document.getElementById('postTitle')?.value.trim() || 'Textbook / Notes Photo';
    titleSnippetEl.textContent = `Preview: ${rawTitle}`;
  }

  if (subSnippetEl) {
    const course = document.getElementById('postCourse')?.value.trim() || 'General';
    subSnippetEl.textContent = `Ready to post for NUB students • ${course}`;
  }

  if (resolutionTag) {
    resolutionTag.textContent = finalUrl.startsWith('data:') ? 'Local File' : 'HD Ready';
  }
}

/**
 * Image Upload & Instant URL Preview Setup
 */
function setupImageUploadAndPreview() {
  const urlInput = document.getElementById('postImageUrl');
  const fileInput = document.getElementById('postImageFileInput');
  const dropzone = document.getElementById('dropzoneArea');
  const previewImg = document.getElementById('postImagePreview');
  const clearUrlBtn = document.getElementById('clearImageUrlBtn');
  const resetBtn = document.getElementById('resetPhotoBtn');
  const removeUploadBtn = document.getElementById('removeUploadedPhotoBtn');
  const modeUrlBtn = document.getElementById('imgModeUrlBtn');
  const modeUploadBtn = document.getElementById('imgModeUploadBtn');
  const urlContainer = document.getElementById('imageUrlContainer');
  const uploadContainer = document.getElementById('imageUploadContainer');
  const errorOverlay = document.getElementById('previewErrorOverlay');

  // Mode switching tabs
  if (modeUrlBtn && modeUploadBtn && urlContainer && uploadContainer) {
    modeUrlBtn.addEventListener('click', () => {
      modeUrlBtn.classList.add('bg-white', 'text-indigo-600', 'shadow-xs');
      modeUrlBtn.classList.remove('text-slate-600');
      modeUploadBtn.classList.remove('bg-white', 'text-indigo-600', 'shadow-xs');
      modeUploadBtn.classList.add('text-slate-600');
      urlContainer.classList.remove('hidden');
      uploadContainer.classList.add('hidden');
    });

    modeUploadBtn.addEventListener('click', () => {
      modeUploadBtn.classList.add('bg-white', 'text-indigo-600', 'shadow-xs');
      modeUploadBtn.classList.remove('text-slate-600');
      modeUrlBtn.classList.remove('bg-white', 'text-indigo-600', 'shadow-xs');
      modeUrlBtn.classList.add('text-slate-600');
      uploadContainer.classList.remove('hidden');
      urlContainer.classList.add('hidden');
    });
  }

  // Instant live URL input preview
  if (urlInput) {
    ['input', 'paste', 'change', 'keyup'].forEach(evt => {
      urlInput.addEventListener(evt, () => {
        setTimeout(() => {
          const val = urlInput.value.trim();
          currentUploadedImageDataUrl = null;
          const uploadStatus = document.getElementById('uploadedFileStatus');
          if (uploadStatus) uploadStatus.classList.add('hidden');
          updatePostImagePreview(val, 'Web URL Linked', document.getElementById('postTitle')?.value || 'Photo Preview');
        }, 15);
      });
    });
  }

  if (clearUrlBtn && urlInput) {
    clearUrlBtn.addEventListener('click', () => {
      urlInput.value = '';
      clearUrlBtn.classList.add('hidden');
      updatePostImagePreview('', 'No Photo Selected', 'Paste URL or select preset');
    });
  }

  // File Upload handling
  function handleFileSelected(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast({
        title: 'Invalid File',
        message: 'Please select a valid image file (PNG, JPG, WebP).',
        type: 'warning'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentUploadedImageDataUrl = e.target.result;
      const statusBox = document.getElementById('uploadedFileStatus');
      const nameSpan = document.getElementById('uploadedFileName');
      if (statusBox && nameSpan) {
        nameSpan.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
        statusBox.classList.remove('hidden');
      }
      if (urlInput) urlInput.value = '';
      updatePostImagePreview(currentUploadedImageDataUrl, 'Device Photo', file.name);
      showToast({
        title: 'Photo Uploaded',
        message: `Photo "${file.name}" loaded for instant preview!`,
        type: 'success',
        icon: 'fa-solid fa-camera'
      });
    };
    reader.readAsDataURL(file);
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      handleFileSelected(file);
    });
  }

  // Drag and drop dropzone
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dropzone-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dropzone-dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt && dt.files && dt.files[0];
      if (file) {
        handleFileSelected(file);
      }
    });
  }

  if (removeUploadBtn) {
    removeUploadBtn.addEventListener('click', () => {
      currentUploadedImageDataUrl = null;
      if (fileInput) fileInput.value = '';
      const statusBox = document.getElementById('uploadedFileStatus');
      if (statusBox) statusBox.classList.add('hidden');
      const defaultUrl = PRESET_IMAGES[0]?.url || '';
      if (urlInput) urlInput.value = defaultUrl;
      updatePostImagePreview(defaultUrl, 'CSE Textbook', 'Textbook Photo');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentUploadedImageDataUrl = null;
      if (fileInput) fileInput.value = '';
      const statusBox = document.getElementById('uploadedFileStatus');
      if (statusBox) statusBox.classList.add('hidden');
      const defaultUrl = PRESET_IMAGES[0]?.url || '';
      if (urlInput) urlInput.value = defaultUrl;
      updatePostImagePreview(defaultUrl, 'Default Preset', 'Casio / Textbook Photo');
      showToast({
        title: 'Photo Reset',
        message: 'Photo preview restored to default preset',
        type: 'info'
      });
    });
  }

  if (previewImg) {
    previewImg.addEventListener('error', () => {
      if (errorOverlay) errorOverlay.classList.remove('hidden');
    });
    previewImg.addEventListener('load', () => {
      if (errorOverlay) errorOverlay.classList.add('hidden');
    });
  }

  // Title sync to preview snippet
  document.getElementById('postTitle')?.addEventListener('input', (e) => {
    const titleSnippetEl = document.getElementById('previewItemTitleSnippet');
    if (titleSnippetEl) {
      titleSnippetEl.textContent = `Preview: ${e.target.value.trim() || 'New Academic Listing'}`;
    }
  });

  document.getElementById('postCourse')?.addEventListener('input', (e) => {
    const subSnippetEl = document.getElementById('previewItemSubSnippet');
    if (subSnippetEl) {
      subSnippetEl.textContent = `Ready to post for NUB students • ${e.target.value.trim() || 'General'}`;
    }
  });
}

/**
 * =========================================================================
 * ACADEMIC PRESENTATION & VIVA AUTO-FILL DEMO SYSTEM
 * =========================================================================
 */

function autoFillNextDemoItem() {
  const demo = CSE_DEMO_ITEMS[currentDemoItemIndex];
  populateListingFormWithDemo(demo, currentDemoItemIndex);
  currentDemoItemIndex = (currentDemoItemIndex + 1) % CSE_DEMO_ITEMS.length;
}

function autoFillDemoByIndex(index) {
  if (index >= 0 && index < CSE_DEMO_ITEMS.length) {
    currentDemoItemIndex = index;
    const demo = CSE_DEMO_ITEMS[index];
    populateListingFormWithDemo(demo, index);
    currentDemoItemIndex = (index + 1) % CSE_DEMO_ITEMS.length;
  }
}

function populateListingFormWithDemo(demo, index = 0) {
  const titleInput = document.getElementById('postTitle');
  const catInput = document.getElementById('postCategory');
  const courseInput = document.getElementById('postCourse');
  const locInput = document.getElementById('postLocation');
  const descInput = document.getElementById('postDescription');
  const urlInput = document.getElementById('postImageUrl');
  const indexBadge = document.getElementById('demoItemIndexBadge');

  if (titleInput) titleInput.value = demo.title;
  if (catInput) catInput.value = demo.category;
  if (courseInput) courseInput.value = demo.courseCode;
  if (locInput) locInput.value = demo.location;
  if (descInput) descInput.value = demo.description;

  currentUploadedImageDataUrl = null;
  const uploadStatus = document.getElementById('uploadedFileStatus');
  if (uploadStatus) uploadStatus.classList.add('hidden');

  if (urlInput) urlInput.value = demo.image;

  if (indexBadge) {
    indexBadge.textContent = `${index + 1}/${CSE_DEMO_ITEMS.length}`;
  }

  // Radio Condition
  const conditionRadios = document.querySelectorAll('input[name="postCondition"]');
  conditionRadios.forEach(r => {
    r.checked = (r.value.toLowerCase() === demo.condition.toLowerCase());
  });

  // Radio Transaction
  const transactionRadios = document.querySelectorAll('input[name="postTransaction"]');
  transactionRadios.forEach(r => {
    r.checked = (r.value.toLowerCase() === demo.transaction.toLowerCase());
  });
  updatePostModalFields();

  // Price or Borrow or Exchange inputs
  if (demo.transaction === 'Sell') {
    const priceInput = document.getElementById('postPriceInput');
    if (priceInput) priceInput.value = demo.price || 650;
  } else if (demo.transaction === 'Borrow') {
    const borrowRate = document.getElementById('postBorrowRateInput');
    const borrowTerms = document.getElementById('postBorrowTermsInput');
    if (borrowRate) borrowRate.value = demo.borrowRate || '৳30 / week';
    if (borrowTerms) borrowTerms.value = demo.borrowTerms || 'NUB Student ID Card deposit';
  } else if (demo.transaction === 'Exchange') {
    const exchangeFor = document.getElementById('postExchangeForInput');
    if (exchangeFor) exchangeFor.value = demo.exchangeFor || 'Open to relevant course trades';
  }

  // Update instant image preview
  updatePostImagePreview(demo.image, demo.previewType || 'Course Material', demo.title);

  // Flash highlight animation on form inputs
  [titleInput, courseInput, descInput].forEach(el => {
    if (el) {
      el.classList.remove('input-flash');
      void el.offsetWidth; // re-flow
      el.classList.add('input-flash');
    }
  });

  // Show clean notification
  showToast({
    title: '✨ Demo CSE Gear Auto-Filled',
    message: `Populated "${demo.title}" (${demo.courseCode}) for quick viva demonstration!`,
    type: 'info',
    actionType: 'notification',
    icon: 'fa-solid fa-wand-magic-sparkles'
  });
}

/**
 * Bind Auto-Fill Demo & Offer Modal Events
 */
function bindDemoAndOfferEvents() {
  const autoFillBtn = document.getElementById('autoFillDemoBtn');
  const fillCseBtn = document.getElementById('fillDemoCseGearBtn');
  [autoFillBtn, fillCseBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', autoFillNextDemoItem);
    }
  });

  // Close Make Offer Modal
  const closeOfferBtn = document.getElementById('closeMakeOfferModal');
  if (closeOfferBtn) closeOfferBtn.addEventListener('click', closeMakeOfferModal);

  // Form submit for Price Offer
  const makeOfferForm = document.getElementById('makeOfferForm');
  if (makeOfferForm) {
    makeOfferForm.addEventListener('submit', handleMakeOfferFormSubmit);
  }

  // Close when clicking modal backdrop
  const offerModal = document.getElementById('makeOfferModal');
  if (offerModal) {
    offerModal.addEventListener('click', (e) => {
      if (e.target === offerModal) closeMakeOfferModal();
    });
  }
}

/**
 * =========================================================================
 * HERO FEATURED ITEMS CAROUSEL (DARAZ-STYLE AUTO-SLIDER)
 * =========================================================================
 */
let currentHeroSlide = 0;
let heroCarouselTimer = null;
const HERO_SLIDE_INTERVAL = 3500; // 3.5 seconds

function handleHeaderSearch() {
  const input = document.getElementById('headerSearchInput') || document.getElementById('searchInput');
  if (input) {
    activeFilters.searchQuery = input.value.trim().toLowerCase();
    renderItems();
  }
  document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
}

function initHeroCarousel() {
  const container = document.getElementById('heroCarouselContainer');
  const track = document.getElementById('heroCarouselTrack');
  const prevBtn = document.getElementById('carouselPrevBtn');
  const nextBtn = document.getElementById('carouselNextBtn');
  const dotsContainer = document.getElementById('carouselDots');

  if (!container || !track) return;

  const slides = track.querySelectorAll('.carousel-slide');
  const totalSlides = slides.length;
  if (totalSlides === 0) return;

  // Render dots
  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from({ length: totalSlides }).map((_, i) => `
      <button type="button" 
              class="carousel-dot ${i === 0 ? 'active' : ''}" 
              data-slide="${i}" 
              aria-label="Go to slide ${i + 1}"></button>
    `).join('');

    dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-slide') || '0', 10);
        goToHeroSlide(idx);
        startAutoPlay();
      });
    });
  }

  function updateSlidePosition() {
    track.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
    if (dotsContainer) {
      dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
        if (idx === currentHeroSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
  }

  function nextHeroSlide() {
    currentHeroSlide = (currentHeroSlide + 1) % totalSlides;
    updateSlidePosition();
  }

  function prevHeroSlide() {
    currentHeroSlide = (currentHeroSlide - 1 + totalSlides) % totalSlides;
    updateSlidePosition();
  }

  function goToHeroSlide(index) {
    currentHeroSlide = index;
    updateSlidePosition();
  }

  function startAutoPlay() {
    stopAutoPlay();
    heroCarouselTimer = setInterval(nextHeroSlide, HERO_SLIDE_INTERVAL);
  }

  function stopAutoPlay() {
    if (heroCarouselTimer) {
      clearInterval(heroCarouselTimer);
      heroCarouselTimer = null;
    }
  }

  // Button clicks
  nextBtn?.addEventListener('click', () => {
    nextHeroSlide();
    startAutoPlay();
  });

  prevBtn?.addEventListener('click', () => {
    prevHeroSlide();
    startAutoPlay();
  });

  // Pause on hover
  container.addEventListener('mouseenter', stopAutoPlay);
  container.addEventListener('mouseleave', startAutoPlay);

  // Mobile Touch Swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoPlay();
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextHeroSlide();
      } else {
        prevHeroSlide();
      }
    }
    startAutoPlay();
  }, { passive: true });

  // Start auto slide
  startAutoPlay();
}

function bindEvents() {
  const searchInput = document.getElementById('searchInput');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const mobileStickySearchInput = document.getElementById('mobileStickySearchInput');
  const headerClearSearchBtn = document.getElementById('headerClearSearchBtn');
  const mobileClearSearchBtn = document.getElementById('mobileClearSearchBtn');

  // Synchronized search across hero bar, sticky desktop header, and sticky mobile bar
  function handleSearchUpdate(val, sourceEl) {
    const query = (val || '').trim().toLowerCase();
    activeFilters.searchQuery = query;

    if (searchInput && sourceEl !== searchInput) searchInput.value = val;
    if (headerSearchInput && sourceEl !== headerSearchInput) headerSearchInput.value = val;
    if (mobileStickySearchInput && sourceEl !== mobileStickySearchInput) mobileStickySearchInput.value = val;

    if (headerClearSearchBtn) {
      if (val) headerClearSearchBtn.classList.remove('hidden');
      else headerClearSearchBtn.classList.add('hidden');
    }
    if (mobileClearSearchBtn) {
      if (val) mobileClearSearchBtn.classList.remove('hidden');
      else mobileClearSearchBtn.classList.add('hidden');
    }

    renderItems();
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearchUpdate(e.target.value, searchInput);
    });
  }

  if (headerSearchInput) {
    headerSearchInput.addEventListener('input', (e) => {
      handleSearchUpdate(e.target.value, headerSearchInput);
    });
    headerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (mobileStickySearchInput) {
    mobileStickySearchInput.addEventListener('input', (e) => {
      handleSearchUpdate(e.target.value, mobileStickySearchInput);
    });
    mobileStickySearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (headerClearSearchBtn) {
    headerClearSearchBtn.addEventListener('click', () => {
      handleSearchUpdate('', null);
      if (headerSearchInput) headerSearchInput.focus();
    });
  }

  if (mobileClearSearchBtn) {
    mobileClearSearchBtn.addEventListener('click', () => {
      handleSearchUpdate('', null);
      if (mobileStickySearchInput) mobileStickySearchInput.focus();
    });
  }

  const headerSearchForm = document.getElementById('headerSearchForm');
  if (headerSearchForm) {
    headerSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (headerSearchInput?.value || searchInput?.value || mobileStickySearchInput?.value || '').trim();
      handleSearchUpdate(val, null);
      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Smooth jitter-free scroll elevation for sticky frosted glass header
  const mainHeader = document.getElementById('mainHeader');
  if (mainHeader) {
    let scrollTicking = false;
    let isScrolled = null;

    const updateStickyHeader = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const shouldBeScrolled = scrollY > 20;

      if (shouldBeScrolled !== isScrolled) {
        isScrolled = shouldBeScrolled;
        if (isScrolled) {
          mainHeader.classList.add('scrolled');
        } else {
          mainHeader.classList.remove('scrolled');
        }
      }
      scrollTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateStickyHeader);
        scrollTicking = true;
      }
    }, { passive: true });

    // Initial check to preserve consistent elevation on page load or scroll restoration
    updateStickyHeader();
  }
  const filterCourse = document.getElementById('filterCourse');
  if (filterCourse) {
    filterCourse.addEventListener('change', (e) => {
      activeFilters.courseCode = e.target.value;
      updateQuickCourseChipsUI();
      renderItems();
    });
  }

  const filterCategory = document.getElementById('filterCategory');
  if (filterCategory) {
    filterCategory.addEventListener('change', (e) => {
      activeFilters.category = e.target.value;
      updateCategoryPillsUI();
      renderItems();
    });
  }

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

  const filterCondition = document.getElementById('filterCondition');
  if (filterCondition) {
    filterCondition.addEventListener('change', (e) => {
      activeFilters.condition = e.target.value;
      renderItems();
    });
  }

  const sortBy = document.getElementById('sortBy');
  if (sortBy) {
    sortBy.addEventListener('change', (e) => {
      activeFilters.sortBy = e.target.value;
      renderItems();
    });
  }

  document.getElementById('btnResetFilters')?.addEventListener('click', resetFilters);

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

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Open Post Item modal (Auth Guarded)
  const openPostModalBtns = document.querySelectorAll('.open-post-modal-btn');
  const postModal = document.getElementById('postItemModal');
  const closePostModalBtn = document.getElementById('closePostModal');
  const cancelPostModalBtn = document.getElementById('cancelPostModal');

  openPostModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!currentUser) {
        pendingAuthAction = () => {
          if (postModal) {
            postModal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
          }
        };
        openAuthModal('login', 'Please sign in with your official @nub.ac.bd account to post an item.');
        return;
      }

      if (postModal) {
        updateAuthUI();
        postModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
    });
  });

  if (closePostModalBtn) closePostModalBtn.addEventListener('click', closePostModal);
  if (cancelPostModalBtn) cancelPostModalBtn.addEventListener('click', closePostModal);

  const postTransactionInputs = document.querySelectorAll('input[name="postTransaction"]');
  postTransactionInputs.forEach(radio => {
    radio.addEventListener('change', updatePostModalFields);
  });

  const postImageUrlInput = document.getElementById('postImageUrl');
  if (postImageUrlInput) {
    postImageUrlInput.addEventListener('input', (e) => {
      updatePostImagePreview(e.target.value.trim());
    });
  }

  document.getElementById('postItemForm')?.addEventListener('submit', handleNewListingSubmit);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePostModal();
      closeDetailsModal();
      closeAuthModal();
      closeDashboardModal();
      closeEditListingModal();
      closeRequestModal();
      closeApprovalModal();
      closeReviewModal();
    }
  });

  document.getElementById('closeDetailsModal')?.addEventListener('click', closeDetailsModal);

  const detailsModal = document.getElementById('itemDetailsModal');
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
  const headerSearchInput = document.getElementById('headerSearchInput');
  const mobileStickySearchInput = document.getElementById('mobileStickySearchInput');
  const headerClearSearchBtn = document.getElementById('headerClearSearchBtn');
  const mobileClearSearchBtn = document.getElementById('mobileClearSearchBtn');
  const filterCourse = document.getElementById('filterCourse');
  const filterCategory = document.getElementById('filterCategory');
  const filterCondition = document.getElementById('filterCondition');
  const sortBy = document.getElementById('sortBy');

  if (searchInput) searchInput.value = '';
  if (headerSearchInput) headerSearchInput.value = '';
  if (mobileStickySearchInput) mobileStickySearchInput.value = '';
  if (headerClearSearchBtn) headerClearSearchBtn.classList.add('hidden');
  if (mobileClearSearchBtn) mobileClearSearchBtn.classList.add('hidden');
  if (filterCourse) filterCourse.value = 'All Courses';
  if (filterCategory) filterCategory.value = 'All Categories';
  if (filterCondition) filterCondition.value = 'All';
  if (sortBy) sortBy.value = 'featured';

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

function getFilteredItems() {
  return items.filter(item => {
    if (activeFilters.showWishlistOnly && !wishlist.has(item.id)) {
      return false;
    }

    if (activeFilters.searchQuery) {
      const q = activeFilters.searchQuery;
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchCourse = (item.courseCode || '').toLowerCase().includes(q);
      const matchCategory = (item.category || '').toLowerCase().includes(q);
      const matchLocation = (item.location || '').toLowerCase().includes(q);
      const matchSeller = (item.seller?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCourse && !matchCategory && !matchLocation && !matchSeller) {
        return false;
      }
    }

    if (activeFilters.courseCode !== 'All Courses') {
      if (item.courseCode !== activeFilters.courseCode) {
        return false;
      }
    }

    if (activeFilters.category !== 'All Categories') {
      if (item.category !== activeFilters.category) {
        return false;
      }
    }

    if (activeFilters.transaction !== 'All') {
      if ((item.transaction || '').toLowerCase() !== activeFilters.transaction.toLowerCase()) {
        return false;
      }
    }

    if (activeFilters.condition !== 'All') {
      if ((item.condition || '').toLowerCase() !== activeFilters.condition.toLowerCase()) {
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
    return ((b.isFeatured || b.featured) ? 1 : 0) - ((a.isFeatured || a.featured) ? 1 : 0);
  });
}

/**
 * Render items into the marketplace grid with status badges
 */
function renderItems() {
  const container = document.getElementById('itemsGrid');
  const countDisplay = document.getElementById('resultsCount');
  const activeFiltersContainer = document.getElementById('activeFilterPills');
  if (!container) return;

  const filtered = getFilteredItems();

  if (countDisplay) {
    countDisplay.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'} available on NUB campus`;
  }

  if (activeFiltersContainer) {
    const badges = [];
    if (activeFilters.searchQuery) badges.push(`Keyword: "${activeFilters.searchQuery}"`);
    if (activeFilters.courseCode !== 'All Courses') badges.push(`Course: ${activeFilters.courseCode}`);
    if (activeFilters.category !== 'All Categories') badges.push(`Category: ${activeFilters.category}`);
    if (activeFilters.transaction !== 'All') badges.push(`Type: ${activeFilters.transaction}`);
    if (activeFilters.condition !== 'All') badges.push(`Condition: ${activeFilters.condition}`);
    if (activeFilters.showWishlistOnly) badges.push(`Saved Wishlist`);

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
            Post an Item
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.open-post-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!currentUser) {
          openAuthModal('login', 'Please sign in with your official @nub.ac.bd account to post an item.');
          return;
        }
        const postModal = document.getElementById('postItemModal');
        if (postModal) postModal.classList.remove('hidden');
      });
    });
    return;
  }

  container.innerHTML = filtered.map(item => generateCardHtml(item)).join('');

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

  container.querySelectorAll('.card-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'request') {
        openRequestModal(itemId);
      } else if (action === 'offer') {
        openMakeOfferModal(itemId);
      } else {
        openDetailsModal(itemId);
      }
    });
  });
}

/**
 * Generate HTML string for single item card with State Machine status
 */
function generateCardHtml(item) {
  const isWishlisted = wishlist.has(item.id);

  // Condition Badge
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

  // Transaction Tag
  let transactionClass = 'transaction-sell';
  let transactionIcon = 'fa-tag';
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

  // State Machine Status Badge
  let statusBadgeHtml = ``;
  let actionButtonHtml = ``;

  if (item.status === 'Requested') {
    statusBadgeHtml = `
      <span class="status-pill status-requested shadow-xs">
        <i class="fa-solid fa-clock text-[9px]"></i> Requested
      </span>
    `;
    actionButtonHtml = `
      <button type="button" 
              data-id="${item.id}" 
              data-action="view"
              class="card-action-btn px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1">
        <span>Requested</span>
      </button>
    `;
  } else if (item.status === 'Borrowed' || item.status === 'In Exchange') {
    const remaining = item.borrowDetails ? getDaysRemaining(item.borrowDetails.dueDate) : { label: 'Borrowed', isUrgent: false };
    statusBadgeHtml = `
      <span class="status-pill status-borrowed shadow-xs">
        <i class="fa-solid fa-arrows-spin text-[9px]"></i> ${item.status}
      </span>
    `;
    actionButtonHtml = `
      <button type="button" 
              data-id="${item.id}" 
              data-action="view"
              class="card-action-btn px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-[11px] font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1">
        <span>${remaining.label}</span>
      </button>
    `;
  } else {
    // Available
    statusBadgeHtml = `
      <span class="status-pill status-available shadow-xs">
        <i class="fa-solid fa-circle-check text-[9px]"></i> Available
      </span>
    `;

    if (item.transaction === 'Borrow') {
      actionButtonHtml = `
        <button type="button" 
                data-id="${item.id}" 
                data-action="request"
                class="card-action-btn px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1">
          <i class="fa-solid fa-clock text-[10px]"></i>
          <span>Borrow</span>
        </button>
      `;
    } else if (item.transaction === 'Exchange') {
      actionButtonHtml = `
        <button type="button" 
                data-id="${item.id}" 
                data-action="request"
                class="card-action-btn px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1">
          <i class="fa-solid fa-arrows-rotate text-[10px]"></i>
          <span>Exchange</span>
        </button>
      `;
    } else {
      actionButtonHtml = `
        <div class="flex items-center gap-1">
          <button type="button" 
                  data-id="${item.id}" 
                  data-action="offer"
                  class="card-action-btn px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1"
                  title="Make a Price Offer">
            <i class="fa-solid fa-tag text-[10px]"></i>
            <span>Offer</span>
          </button>
          <button type="button" 
                  data-id="${item.id}" 
                  data-action="view"
                  class="card-action-btn px-2.5 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1">
            <span>View</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      `;
    }
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

          <!-- Top-Left: Transaction Tag & Status Badge -->
          <div class="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            <span class="${transactionClass} px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid ${transactionIcon}"></i>
              ${transactionBadgeLabel}
            </span>
            ${statusBadgeHtml}
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
            <span><i class="fa-regular fa-clock mr-1"></i>${item.postedAt || item.datePosted || 'Just now'}</span>
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
               class="w-8 h-8 rounded-full object-cover ring-2 ring-white shrink-0" 
               onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'" />
          <div class="min-w-0">
            <div class="flex items-center gap-1">
              <p class="text-xs font-bold text-slate-800 truncate">${item.seller.name}</p>
              <i class="fa-solid fa-circle-check text-blue-600 text-[10px]" title="NUB Verified Student"></i>
            </div>
            <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span class="text-amber-500 font-bold flex items-center">
                <i class="fa-solid fa-star text-[9px] mr-0.5"></i>${item.seller.rating || 5.0}
                <span class="text-slate-400 font-normal ml-0.5">(${item.seller.reviewsCount || 1})</span>
              </span>
              <span>&bull;</span>
              <span class="truncate">${item.location.split(',')[0]}</span>
            </div>
          </div>
        </div>

        <div>
          ${actionButtonHtml}
        </div>
      </div>
    </article>
  `;
}

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

  if (activeFilters.showWishlistOnly) {
    renderItems();
  } else {
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
 * Item Details Modal with dynamic state machine controls & reviews
 */
function openDetailsModal(itemId) {
  let item = items.find(i => i.id === itemId);
  if (!item) {
    if (itemId === 'ck-101' || itemId === 'item-1') {
      item = items.find(i => i.id === 'item-1' || (i.title || '').toLowerCase().includes('casio'));
    } else if (itemId === 'ck-102' || itemId === 'item-2') {
      item = items.find(i => i.id === 'item-2' || (i.title || '').toLowerCase().includes('discrete'));
    } else if (itemId === 'ck-103' || itemId === 'item-3') {
      item = items.find(i => i.id === 'item-3' || (i.title || '').toLowerCase().includes('breadboard') || (i.title || '').toLowerCase().includes('logic design'));
    } else if (itemId === 'item-4') {
      item = items.find(i => i.id === 'item-4' || (i.title || '').toLowerCase().includes('operating systems') || (i.title || '').toLowerCase().includes('3373'));
    } else if (itemId === 'item-5') {
      item = items.find(i => i.id === 'item-5' || (i.title || '').toLowerCase().includes('drafting') || (i.title || '').toLowerCase().includes('t-scale'));
    }
  }
  if (!item && items.length > 0) {
    item = items[0];
  }
  if (!item) return;

  const modal = document.getElementById('itemDetailsModal');
  const content = document.getElementById('itemDetailsContent');
  if (!modal || !content) return;

  let conditionClass = 'condition-good';
  if (item.condition === 'Brand New') conditionClass = 'condition-brand-new';
  if (item.condition === 'Like New') conditionClass = 'condition-like-new';
  if (item.condition === 'Fair') conditionClass = 'condition-fair';

  let transactionClass = 'transaction-sell';
  let transactionLabel = 'FOR SALE';
  if (item.transaction === 'Borrow') {
    transactionClass = 'transaction-borrow';
    transactionLabel = 'AVAILABLE FOR BORROW';
  } else if (item.transaction === 'Exchange') {
    transactionClass = 'transaction-exchange';
    transactionLabel = 'OPEN TO EXCHANGE';
  }

  // Seller reviews list
  const sellerReviews = reviews.filter(r => r.sellerId === item.seller.studentId).slice(0, 3);

  // Status Action Buttons inside modal
  let primaryActionBtn = ``;
  const isOwner = currentUser && item.seller.studentId === currentUser.studentId;

  if (isOwner) {
    primaryActionBtn = `
      <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
        <span class="text-indigo-900 font-semibold"><i class="fa-solid fa-user-shield text-indigo-600 mr-1.5"></i>You own this listing</span>
        <button type="button" onclick="closeDetailsModal(); openDashboard('listings');" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Manage in Dashboard</button>
      </div>
    `;
  } else if (item.status === 'Requested') {
    primaryActionBtn = `
      <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
        <span class="font-semibold"><i class="fa-solid fa-clock text-amber-600 mr-1.5"></i>Request is currently pending owner review</span>
      </div>
    `;
  } else if (item.status === 'Borrowed' || item.status === 'In Exchange') {
    const remaining = item.borrowDetails ? getDaysRemaining(item.borrowDetails.dueDate) : { label: 'Borrowed' };
    primaryActionBtn = `
      <div class="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 flex items-center justify-between">
        <span><i class="fa-solid fa-arrows-spin text-purple-600 mr-1.5"></i>Currently borrowed by a classmate (${remaining.label})</span>
      </div>
    `;
  } else {
    // Available
    if (item.transaction === 'Borrow') {
      primaryActionBtn = `
        <button type="button" onclick="closeDetailsModal(); openRequestModal('${item.id}');" class="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-clock text-xs"></i>
          <span>Request to Borrow (${item.priceLabel})</span>
        </button>
      `;
    } else if (item.transaction === 'Exchange') {
      primaryActionBtn = `
        <button type="button" onclick="closeDetailsModal(); openRequestModal('${item.id}');" class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center justify-center gap-1.5 active:scale-95">
          <i class="fa-solid fa-arrows-rotate text-xs"></i>
          <span>Propose an Exchange</span>
        </button>
      `;
    } else {
      primaryActionBtn = `
        <div class="grid grid-cols-2 gap-2">
          <button type="button" onclick="openMakeOfferModal('${item.id}');" class="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/25 transition flex items-center justify-center gap-1.5 active:scale-95">
            <i class="fa-solid fa-tags text-xs"></i>
            <span>Make an Offer</span>
          </button>
          <button type="button" onclick="document.getElementById('studentChatInput')?.focus();" class="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95">
            <i class="fa-solid fa-comments text-xs"></i>
            <span>Message Seller</span>
          </button>
        </div>
      `;
    }
  }

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Left Column: Media & Specs -->
      <div>
        <div class="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 h-72 sm:h-80">
          <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover" />
          <div class="absolute top-3 left-3 flex flex-col gap-1 items-start">
            <span class="${transactionClass} px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow">
              ${transactionLabel}
            </span>
            <span class="status-pill ${item.status === 'Requested' ? 'status-requested' : (item.status === 'Borrowed' ? 'status-borrowed' : 'status-available')}">
              ${item.status || 'Available'}
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
        <div class="mt-4 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start space-x-3 text-xs text-blue-900">
          <i class="fa-solid fa-shield-halved text-blue-600 text-base mt-0.5"></i>
          <div>
            <p class="font-bold">NUB Campus Safe Exchange Policy</p>
            <p class="text-blue-800 text-[11px] mt-0.5">Meet at designated campus spots (Ashkona Central Library, Student Cafeteria). Inspect item condition before closing transactions.</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Details, Seller & Reviews -->
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span>${item.category}</span>
            <span>Posted ${item.postedAt || item.datePosted || 'Just now'} &bull; ${item.views || 45} views</span>
          </div>

          <h2 class="text-xl font-bold text-slate-900 leading-snug mb-3">${item.title}</h2>

          <!-- Price & Terms Highlight -->
          <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl mb-3">
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
          <div class="mb-3">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
            <p class="text-xs text-slate-700 leading-relaxed">${item.description}</p>
          </div>

          <!-- Pickup Location -->
          <div class="flex items-center text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 mb-3">
            <i class="fa-solid fa-location-dot text-indigo-600 text-sm mr-2.5"></i>
            <div>
              <span class="font-bold text-slate-800">NUB Meetup Spot:</span>
              <p class="text-slate-500">${item.location}</p>
            </div>
          </div>

          <!-- Seller Profile Card with Star Rating -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <img src="${item.seller.avatar}" class="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-200" alt="${item.seller.name}" />
              <div>
                <div class="flex items-center gap-1.5">
                  <h4 class="text-xs font-bold text-slate-900">${item.seller.name}</h4>
                  <span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                    <i class="fa-solid fa-check text-[8px]"></i>NUB Verified
                  </span>
                </div>
                <p class="text-[11px] text-slate-500">${item.seller.major}</p>
              </div>
            </div>
            <div class="text-right text-[11px]">
              <div class="text-amber-500 font-bold flex items-center justify-end">
                <i class="fa-solid fa-star text-xs mr-1"></i>${item.seller.rating || 5.0}
                <span class="text-slate-400 font-normal ml-1">(${item.seller.reviewsCount || 1} reviews)</span>
              </div>
              <span class="text-slate-400">${item.seller.responseTime || '< 15 mins'}</span>
            </div>
          </div>

          <!-- Recent Reviews Snippet -->
          ${sellerReviews.length > 0 ? `
            <div class="mb-3">
              <h4 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Recent Peer Reviews</span>
                <span class="text-amber-500 font-semibold">${item.seller.rating || 5.0} ★</span>
              </h4>
              <div class="space-y-1.5">
                ${sellerReviews.map(r => `
                  <div class="text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div class="flex items-center justify-between text-slate-600 font-medium">
                      <span>${r.reviewerName}</span>
                      <span class="text-amber-500 font-bold">${'★'.repeat(r.rating)}</span>
                    </div>
                    <p class="text-slate-500 italic mt-0.5">"${r.comment}"</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="pt-2 border-t border-slate-200 space-y-2">
          ${primaryActionBtn}

          <!-- Direct Chat Box -->
          <div class="flex gap-2">
            <input type="text" 
                   id="studentChatInput" 
                   placeholder="Hi ${item.seller.name.split(' ')[0]}, can we meet at ${item.location}?" 
                   value="Hi ${item.seller.name.split(' ')[0]}, is this item still available?" 
                   class="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" />
            <button type="button" 
                    id="sendCampusMessageBtn" 
                    class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1">
              <i class="fa-solid fa-paper-plane text-[10px]"></i>
              <span>Send</span>
            </button>
          </div>
          <p class="text-[10px] text-slate-400 text-center">Messages are routed to the student's official @nub.ac.bd address.</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('sendCampusMessageBtn')?.addEventListener('click', () => {
    if (!currentUser) {
      closeDetailsModal();
      openAuthModal('login', `Please sign in with your @nub.ac.bd account to message ${item.seller.name}.`);
      return;
    }

    const input = document.getElementById('studentChatInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      showToast('Please type a message first', 'warning');
      return;
    }

    showToast(`Message sent from ${currentUser.email} to ${item.seller.name}!`, 'success');
    setTimeout(closeDetailsModal, 1200);
  });

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
 * Post Item Form
 */
function closePostModal() {
  const modal = document.getElementById('postItemModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function openPostModal() {
  if (!currentUser) {
    pendingAuthAction = openPostModal;
    openAuthModal('login', 'Please sign in with your official @nub.ac.bd account to post an item.');
    return;
  }
  const postModal = document.getElementById('postItemModal');
  if (postModal) {
    updateAuthUI();
    const sellerInput = document.getElementById('postSellerName');
    if (sellerInput && currentUser) {
      sellerInput.value = `${currentUser.name} (${currentUser.studentId})`;
    }
    postModal.classList.remove('hidden');
    postModal.scrollTop = 0;
    document.body.classList.add('overflow-hidden');
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

  if (!currentUser) {
    closePostModal();
    openAuthModal('login', 'Please sign in with your @nub.ac.bd account to publish a listing.');
    return;
  }

  const title = document.getElementById('postTitle').value.trim();
  const category = document.getElementById('postCategory').value;
  const courseCode = document.getElementById('postCourse').value.trim() || 'General';
  const condition = document.querySelector('input[name="postCondition"]:checked')?.value || 'Good';
  const transaction = document.querySelector('input[name="postTransaction"]:checked')?.value || 'Sell';
  const location = document.getElementById('postLocation').value.trim() || 'NUB Central Library (Ashkona)';
  const description = document.getElementById('postDescription').value.trim();
  const imageUrl = currentUploadedImageDataUrl || document.getElementById('postImageUrl')?.value.trim() || PRESET_IMAGES[0].url;

  if (!title || !category || !description) {
    showToast({
      title: 'Missing Fields',
      message: 'Please fill out the required title, category, and description fields.',
      type: 'warning'
    });
    return;
  }

  let price = 0;
  let priceLabel = 'Free';
  let borrowTerms = null;
  let exchangeFor = null;

  if (transaction === 'Sell') {
    const rawPrice = parseFloat(document.getElementById('postPriceInput')?.value || 0);
    price = isNaN(rawPrice) ? 0 : rawPrice;
    priceLabel = `৳${price}`;
  } else if (transaction === 'Borrow') {
    const rawRate = document.getElementById('postBorrowRateInput')?.value.trim() || '৳50 / week';
    borrowTerms = document.getElementById('postBorrowTermsInput')?.value.trim() || 'Student ID card deposit';
    priceLabel = rawRate;
    price = 50;
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
    status: 'Available',
    price,
    priceLabel,
    originalPrice: null,
    exchangeFor,
    borrowTerms,
    image: imageUrl,
    description,
    location,
    seller: {
      name: currentUser.name,
      studentId: currentUser.studentId,
      avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      major: `${currentUser.department || 'NUB'} '26`,
      badge: 'NUB Verified Student',
      rating: 5.0,
      reviewsCount: 1,
      responseTime: '< 5 mins'
    },
    postedAt: 'Just now',
    featured: true,
    views: 1,
    activeRequest: null,
    borrowDetails: null
  };

  items.unshift(newItem);
  saveItemsToStorage();

  e.target.reset();
  currentUploadedImageDataUrl = null;
  const uploadStatus = document.getElementById('uploadedFileStatus');
  if (uploadStatus) uploadStatus.classList.add('hidden');
  updatePostImagePreview(PRESET_IMAGES[0].url, 'Textbook Preset', 'Default Photo');

  closePostModal();

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
  updateNotificationBadges();

  showToast({
    title: 'Listing published successfully! 🎉',
    message: `"${newItem.title}" (${newItem.courseCode}) is now live on CampusKart NUB!`,
    type: 'success',
    actionType: 'item_posted',
    icon: 'fa-solid fa-cloud-arrow-up'
  });

  // If Supabase is active, persist directly to Supabase cloud
  if (typeof isSupabaseActive !== 'undefined' && isSupabaseActive && supabaseClientInstance) {
    try {
      supabaseClientInstance.from('items').insert([{
        id: newItem.id,
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        course_code: newItem.courseCode,
        price: newItem.price,
        transaction_type: newItem.transaction,
        condition: newItem.condition,
        image_url: newItem.image,
        seller_id: currentUser.studentId,
        status: 'available',
        created_at: new Date().toISOString()
      }]).then(({ error }) => {
        if (error) console.warn('Supabase cloud insert note:', error);
      }).catch(err => console.warn('Supabase offline fallback:', err));
    } catch (e) {
      console.warn('Supabase insert skipped:', e);
    }
  }

  const grid = document.getElementById('itemsGrid');
  if (grid) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * =========================================================================
 * MODERN TOAST NOTIFICATION SYSTEM
 * =========================================================================
 * Renders floating, animated, glassmorphic toast notifications with action badges,
 * progress timer bars, and category styling.
 * Positioned: Top-center on mobile (< sm), Top-right on desktop (sm+)
 * 
 * Supports both:
 * - showToast('Message string', 'success')
 * - showToast({ title, message, type, actionType, icon, duration })
 */
function showToast(msgOrConfig, type = 'info', title = null, actionType = null) {
  let config = {};
  if (typeof msgOrConfig === 'object' && msgOrConfig !== null) {
    config = msgOrConfig;
  } else {
    config = {
      message: msgOrConfig || '',
      type: type || 'info',
      title: title,
      actionType: actionType
    };
  }

  const {
    message = '',
    type: toastType = 'info',
    title: customTitle = null,
    actionType: explicitAction = null,
    icon: customIcon = null,
    duration = 3800
  } = config;

  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-5 z-[3000] flex flex-col items-center sm:items-end gap-2.5 w-[92vw] max-w-sm sm:max-w-md pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  // Derive action category, icon, and title if not explicitly provided
  let categoryLabel = 'CAMPUS NOTICE';
  let toastTitle = customTitle;
  let toastIcon = customIcon;
  let themeClass = 'toast-info';

  const fullText = ((message || '') + ' ' + (toastTitle || '')).toLowerCase();

  if (explicitAction === 'item_posted' || fullText.includes('listing published') || fullText.includes('item posted') || fullText.includes('listing is live') || fullText.includes('listing live')) {
    categoryLabel = 'LISTING PUBLISHED';
    toastTitle = toastTitle || 'Listing published successfully! 🎉';
    toastIcon = toastIcon || 'fa-solid fa-cloud-arrow-up';
    themeClass = 'toast-success';
  } else if (explicitAction === 'offer_made' || fullText.includes('offer submitted') || fullText.includes('offer made') || fullText.includes('price offer') || fullText.includes('trade offer') || fullText.includes('exchange proposal')) {
    categoryLabel = 'OFFER SUBMITTED';
    toastTitle = toastTitle || 'Offer submitted to seller! 💬';
    toastIcon = toastIcon || 'fa-solid fa-comment-dollar';
    themeClass = 'toast-accent';
  } else if (explicitAction === 'request_sent' || fullText.includes('borrow request sent') || fullText.includes('borrow request') || fullText.includes('request sent') || fullText.includes('awaiting their approval')) {
    categoryLabel = 'BORROW REQUEST';
    toastTitle = toastTitle || 'Borrow request sent to owner! ⏳';
    toastIcon = toastIcon || 'fa-solid fa-hourglass-half';
    themeClass = 'toast-primary';
  } else if (explicitAction === 'status_updated' || fullText.includes('status updated to returned') || fullText.includes('marked as returned') || fullText.includes('borrow status updated') || fullText.includes('returned') || fullText.includes('request declined') || fullText.includes('relisted as available')) {
    categoryLabel = 'STATUS UPDATED';
    toastTitle = toastTitle || 'Status updated to Returned! ⭐';
    toastIcon = toastIcon || 'fa-solid fa-circle-check';
    themeClass = 'toast-status';
  } else if (toastType === 'success') {
    categoryLabel = 'ACTION SUCCESSFUL';
    toastTitle = toastTitle || 'Action Confirmed';
    toastIcon = toastIcon || 'fa-solid fa-circle-check';
    themeClass = 'toast-success';
  } else if (toastType === 'warning') {
    categoryLabel = 'ATTENTION';
    toastTitle = toastTitle || 'Campus Notice';
    toastIcon = toastIcon || 'fa-solid fa-triangle-exclamation';
    themeClass = 'toast-warning';
  } else if (toastType === 'error') {
    categoryLabel = 'ACTION FAILED';
    toastTitle = toastTitle || 'Error Occurred';
    toastIcon = toastIcon || 'fa-solid fa-circle-xmark';
    themeClass = 'toast-warning';
  } else {
    categoryLabel = 'CAMPUSKART';
    toastTitle = toastTitle || 'Notification';
    toastIcon = toastIcon || 'fa-solid fa-circle-info';
    themeClass = 'toast-info';
  }

  const toast = document.createElement('div');
  toast.className = `campuskart-toast ${themeClass} flex flex-col pointer-events-auto rounded-2xl backdrop-blur-md border shadow-xl p-3.5 relative overflow-hidden transition-all duration-300 w-full`;
  
  toast.innerHTML = `
    <div class="toast-progress-bar absolute top-0 left-0 right-0 h-1" style="animation-duration: ${duration}ms;"></div>
    <div class="flex items-start space-x-3 pt-0.5">
      <div class="toast-icon-box w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-xs">
        <i class="${toastIcon}"></i>
      </div>
      <div class="flex-1 min-w-0 pr-4">
        <div class="flex items-center gap-1.5 mb-0.5">
          <span class="toast-badge text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded font-mono">
            ${categoryLabel}
          </span>
          <span class="text-[10px] text-slate-400 font-medium">&bull; Just now</span>
        </div>
        <h5 class="text-xs font-bold text-slate-900 leading-tight mb-0.5 truncate">${toastTitle}</h5>
        <p class="text-[11px] text-slate-600 leading-snug">${message}</p>
      </div>
      <button type="button" class="toast-close-btn w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition absolute top-2.5 right-2.5" title="Dismiss notification">
        <i class="fa-solid fa-xmark text-xs"></i>
      </button>
    </div>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  let removed = false;
  const dismiss = () => {
    if (removed) return;
    removed = true;
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 280);
  };

  if (closeBtn) closeBtn.addEventListener('click', dismiss);

  toastContainer.prepend(toast);

  setTimeout(dismiss, duration);
}

// Replace native browser alert() popups with sleek animated toast notifications
if (typeof window !== 'undefined') {
  window.alert = function(msg) {
    showToast({
      title: 'Campus Notice',
      message: String(msg),
      type: 'info',
      icon: 'fa-solid fa-circle-info'
    });
  };
}

/**
 * CampusKart - Main Application Logic
 * Powers search, filtering, item rendering, posting new items, and interactions.
 * Features:
 * 1. Strict university email authentication (@nub.ac.bd) for Northern University Bangladesh.
 * 2. Peer Exchange and Borrow/Return State Machine workflow (Available -> Requested -> Borrowed/In Exchange -> Returned).
 * 3. User Transactions Dashboard with real-time due date countdowns.
 * 4. Seller and Peer Rating System with dynamic star averages.
 */

// Storage keys (v2 with authentic NUB student listings & peer workflow switch)
const STORAGE_ITEMS_KEY = 'campuskart_listings_v2';
const STORAGE_WISHLIST_KEY = 'campuskart_wishlist_v2';
const STORAGE_AUTH_KEY = 'campuskart_auth_session_v2';
const STORAGE_USERS_KEY = 'campuskart_registered_users_v2';
const STORAGE_REVIEWS_KEY = 'campuskart_reviews_v2';
const STORAGE_MESSAGES_KEY = 'campuskart_messages_v2';

// Pre-seeded peer chat messages between Ruma Akter and Rifat Hasan
const DEFAULT_CHAT_MESSAGES = [
  {
    id: 'msg-seed-1',
    itemId: 'ck-101',
    itemTitle: 'Casio fx-991MS Scientific Calculator',
    itemImage: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
    itemPrice: '৳650',
    itemCondition: 'Like New',
    sellerId: '202110045',
    sellerName: 'Rifat Hasan',
    buyerId: '202220015',
    buyerName: 'Ruma Akter',
    senderId: '202220015',
    senderName: 'Ruma Akter',
    receiverId: '202110045',
    receiverName: 'Rifat Hasan',
    text: 'Hi Rifat! Is your Casio fx-991MS calculator still available? Does it come with the original hard slide cover?',
    offerPrice: null,
    offerStatus: null,
    timestamp: Date.now() - 3600000 * 2, // 2 hrs ago
    readBy: ['202220015', '202110045']
  },
  {
    id: 'msg-seed-2',
    itemId: 'ck-101',
    itemTitle: 'Casio fx-991MS Scientific Calculator',
    itemImage: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
    itemPrice: '৳650',
    itemCondition: 'Like New',
    sellerId: '202110045',
    sellerName: 'Rifat Hasan',
    buyerId: '202220015',
    buyerName: 'Ruma Akter',
    senderId: '202110045',
    senderName: 'Rifat Hasan',
    receiverId: '202220015',
    receiverName: 'Ruma Akter',
    text: 'Yes Ruma! The slide cover is included, and I put in a fresh Maxell button cell battery last week. All 401 functions work perfectly.',
    offerPrice: null,
    offerStatus: null,
    timestamp: Date.now() - 3600000 * 1.5, // 1.5 hrs ago
    readBy: ['202110045', '202220015']
  },
  {
    id: 'msg-seed-3',
    itemId: 'ck-101',
    itemTitle: 'Casio fx-991MS Scientific Calculator',
    itemImage: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
    itemPrice: '৳650',
    itemCondition: 'Like New',
    sellerId: '202110045',
    sellerName: 'Rifat Hasan',
    buyerId: '202220015',
    buyerName: 'Ruma Akter',
    senderId: '202220015',
    senderName: 'Ruma Akter',
    receiverId: '202110045',
    receiverName: 'Rifat Hasan',
    text: 'Would you consider ৳580 if we meet today at the NUB Central Library 2nd floor?',
    offerPrice: 580,
    offerStatus: 'pending',
    timestamp: Date.now() - 1800000, // 30 mins ago
    readBy: ['202220015'] // unread for Rifat!
  }
];

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
let chatMessages = [];
let activeChatContext = null;
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
  { label: 'Textbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Calculator / Tech', url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80' },
  { label: 'Lab / STEM Kit', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dorm / Living', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80' },
  { label: 'Study Notes / Binder', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Headphones / Gear', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' }
];

// Initialize application on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  loadAuthData();
  loadData();
  initUI();
  populateDropdowns();
  bindEvents();
  bindAuthEvents();
  bindStateMachineEvents();
  bindChatEvents();
  bindSupabaseEvents();
  renderItems();
  updateWishlistCount();
  updateAuthUI();
  updateNotificationBadges();
  initHeroCarousel();
  initSupabaseSync();
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
            <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-indigo-600 transition-colors"></i>
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
                <span class="flex items-center gap-2"><i class="fa-solid fa-chart-line text-xs"></i> My Transactions</span>
                <span id="menuRequestBadge" class="hidden bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">0</span>
              </button>
              <button type="button" 
                      id="menuMessagesBtn" 
                      class="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-between transition">
                <span class="flex items-center gap-2"><i class="fa-regular fa-comments text-xs text-orange-500"></i> Messages & Offers</span>
                <span id="menuMessagesBadge" class="hidden bg-orange-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">0</span>
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
        openDashboard('requests');
      });

      document.getElementById('menuMessagesBtn')?.addEventListener('click', () => {
        menu?.classList.add('hidden');
        openNavbarMessages();
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
            <button type="button" onclick="openDashboard('requests')" class="py-1.5 px-2 bg-indigo-600 text-white rounded-xl text-xs font-bold text-center">
              Transactions
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
 * STUBBED DEMO FUNCTIONS (SAFEGUARD FOR REMOVED DEMO TOGGLES)
 * =========================================================================
 */
function updateDemoSwitcherUI() {}
function switchDemoUser() {}
function toggleStudentDemo() {}

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
    showToast('Please specify what item you are offering in trade.', 'warning');
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

  // Cloud sync to Supabase transactions table
  if (typeof SupabaseService !== 'undefined' && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    SupabaseService.createTransaction({
      id: `tx-${Date.now().toString().slice(-6)}`,
      itemId: item.id,
      borrowerId: currentUser.studentId,
      sellerId: item.seller.studentId,
      status: 'requested',
      borrowerName: currentUser.name,
      borrowerEmail: currentUser.email,
      borrowerDept: currentUser.department,
      durationRequested: item.transaction === 'Exchange' ? null : duration,
      offeredItem: item.transaction === 'Exchange' ? offeredItem : null,
      note: note
    }).then(res => {
      if (res && res.success) {
        console.log('Transaction synced to Supabase PostgreSQL:', res.data);
      }
    });
  }

  closeRequestModal();
  renderItems();
  updateNotificationBadges();

  showToast(`🎉 Request sent to ${item.seller.name}! Awaiting their approval in their dashboard.`, 'success');
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

  // Cloud sync to Supabase transactions & items
  if (typeof SupabaseService !== 'undefined' && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    SupabaseService.updateTransactionStatus(item.id, 'approved', {
      dueDate: finalDueDate,
      note: meetupNote
    });
  }

  closeApprovalModal();
  renderItems();
  renderDashboard();
  updateNotificationBadges();

  showToast(`✅ Approved! Status changed to ${nextStatus}. Return due date set to ${formatDate(finalDueDate)}.`, 'success');
}

function handleDeclineRequest(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  // Revert status to Available
  item.status = 'Available';
  item.activeRequest = null;

  saveItemsToStorage();

  // Cloud sync to Supabase
  if (typeof SupabaseService !== 'undefined' && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    SupabaseService.updateTransactionStatus(item.id, 'available');
  }

  renderItems();
  renderDashboard();
  updateNotificationBadges();

  showToast('Request declined. Item status reverted back to Available.', 'info');
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

  // Cloud sync to Supabase
  if (typeof SupabaseService !== 'undefined' && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    SupabaseService.updateTransactionStatus(item.id, 'returned');
  }

  renderItems();
  renderDashboard();
  updateNotificationBadges();

  showToast(`🎉 Item "${item.title}" successfully marked as returned! It is now available again on CampusKart.`, 'success');
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

  // Cloud sync to Supabase rating & review
  if (typeof SupabaseService !== 'undefined' && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    SupabaseService.saveRating(itemId, currentUser.studentId, rating, comment);
  }

  closeReviewModal();
  renderItems();
  renderDashboard();

  showToast(`⭐ Thank you! Your ${rating}-star review for ${item.seller.name} has been published.`, 'success');
}

/**
 * =========================================================================
 * USER TRANSACTIONS DASHBOARD
 * =========================================================================
 */

function openDashboard(defaultTab = 'requests') {
  if (!currentUser) {
    pendingAuthAction = () => openDashboard(defaultTab);
    openAuthModal('login', 'Please sign in with your @nub.ac.bd account to view your transactions dashboard.');
    return;
  }

  const modal = document.getElementById('dashboardModal');
  const userSub = document.getElementById('dashUserSub');
  if (!modal) return;

  if (userSub) {
    userSub.innerHTML = `Signed in as <strong>${currentUser.name}</strong> (ID: <span class="font-mono">${currentUser.studentId}</span>) &bull; ${currentUser.department || 'NUB'}`;
  }

  switchDashboardTab(defaultTab);
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
  const btnRequests = document.getElementById('dashTabRequestsBtn');
  const btnListings = document.getElementById('dashTabListingsBtn');
  const btnBorrowed = document.getElementById('dashTabBorrowedBtn');

  const panelRequests = document.getElementById('dashRequestsPanel');
  const panelListings = document.getElementById('dashListingsPanel');
  const panelBorrowed = document.getElementById('dashBorrowedPanel');

  [btnRequests, btnListings, btnBorrowed].forEach(b => {
    b?.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
    b?.classList.add('border-transparent', 'text-slate-600');
  });

  [panelRequests, panelListings, panelBorrowed].forEach(p => p?.classList.add('hidden'));

  if (tabName === 'requests') {
    btnRequests?.classList.add('active', 'border-indigo-600', 'text-indigo-600');
    btnRequests?.classList.remove('border-transparent', 'text-slate-600');
    panelRequests?.classList.remove('hidden');
  } else if (tabName === 'listings') {
    btnListings?.classList.add('active', 'border-indigo-600', 'text-indigo-600');
    btnListings?.classList.remove('border-transparent', 'text-slate-600');
    panelListings?.classList.remove('hidden');
  } else if (tabName === 'borrowed') {
    btnBorrowed?.classList.add('active', 'border-indigo-600', 'text-indigo-600');
    btnBorrowed?.classList.remove('border-transparent', 'text-slate-600');
    panelBorrowed?.classList.remove('hidden');
  }
}

function filterDashListings(status) {
  currentDashListingFilter = status;
  const btns = document.querySelectorAll('.dash-listing-filter');
  btns.forEach(b => {
    b.className = 'dash-listing-filter px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200';
  });

  const activeBtn = Array.from(btns).find(b => b.textContent.toLowerCase() === status.toLowerCase() || (status === 'Borrowed' && b.textContent.includes('Borrowed')));
  if (activeBtn) {
    activeBtn.className = 'dash-listing-filter px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-medium';
  }

  renderDashboardListingsPanel();
}

function renderDashboard() {
  if (!currentUser) return;

  // 1. Incoming requests
  const incoming = items.filter(it => it.seller.studentId === currentUser.studentId && it.status === 'Requested');
  const requestsPanel = document.getElementById('dashRequestsPanel');
  const requestsBadge = document.getElementById('dashRequestsCountBadge');

  if (requestsBadge) requestsBadge.textContent = incoming.length;

  if (requestsPanel) {
    if (incoming.length === 0) {
      requestsPanel.innerHTML = `
        <div class="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
          <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg">
            <i class="fa-solid fa-inbox"></i>
          </div>
          <h4 class="text-sm font-bold text-slate-800">No Pending Requests</h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">When classmates request to borrow or exchange your listings, they will appear here with instant approval controls.</p>
        </div>
      `;
    } else {
      requestsPanel.innerHTML = incoming.map(it => `
        <div class="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start space-x-3.5">
            <img src="${it.image}" alt="${it.title}" class="w-14 h-14 rounded-xl object-cover shrink-0 ring-1 ring-slate-200" />
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="status-pill status-requested"><i class="fa-solid fa-clock"></i> Request Pending</span>
                <span class="text-xs font-bold text-slate-400 font-mono">${it.courseCode}</span>
              </div>
              <h4 class="text-sm font-bold text-slate-900 leading-snug">${it.title}</h4>
              <div class="mt-1 text-xs text-slate-600 space-y-0.5">
                <p>From: <strong>${it.activeRequest?.requesterName}</strong> (Student ID: <span class="font-mono">${it.activeRequest?.requesterId}</span>)</p>
                ${it.activeRequest?.durationRequested ? `<p class="text-purple-700 font-semibold"><i class="fa-solid fa-calendar-days mr-1"></i>Requested duration: ${it.activeRequest.durationRequested}</p>` : ''}
                ${it.activeRequest?.offeredItem ? `<p class="text-sky-700 font-semibold"><i class="fa-solid fa-arrows-rotate mr-1"></i>Offered in trade: ${it.activeRequest.offeredItem}</p>` : ''}
                ${it.activeRequest?.note ? `<p class="italic text-slate-500 text-[11px] mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">"${it.activeRequest.note}"</p>` : ''}
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2 shrink-0 self-end md:self-center">
            <button type="button" onclick="handleDeclineRequest('${it.id}')" class="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold transition">
              Decline
            </button>
            <button type="button" onclick="openApprovalModal('${it.id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/30 transition flex items-center gap-1.5">
              <i class="fa-solid fa-check text-[11px]"></i>
              <span>Approve & Set Due Date</span>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // 2. My Listings Panel
  renderDashboardListingsPanel();

  // 3. Items I Borrowed Panel
  renderDashboardBorrowedPanel();

  updateNotificationBadges();
}

function renderDashboardListingsPanel() {
  if (!currentUser) return;
  const myListings = items.filter(it => it.seller.studentId === currentUser.studentId);
  const container = document.getElementById('dashListingsContainer');
  const countBadge = document.getElementById('dashListingsCountBadge');
  const summaryText = document.getElementById('dashListingsSummaryText');

  if (countBadge) countBadge.textContent = myListings.length;

  let filtered = myListings;
  if (currentDashListingFilter === 'Available') {
    filtered = myListings.filter(it => it.status === 'Available');
  } else if (currentDashListingFilter === 'Requested') {
    filtered = myListings.filter(it => it.status === 'Requested');
  } else if (currentDashListingFilter === 'Borrowed') {
    filtered = myListings.filter(it => it.status === 'Borrowed' || it.status === 'In Exchange');
  }

  if (summaryText) {
    summaryText.textContent = `Showing ${filtered.length} of ${myListings.length} items`;
  }

  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
        <p class="text-xs text-slate-500">No listings found for this filter. Post textbooks or equipment to share with NUB classmates!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(it => {
    let statusBadge = `<span class="status-pill status-available"><i class="fa-solid fa-circle-check text-[10px]"></i> Available</span>`;
    let actionArea = ``;

    if (it.status === 'Requested') {
      statusBadge = `<span class="status-pill status-requested"><i class="fa-solid fa-clock text-[10px]"></i> Action Needed</span>`;
      actionArea = `
        <button type="button" onclick="openApprovalModal('${it.id}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs">
          Review Request
        </button>
      `;
    } else if (it.status === 'Borrowed' || it.status === 'In Exchange') {
      const remaining = it.borrowDetails ? getDaysRemaining(it.borrowDetails.dueDate) : { label: 'Active', isUrgent: false };
      statusBadge = `
        <span class="status-pill status-borrowed"><i class="fa-solid fa-arrows-spin text-[10px]"></i> ${it.status}</span>
        <span class="text-[11px] px-2 py-0.5 rounded-full font-bold ${remaining.isUrgent ? 'countdown-urgent' : 'countdown-normal'}">
          ${remaining.label}
        </span>
      `;
      actionArea = `
        <button type="button" onclick="handleMarkAsReturned('${it.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1">
          <i class="fa-solid fa-check text-[10px]"></i>
          <span>Mark as Returned</span>
        </button>
      `;
    }

    return `
      <div class="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center space-x-3 min-w-0">
          <img src="${it.image}" alt="${it.title}" class="w-12 h-12 rounded-xl object-cover shrink-0 ring-1 ring-slate-200" />
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
              ${statusBadge}
              <span class="text-[11px] font-mono text-slate-400">${it.courseCode}</span>
            </div>
            <h4 class="text-xs font-bold text-slate-900 truncate">${it.title}</h4>
            <p class="text-[11px] text-slate-500">${it.priceLabel} &bull; ${it.category}</p>
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          ${actionArea}
          <button type="button" onclick="openDetailsModal('${it.id}')" class="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition">
            View
          </button>
        </div>
      </div>
    `;
  }).join('');
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
      <div class="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
        <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">No Borrowed Items</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">You haven't requested or borrowed any academic materials yet. Browse textbooks and lab kits on the marketplace!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = myBorrows.map(it => {
    let statusHtml = '';
    let actionHtml = '';

    if (it.status === 'Requested') {
      statusHtml = `
        <span class="status-pill status-requested"><i class="fa-solid fa-clock"></i> Awaiting Owner Approval</span>
      `;
      actionHtml = `
        <span class="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">Pending Review</span>
      `;
    } else if (it.borrowDetails?.returnStatus === 'Returned') {
      statusHtml = `
        <span class="status-pill status-completed"><i class="fa-solid fa-circle-check text-emerald-500"></i> Returned / Completed</span>
      `;
      if (!it.borrowDetails.isReviewed) {
        actionHtml = `
          <button type="button" onclick="openReviewModal('${it.id}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 animate-pulse">
            <i class="fa-solid fa-star text-[10px]"></i>
            <span>Rate Lender</span>
          </button>
        `;
      } else {
        actionHtml = `
          <span class="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
            <i class="fa-solid fa-star text-[10px]"></i> Rated
          </span>
        `;
      }
    } else if (it.status === 'Borrowed' || it.status === 'In Exchange') {
      const remaining = getDaysRemaining(it.borrowDetails.dueDate);
      statusHtml = `
        <span class="status-pill status-borrowed"><i class="fa-solid fa-handshake"></i> ${it.status}</span>
        <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${remaining.isUrgent ? 'countdown-urgent' : 'countdown-normal'}">
          ${remaining.label}
        </span>
      `;
      actionHtml = `
        <div class="text-right">
          <p class="text-[11px] text-slate-500">Due: <strong>${formatDate(it.borrowDetails.dueDate)}</strong></p>
          <span class="text-[10px] text-indigo-600">Return to: ${it.seller.name}</span>
        </div>
      `;
    }

    return `
      <div class="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-start space-x-3.5">
          <img src="${it.image}" alt="${it.title}" class="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200 shrink-0" />
          <div>
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              ${statusHtml}
            </div>
            <h4 class="text-sm font-bold text-slate-900">${it.title}</h4>
            <p class="text-xs text-slate-600 mt-0.5">
              Lender: <strong>${it.seller.name}</strong> (${it.seller.major})
              &bull; Meetup Spot: <span class="text-slate-500">${it.location}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2 shrink-0 self-end md:self-center">
          ${actionHtml}
          <button type="button" onclick="openDetailsModal('${it.id}')" class="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition">
            Details
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function updateNotificationBadges() {
  const navBadge = document.getElementById('navRequestsBadge');
  const menuBadge = document.getElementById('menuRequestBadge');
  const msgBadge = document.getElementById('navMessagesBadge');
  const menuMsgBadge = document.getElementById('menuMessagesBadge');

  if (!currentUser) {
    if (navBadge) navBadge.classList.add('hidden');
    if (menuBadge) menuBadge.classList.add('hidden');
    if (msgBadge) msgBadge.classList.add('hidden');
    if (menuMsgBadge) menuMsgBadge.classList.add('hidden');
    return;
  }

  const pendingRequests = items.filter(it => it.seller.studentId === currentUser.studentId && it.status === 'Requested');

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

  // Unread chat messages badge calculation
  const unreadMsgCount = getUnreadMessagesCount();

  if (msgBadge) {
    if (unreadMsgCount > 0) {
      msgBadge.textContent = unreadMsgCount;
      msgBadge.classList.remove('hidden');
    } else {
      msgBadge.classList.add('hidden');
    }
  }

  if (menuMsgBadge) {
    if (unreadMsgCount > 0) {
      menuMsgBadge.textContent = `${unreadMsgCount} new`;
      menuMsgBadge.classList.remove('hidden');
    } else {
      menuMsgBadge.classList.add('hidden');
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
  document.getElementById('navTransactionsBtn')?.addEventListener('click', () => openDashboard('requests'));
  document.getElementById('closeDashboardModal')?.addEventListener('click', closeDashboardModal);
  document.getElementById('dashPostShortcutBtn')?.addEventListener('click', () => {
    closeDashboardModal();
    openPostModal();
  });

  document.getElementById('dashTabRequestsBtn')?.addEventListener('click', () => switchDashboardTab('requests'));
  document.getElementById('dashTabListingsBtn')?.addEventListener('click', () => switchDashboardTab('listings'));
  document.getElementById('dashTabBorrowedBtn')?.addEventListener('click', () => switchDashboardTab('borrowed'));

  document.getElementById('closeRequestModal')?.addEventListener('click', closeRequestModal);
  document.getElementById('requestForm')?.addEventListener('submit', handleRequestFormSubmit);

  document.getElementById('closeApprovalModal')?.addEventListener('click', closeApprovalModal);
  document.getElementById('approvalForm')?.addEventListener('submit', handleApprovalFormSubmit);

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
  const requestModal = document.getElementById('requestModal');
  const approvalModal = document.getElementById('approvalModal');
  const reviewModal = document.getElementById('reviewModal');

  [dashboardModal, requestModal, approvalModal, reviewModal].forEach(m => {
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
    } else {
      items = [...INITIAL_ITEMS];
      saveItemsToStorage();
    }

    const savedWishlist = localStorage.getItem(STORAGE_WISHLIST_KEY);
    if (savedWishlist) {
      wishlist = new Set(JSON.parse(savedWishlist));
    }

    const savedReviews = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (savedReviews) {
      reviews = JSON.parse(savedReviews);
    } else {
      reviews = [...INITIAL_REVIEWS];
      saveReviewsToStorage();
    }

    const savedMessages = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (savedMessages) {
      chatMessages = JSON.parse(savedMessages);
    } else {
      chatMessages = [...DEFAULT_CHAT_MESSAGES];
      saveChatMessagesToStorage();
    }
  } catch (err) {
    console.error('Error reading localStorage', err);
    items = [...INITIAL_ITEMS];
    wishlist = new Set();
    reviews = [...INITIAL_REVIEWS];
    chatMessages = [...DEFAULT_CHAT_MESSAGES];
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

function saveChatMessagesToStorage() {
  try {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(chatMessages));
  } catch (e) {
    console.warn('Could not save chat messages to localStorage', e);
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
 * =========================================================================
 * HERO FEATURED ITEMS CAROUSEL (DARAZ-STYLE AUTO-SLIDER)
 * =========================================================================
 */
let currentHeroSlide = 0;
let heroCarouselTimer = null;
const HERO_SLIDE_INTERVAL = 3500; // 3.5 seconds

function handleHeaderSearch() {
  const input = document.getElementById('searchInput');
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
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeFilters.searchQuery = e.target.value.trim().toLowerCase();
      renderItems();
    });
  }

  const headerSearchForm = document.getElementById('headerSearchForm');
  if (headerSearchForm) {
    headerSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleHeaderSearch();
    });
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
  const filterCourse = document.getElementById('filterCourse');
  const filterCategory = document.getElementById('filterCategory');
  const filterCondition = document.getElementById('filterCondition');
  const sortBy = document.getElementById('sortBy');

  if (searchInput) searchInput.value = '';
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
      if (item.transaction.toLowerCase() !== activeFilters.transaction.toLowerCase()) {
        return false;
      }
    }

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
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
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
        <button type="button" 
                data-id="${item.id}" 
                data-action="view"
                class="card-action-btn px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1">
          <span>View</span>
          <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </button>
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
  const item = items.find(i => i.id === itemId);
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
        <button type="button" onclick="closeDetailsModal(); openRequestModal('${item.id}');" class="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-clock text-xs"></i>
          <span>Request to Borrow (${item.priceLabel})</span>
        </button>
      `;
    } else if (item.transaction === 'Exchange') {
      primaryActionBtn = `
        <button type="button" onclick="closeDetailsModal(); openRequestModal('${item.id}');" class="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center justify-center gap-1.5">
          <i class="fa-solid fa-arrows-rotate text-xs"></i>
          <span>Propose an Exchange</span>
        </button>
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
            <span>Posted ${item.postedAt} &bull; ${item.views || 45} views</span>
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

        <div class="pt-3 border-t border-slate-200 space-y-2">
          ${primaryActionBtn}

          ${isOwner ? `
            <button type="button" 
                    id="detailsOwnerChatsBtn"
                    onclick="closeDetailsModal(); openChatModal('${item.id}');"
                    class="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2 active:scale-98">
              <i class="fa-solid fa-comments text-xs text-orange-400"></i>
              <span>View Buyer Messages & Offers</span>
            </button>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" 
                      id="detailsChatWithSellerBtn"
                      onclick="closeDetailsModal(); openChatModal('${item.id}', 'message');" 
                      class="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 active:scale-98">
                <i class="fa-solid fa-comments text-xs"></i>
                <span>Chat with Seller</span>
              </button>
              <button type="button" 
                      id="detailsMakeOfferBtn"
                      onclick="closeDetailsModal(); openChatModal('${item.id}', 'offer');" 
                      class="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 active:scale-98">
                <i class="fa-solid fa-hand-holding-dollar text-xs"></i>
                <span>Make an Offer</span>
              </button>
            </div>
          `}
          <p class="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-shield-halved text-emerald-500 text-[11px]"></i>
            <span>Real-time in-app peer chat & price negotiation saved to localStorage</span>
          </p>
        </div>
      </div>
    </div>
  `;

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
    postModal.classList.remove('hidden');
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
  const imageUrl = document.getElementById('postImageUrl').value.trim() || PRESET_IMAGES[0].url;

  if (!title || !category || !description) {
    showToast('Please fill out the required title, category, and description fields.', 'warning');
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

  // Cloud persistence: Insert directly into Supabase PostgreSQL 'items' table
  if (typeof SupabaseService !== 'undefined' && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    SupabaseService.insertItem(newItem).then(res => {
      if (res && res.success) {
        showToast('🎉 Your listing is live on Supabase PostgreSQL & CampusKart!', 'success');
      } else {
        console.warn('Supabase insert note:', res?.error);
        showToast(`Saved to local cache (${res?.error || 'Cloud sync note'}).`, 'warning');
      }
    }).catch(err => {
      console.error('Supabase insert failed:', err);
      showToast('Saved to local storage (Offline fallback mode).', 'info');
    });
  } else {
    showToast('🎉 Your listing is live on CampusKart NUB!', 'success');
  }

  e.target.reset();
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

  showToast('🎉 Your listing is live on CampusKart NUB!', 'success');

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

/**
 * =========================================================================
 * CHAT WITH SELLER & MAKE OFFER SYSTEM (PEER MESSAGING ENGINE)
 * =========================================================================
 */

function getUnreadMessagesCount() {
  if (!currentUser) return 0;
  return chatMessages.filter(msg => 
    msg.receiverId === currentUser.studentId && 
    (!msg.readBy || !msg.readBy.includes(currentUser.studentId))
  ).length;
}

function openChatModal(itemId, initialMode = 'message', targetBuyerId = null) {
  if (!currentUser) {
    closeDetailsModal();
    openAuthModal('login', 'Please sign in with your official @nub.ac.bd account to chat with the seller or make an offer.');
    return;
  }

  const item = items.find(i => i.id === itemId);
  if (!item) {
    openNavbarMessages();
    return;
  }

  const isOwner = currentUser.studentId === item.seller.studentId;
  let peerId, peerName, peerAvatar, peerSub;
  let buyerId, buyerName;

  if (isOwner) {
    const itemMessages = chatMessages.filter(m => m.itemId === itemId);
    if (targetBuyerId) {
      buyerId = targetBuyerId;
      const refMsg = itemMessages.find(m => m.buyerId === targetBuyerId || m.senderId === targetBuyerId);
      buyerName = refMsg ? (refMsg.buyerId === targetBuyerId ? refMsg.buyerName : refMsg.senderName) : 'Interested Buyer';
    } else if (itemMessages.length > 0) {
      const latestMsg = itemMessages[itemMessages.length - 1];
      buyerId = latestMsg.buyerId || latestMsg.senderId;
      buyerName = latestMsg.buyerName || (latestMsg.senderId !== item.seller.studentId ? latestMsg.senderName : latestMsg.receiverName);
    } else {
      showToast('You own this listing. No buyer messages have been received yet.', 'info');
      return;
    }

    peerId = buyerId;
    peerName = buyerName;
    const peerUser = registeredUsers.find(u => u.studentId === peerId);
    peerAvatar = peerUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80';
    peerSub = `Buyer &bull; ID: ${peerId}`;
  } else {
    buyerId = currentUser.studentId;
    buyerName = currentUser.name;
    peerId = item.seller.studentId;
    peerName = item.seller.name;
    peerAvatar = item.seller.avatar;
    peerSub = `${item.seller.major || 'Seller'} &bull; ID: ${peerId}`;
  }

  activeChatContext = {
    itemId: item.id,
    itemTitle: item.title,
    itemImage: item.image,
    itemPrice: item.priceLabel,
    itemNumericPrice: typeof item.price === 'number' ? item.price : 500,
    itemCondition: item.condition,
    itemLocation: item.location,
    sellerId: item.seller.studentId,
    sellerName: item.seller.name,
    buyerId: buyerId,
    buyerName: buyerName,
    peerId: peerId,
    peerName: peerName,
    isOwner: isOwner
  };

  const peerAvatarEl = document.getElementById('chatPeerAvatar');
  const peerNameEl = document.getElementById('chatPeerName');
  const peerSubEl = document.getElementById('chatPeerSub');
  const itemThumbEl = document.getElementById('chatItemThumb');
  const itemTitleEl = document.getElementById('chatItemTitle');
  const itemPriceEl = document.getElementById('chatItemPrice');
  const itemConditionEl = document.getElementById('chatItemCondition');
  const offerAmountInput = document.getElementById('chatOfferAmountInput');
  const quickOfferPills = document.getElementById('chatQuickOfferPills');

  if (peerAvatarEl) peerAvatarEl.src = peerAvatar;
  if (peerNameEl) peerNameEl.textContent = peerName;
  if (peerSubEl) peerSubEl.innerHTML = peerSub;
  if (itemThumbEl) itemThumbEl.src = item.image;
  if (itemTitleEl) itemTitleEl.textContent = item.title;
  if (itemPriceEl) itemPriceEl.textContent = item.priceLabel;
  if (itemConditionEl) itemConditionEl.textContent = item.condition;

  const basePrice = typeof item.price === 'number' && item.price > 0 ? item.price : 500;
  if (offerAmountInput) {
    offerAmountInput.value = Math.round(basePrice * 0.9);
    offerAmountInput.placeholder = `e.g. ${Math.round(basePrice * 0.85)}`;
  }

  if (quickOfferPills) {
    const p10 = Math.round(basePrice * 0.9);
    const p15 = Math.round(basePrice * 0.85);
    const p20 = Math.round(basePrice * 0.8);
    quickOfferPills.innerHTML = `
      <button type="button" onclick="setOfferAmount(${p10})" class="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 font-bold transition">৳${p10} (-10%)</button>
      <button type="button" onclick="setOfferAmount(${p15})" class="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 font-bold transition">৳${p15} (-15%)</button>
      <button type="button" onclick="setOfferAmount(${p20})" class="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 font-bold transition">৳${p20} (-20%)</button>
    `;
  }

  const toggleOfferBtn = document.getElementById('chatToggleOfferBtn');
  const quickOfferToggle = document.getElementById('chatQuickOfferToggleBtn');
  if (toggleOfferBtn) toggleOfferBtn.style.display = isOwner ? 'none' : 'flex';
  if (quickOfferToggle) quickOfferToggle.style.display = isOwner ? 'none' : 'block';

  document.getElementById('chatThreadView')?.classList.remove('hidden');
  document.getElementById('chatConversationsListView')?.classList.add('hidden');
  document.getElementById('chatBackToListBtn')?.classList.add('hidden');
  document.getElementById('chatItemStrip')?.classList.remove('hidden');

  const drawer = document.getElementById('chatOfferDrawer');
  if (drawer) {
    if (initialMode === 'offer' && !isOwner) {
      drawer.classList.remove('hidden');
    } else {
      drawer.classList.add('hidden');
    }
  }

  renderCurrentChatThread();

  const modal = document.getElementById('chatModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function renderCurrentChatThread() {
  if (!activeChatContext) return;
  const listContainer = document.getElementById('chatMessagesList');
  if (!listContainer) return;

  const thread = chatMessages.filter(m => 
    m.itemId === activeChatContext.itemId && 
    (m.buyerId === activeChatContext.buyerId || (!m.buyerId && (m.senderId === activeChatContext.buyerId || m.receiverId === activeChatContext.buyerId)))
  );

  let markedAny = false;
  thread.forEach(msg => {
    if (msg.receiverId === currentUser.studentId) {
      if (!msg.readBy) msg.readBy = [];
      if (!msg.readBy.includes(currentUser.studentId)) {
        msg.readBy.push(currentUser.studentId);
        markedAny = true;
      }
    }
  });

  if (markedAny) {
    saveChatMessagesToStorage();
    updateNotificationBadges();
  }

  const icebreakersBar = document.getElementById('chatIcebreakersBar');
  if (icebreakersBar) {
    icebreakersBar.style.display = thread.length <= 2 ? 'flex' : 'none';
  }

  if (thread.length === 0) {
    listContainer.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
        <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 text-xl mb-3 shadow-xs">
          <i class="fa-solid fa-comments"></i>
        </div>
        <h4 class="text-xs font-bold text-slate-800 mb-1">Start chatting with ${activeChatContext.peerName}</h4>
        <p class="text-[11px] text-slate-500 max-w-xs mb-4">
          Ask questions about the ${activeChatContext.itemTitle}, coordinate a meetup on NUB campus, or propose a discounted offer price.
        </p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = thread.map(msg => {
    const isMe = msg.senderId === currentUser.studentId;
    const timeFormatted = formatRelativeTime(msg.timestamp);

    if (msg.offerPrice) {
      let statusPill = '';
      let actionButtons = '';

      if (msg.offerStatus === 'accepted') {
        statusPill = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><i class="fa-solid fa-check text-[9px]"></i> Offer Accepted</span>`;
      } else if (msg.offerStatus === 'declined') {
        statusPill = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700"><i class="fa-solid fa-xmark text-[9px]"></i> Offer Declined</span>`;
      } else {
        statusPill = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 chat-offer-badge-pulse"><i class="fa-solid fa-hourglass-half text-[9px]"></i> Offer Pending</span>`;
        if (msg.receiverId === currentUser.studentId) {
          actionButtons = `
            <div class="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center gap-2">
              <button type="button" onclick="handleAcceptOffer('${msg.id}')" class="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 active:scale-95">
                <i class="fa-solid fa-check text-[10px]"></i> Accept ৳${msg.offerPrice}
              </button>
              <button type="button" onclick="handleDeclineOffer('${msg.id}')" class="py-1 px-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition active:scale-95">
                Decline
              </button>
            </div>
          `;
        }
      }

      return `
        <div class="flex ${isMe ? 'justify-end' : 'justify-start'} w-full">
          <div class="chat-offer-card ${msg.offerStatus === 'accepted' ? 'accepted' : (msg.offerStatus === 'declined' ? 'declined' : '')} max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-xs border">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <i class="fa-solid fa-hand-holding-dollar text-amber-600"></i> Propose Offer
              </span>
              ${statusPill}
            </div>
            <div class="my-1 flex items-baseline gap-2">
              <span class="text-xl font-black text-amber-950">৳${msg.offerPrice}</span>
              <span class="text-[10px] text-slate-500 font-medium">List: ${msg.itemPrice || activeChatContext.itemPrice}</span>
            </div>
            ${msg.text ? `<p class="text-xs text-slate-700 mt-1 leading-snug">${escapeHtml(msg.text)}</p>` : ''}
            ${actionButtons}
            <div class="mt-1 text-[10px] text-slate-400 text-right">${timeFormatted} &bull; ${msg.senderName}</div>
          </div>
        </div>
      `;
    }

    if (isMe) {
      return `
        <div class="flex justify-end w-full">
          <div class="chat-bubble-outgoing max-w-[80%] px-3.5 py-2.5 text-xs shadow-xs leading-relaxed">
            <p>${escapeHtml(msg.text)}</p>
            <div class="mt-1 text-[9px] text-indigo-200 text-right flex items-center justify-end gap-1">
              <span>${timeFormatted}</span>
              <i class="fa-solid fa-check-double text-[8px] opacity-80"></i>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="flex justify-start items-start gap-2 max-w-[85%]">
          <div class="chat-bubble-incoming px-3.5 py-2.5 text-xs shadow-xs leading-relaxed border border-slate-200/90">
            <p class="font-bold text-[10px] text-indigo-700 mb-0.5">${msg.senderName}</p>
            <p class="text-slate-800">${escapeHtml(msg.text)}</p>
            <div class="mt-1 text-[9px] text-slate-400">${timeFormatted}</div>
          </div>
        </div>
      `;
    }
  }).join('');

  listContainer.scrollTop = listContainer.scrollHeight;
}

function handleSendChatMessage(customText = null, offerPrice = null) {
  if (!currentUser) return;
  if (!activeChatContext) return;

  const inputEl = document.getElementById('chatInputText');
  const text = customText !== null ? customText : (inputEl ? inputEl.value.trim() : '');

  if (!text && !offerPrice) {
    showToast('Please type a message or enter an offer amount.', 'warning');
    return;
  }

  const newMsg = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    itemId: activeChatContext.itemId,
    itemTitle: activeChatContext.itemTitle,
    itemImage: activeChatContext.itemImage,
    itemPrice: activeChatContext.itemPrice,
    itemCondition: activeChatContext.itemCondition,
    sellerId: activeChatContext.sellerId,
    sellerName: activeChatContext.sellerName,
    buyerId: activeChatContext.buyerId,
    buyerName: activeChatContext.buyerName,
    senderId: currentUser.studentId,
    senderName: currentUser.name,
    receiverId: activeChatContext.peerId,
    receiverName: activeChatContext.peerName,
    text: text,
    offerPrice: offerPrice ? Number(offerPrice) : null,
    offerStatus: offerPrice ? 'pending' : null,
    timestamp: Date.now(),
    readBy: [currentUser.studentId]
  };

  chatMessages.push(newMsg);
  saveChatMessagesToStorage();

  if (inputEl && customText === null) inputEl.value = '';

  document.getElementById('chatOfferDrawer')?.classList.add('hidden');

  renderCurrentChatThread();
  updateNotificationBadges();

  if (offerPrice) {
    showToast(`Proposed offer of ৳${offerPrice} sent to ${activeChatContext.peerName}! 🏷️`, 'success');
  } else {
    showToast('Message sent! 💬', 'info');
  }
}

function handleAcceptOffer(messageId) {
  const msg = chatMessages.find(m => m.id === messageId);
  if (!msg) return;

  msg.offerStatus = 'accepted';

  const replyMsg = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    itemId: msg.itemId,
    itemTitle: msg.itemTitle,
    itemImage: msg.itemImage,
    itemPrice: msg.itemPrice,
    itemCondition: msg.itemCondition,
    sellerId: msg.sellerId,
    sellerName: msg.sellerName,
    buyerId: msg.buyerId,
    buyerName: msg.buyerName,
    senderId: currentUser.studentId,
    senderName: currentUser.name,
    receiverId: msg.senderId,
    receiverName: msg.senderName,
    text: `✓ Offer of ৳${msg.offerPrice} accepted! Let's arrange a meetup at the campus library or student cafeteria to complete the exchange.`,
    offerPrice: null,
    offerStatus: null,
    timestamp: Date.now(),
    readBy: [currentUser.studentId]
  };

  chatMessages.push(replyMsg);
  saveChatMessagesToStorage();
  renderCurrentChatThread();
  showToast(`Accepted offer of ৳${msg.offerPrice}! 🤝`, 'success');
}

function handleDeclineOffer(messageId) {
  const msg = chatMessages.find(m => m.id === messageId);
  if (!msg) return;

  msg.offerStatus = 'declined';

  const replyMsg = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    itemId: msg.itemId,
    itemTitle: msg.itemTitle,
    itemImage: msg.itemImage,
    itemPrice: msg.itemPrice,
    itemCondition: msg.itemCondition,
    sellerId: msg.sellerId,
    sellerName: msg.sellerName,
    buyerId: msg.buyerId,
    buyerName: msg.buyerName,
    senderId: currentUser.studentId,
    senderName: currentUser.name,
    receiverId: msg.senderId,
    receiverName: msg.senderName,
    text: `Offer of ৳${msg.offerPrice} declined. Feel free to propose another offer or message to discuss terms.`,
    offerPrice: null,
    offerStatus: null,
    timestamp: Date.now(),
    readBy: [currentUser.studentId]
  };

  chatMessages.push(replyMsg);
  saveChatMessagesToStorage();
  renderCurrentChatThread();
  showToast('Offer declined.', 'info');
}

function openConversationsList() {
  if (!currentUser) {
    openAuthModal('login', 'Please sign in to view your messages.');
    return;
  }

  const threadView = document.getElementById('chatThreadView');
  const listView = document.getElementById('chatConversationsListView');
  const backBtn = document.getElementById('chatBackToListBtn');
  const itemStrip = document.getElementById('chatItemStrip');
  const peerNameEl = document.getElementById('chatPeerName');
  const peerSubEl = document.getElementById('chatPeerSub');
  const drawer = document.getElementById('chatOfferDrawer');

  if (threadView) threadView.classList.add('hidden');
  if (listView) listView.classList.remove('hidden');
  if (backBtn) backBtn.classList.add('hidden');
  if (itemStrip) itemStrip.classList.add('hidden');
  if (drawer) drawer.classList.add('hidden');
  if (peerNameEl) peerNameEl.textContent = 'My Messages & Offers';
  if (peerSubEl) peerSubEl.innerHTML = `${currentUser.name} &bull; ID: ${currentUser.studentId}`;

  const threadMap = new Map();
  chatMessages.forEach(msg => {
    const isParticipant = msg.sellerId === currentUser.studentId || 
                          msg.buyerId === currentUser.studentId || 
                          msg.senderId === currentUser.studentId || 
                          msg.receiverId === currentUser.studentId;
    if (!isParticipant) return;

    const bId = msg.buyerId || (msg.senderId !== msg.sellerId ? msg.senderId : msg.receiverId);
    const key = `${msg.itemId}_${bId}`;

    if (!threadMap.has(key)) {
      threadMap.set(key, []);
    }
    threadMap.get(key).push(msg);
  });

  if (threadMap.size === 0) {
    listView.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
        <div class="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 text-2xl mb-3 shadow-xs">
          <i class="fa-regular fa-comments"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800 mb-1">No messages yet</h4>
        <p class="text-xs text-slate-500 max-w-xs mb-4">
          Browse the marketplace, click on any item, and click "Chat with Seller" or "Make an Offer" to start a peer conversation!
        </p>
        <button type="button" onclick="closeChatModal();" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm">
          Browse Campus Listings
        </button>
      </div>
    `;
    return;
  }

  const threadsArray = Array.from(threadMap.entries()).map(([key, msgs]) => {
    const latest = msgs[msgs.length - 1];
    const unread = msgs.filter(m => m.receiverId === currentUser.studentId && (!m.readBy || !m.readBy.includes(currentUser.studentId))).length;
    const isOwner = currentUser.studentId === latest.sellerId;
    const peerName = isOwner ? (latest.buyerName || 'Buyer') : latest.sellerName;
    const bId = latest.buyerId || (latest.senderId !== latest.sellerId ? latest.senderId : latest.receiverId);
    return {
      key,
      itemId: latest.itemId,
      buyerId: bId,
      peerName,
      latestMsg: latest,
      unreadCount: unread,
      timestamp: latest.timestamp
    };
  });

  threadsArray.sort((a, b) => b.timestamp - a.timestamp);

  listView.innerHTML = threadsArray.map(t => {
    const item = items.find(i => i.id === t.itemId) || { title: t.latestMsg.itemTitle, image: t.latestMsg.itemImage, priceLabel: t.latestMsg.itemPrice };
    return `
      <div onclick="openChatModal('${t.itemId}', 'message', '${t.buyerId}')" 
           class="p-3 bg-white hover:bg-indigo-50/50 border border-slate-200/90 rounded-2xl transition cursor-pointer shadow-xs flex items-center justify-between gap-3 group">
        <div class="flex items-center space-x-3 min-w-0">
          <img src="${item.image}" alt="${item.title}" class="w-12 h-12 rounded-xl object-cover shrink-0 ring-1 ring-slate-200" />
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 mb-0.5">
              <span class="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">${t.peerName}</span>
              ${t.unreadCount > 0 ? `<span class="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>` : ''}
            </div>
            <p class="text-[11px] font-medium text-slate-600 truncate">${item.title}</p>
            <p class="text-[11px] text-slate-400 truncate mt-0.5">
              ${t.latestMsg.offerPrice ? `<span class="text-amber-600 font-bold">🏷️ Offer: ৳${t.latestMsg.offerPrice}</span> &bull; ` : ''}${escapeHtml(t.latestMsg.text || 'Offer proposed')}
            </p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="text-[10px] text-slate-400 block mb-1">${formatRelativeTime(t.timestamp)}</span>
          ${t.unreadCount > 0 ? `
            <span class="inline-flex px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-bold">
              ${t.unreadCount} new
            </span>
          ` : `
            <span class="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition"><i class="fa-solid fa-chevron-right"></i></span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function openNavbarMessages() {
  if (!currentUser) {
    openAuthModal('login', 'Please sign in with your @nub.ac.bd account to view messages and offers.');
    return;
  }

  const modal = document.getElementById('chatModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  openConversationsList();
}

function setOfferAmount(val) {
  const input = document.getElementById('chatOfferAmountInput');
  if (input) input.value = val;
}

function formatRelativeTime(ts) {
  if (!ts) return 'Just now';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function closeChatModal() {
  const modal = document.getElementById('chatModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function bindChatEvents() {
  document.getElementById('navMessagesBtn')?.addEventListener('click', openNavbarMessages);
  document.getElementById('closeChatModal')?.addEventListener('click', closeChatModal);

  document.getElementById('chatToggleOfferBtn')?.addEventListener('click', () => {
    document.getElementById('chatOfferDrawer')?.classList.toggle('hidden');
  });

  document.getElementById('chatQuickOfferToggleBtn')?.addEventListener('click', () => {
    document.getElementById('chatOfferDrawer')?.classList.toggle('hidden');
  });

  document.getElementById('closeOfferDrawerBtn')?.addEventListener('click', () => {
    document.getElementById('chatOfferDrawer')?.classList.add('hidden');
  });

  document.getElementById('chatSendOfferBtn')?.addEventListener('click', () => {
    const input = document.getElementById('chatOfferAmountInput');
    const amount = input ? input.value : null;
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid offer amount in ৳.', 'warning');
      return;
    }
    handleSendChatMessage(`I would like to propose an offer of ৳${amount} for this item.`, Number(amount));
  });

  document.getElementById('chatToggleAllConversationsBtn')?.addEventListener('click', () => {
    const listView = document.getElementById('chatConversationsListView');
    if (listView && !listView.classList.contains('hidden')) {
      if (activeChatContext) {
        document.getElementById('chatThreadView')?.classList.remove('hidden');
        listView.classList.add('hidden');
        document.getElementById('chatItemStrip')?.classList.remove('hidden');
        document.getElementById('chatPeerName').textContent = activeChatContext.peerName;
        document.getElementById('chatPeerSub').innerHTML = activeChatContext.isOwner ? `Buyer &bull; ID: ${activeChatContext.peerId}` : `${activeChatContext.peerName} &bull; ID: ${activeChatContext.peerId}`;
        renderCurrentChatThread();
      }
    } else {
      openConversationsList();
    }
  });

  document.getElementById('chatBackToListBtn')?.addEventListener('click', openConversationsList);

  document.querySelectorAll('.chat-quick-reply').forEach(btn => {
    btn.addEventListener('click', function() {
      const text = this.textContent.trim();
      const input = document.getElementById('chatInputText');
      if (input) {
        input.value = text;
        input.focus();
      }
    });
  });

  document.getElementById('chatModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'chatModal') {
      closeChatModal();
    }
  });
}

/**
 * =========================================================================
 * SUPABASE POSTGRESQL CLOUD BACKEND INTEGRATION
 * =========================================================================
 */

function openSupabaseModal() {
  const modal = document.getElementById('supabaseConfigModal');
  if (!modal) return;

  const urlInput = document.getElementById('supabaseProjectUrlInput');
  const keyInput = document.getElementById('supabaseAnonKeyInput');
  const alertEl = document.getElementById('supabaseFeedbackAlert');

  if (alertEl) {
    alertEl.classList.add('hidden');
    alertEl.innerHTML = '';
  }

  if (typeof getSupabaseConfig === 'function') {
    const config = getSupabaseConfig();
    if (urlInput) urlInput.value = config.url || '';
    if (keyInput) keyInput.value = config.anonKey || '';
  }

  updateSupabaseStatusUI();
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeSupabaseModal() {
  const modal = document.getElementById('supabaseConfigModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function updateSupabaseStatusUI() {
  const isCfg = typeof isSupabaseConfigured === 'function' && isSupabaseConfigured();
  const isConn = Boolean(window.supabaseBackendState?.isConnected);

  let state = 'fallback';
  let label = 'Cloud DB';

  if (isCfg && isConn) {
    state = 'live';
    label = 'Supabase Live';
  } else if (isCfg) {
    state = 'connecting';
    label = 'Supabase Configured';
  } else {
    state = 'fallback';
    label = 'Local Fallback';
  }

  updateSupabaseStatusBadge(state, label);
}

function updateSupabaseStatusBadge(status, text) {
  const dot = document.getElementById('supabaseStatusDot');
  const label = document.getElementById('supabaseStatusText');
  const modalDot = document.getElementById('modalStatusDot');
  const modalTitle = document.getElementById('modalStatusTitle');
  const modalDesc = document.getElementById('modalStatusDesc');

  if (dot) {
    dot.className = 'w-2 h-2 rounded-full shrink-0 transition-colors';
    if (status === 'live') {
      dot.className = 'w-2 h-2 rounded-full shrink-0 supabase-dot-live';
    } else if (status === 'connecting') {
      dot.className = 'w-2 h-2 rounded-full shrink-0 supabase-dot-connecting';
    } else if (status === 'error') {
      dot.className = 'w-2 h-2 rounded-full shrink-0 supabase-dot-error';
    } else {
      dot.className = 'w-2 h-2 rounded-full shrink-0 supabase-dot-fallback';
    }
  }

  if (label) {
    label.textContent = text || (status === 'live' ? 'Supabase Live' : 'Local Fallback');
  }

  if (modalDot && modalTitle && modalDesc) {
    modalDot.className = 'w-3 h-3 rounded-full shrink-0';
    if (status === 'live') {
      modalDot.className = 'w-3 h-3 rounded-full shrink-0 supabase-dot-live';
      modalTitle.textContent = '🟢 Connected to Supabase Cloud PostgreSQL';
      const cfg = typeof getSupabaseConfig === 'function' ? getSupabaseConfig() : { url: '' };
      modalDesc.textContent = `Live database active: ${cfg.url || 'Supabase'}`;
    } else if (status === 'connecting') {
      modalDot.className = 'w-3 h-3 rounded-full shrink-0 supabase-dot-connecting';
      modalTitle.textContent = 'Connecting to Supabase...';
      modalDesc.textContent = 'Testing connection and querying PostgreSQL tables...';
    } else if (status === 'error') {
      modalDot.className = 'w-3 h-3 rounded-full shrink-0 supabase-dot-error';
      modalTitle.textContent = '❌ Supabase Connection Issue';
      modalDesc.textContent = window.supabaseBackendState?.lastError || 'Could not connect. Check your credentials and RLS policies.';
    } else {
      modalDot.className = 'w-3 h-3 rounded-full shrink-0 supabase-dot-fallback';
      modalTitle.textContent = '⚡ Local Fallback Mode';
      modalDesc.textContent = 'Operating offline with localStorage & 10 authentic NUB sample items.';
    }
  }
}

function mapDbItemToFrontend(row, dbTransactions = []) {
  const itemTx = dbTransactions.filter(t => t.item_id === row.id);
  const activeReqTx = itemTx.find(t => t.status === 'requested');
  const approvedTx = itemTx.find(t => t.status === 'approved');

  const sellerId = row.seller_id;
  const knownUser = registeredUsers.find(u => u.studentId === sellerId);

  const sellerName = row.seller_name || knownUser?.name || 'Verified Student';
  const sellerAvatar = row.seller_avatar || knownUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
  const sellerMajor = row.seller_major || knownUser?.department || 'Computer Science & Engineering (CSE)';

  let status = 'Available';
  const rawStatus = (row.status || '').toLowerCase();
  if (rawStatus === 'borrowed') status = 'Borrowed';
  else if (rawStatus === 'in exchange') status = 'In Exchange';
  else if (rawStatus === 'requested') status = 'Requested';
  else if (rawStatus === 'sold') status = 'Sold';
  else status = 'Available';

  let activeRequest = null;
  if (activeReqTx) {
    status = 'Requested';
    activeRequest = {
      transactionId: activeReqTx.id,
      requesterId: activeReqTx.borrower_id,
      requesterName: activeReqTx.borrower_name || `Student #${activeReqTx.borrower_id}`,
      requesterEmail: activeReqTx.borrower_email || `${activeReqTx.borrower_id}@nub.ac.bd`,
      requesterDept: activeReqTx.borrower_dept || 'Computer Science & Engineering (CSE)',
      requestDate: activeReqTx.created_at,
      durationRequested: activeReqTx.duration_requested,
      offeredItem: activeReqTx.offered_item,
      note: activeReqTx.note
    };
  }

  let borrowDetails = null;
  if (approvedTx) {
    status = row.transaction_type === 'Exchange' ? 'In Exchange' : 'Borrowed';
    borrowDetails = {
      transactionId: approvedTx.id,
      borrowerId: approvedTx.borrower_id,
      borrowerName: approvedTx.borrower_name || `Student #${approvedTx.borrower_id}`,
      borrowerEmail: approvedTx.borrower_email || `${approvedTx.borrower_id}@nub.ac.bd`,
      borrowerDept: approvedTx.borrower_dept || 'Computer Science & Engineering (CSE)',
      approvedDate: approvedTx.created_at,
      dueDate: approvedTx.return_due_date,
      meetupNote: approvedTx.note,
      returnStatus: 'Active',
      isReviewed: Boolean(approvedTx.rating)
    };
  }

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    courseCode: row.course_code || 'General',
    condition: row.condition,
    transaction: row.transaction_type,
    status: status,
    price: Number(row.price) || 0,
    priceLabel: row.price_label || (row.transaction_type === 'Sell' ? `৳${row.price}` : (row.transaction_type === 'Exchange' ? 'Trade Only' : '৳50 / week')),
    originalPrice: null,
    exchangeFor: row.exchange_for || null,
    borrowTerms: row.borrow_terms || null,
    image: row.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    description: row.description || '',
    location: row.location || 'NUB Central Library 2nd Fl (Ashkona)',
    seller: {
      name: sellerName,
      studentId: sellerId,
      avatar: sellerAvatar,
      major: sellerMajor,
      badge: 'NUB Verified Student',
      rating: 5.0,
      reviewsCount: 1,
      responseTime: '< 5 mins'
    },
    postedAt: formatRelativeTime(new Date(row.created_at).getTime()),
    featured: Boolean(row.featured !== false),
    views: row.views || 1,
    activeRequest: activeRequest,
    borrowDetails: borrowDetails
  };
}

async function initSupabaseSync() {
  updateSupabaseStatusUI();

  if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
    updateSupabaseStatusBadge('connecting', 'Connecting...');
    try {
      const result = await SupabaseService.fetchItemsAndTransactions();
      if (result && result.items) {
        if (result.items.length > 0) {
          items = result.items.map(row => mapDbItemToFrontend(row, result.transactions || []));
          saveItemsToStorage();
          populateDropdowns();
          renderItems();
          renderHeroSlider();
          updateNotificationBadges();
          updateSupabaseStatusBadge('live', 'Supabase Live');
          console.log(`✅ Loaded ${items.length} items directly from Supabase Cloud PostgreSQL.`);
        } else {
          updateSupabaseStatusBadge('live', 'Supabase (Empty)');
        }
      } else {
        updateSupabaseStatusBadge('fallback', 'Local Fallback');
      }
    } catch (err) {
      console.warn('Supabase fetch failed, keeping local fallback:', err);
      updateSupabaseStatusBadge('error', 'Supabase Error');
    }
  } else {
    updateSupabaseStatusBadge('fallback', 'Local Fallback');
  }
}

function bindSupabaseEvents() {
  document.getElementById('navSupabaseStatusBtn')?.addEventListener('click', openSupabaseModal);
  document.getElementById('closeSupabaseModal')?.addEventListener('click', closeSupabaseModal);
  document.getElementById('supabaseCancelBtn')?.addEventListener('click', closeSupabaseModal);

  document.getElementById('supabaseConfigModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'supabaseConfigModal') {
      closeSupabaseModal();
    }
  });

  // Test Ping Button
  document.getElementById('supabaseQuickTestBtn')?.addEventListener('click', async () => {
    const url = document.getElementById('supabaseProjectUrlInput')?.value.trim();
    const key = document.getElementById('supabaseAnonKeyInput')?.value.trim();
    const alertEl = document.getElementById('supabaseFeedbackAlert');

    if (!url || !key) {
      if (alertEl) {
        alertEl.className = 'p-3 rounded-xl text-[11px] bg-amber-50 text-amber-800 border border-amber-200';
        alertEl.textContent = 'Please fill out both Project URL and Public Anon Key before testing.';
        alertEl.classList.remove('hidden');
      }
      return;
    }

    if (alertEl) {
      alertEl.className = 'p-3 rounded-xl text-[11px] bg-blue-50 text-blue-800 border border-blue-200';
      alertEl.textContent = 'Testing connection to Supabase PostgreSQL...';
      alertEl.classList.remove('hidden');
    }

    saveSupabaseCredentials(url, key);
    const res = await testSupabaseConnection();

    if (alertEl) {
      if (res.success) {
        alertEl.className = 'p-3 rounded-xl text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200';
        alertEl.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600"></i> ${res.message}`;
        updateSupabaseStatusBadge('live', 'Supabase Live');
      } else {
        alertEl.className = 'p-3 rounded-xl text-[11px] bg-rose-50 text-rose-800 border border-rose-200';
        alertEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-600"></i> ${res.message}`;
        updateSupabaseStatusBadge('error', 'Supabase Error');
      }
    }
  });

  // Save Credentials Button
  document.getElementById('supabaseSaveCredentialsBtn')?.addEventListener('click', async () => {
    const url = document.getElementById('supabaseProjectUrlInput')?.value.trim();
    const key = document.getElementById('supabaseAnonKeyInput')?.value.trim();

    if (!url || !key) {
      showToast('Please provide both Supabase URL and Anon Public Key.', 'warning');
      return;
    }

    saveSupabaseCredentials(url, key);
    showToast('Saved Supabase credentials! Connecting...', 'info');

    await initSupabaseSync();
    showToast('Connected to Supabase PostgreSQL backend!', 'success');
    closeSupabaseModal();
  });

  // Reset to Local Fallback
  document.getElementById('supabaseResetFallbackBtn')?.addEventListener('click', () => {
    resetSupabaseCredentials();
    const urlInput = document.getElementById('supabaseProjectUrlInput');
    const keyInput = document.getElementById('supabaseAnonKeyInput');
    if (urlInput) urlInput.value = '';
    if (keyInput) keyInput.value = '';

    const alertEl = document.getElementById('supabaseFeedbackAlert');
    if (alertEl) alertEl.classList.add('hidden');

    items = [...INITIAL_ITEMS];
    saveItemsToStorage();
    populateDropdowns();
    renderItems();
    updateNotificationBadges();
    updateSupabaseStatusBadge('fallback', 'Local Fallback');
    showToast('Reverted to Local Storage & Mock Data Fallback.', 'info');
  });

  // 1-Click Seed Sample Data to Cloud
  document.getElementById('supabaseSeedDataBtn')?.addEventListener('click', async () => {
    if (!isSupabaseConfigured()) {
      showToast('Please configure your Supabase URL & Anon Key first.', 'warning');
      return;
    }

    showToast('🚀 Seeding 10 university study items to Supabase PostgreSQL...', 'info');
    try {
      const res = await SupabaseService.seedSampleDataToCloud(INITIAL_ITEMS);
      if (res.success) {
        showToast(`🎉 Successfully seeded ${res.count} items into Supabase!`, 'success');
        await initSupabaseSync();
      }
    } catch (err) {
      console.error('Seed error:', err);
      showToast(`Seed failed: ${err.message}. Did you run schema.sql first?`, 'error');
    }
  });

  // Copy SQL Schema Notice Button
  document.getElementById('supabaseCopySchemaBtn')?.addEventListener('click', () => {
    const sqlNotice = `-- CampusKart schema.sql is located in the root repository.
-- Copy the contents of schema.sql and run it in the Supabase SQL Editor.`;
    navigator.clipboard?.writeText(sqlNotice).then(() => {
      showToast('📋 Notice copied! Open schema.sql in your editor to copy full SQL.', 'success');
    }).catch(() => {
      showToast('schema.sql file is ready in project root directory.', 'info');
    });
  });
}


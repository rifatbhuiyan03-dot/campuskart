/**
 * CampusKart - Supabase Client Configuration & Cloud Persistence Layer
 * Integrates Supabase PostgreSQL backend with public anon key.
 * Provides fallback mock data and offline resiliency when credentials are not set.
 */

// ============================================================================
// 1. DEFAULT SUPABASE CREDENTIALS
// ============================================================================
// You can enter your Supabase Project URL and public anon key below, OR configure
// them dynamically at runtime via the "Cloud DB" settings button in the navbar.
const DEFAULT_SUPABASE_URL = ""; // e.g. "https://xyzcompany.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY = ""; // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

const STORAGE_SUPABASE_URL_KEY = 'campuskart_supabase_url';
const STORAGE_SUPABASE_ANON_KEY = 'campuskart_supabase_anon_key';
const STORAGE_SUPABASE_MODE_KEY = 'campuskart_backend_mode'; // 'supabase' | 'fallback'

// Global Supabase client instance
let supabaseClient = null;
let supabaseBackendState = {
  isConfigured: false,
  isConnected: false,
  isLive: false,
  url: '',
  anonKey: '',
  lastError: null
};

/**
 * Get active Supabase configuration (prefers localStorage overrides, then defaults)
 */
function getSupabaseConfig() {
  const savedUrl = localStorage.getItem(STORAGE_SUPABASE_URL_KEY);
  const savedKey = localStorage.getItem(STORAGE_SUPABASE_ANON_KEY);

  const url = (savedUrl !== null && savedUrl !== undefined && savedUrl.trim() !== '') 
    ? savedUrl.trim() 
    : DEFAULT_SUPABASE_URL.trim();

  const anonKey = (savedKey !== null && savedKey !== undefined && savedKey.trim() !== '') 
    ? savedKey.trim() 
    : DEFAULT_SUPABASE_ANON_KEY.trim();

  return { url, anonKey };
}

/**
 * Validate whether Supabase URL & Anon Key are realistically configured
 */
function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  const isValidUrl = url && url.startsWith('https://') && url.includes('.supabase.co');
  const isValidKey = anonKey && anonKey.length > 20; // JWT format
  return Boolean(isValidUrl && isValidKey);
}

/**
 * Initialize or re-initialize the Supabase client
 */
function initSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  supabaseBackendState.url = url;
  supabaseBackendState.anonKey = anonKey;

  if (typeof window.supabase === 'undefined') {
    console.warn('Supabase JS library (CDN) not loaded yet.');
    supabaseBackendState.isConfigured = false;
    supabaseBackendState.isConnected = false;
    supabaseClient = null;
    return null;
  }

  if (isSupabaseConfigured()) {
    try {
      supabaseClient = window.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      supabaseBackendState.isConfigured = true;
      console.log('✅ Supabase client initialized with cloud URL:', url);
      return supabaseClient;
    } catch (err) {
      console.error('❌ Failed to initialize Supabase client:', err);
      supabaseBackendState.isConfigured = false;
      supabaseBackendState.lastError = err.message;
      supabaseClient = null;
      return null;
    }
  } else {
    supabaseBackendState.isConfigured = false;
    supabaseBackendState.isConnected = false;
    supabaseClient = null;
    return null;
  }
}

/**
 * Save new Supabase credentials and re-initialize
 */
function saveSupabaseCredentials(url, anonKey) {
  if (url) {
    localStorage.setItem(STORAGE_SUPABASE_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(STORAGE_SUPABASE_URL_KEY);
  }

  if (anonKey) {
    localStorage.setItem(STORAGE_SUPABASE_ANON_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_SUPABASE_ANON_KEY);
  }

  initSupabaseClient();
}

/**
 * Clear custom credentials and revert to defaults
 */
function resetSupabaseCredentials() {
  localStorage.removeItem(STORAGE_SUPABASE_URL_KEY);
  localStorage.removeItem(STORAGE_SUPABASE_ANON_KEY);
  initSupabaseClient();
}

/**
 * Test connectivity with the live Supabase database
 */
async function testSupabaseConnection() {
  if (!initSupabaseClient()) {
    return {
      success: false,
      message: 'Supabase credentials are not fully configured. Please provide a valid project URL and anon public key.'
    };
  }

  try {
    const { count, error } = await supabaseClient
      .from('items')
      .select('*', { count: 'exact', head: true });

    if (error) {
      supabaseBackendState.isConnected = false;
      supabaseBackendState.lastError = error.message;
      return {
        success: false,
        message: `Connection failed: ${error.message} (Hint: ensure 'items' table exists and RLS allows public select)`
      };
    }

    supabaseBackendState.isConnected = true;
    supabaseBackendState.isLive = true;
    supabaseBackendState.lastError = null;
    return {
      success: true,
      message: `Connected successfully! Found ${count !== null ? count : 0} items in 'items' table.`,
      count: count
    };
  } catch (err) {
    supabaseBackendState.isConnected = false;
    supabaseBackendState.lastError = err.message;
    return {
      success: false,
      message: `Network error reaching Supabase: ${err.message}`
    };
  }
}

// ============================================================================
// 2. SUPABASE POSTGRESQL CLOUD DATA SERVICE
// ============================================================================

const SupabaseService = {
  /**
   * Fetch all items and active transactions from Supabase
   */
  async fetchItemsAndTransactions() {
    if (!supabaseClient || !isSupabaseConfigured()) {
      return null;
    }

    try {
      // 1. Fetch items
      const { data: dbItems, error: itemsError } = await supabaseClient
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // 2. Fetch transactions
      let dbTransactions = [];
      try {
        const { data: txData, error: txError } = await supabaseClient
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });
        if (!txError && txData) {
          dbTransactions = txData;
        }
      } catch (txEx) {
        console.warn('Transactions table query failed:', txEx);
      }

      supabaseBackendState.isConnected = true;
      supabaseBackendState.isLive = true;

      return {
        items: dbItems || [],
        transactions: dbTransactions || []
      };
    } catch (err) {
      console.error('Error querying Supabase tables:', err);
      supabaseBackendState.isConnected = false;
      supabaseBackendState.lastError = err.message;
      return null;
    }
  },

  /**
   * Insert a new item directly into Supabase 'items' table
   */
  async insertItem(item) {
    if (!supabaseClient || !isSupabaseConfigured()) {
      return { success: false, mode: 'local', error: 'Supabase not configured' };
    }

    // Prepare row matching the exact schema requirements:
    // id, title, description, category, course_code, price, transaction_type, condition, image_url, seller_id, status, created_at
    const dbRow = {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      course_code: item.courseCode || 'General',
      price: Number(item.price) || 0,
      transaction_type: item.transaction,
      condition: item.condition,
      image_url: item.image,
      seller_id: item.seller?.studentId || item.sellerId || '202110045',
      status: (item.status || 'available').toLowerCase(),
      created_at: new Date().toISOString(),
      
      // Helper metadata for campus UX
      price_label: item.priceLabel || `৳${item.price}`,
      location: item.location || 'NUB Central Library (Ashkona)',
      exchange_for: item.exchangeFor || null,
      borrow_terms: item.borrowTerms || null,
      seller_name: item.seller?.name || 'Verified Student',
      seller_avatar: item.seller?.avatar || null,
      seller_major: item.seller?.major || 'NUB Student',
      featured: Boolean(item.featured !== false),
      views: item.views || 1
    };

    try {
      const { data, error } = await supabaseClient
        .from('items')
        .insert([dbRow])
        .select();

      if (error) throw error;

      return { success: true, mode: 'cloud', data: data?.[0] };
    } catch (err) {
      console.error('Supabase insertItem failed:', err);
      return { success: false, mode: 'local', error: err.message };
    }
  },

  /**
   * Insert a new transaction into Supabase 'transactions' table
   */
  async createTransaction(tx) {
    if (!supabaseClient || !isSupabaseConfigured()) {
      return { success: false, mode: 'local' };
    }

    // Prepare row matching the exact schema requirements:
    // id, item_id, borrower_id, seller_id, status, return_due_date, rating, review_text
    const dbRow = {
      id: tx.id || `tx-${Date.now().toString().slice(-6)}`,
      item_id: tx.itemId || tx.item_id,
      borrower_id: tx.borrowerId || tx.borrower_id,
      seller_id: tx.sellerId || tx.seller_id,
      status: (tx.status || 'requested').toLowerCase(),
      return_due_date: tx.returnDueDate || tx.return_due_date || null,
      rating: tx.rating || null,
      review_text: tx.reviewText || tx.review_text || null,
      created_at: new Date().toISOString(),

      // Helper metadata
      borrower_name: tx.borrowerName || null,
      borrower_email: tx.borrowerEmail || null,
      borrower_dept: tx.borrowerDept || null,
      duration_requested: tx.durationRequested || null,
      note: tx.note || null,
      offered_item: tx.offeredItem || null
    };

    try {
      const { data, error } = await supabaseClient
        .from('transactions')
        .insert([dbRow])
        .select();

      if (error) throw error;

      // Update item status in items table as well
      await supabaseClient
        .from('items')
        .update({ status: 'requested' })
        .eq('id', dbRow.item_id);

      return { success: true, mode: 'cloud', data: data?.[0] };
    } catch (err) {
      console.error('Supabase createTransaction failed:', err);
      return { success: false, mode: 'local', error: err.message };
    }
  },

  /**
   * Update transaction status (approved/returned/etc.) and set return due date
   */
  async updateTransactionStatus(itemId, newStatus, extra = {}) {
    if (!supabaseClient || !isSupabaseConfigured()) {
      return { success: false, mode: 'local' };
    }

    try {
      const updates = {
        status: newStatus.toLowerCase()
      };
      if (extra.dueDate) {
        updates.return_due_date = extra.dueDate;
      }
      if (extra.note) {
        updates.note = extra.note;
      }
      if (extra.rating) {
        updates.rating = extra.rating;
      }
      if (extra.reviewText) {
        updates.review_text = extra.reviewText;
      }

      const { data, error } = await supabaseClient
        .from('transactions')
        .update(updates)
        .eq('item_id', itemId);

      if (error) throw error;

      // Also sync items table status
      let itemDbStatus = 'available';
      if (newStatus === 'approved') itemDbStatus = 'borrowed';
      else if (newStatus === 'requested') itemDbStatus = 'requested';
      else if (newStatus === 'returned') itemDbStatus = 'available';

      await supabaseClient
        .from('items')
        .update({ status: itemDbStatus })
        .eq('id', itemId);

      return { success: true, mode: 'cloud', data };
    } catch (err) {
      console.error('Supabase updateTransactionStatus failed:', err);
      return { success: false, mode: 'local', error: err.message };
    }
  },

  /**
   * Save peer rating & review to transactions
   */
  async saveRating(itemId, reviewerId, rating, comment) {
    if (!supabaseClient || !isSupabaseConfigured()) {
      return { success: false, mode: 'local' };
    }

    try {
      const { data, error } = await supabaseClient
        .from('transactions')
        .update({
          rating: Number(rating),
          review_text: comment
        })
        .eq('item_id', itemId)
        .eq('borrower_id', reviewerId);

      if (error) throw error;
      return { success: true, mode: 'cloud', data };
    } catch (err) {
      console.error('Supabase saveRating failed:', err);
      return { success: false, mode: 'local', error: err.message };
    }
  },

  /**
   * 1-Click Seed Tool: Push all 10 realistic NUB items and initial transaction to Supabase
   */
  async seedSampleDataToCloud(sampleItems) {
    if (!supabaseClient || !isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured.');
    }

    const rows = sampleItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      course_code: item.courseCode || 'General',
      price: Number(item.price) || 0,
      transaction_type: item.transaction,
      condition: item.condition,
      image_url: item.image,
      seller_id: item.seller?.studentId || '202110045',
      status: (item.status || 'available').toLowerCase(),
      created_at: new Date().toISOString(),
      price_label: item.priceLabel,
      location: item.location,
      exchange_for: item.exchangeFor,
      borrow_terms: item.borrowTerms,
      seller_name: item.seller?.name,
      seller_avatar: item.seller?.avatar,
      seller_major: item.seller?.major,
      featured: Boolean(item.featured),
      views: item.views || 50
    }));

    // Upsert items
    const { error: itemsError } = await supabaseClient
      .from('items')
      .upsert(rows, { onConflict: 'id' });

    if (itemsError) throw itemsError;

    // Insert pre-seeded transaction for ck-103
    const seedTx = {
      id: 'tx-seed-101',
      item_id: 'ck-103',
      borrower_id: '202220015',
      seller_id: '202110045',
      status: 'requested',
      return_due_date: null,
      rating: null,
      review_text: null,
      created_at: new Date().toISOString(),
      borrower_name: 'Ruma Akter',
      borrower_email: 'ruma.cse@nub.ac.bd',
      borrower_dept: 'Computer Science & Engineering (CSE)',
      duration_requested: '14 Days (Two Weeks)',
      note: 'Hi Rifat brother! Need this TTL logic breadboard kit for my CSE 123 midterm lab experiment next Tuesday. Will handle with care!',
      offered_item: null
    };

    try {
      await supabaseClient
        .from('transactions')
        .upsert([seedTx], { onConflict: 'id' });
    } catch (e) {
      console.warn('Transaction seed notice:', e);
    }

    return { success: true, count: rows.length };
  }
};

// Initialize on script load
if (typeof window !== 'undefined') {
  window.SupabaseService = SupabaseService;
  window.initSupabaseClient = initSupabaseClient;
  window.isSupabaseConfigured = isSupabaseConfigured;
  window.testSupabaseConnection = testSupabaseConnection;
  window.saveSupabaseCredentials = saveSupabaseCredentials;
  window.resetSupabaseCredentials = resetSupabaseCredentials;
  
  // Try initializing if library already loaded
  if (typeof window.supabase !== 'undefined') {
    initSupabaseClient();
  }
}

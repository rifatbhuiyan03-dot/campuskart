# CampusKart - Northern University Bangladesh Marketplace

CampusKart is a responsive, student-centered campus marketplace web application built with **HTML5**, **Tailwind CSS**, and **Vanilla JavaScript**. Designed specifically for **Northern University Bangladesh (NUB)** students, it enables students to buy, sell, borrow, and trade course textbooks, scientific calculators, digital logic breadboard kits, and engineering drafting sets with peer safety and verification.

Featuring:
1. **Daraz-Style Prominent Search Bar & Clean Header**: Wide search bar with orange accent button, rounded corners, responsive mobile wrapping (logo on top with login/profile, search bar full-width below, zero horizontal scroll).
2. **Auto-Sliding Featured Items Hero Carousel**: Eye-catching sliding banner inspired by Daraz showcasing featured NUB campus items with badges ("Student Deal", "Available to Borrow", "Featured Exchange", "Lab Ready"), 3.5s auto-transitions, pause on hover, touch swipe support, and "View Item" CTA buttons.
3. **Official NUB Authentication**: Strictly restricted to `@nub.ac.bd` university emails with clean "Login" and "Sign Up" actions.
4. **Realistic NUB Academic Marketplace**: Populated with 10 authentic university study items with course codes, condition badges, and high-resolution academic photos.
5. **Authentic University Authentication**: Strict validation for official `@nub.ac.bd` domain emails, session persistence, and zero demo banner clutter.
6. **Peer Borrow & Exchange State Machine**: Full lifecycle tracking (`Available` ➔ `Requested` ➔ `Borrowed / In Exchange` ➔ `Returned`).
7. **Student Transactions Dashboard**: Dedicated hub for Incoming Requests, Active Listings, and Borrowed Items with real-time due date countdowns.
8. **Peer & Seller Rating System**: Interactive 5-star review engine with dynamic average calculations.
9. **Chat with Seller & Make Offer (Peer Negotiation)**: In-app real-time messaging modal with listing context strip, offer drawer (-10% / -15% / -20% quick pills), seller Accept/Decline actions with automated confirmation replies, and unread notification badge counters.
10. **Supabase PostgreSQL Cloud Backend**: Real cloud persistence using client-side `@supabase/supabase-js` via CDN and public anon keys. Live data synchronization across two core tables (`items` and `transactions`), direct cloud insertions on '+ Post an Item', state machine transaction updates, and resilient offline mock data fallback.

---

## 🛍️ Daraz-Inspired Modern Header & Hero Section

CampusKart features a redesigned, modern header and animated hero section modeled after major e-commerce platforms like Daraz:

1. **Clean Header (No Redundant Announcement Tickers)**:
   - The dark-blue top banner and redundant campus tags have been completely removed for a modern, distraction-free aesthetic.
   - The "NUB Campus Ashkona" badge has been removed from the main navbar for cleaner alignment.

2. **Prominent Wide Search Bar & Quick Actions**:
   - Wide, rounded search input with Daraz placeholder: `"Search for textbooks, calculators, lab gear, course codes..."`.
   - Vibrant orange/amber search action button with magnifying glass (`#headerSearchForm`).
   - Clean, modern **"Login"** and **"Sign Up"** buttons (or student profile dropdown with avatar when logged in).
   - High-contrast **"+ Post an Item"** action button positioned directly adjacent to authentication.
   - **Zero Horizontal Overflow on Mobile**: Flexbox wrapping ensures that on mobile screens, the logo sits on the top row alongside profile/actions, while the search bar expands full-width directly beneath it.

3. **Auto-Sliding Featured Items Banner / Hero Carousel**:
   - Sits prominently directly below the search bar.
   - Features 5 key campus essentials:
     - **Casio fx-991MS Calculator** &bull; `Student Deal • 53% Off` &bull; `MATH 101`
     - **Discrete Mathematics Textbook** &bull; `Available to Borrow` &bull; `CSE 103`
     - **Digital Logic Design Breadboard Kit** &bull; `Lab Ready` &bull; `CSE 123`
     - **Microprocessor 8086 Manual & Notes** &bull; `Featured Exchange` &bull; `CSE 221`
     - **Drafting T-Scale & Drawing Set** &bull; `Engineering Deal • 60% Off` &bull; `ME 101`
   - **Smooth Auto-Sliding**: Transitions automatically every 3.5 seconds with interactive pagination dots and chevron navigation arrows.
   - **Interactive Controls**: Auto-slide pauses when hovering over the banner and resumes on mouse leave.
   - **Touch / Swipe Gestures**: Seamlessly swipe left or right on mobile devices.
   - **Instant Action**: Each slide includes a direct **"View Item"** action button opening the item details modal with full owner, course, and condition information.

---

## 🎒 Realistic Study Items in the NUB Marketplace

| # | Item Title | Category | Course Code | Condition | Type | Price / Terms | Owner |
|---|---|---|---|---|---|---|---|
| 1 | **Casio fx-991MS Scientific Calculator** (2-Line Display, 401 Functions) | Tech & Electronics | `MATH 101` | Like New | **Sell** | **৳650** (MSRP ৳1,400) | Rifat Hasan |
| 2 | **Discrete Mathematics and Its Applications** (Rosen 7th Ed) | Textbooks | `CSE 103` | Good | **Borrow / Trade** | **৳30 / week** (Trade for Algorithms) | Ruma Akter |
| 3 | **Digital Logic Design Breadboard with IC 7408, 7432, 7404 Kit** | Lab & Engineering | `CSE 123` | Like New | **Borrow** | **৳50 / week** (*Pre-seeded request pending!*) | Rifat Hasan |
| 4 | **Microprocessor 8086 Manual & CSE 3rd Sem Lecture Notes** | Notes & Study Kits | `CSE 221` | Fair | **Exchange** | **Trade Only** (Looking for DBMS notes) | Ruma Akter |
| 5 | **Drafting T-Scale & Engineering Drawing Set** (with tube) | Lab & Engineering | `ME 101` | Good | **Sell** | **৳300** | Rifat Hasan |
| 6 | **Data Communications & Networking** (Forouzan 5th Ed) | Textbooks | `CSE 231` | Like New | **Sell** | **৳420** | Ruma Akter |
| 7 | **Introductory Circuit Analysis (Boylestad) + Digital Multimeter DT-830D** | Tech & Electronics | `EEE 101` | Brand New | **Borrow** | **৳45 / week** | Rifat Hasan |
| 8 | **Structured Programming with C (Balagurusamy 8th Ed) + Workbook** | Textbooks | `CSE 111` | Like New | **Sell** | **৳250** | Ruma Akter |
| 9 | **Casio fx-991EX ClassWiz Calculator** (High-Res Natural Display) | Tech & Electronics | `MATH 201` | Brand New | **Exchange** | **Trade Only** (Trade for Arduino kit) | Rifat Hasan |
| 10 | **Principles of Marketing** (Philip Kotler 17th Ed) | Textbooks | `BBA 201` | Good | **Borrow** | **৳30 / week** | Ruma Akter |

---

## 👥 Authentic NUB Student Accounts & Authentication

CampusKart features authentic university authentication without intrusive demo banners:

- **Pre-Seeded Test Student Accounts**:
  - **Rifat Hasan** (`rifat.cse@nub.ac.bd` &bull; ID: `202110045` &bull; Password: `campus123` &bull; CSE '25):
    - Owner of: *Casio fx-991MS*, *DLD Breadboard kit*, *Drafting T-Scale*, *Boylestad Circuit kit*, and *Casio fx-991EX ClassWiz*.
    - Has 1 pending incoming borrow request from Ruma awaiting approval.
  - **Ruma Akter** (`ruma.cse@nub.ac.bd` &bull; ID: `202220015` &bull; Password: `campus123` &bull; CSE '26):
    - Owner of: *Discrete Mathematics (CSE 103)*, *Microprocessor 8086 Manual (CSE 221)*, *Forouzan Networking (CSE 231)*, *C Programming (CSE 111)*, and *Principles of Marketing (BBA 201)*.
    - Active borrower requesting Rifat's DLD Breadboard kit for her midterm lab.

### How to Sign In:
- Click the **"Login"** button in the top navbar.
- Enter either student email (`rifat.cse@nub.ac.bd` or `ruma.cse@nub.ac.bd`) or Student ID (`202110045` or `202220015`) and password `campus123`.
- Or click **"Sign Up"** to register a new student account with an official `@nub.ac.bd` university email.

---

## 🔄 Borrow & Exchange State Machine Workflow

```
   [ Available ] 
         │ (Student submits request with duration or trade offer)
         ▼
   [ Requested ] 
         │
   ┌─────┴──────────────────┐
   ▼                        ▼
[ Decline ]          [ Approve & Set Due Date ]
 (Reverts to               │ (Owner sets 7d, 14d, 30d, or custom date)
  Available)               ▼
                     [ Borrowed / In Exchange ]
                           │
                           │ (Owner clicks "Mark as Returned")
                           ▼
                     [ Returned / Completed ]
                           │ (Borrower leaves 1-5 star review)
                           ▼
                     [ Available Again ]
```

### Complete Walkthrough Test:
1. **Sign In as Rifat (Item Owner)**:
   - Click **"Login"** and enter `202110045` with password `campus123`.
   - Notice the amber notification badge `1` on the **"Transactions"** shortcut (and profile menu).
   - Click **"Transactions"** (or use the profile avatar menu) to open the dashboard.
   - Under **"Incoming Requests"**, see the request from **Ruma Akter** for your *Digital Logic Design Breadboard with IC Kit*.
   - Click **"Approve & Set Due Date"**, select **"7 Days"**, and click **"Confirm Approval"**.
   - The item status updates to **`Borrowed`** with an active countdown!

2. **Sign In as Ruma (Borrower)**:
   - Click the Profile Avatar ➔ **"Sign Out"**.
   - Click **"Login"** and enter `202220015` with password `campus123`.
   - Open **"Transactions"** and navigate to the **"Items I Borrowed"** tab.
   - You will see the *DLD Breadboard kit* with a live return countdown (e.g. `Due in 7 days`).

3. **Request a Book from Ruma**:
   - While signed in as Rifat, find Ruma's listing: **"Discrete Mathematics and Its Applications (CSE 103)"**.
   - Click **"Borrow"** on the card, choose duration (e.g. `14 Days`), and submit.
   - The card status changes to **`Requested`**.
   - Sign in as **Ruma** and open her **Transactions Dashboard** ➔ Rifat's new request is waiting for her approval!

4. **Mark as Returned & Rate Seller**:
   - The item owner clicks **"Mark as Returned"** in the dashboard.
   - The borrower receives a **"Rate Lender ★"** button.
   - Leaving a 1–5 star rating dynamically updates the average rating badge on the lender's profile and item cards!

---

## 📊 User Transactions Dashboard ("My Transactions")

Accessible via the navbar shortcut button or student profile dropdown:
- **Incoming Requests Tab**: Review borrower name, student ID, requested duration, and campus meetup notes with 1-click **"Approve"** and **"Decline"** buttons.
- **My Listings Tab**: Real-time management of all items owned by the current student, filterable by `All`, `Available`, `Requested`, and `Borrowed`.
- **Items I Borrowed Tab**: Live return due-date countdowns, urgency pulses ($\le 2$ days), and completion review prompts.

---

## ⭐ Seller & Peer Rating System

- **Interactive 5-Star Engine**: Visual star selector with descriptive sentiments (*Outstanding*, *Great*, *Fair*).
- **Quick-Tag Pills**: `+ Punctual & Friendly`, `+ Item in great condition`, `+ Smooth return`, `+ Helpful classmate`.
- **Automatic Score Recalculation**: Stored in `localStorage` (`campuskart_reviews_v2`) and dynamically displayed on all cards and modals.

---

## 💬 Chat with Seller & Make Offer (Peer Negotiation)

CampusKart includes an in-app student chat and peer price negotiation engine directly integrated into item details pages and the main navigation:

### 1. Feature Highlights:
- **Lightweight Chat Modal (`#chatModal`)**:
  - Displays peer avatar, active status indicator, student name, and university ID.
  - **Listing Context Strip**: Sticky banner showing item thumbnail, title, listed price, condition badge, and a toggle button to open the offer drawer.
  - **Collapsible Offer Drawer**: Propose a custom counter-offer in ৳ or pick one-click percentage discount pills (`-10%`, `-15%`, `-20%`).
  - **Interactive Icebreakers**: Quick student conversation starters (`"Is this item still available?"`, `"Can we meet at the campus library?"`, `"Are notes/accessories included?"`).
  - **Offer State Machine**:
    - Buyer proposes an offer ➔ Card renders with pulsing amber badge `Offer Pending`.
    - Seller sees prominent **"Accept ৳XXX"** and **"Decline"** buttons right inside the chat thread.
    - Accepting automatically switches offer status to `Offer Accepted` (emerald badge) and sends an automated meetup confirmation message.
    - Declining updates status to `Offer Declined` (neutral gray badge) and invites further discussion.
- **Unread Badge & Multi-Thread View**:
  - Live orange notification badges on navbar (`#navMessagesBadge`) and student profile dropdown (`#menuMessagesBadge`).
  - **"My Chats" / Conversation List**: View all active peer chats grouped by listing and buyer, with latest message previews, relative timestamps (`Just now`, `5m ago`), and unread indicator dots.
  - Data is cleanly persisted in `localStorage` (`campuskart_messages_v2`).

### 2. Peer Negotiation Workflow:
```
   [ Buyer Views Listing Details ]
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
[ Chat with Seller ]  [ Make an Offer ]
(Opens peer thread)   (Opens offer drawer with quick -10%/-15%/-20% pills)
      │                     │
      └──────────┬──────────┘
                 ▼
     [ Send Message / Propose Offer ]
                 │
                 ▼
   [ Stored in localStorage & Unread Badge Alert ]
                 │
                 ▼
        [ Seller Views Thread ]
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [ Accept Offer ]  [ Decline Offer ]
    (Sets status to   (Sets status to
     Accepted & auto-  Declined & prompts
     posts meetup)     counter discussion)
```

### 3. Step-by-Step Test Walkthrough:
1. **Sign in as Rifat Hasan** (`202110045` / `campus123`):
   - Notice the orange notification badge `1` on the Messages button in the navbar.
   - Click the Messages button or open Casio fx-991MS details ➔ click **"View Buyer Messages & Offers"**.
   - See the incoming offer of **৳580** from **Ruma Akter** with the pulsing amber `Offer Pending` badge.
   - Click **"Accept ৳580"**: The offer badge changes to emerald `Offer Accepted`, and an automated meetup message is sent!
   - Notice the unread message badge in the navbar clears to 0.

2. **Sign in as Ruma Akter** (`202220015` / `campus123`):
   - Switch accounts by signing out and logging in as Ruma.
   - Open Rifat's **"Digital Logic Design Breadboard Kit"** (or click any item).
   - Click **"Make an Offer"**: The offer drawer opens automatically.
   - Click the **"-10%"** or **"-15%"** pill, or enter a custom amount (e.g. `450`), and click **"Send Offer"**.
   - The offer card is immediately added to the thread and saved in `localStorage`.
   - Click **"My Chats"** to switch between conversations across different campus items.

---

## 🔐 University Authentication (`@nub.ac.bd`)

- **Strict University Domain**: All registrations must end with `@nub.ac.bd`.
- **Live Input Validation**: Instant visual feedback (green checkmark for `@nub.ac.bd`, red warning otherwise).
- **Automatic State Management**: Navigation controls, post item author details, and transaction ownership update dynamically with active session.

---

## 🐘 Supabase PostgreSQL Backend & Cloud Persistence

CampusKart connects directly to a **Supabase PostgreSQL** cloud database using client-side `@supabase/supabase-js` (loaded via CDN) and public anon keys protected by PostgreSQL **Row Level Security (RLS)**.

### 1. Database Architecture & Core Tables:

```
┌──────────────────────────────────────┐       ┌─────────────────────────────────────────┐
│              items                   │       │              transactions               │
├──────────────────────────────────────┤       ├─────────────────────────────────────────┤
│ id                 TEXT PRIMARY KEY  │◄──────│ id                 TEXT PRIMARY KEY     │
│ title              TEXT NOT NULL     │       │ item_id            TEXT REFERENCES items│
│ description        TEXT              │       │ borrower_id        TEXT NOT NULL        │
│ category           TEXT NOT NULL     │       │ seller_id          TEXT NOT NULL        │
│ course_code        TEXT              │       │ status             TEXT (req/appr/ret)  │
│ price              NUMERIC           │       │ return_due_date    TIMESTAMPTZ          │
│ transaction_type   TEXT (Sell/Borrow)│       │ rating             INTEGER (1-5)        │
│ condition          TEXT              │       │ review_text        TEXT                 │
│ image_url          TEXT              │       │ created_at         TIMESTAMPTZ          │
│ seller_id          TEXT NOT NULL     │       │ borrower_name      TEXT                 │
│ status             TEXT              │       │ duration_requested TEXT                 │
│ created_at         TIMESTAMPTZ       │       │ note               TEXT                 │
└──────────────────────────────────────┘       └─────────────────────────────────────────┘
```

1. **`items` Table**:
   - `id`: Unique identifier (e.g. `ck-101`, `ck-102`).
   - `title`: Item title (e.g. Casio fx-991MS Scientific Calculator).
   - `description`: Detailed academic & condition description.
   - `category`: Category name (`Tech & Electronics`, `Textbooks`, `Lab & Engineering`, `Notes & Study Kits`).
   - `course_code`: NUB course code (`MATH 101`, `CSE 103`, `CSE 123`, `CSE 221`, `ME 101`, etc.).
   - `price`: Numeric price in BDT (৳).
   - `transaction_type`: `Sell`, `Borrow`, or `Exchange`.
   - `condition`: `Brand New`, `Like New`, `Good`, `Fair`.
   - `image_url`: High-resolution academic placeholder image URL.
   - `seller_id`: University Student ID of the owner (`202110045`, `202220015`).
   - `status`: `available`, `borrowed`, `requested`, `sold`.
   - `created_at`: Timestamp with timezone.

2. **`transactions` Table**:
   - `id`: Transaction identifier (`tx-seed-101`, `tx-...`).
   - `item_id`: Foreign key referencing `items(id)`.
   - `borrower_id`: University Student ID of borrower / requester.
   - `seller_id`: University Student ID of lender / item owner.
   - `status`: State machine status (`requested`, `approved`, `returned`).
   - `return_due_date`: Expected return timestamp set by the owner during approval.
   - `rating`: 1 to 5 star rating left by the borrower after return.
   - `review_text`: Feedback comment left by the borrower.
   - `created_at`: Request timestamp.

---

### 2. How to Set Up Your Supabase Cloud Database:

1. **Create a Supabase Project**:
   - Go to [Supabase](https://supabase.com) and create a free project.
2. **Execute the SQL Schema**:
   - Open the **SQL Editor** from your project sidebar.
   - Copy the contents of [`schema.sql`](file:///c:/Users/rifat/OneDrive/Desktop/Software%20Devlopment%20Project/schema.sql).
   - Paste into the query window and click **Run**.
   - This creates both tables, enables Row Level Security (RLS) with public demo policies, and pre-seeds all 10 realistic NUB study items!
3. **Connect in CampusKart**:
   - Click the **"Cloud DB"** status button in the top navbar (`#navSupabaseStatusBtn`).
   - Paste your **Project URL** (`https://<project-ref>.supabase.co`) and **Anon Public Key**.
   - Click **"Test Ping"** to verify connection, then click **"Save & Connect"**.
   - The indicator dot will pulse green (`🟢 Supabase Live`), and listings will load directly from your cloud database!

---

### 3. Dynamic Cloud Sync & Offline Fallback:

- **Dynamic Fetch on Page Load**: When configured, listings and active transactions are fetched directly from PostgreSQL (`items` and `transactions`).
- **Direct Cloud Post**: Submitting the **"+ Post an Item"** form writes immediately to the Supabase `items` table via `supabaseClient.from('items').insert([...])`.
- **Peer State Machine Sync**: Requesting to borrow/trade inserts into `transactions`; owner approvals and returns automatically update status and return due dates in PostgreSQL.
- **Graceful Fallback Mode**: If no Supabase credentials are configured or if the device is offline, CampusKart seamlessly switches to **Local Fallback Mode** (`localStorage` & pre-seeded NUB sample items) with no broken UI or errors.
- **1-Click Cloud Seeding**: Inside the Cloud DB settings modal, click **"🚀 1-Click Seed to Supabase"** to instantly push all 10 authentic items into your live database.

---

## 📁 Project Structure

```
Software Devlopment Project/
├── index.html              # Modern Daraz-style UI with Tailwind CSS & interactive modals
├── schema.sql              # Ready-to-run PostgreSQL schema with RLS policies & sample data
├── css/
│   └── custom.css          # Badges, chat bubbles, offer cards, live status pulses & styling
├── js/
│   ├── supabase-config.js  # Supabase client setup, test ping, data service & cloud syncing
│   ├── data.js             # 10 realistic NUB study items, course codes & pre-seeded profiles
│   └── app.js              # State machine, chat & offer engine, cloud CRUD & dashboard
└── README.md               # Documentation and setup guide
```

---

## 🚀 How to Launch the Application

Double-click `index.html` or run the following command in PowerShell:

```powershell
Start-Process "index.html"
```

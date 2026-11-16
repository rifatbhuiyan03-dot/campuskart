# CampusKart - Northern University Bangladesh Marketplace

CampusKart is a responsive, student-centered campus marketplace web application built with **HTML5**, **Tailwind CSS**, and **Vanilla JavaScript**. Designed specifically for **Northern University Bangladesh (NUB)** students, it enables students to buy, sell, borrow, and trade course textbooks, scientific calculators, digital logic breadboard kits, and engineering drafting sets with peer safety and verification.

Featuring:
1. **Official NUB Authentication**: Strictly restricted to `@nub.ac.bd` university emails.
2. **Realistic NUB Academic Marketplace**: Populated with 10 authentic university study items with course codes, condition badges, and high-resolution academic photos.
3. **1-Click Student Demo Switcher**: Instant switching between **Rifat Hasan** (`202110045`) and **Ruma Akter** (`202220015`) to test the complete peer borrow and exchange lifecycle.
4. **Peer Borrow & Exchange State Machine**: Full lifecycle tracking (`Available` ➔ `Requested` ➔ `Borrowed / In Exchange` ➔ `Returned`).
5. **Student Transactions Dashboard**: Dedicated hub for Incoming Requests, Active Listings, and Borrowed Items with real-time due date countdowns.
6. **Peer & Seller Rating System**: Interactive 5-star review engine with dynamic average calculations.

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

## 👥 Student Demo Switcher ('Rifat' & 'Ruma')

CampusKart includes a persistent **Peer Demo Testing Bar** at the top of every page and a **Floating Quick-Switcher Pill** at the bottom-left:

- **Rifat Hasan** (`rifat.cse@nub.ac.bd` &bull; ID: `202110045` &bull; CSE '25):
  - Owner of: *Casio fx-991MS*, *DLD Breadboard kit*, *Drafting T-Scale*, *Boylestad Circuit kit*, and *Casio fx-991EX ClassWiz*.
  - Has 1 pending incoming borrow request from Ruma awaiting approval.
- **Ruma Akter** (`ruma.cse@nub.ac.bd` &bull; ID: `202220015` &bull; CSE '26):
  - Owner of: *Discrete Mathematics (CSE 103)*, *Microprocessor 8086 Manual (CSE 221)*, *Forouzan Networking (CSE 231)*, *C Programming (CSE 111)*, and *Principles of Marketing (BBA 201)*.
  - Active borrower requesting Rifat's DLD Breadboard kit for her midterm lab.

### How to Switch:
- Click **"Rifat Hasan"** or **"Ruma Akter"** directly in the top demo banner or bottom-left floating pill.
- Click **"Toggle Student"** (`🔀`) to instantly toggle back and forth.
- In the **Sign In modal**, click either **"Rifat (202110045)"** or **"Ruma (202220015)"** for 1-click authentication.

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
1. **View Pre-Seeded Incoming Request (as Rifat)**:
   - On page load, you are already signed in as **Rifat Hasan**.
   - Notice the amber notification badge `1` on the **"Transactions"** button in the navbar.
   - Click **"Transactions"** (or use the profile menu) to open the dashboard.
   - Under **"Incoming Requests"**, see the request from **Ruma Akter** for your *Digital Logic Design Breadboard with IC Kit*.
   - Click **"Approve & Set Due Date"**, select **"7 Days"** (or a custom date), and click **"Confirm Approval"**.
   - The item status updates to **`Borrowed`** with an active countdown!

2. **Switch to Ruma (as Borrower)**:
   - Click the **"Ruma Akter"** button in the demo switcher bar or floating pill.
   - Notice your active student profile updates to **Ruma Akter (202220015)**.
   - Open **"Transactions"** and navigate to the **"Items I Borrowed"** tab.
   - You will see the *DLD Breadboard kit* with a live return countdown (e.g. `Due in 7 days`).

3. **Request a Book from Ruma (as Rifat)**:
   - Switch back to **Rifat Hasan**.
   - In the marketplace, find Ruma's listing: **"Discrete Mathematics and Its Applications (CSE 103)"**.
   - Click **"Borrow"** on the card.
   - Choose your duration (e.g. `14 Days`) and submit your request.
   - The card status changes to **`Requested`**.
   - Switch to **Ruma** and open her **Transactions Dashboard** ➔ Rifat's new request is waiting for her approval!

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

## 🔐 University Authentication (`@nub.ac.bd`)

- **Strict University Domain**: All registrations must end with `@nub.ac.bd`.
- **Live Input Validation**: Instant visual feedback (green checkmark for `@nub.ac.bd`, red warning otherwise).
- **Automatic State Management**: Navigation controls, post item author details, and transaction ownership update dynamically with active session.

---

## 📁 Project Structure

```
Software Devlopment Project/
├── index.html          # Semantic HTML5 layout with Tailwind CSS & interactive modals
├── css/
│   └── custom.css      # Custom badge styling, animations, floating switcher & star rating
├── js/
│   ├── data.js         # 10 realistic NUB study items, course codes, Rifat/Ruma profiles & reviews
│   └── app.js          # Main app logic, state machine, demo switcher, auth & dashboard
└── README.md           # Documentation and guide
```

---

## 🚀 How to Launch the Application

Double-click `index.html` or run the following command in PowerShell:

```powershell
Start-Process "index.html"
```

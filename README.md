# CampusKart - Modern Campus Marketplace UI with NUB Authentication

CampusKart is a responsive, student-centered campus marketplace web application built with **HTML5**, **Tailwind CSS**, and **Vanilla JavaScript**. It connects university students directly to buy, sell, borrow, and trade textbooks, graphing calculators, lab gear, and dorm equipment with safety and peer verification.

Now featuring an **Authentication System** strictly restricted to official Northern University Bangladesh emails (`@nub.ac.bd`).

---

## 🔐 Authentication & Session System

### 1. Strict Domain Restriction (`@nub.ac.bd`)
- Registration is strictly gated to official university email addresses ending with `@nub.ac.bd`.
- Built-in live client-side regex check (`/^[a-zA-Z0-9._%+-]+@nub\.ac\.bd$/i`) that evaluates input in real-time:
  - Non-NUB domains (e.g. `@gmail.com`, `@yahoo.com`, or other institutions) are rejected with clear visual warning indicators.
  - Valid `@nub.ac.bd` emails are highlighted with a green success badge.

### 2. Comprehensive Student Registration
- **Student Full Name**
- **Official University Email** (`@nub.ac.bd` domain strictly enforced)
- **Student ID** (e.g., `202110045`)
- **Department / Major** (CSE, BBA, EEE, Textile, Pharmacy, English, Law)
- **Password & Confirm Password** (with show/hide eye toggle & 6-character minimum)
- **Student Enrollment Confirmation Checkbox**

### 3. Dynamic Session & Authentication State
- **Guest (Logged Out) State**:
  - Navbar presents "Sign In" and "Register" buttons.
  - Attempting to click **"Post an Item"** triggers an auth guard that opens the Auth Modal with a contextual notice: *"Please sign in with your official @nub.ac.bd account to post an item."*
  - Attempting to message a seller prompts for login.
- **Authenticated (Logged In) State**:
  - Navbar dynamically renders the verified student avatar, active status indicator, student name, verified `.edu` shield, and student ID.
  - Interactive profile dropdown menu showing:
    - Student details (Full Name, ID, Department, Email)
    - "My Active Listings" shortcut (filters marketplace listings by Student ID)
    - "My Saved Items" shortcut
    - "Sign Out" button
  - Publishing a new listing automatically attributes the post to the authenticated student's Name, Student ID, and Department.
- **Logout Action**:
  - Safely clears the session from `localStorage` without a full page reload, reverts the UI to guest mode, and shows a toast notification.
- **Pre-registered Demo Account**:
  - Email: `student@nub.ac.bd`
  - Password: `campus123`
  - Student ID: `202110045` (Tanvir Ahmed - CSE)
  - Features a 1-click **"Auto-fill Demo"** button on the Login form for instant testing.

---

## 🌟 Marketplace Features

### 1. Clean & Responsive Navigation Bar
- **CampusKart Branding**: Logo with custom graduation cap and shopping basket badge.
- **NUB Campus Indicator**: Ashkona Permanent Campus selector.
- **Navigation Shortcuts**: Quick category filtering for Textbooks, Tech & Electronics, Lab Gear, and Dorm Essentials.
- **Saved / Wishlist Counter**: Real-time counter of bookmarked items with interactive heart animations.
- **Primary CTA**: Prominent "Post an Item" button (guarded by login).
- **Mobile Drawer**: Responsive hamburger slide-down menu with dynamic mobile authentication card.

### 2. Multi-Dimensional Search & Filtering Console
- **Instant Keyword Search**: Real-time search by title, description, course code, category, and campus meetup spot.
- **Course-Code Filters**:
  - Dropdown containing campus courses (`CSE 111`, `MATH 201`, `CS 101`, `CS 201`, `EEE 101`, `BBA 202`, `CHEM 121`, `PHYS 102`, `BIO 110`, `ECON 101`, `ARCH 110`, `ENGR 210`, etc.).
  - 1-click popular course chips for rapid course filtering.
- **Category Filters**: Textbooks, Tech & Electronics, Lab & Engineering, Dorm & Living, Notes & Study Kits.
- **Transaction Type Tabs**:
  - `All`
  - `Sell`: Outright discount purchases with original retail price comparisons.
  - `Borrow`: Peer rentals with weekly rates and deposit terms.
  - `Exchange`: Barter/trade listings specifying requested items.
- **Condition Badges & Selectors**:
  - `Brand New` (Mint / unopened)
  - `Like New` (Barely used, flawless condition)
  - `Good` (Normal academic use, 100% operational)
  - `Fair` (Noticeable wear or annotations, fully usable)
- **Sorting**: Featured First, Recently Posted, Price: Low to High, Price: High to Low.
- **Active Filter Badges**: Dynamic pill indicators showing active filters with a one-click "Clear all" action.

### 3. Dynamic Item Cards
- High-resolution imagery with hover zoom effect and gradient overlays.
- Color-coded condition badge (`Brand New`, `Like New`, `Good`, `Fair`).
- Distinct transaction pill (`FOR SALE`, `BORROW`, `EXCHANGE`).
- Mono-styled Course Code pill (e.g., `MATH 201`, `CSE 111`).
- Card body with category, time posted, title, and descriptive snippet.
- Financial detail callout:
  - If Sell: Price + retail comparison.
  - If Borrow: Weekly rental rate + deposit notice.
  - If Exchange: Trade wishlist item.
- Verified student seller profile: Student avatar, name, verified checkmark, and campus meetup spot (e.g., NUB Central Library, Ashkona Cafeteria).
- "View" button opening full item details and peer messaging.

---

## 📁 Project Structure

```
Software Devlopment Project/
├── index.html          # Semantic HTML5 layout with Tailwind CSS & modals (Post, Details, Auth)
├── css/
│   └── custom.css      # Badge styles, animations, custom scrollbars, dropdown & auth indicators
├── js/
│   ├── data.js         # Dataset with course codes, conditions & transactions
│   └── app.js          # Authentication engine, filtering, modal handlers, and DOM rendering
└── README.md           # Documentation and user guide
```

---

## 🚀 How to Run

1. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
2. Or open directly from PowerShell:
   ```powershell
   Start-Process "index.html"
   ```

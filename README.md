# CampusKart - Modern Campus Marketplace UI

CampusKart is a responsive, student-centered campus marketplace web application built with **HTML5**, **Tailwind CSS**, and **Vanilla JavaScript**. It connects university students directly to buy, sell, borrow, and trade textbooks, graphing calculators, lab gear, and dorm equipment with safety and peer verification.

---

## 🌟 Key Features

### 1. Clean & Responsive Navigation Bar
- **CampusKart Branding**: Logo with custom graduation cap and shopping basket badge.
- **Campus Hub Indicator**: North Campus hub selector with Fall 2026 term context.
- **Navigation Shortcuts**: Quick category filtering for Textbooks, Tech & Electronics, Lab Gear, and Dorm Essentials.
- **Saved / Wishlist Counter**: Real-time counter of bookmarked items with interactive heart animations.
- **Primary CTA**: Prominent "Post an Item" button.
- **Student Profile**: Verified `.edu` student badge and profile display.
- **Mobile Drawer**: Responsive hamburger slide-down menu for smaller devices.

### 2. Multi-Dimensional Search & Filtering Console
- **Instant Keyword Search**: Real-time search by title, description, course code, category, and campus meetup spot.
- **Course-Code Filters**:
  - Dropdown containing campus courses (`MATH 201`, `CS 101`, `CS 201`, `CHEM 121`, `PHYS 102`, `BIO 110`, `ECON 101`, `ARCH 110`, `ENGR 210`, etc.).
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
- Mono-styled Course Code pill (e.g., `MATH 201`).
- Card body with category, time posted, title, and descriptive snippet.
- Financial detail callout:
  - If Sell: Price + retail comparison.
  - If Borrow: Weekly rental rate + deposit notice.
  - If Exchange: Trade wishlist item.
- Verified student seller profile: Student avatar, name, verified `.edu` checkmark, and campus meetup spot (e.g., Library West, Student Union, South Tower).
- "View" button opening full item details.

### 4. Interactive Modals & Workflows
- **"Post an Item" Modal**:
  - Form validation with reactive fields (price input for Sell, weekly rate + deposit for Borrow, trade wish for Exchange).
  - Condition selection radio cards.
  - Preset campus image selector for 1-click photo attachment or custom URL input.
  - Live preview of the listing image.
  - Dynamic persistence using `localStorage` so newly created items appear at the top of the feed and persist across browser reloads.
- **"Item Details & Campus Safe Trade" Modal**:
  - High-res media presentation and specs.
  - Campus safe exchange checklist (recommending student union/library daylight meetups).
  - Interactive student peer messenger mockup with real-time delivery confirmation.
- **Toast Notification System**:
  - Smooth animated floating feedback cards for saved items, search resets, published listings, and student messages.

---

## 📁 Project Structure

```
Software Devlopment Project/
├── index.html          # Semantic HTML5 layout with Tailwind CSS & modals
├── css/
│   └── custom.css      # Badge styles, animations, custom scrollbars, and card hovers
├── js/
│   ├── data.js         # Initial mock dataset with course codes, conditions & transactions
│   └── app.js          # Filtering logic, state management, modal handlers, and DOM rendering
└── README.md           # Documentation and user guide
```

---

## 🚀 How to Run

1. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
2. Alternatively, serve with any local HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000`.

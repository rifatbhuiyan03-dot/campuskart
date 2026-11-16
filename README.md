# CampusKart - Campus Marketplace UI with State Machine & Peer Ratings

CampusKart is a responsive, student-centered campus marketplace web application built with **HTML5**, **Tailwind CSS**, and **Vanilla JavaScript**. It connects university students directly to buy, sell, borrow, and trade textbooks, graphing calculators, lab gear, and dorm equipment with safety and peer verification.

Featuring:
1. **Official NUB Authentication**: Strictly restricted to `@nub.ac.bd` university accounts.
2. **Peer Borrow & Exchange State Machine**: Full lifecycle tracking (`Available` ➔ `Requested` ➔ `Borrowed / In Exchange` ➔ `Returned`).
3. **Student Transactions Dashboard**: Dedicated hub for Incoming Requests, Active Listings, and Borrowed Items with real-time due date countdowns.
4. **Peer & Seller Rating System**: Interactive 5-star review engine with dynamic average calculations.

---

## 🔄 Borrow & Exchange State Machine

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

### State Machine Workflow:
1. **Requesting an Item**:
   - A logged-in student clicks **"Borrow"** or **"Exchange"** on an available item card or within the details modal.
   - The student specifies needed duration (e.g. 7 days, 14 days, Exam month) or specifies the item they are offering in trade.
   - The item status immediately transitions to **`Requested`**, locking it from conflicting requests.
2. **Owner Review & Due Date Scheduling**:
   - The item owner receives an alert in their **Transactions Dashboard** under **"Incoming Requests"** (with live badge counter in the navbar).
   - The owner can **"Approve"** or **"Decline"** with 1 click.
   - On approval, the owner sets an expected return due-date via presets (`7 Days`, `14 Days`, `30 Days`) or a custom date picker.
   - The item transitions to **`Borrowed`** or **`In Exchange`**.
3. **Return & Completion**:
   - When the borrowing period concludes, the owner clicks **"Mark as Returned"** in their dashboard.
   - The item safely reverts back to **`Available`** status, ready for future campus peers.
4. **Peer & Seller Rating**:
   - The borrower is prompted with a **"Rate Lender"** button.
   - Submitting a 1–5 star rating and feedback automatically updates the seller's average score across all their active listings.

---

## 📊 User Transactions Dashboard ("My Transactions")

Accessible via the navbar shortcut button or the student profile dropdown:

1. **Incoming Requests Tab**:
   - Lists all requests pending owner decision.
   - Displays borrower identity: Name, Student ID, Department, Email, requested duration, and meetup notes.
   - Immediate **"Approve & Set Due Date"** and **"Decline"** controls.
2. **My Listings Tab**:
   - Displays all items created by the logged-in student.
   - Live filter tabs: `All`, `Available`, `Requested`, and `Borrowed / In Exchange`.
   - **"Mark as Returned"** action button for active borrows.
3. **Items I Borrowed Tab**:
   - Displays all items requested or borrowed by the current user.
   - **Real-Time Due Date Countdown**:
     - Normal countdown (e.g., `Due in 7 days`).
     - Urgent highlight when $\le 2$ days remaining (animated pulse).
     - Overdue status indicator if the due date has passed.
   - **"Rate Lender ★"** button appears once an item has been marked as returned.

---

## ⭐ Seller & Peer Rating System

- **5-Star Interactive Selector**: Click or hover to select 1 to 5 stars with live rating sentiment descriptions (e.g., *"5 Stars - Outstanding Peer!"*).
- **Quick-Tag Pills**: 1-click presets: `+ Punctual & Friendly`, `+ Item in great condition`, `+ Smooth return`, `+ Helpful classmate`.
- **Dynamic Score Updating**: Ratings are stored in `campuskart_reviews_v1`, and the seller's average rating (e.g. `★ 4.9`) and total review count automatically recalculate and display on item cards and in the details modal.

---

## 🔐 University Authentication (`@nub.ac.bd`)

- **Strict Domain Validation**: Only emails ending with `@nub.ac.bd` are accepted for registration.
- **Interactive Live Validator**: Input field displays instant visual indicators (green checkmark for valid `@nub.ac.bd`, red warning for external domains).
- **Session Persistence**: Sessions persist in `localStorage` across page reloads.
- **Pre-configured Demo Student**:
  - Email: `student@nub.ac.bd`
  - Student ID: `202110045` (Tanvir Ahmed - CSE)
  - Password: `campus123`
  - *Pre-seeded with 1 incoming borrow request on the Arduino Starter Kit so you can immediately test the approval and due date workflow!*

---

## 📁 Project Structure

```
Software Devlopment Project/
├── index.html          # Semantic HTML5 layout with Tailwind CSS & interactive modals
├── css/
│   └── custom.css      # Status badges, countdown animations, star ratings & tab styles
├── js/
│   ├── data.js         # Seed items with state machine statuses, student IDs & seed reviews
│   └── app.js          # Authentication, state machine transitions, dashboard & rating engine
└── README.md           # Documentation and guide
```

----

## 🚀 How to Run & Test

1. Open `index.html` in your browser:
   ```powershell
   Start-Process "index.html"
   ```
2. Click **"Sign In"** in the top navbar and click **"Auto-fill Demo"** (logs in as `Tanvir Ahmed`, ID: `202110045`).
3. Notice the amber badge `1` on the **Transactions** button in the navbar:
   - Click it to view the **Incoming Request** from *Ayesha Siddiqua* for the *Arduino Uno Starter Kit*.
   - Click **"Approve & Set Due Date"**, choose **"7 Days"**, and confirm.
   - Status changes to **`Borrowed`** with due date!
   - Click **"Mark as Returned"** to complete the cycle and reopen the item for reviews!
4. Try requesting a book (e.g., *Stewart Calculus* or *CLRS Algorithms*) to test borrower requests!

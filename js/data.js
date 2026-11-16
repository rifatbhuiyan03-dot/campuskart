/**
 * CampusKart - Sample Dataset
 * Realistic university study items for Northern University Bangladesh (NUB) students.
 * Features course codes, verified student seller profiles (Rifat & Ruma),
 * condition badges, transaction tags, and state machine workflows.
 */

const INITIAL_ITEMS = [
  {
    id: "ck-101",
    title: "Casio fx-991MS Scientific Calculator (2-Line Display)",
    category: "Tech & Electronics",
    courseCode: "MATH 101",
    condition: "Like New",
    transaction: "Sell",
    status: "Available",
    price: 650,
    priceLabel: "৳650",
    originalPrice: "৳1,400 Retail",
    exchangeFor: null,
    borrowTerms: null,
    image: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80",
    description: "Original Casio fx-991MS scientific calculator in pristine condition. Features 401 functions including matrix calculation, complex numbers, standard deviation, and differential integration. Slide-on hard protective cover and fresh battery included. Perfect for MATH 101, CSE 103, and EEE 101 semester exams.",
    location: "NUB Central Library 2nd Fl (Ashkona)",
    seller: {
      name: "Rifat Hasan",
      studentId: "202110045",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 5.0,
      reviewsCount: 12,
      responseTime: "< 5 mins"
    },
    postedAt: "1 hour ago",
    featured: true,
    views: 148,
    activeRequest: null,
    borrowDetails: null
  },
  {
    id: "ck-102",
    title: "Discrete Mathematics and Its Applications (Kenneth H. Rosen 7th Ed)",
    category: "Textbooks",
    courseCode: "CSE 103",
    condition: "Good",
    transaction: "Borrow",
    status: "Available",
    price: 30,
    priceLabel: "৳30 / week",
    originalPrice: "৳550 Nilkhet",
    exchangeFor: "Trade for Schaum's Data Structures or Algorithms Book",
    borrowTerms: "Deposit ৳200 refundable upon clean return. Available for 1 to 4 weeks.",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    description: "The core textbook for CSE 103 (Discrete Mathematics). Complete international edition covering propositional logic, set theory, predicate calculus, graph theory, trees, and Boolean algebra. Very clean text with pencil annotations on important solved problem sets.",
    location: "NUB Ashkona Cafeteria & Student Lounge",
    seller: {
      name: "Ruma Akter",
      studentId: "202220015",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 4.9,
      reviewsCount: 9,
      responseTime: "< 10 mins"
    },
    postedAt: "3 hours ago",
    featured: true,
    views: 112,
    activeRequest: null,
    borrowDetails: null
  },
  {
    id: "ck-103",
    title: "Digital Logic Design Breadboard with IC 7408, 7432, 7404 Kit",
    category: "Lab & Engineering",
    courseCode: "CSE 123",
    condition: "Like New",
    transaction: "Borrow",
    status: "Requested", // Pre-seeded as requested by Ruma to test approval workflow instantly!
    price: 50,
    priceLabel: "৳50 / week",
    originalPrice: "৳450 Patuatuly",
    exchangeFor: null,
    borrowTerms: "Complete TTL logic kit. Return all 4 ICs in foam protector with 65-pc jumper wire bundle.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    description: "Complete electronics kit for Digital Logic Design (CSE 123). Standard 830-point solderless breadboard with logic gates: IC 7408 (Quad 2-input AND), IC 7432 (Quad 2-input OR), IC 7404 (Hex Inverter NOT), and IC 7400 (Quad 2-input NAND). Includes 5mm red/green indicator LEDs, 330Ω resistors, and male-to-male jumper wire bundle.",
    location: "NUB Hardware Lab 304, CSE Building (Ashkona)",
    seller: {
      name: "Rifat Hasan",
      studentId: "202110045",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 5.0,
      reviewsCount: 12,
      responseTime: "< 5 mins"
    },
    postedAt: "4 hours ago",
    featured: true,
    views: 195,
    activeRequest: {
      requesterId: "202220015",
      requesterName: "Ruma Akter",
      requesterEmail: "ruma.cse@nub.ac.bd",
      requesterDept: "Computer Science & Engineering (CSE)",
      requestDate: "2026-11-16T15:30:00.000Z",
      durationRequested: "7 Days (1 Week)",
      offeredItem: null,
      note: "Hi Rifat! Need this breadboard and IC kit for our CSE 123 digital circuit lab midterm on Thursday. Can collect from you at the CSE lab!"
    },
    borrowDetails: null
  },
  {
    id: "ck-104",
    title: "Microprocessor 8086 Manual & CSE 3rd Semester Lecture Notes",
    category: "Notes & Study Kits",
    courseCode: "CSE 221",
    condition: "Fair",
    transaction: "Exchange",
    status: "Available",
    price: 0,
    priceLabel: "Trade Only",
    originalPrice: "Priceless A+ Prep",
    exchangeFor: "CSE 223 Database Management Manual or Algorithm notes",
    borrowTerms: null,
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    description: "Comprehensive spiral-bound study bundle for Microprocessors and Assembly Language (CSE 221). Contains emu8086 register architecture diagrams, addressing modes breakdown, interrupt vector tables, and 4 years of solved NUB semester exam questions with sample assembly programs.",
    location: "NUB Central Library Study Room 3",
    seller: {
      name: "Ruma Akter",
      studentId: "202220015",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 4.9,
      reviewsCount: 9,
      responseTime: "< 10 mins"
    },
    postedAt: "Yesterday",
    featured: true,
    views: 168,
    activeRequest: null,
    borrowDetails: null
  },
  {
    id: "ck-105",
    title: "Drafting T-Scale & Engineering Drawing Set (With Tube)",
    category: "Lab & Engineering",
    courseCode: "ME 101",
    condition: "Good",
    transaction: "Sell",
    status: "Available",
    price: 300,
    priceLabel: "৳300",
    originalPrice: "৳750 Stationery",
    exchangeFor: null,
    borrowTerms: null,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    description: "Complete engineering graphics equipment for ME 101 and ARCH 110. Includes 36-inch transparent acrylic T-Scale with bevelled edge, set-squares (30-60 & 45 degree), French curves, drawing board sheet clips, and durable cylindrical carrying tube with shoulder strap.",
    location: "NUB Architecture Studio 4B (Ashkona)",
    seller: {
      name: "Rifat Hasan",
      studentId: "202110045",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 5.0,
      reviewsCount: 12,
      responseTime: "< 5 mins"
    },
    postedAt: "Yesterday",
    featured: false,
    views: 94,
    activeRequest: null,
    borrowDetails: null
  },
  {
    id: "ck-106",
    title: "Data Communications and Networking (Behrouz A. Forouzan 5th Ed)",
    category: "Textbooks",
    courseCode: "CSE 231",
    condition: "Like New",
    transaction: "Sell",
    status: "Available",
    price: 420,
    priceLabel: "৳420",
    originalPrice: "৳850 Import",
    exchangeFor: null,
    borrowTerms: null,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    description: "The definitive textbook for CSE 231 (Data Communications & Networking). Complete guide to the OSI 7-layer model, TCP/IP protocols, IP subnetting calculations, routing algorithms, and network security. Clean binding with no torn or missing pages.",
    location: "NUB Central Library Front Desk",
    seller: {
      name: "Ruma Akter",
      studentId: "202220015",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 4.9,
      reviewsCount: 9,
      responseTime: "< 10 mins"
    },
    postedAt: "2 days ago",
    featured: true,
    views: 182,
    activeRequest: null,
    borrowDetails: null
  },
  {
    id: "ck-107",
    title: "Introductory Circuit Analysis (Boylestad) + Digital Multimeter DT-830D",
    category: "Tech & Electronics",
    courseCode: "EEE 101",
    condition: "Brand New",
    transaction: "Borrow",
    status: "Available",
    price: 45,
    priceLabel: "৳45 / week",
    originalPrice: "৳900 Value",
    exchangeFor: null,
    borrowTerms: "Includes digital multimeter with probe leads & 9V battery. Return undamaged.",
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=800&q=80",
    description: "Essential circuit lab package for EEE 101 (Electrical Circuits Analysis). Includes Boylestad reference book and brand new DT-830D digital multimeter for testing DC/AC voltage, DC current, resistance, diode test, and transistor hFE.",
    location: "NUB Maker Space / EEE Dept Atrium",
    seller: {
      name: "Rifat Hasan",
      studentId: "202110045",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 5.0,
      reviewsCount: 12,
      responseTime: "< 5 mins"
    },
    postedAt: "2 days ago",
    featured: false,
    views: 89,
    activeRequest: null,
    borrowDetails: null
  },
  {
    id: "ck-108",
    title: "Structured Programming with C (Balagurusamy 8th Ed) + Lab Workbook",
    category: "Textbooks",
    courseCode: "CSE 111",
    condition: "Like New",
    transaction: "Sell",
    status: "Available",
    price: 250,
    priceLabel: "৳250",
    originalPrice: "৳500 Retail",
    exchangeFor: null,
    borrowTerms: null,
    image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80",
    description: "Comprehensive textbook for 1st-year CSE 111 programming. Includes structured code examples for pointers, memory allocation, arrays, structs, recursion, and file I/O. Bonus bound workbook with 40 solved lab assignments included.",
    location: "NUB Ashkona Cafeteria Corner",
    seller: {
      name: "Ruma Akter",
      studentId: "202220015",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 4.9,
      reviewsCount: 9,
      responseTime: "< 10 mins"
    },
    postedAt: "3 days ago",
    featured: false,
    views: 135,
    activeRequest: null,
    borrowDetails: null
  },
  {
    id: "ck-109",
    title: "Casio fx-991EX ClassWiz Scientific Calculator (High-Res LCD Display)",
    category: "Tech & Electronics",
    courseCode: "MATH 201",
    condition: "Brand New",
    transaction: "Exchange",
    status: "Available",
    price: 0,
    priceLabel: "Trade Only",
    originalPrice: "৳2,200 Retail",
    exchangeFor: "Arduino Uno Ultimate Starter Kit or Mechanical Keyboard",
    borrowTerms: null,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    description: "Brand new unopened Casio fx-991EX ClassWiz scientific calculator with high-resolution Natural Textbook display. Supports 552 functions, QR code online verification, spreadsheets, 4x4 matrix, vector calculations, and equation solving. Authentic with warranty.",
    location: "NUB Ashkona Campus Computer Lab 4",
    seller: {
      name: "Rifat Hasan",
      studentId: "202110045",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 5.0,
      reviewsCount: 12,
      responseTime: "< 5 mins"
    },
    postedAt: "3 days ago",
    featured: true,
    views: 260,
    activeRequest: null,
    borrowDetails: null
  },
  {
    id: "ck-110",
    title: "Principles of Marketing (Philip Kotler & Gary Armstrong 17th Ed)",
    category: "Textbooks",
    courseCode: "BBA 201",
    condition: "Good",
    transaction: "Borrow",
    status: "Available",
    price: 30,
    priceLabel: "৳30 / week",
    originalPrice: "৳650 Nilkhet",
    exchangeFor: null,
    borrowTerms: "Available for 1 to 3 weeks during marketing term project submissions.",
    image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
    description: "Standard course textbook for NUB BBA and open elective marketing principles. Covers STP analysis (Segmentation, Targeting, Positioning), 4Ps marketing mix, digital advertising, and consumer buying behavior with global and local case studies.",
    location: "NUB School of Business Atrium",
    seller: {
      name: "Ruma Akter",
      studentId: "202220015",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      major: "Computer Science & Engineering (CSE)",
      badge: "NUB Verified Student",
      rating: 4.9,
      reviewsCount: 9,
      responseTime: "< 10 mins"
    },
    postedAt: "4 days ago",
    featured: false,
    views: 140,
    activeRequest: null,
    borrowDetails: null
  }
];

// Seed reviews for sellers
const INITIAL_REVIEWS = [
  {
    id: "rev-01",
    sellerId: "202110045", // Rifat Hasan
    reviewerId: "202220015",
    reviewerName: "Ruma Akter",
    rating: 5,
    comment: "Rifat is a super helpful classmate! Lent me the DLD Breadboard kit right before midterms with all ICs neatly organized.",
    date: "2 days ago",
    itemTitle: "Digital Logic Design Breadboard Kit"
  },
  {
    id: "rev-02",
    sellerId: "202110045",
    reviewerId: "202010012",
    reviewerName: "Maya Lin",
    rating: 5,
    comment: "The Casio calculator was in mint condition. Met at Ashkona central library desk on time.",
    date: "1 week ago",
    itemTitle: "Casio fx-991MS Scientific Calculator"
  },
  {
    id: "rev-03",
    sellerId: "202220015", // Ruma Akter
    reviewerId: "202110045",
    reviewerName: "Rifat Hasan",
    rating: 5,
    comment: "Ruma's Microprocessor lecture notes are a lifesaver for assembly exams! Excellent handwritten explanations.",
    date: "3 days ago",
    itemTitle: "Microprocessor 8086 Manual & Notes"
  }
];

// Master list of available course codes for filter dropdown
const COURSE_CODES = [
  "All Courses",
  "CSE 103",
  "CSE 111",
  "CSE 123",
  "CSE 221",
  "CSE 231",
  "MATH 101",
  "MATH 201",
  "EEE 101",
  "ME 101",
  "BBA 201",
  "General"
];

// Master list of categories
const CATEGORIES = [
  "All Categories",
  "Textbooks",
  "Tech & Electronics",
  "Lab & Engineering",
  "Notes & Study Kits",
  "Dorm & Living"
];

// Conditions specification
const CONDITIONS = [
  { name: "Brand New", color: "emerald", description: "Unopened or unused in original packaging" },
  { name: "Like New", color: "blue", description: "Minimal cosmetic use, flawless functionality" },
  { name: "Good", color: "amber", description: "Normal wear from usage, 100% operational" },
  { name: "Fair", color: "orange", description: "Noticeable wear or markings, functional" }
];

// Transaction types
const TRANSACTIONS = [
  { type: "Sell", label: "Buy Directly", badgeClass: "badge-sell" },
  { type: "Borrow", label: "Borrow / Rent", badgeClass: "badge-borrow" },
  { type: "Exchange", label: "Barter / Trade", badgeClass: "badge-exchange" }
];

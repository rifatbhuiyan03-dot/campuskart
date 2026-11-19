-- ============================================================================
-- CampusKart - Supabase PostgreSQL Schema
-- Northern University Bangladesh (NUB) Student Marketplace
-- ============================================================================
-- Run this script in your Supabase Dashboard:
-- 1. Open your Supabase Project: https://supabase.com/dashboard
-- 2. Go to "SQL Editor" -> "New query"
-- 3. Paste this entire file and click "Run" (Ctrl+Enter)
-- ============================================================================

-- 1. Create 'items' table
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    course_code TEXT DEFAULT 'General',
    price NUMERIC DEFAULT 0,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Sell', 'Borrow', 'Exchange')),
    condition TEXT NOT NULL CHECK (condition IN ('Brand New', 'Like New', 'Good', 'Fair')),
    image_url TEXT,
    seller_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'sold', 'requested')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Additional helper columns for campus UI and metadata
    price_label TEXT,
    location TEXT DEFAULT 'NUB Central Library (Ashkona)',
    exchange_for TEXT,
    borrow_terms TEXT,
    seller_name TEXT,
    seller_avatar TEXT,
    seller_major TEXT,
    featured BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 1
);

-- 2. Create 'transactions' table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
    borrower_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('requested', 'approved', 'returned')),
    return_due_date TIMESTAMP WITH TIME ZONE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Additional helper columns for peer borrow & return workflow
    borrower_name TEXT,
    borrower_email TEXT,
    borrower_dept TEXT,
    duration_requested TEXT,
    note TEXT,
    offered_item TEXT
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Access Policies for Campus Marketplace Demo (using public anon key)
DROP POLICY IF EXISTS "Public Full Access on Items" ON public.items;
CREATE POLICY "Public Full Access on Items" 
ON public.items 
FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public Full Access on Transactions" ON public.transactions;
CREATE POLICY "Public Full Access on Transactions" 
ON public.transactions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Enable Realtime Replication for Instant Peer Updates (Optional & Recommended)
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ============================================================================
-- SEED DATA: 10 Realistic University Study Items for NUB Students
-- ============================================================================

INSERT INTO public.items (
    id, title, description, category, course_code, price, transaction_type, 
    condition, image_url, seller_id, status, created_at, price_label, 
    location, exchange_for, borrow_terms, seller_name, seller_avatar, seller_major, featured, views
) VALUES
(
    'ck-101',
    'Casio fx-991MS Scientific Calculator (2-Line Display)',
    'Original Casio fx-991MS scientific calculator in pristine condition. Features 401 functions including matrix calculation, complex numbers, standard deviation, and differential integration. Slide-on hard protective cover and fresh battery included. Perfect for MATH 101, CSE 103, and EEE 101 semester exams.',
    'Tech & Electronics',
    'MATH 101',
    650,
    'Sell',
    'Like New',
    'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
    '202110045',
    'available',
    NOW() - INTERVAL '1 hour',
    '৳650',
    'NUB Central Library 2nd Fl (Ashkona)',
    NULL,
    NULL,
    'Rifat Hasan',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    TRUE,
    148
),
(
    'ck-102',
    'Discrete Mathematics and Its Applications (Kenneth H. Rosen 7th Ed)',
    'The core textbook for CSE 103 (Discrete Mathematics). Complete international edition covering propositional logic, set theory, predicate calculus, graph theory, trees, and Boolean algebra. Very clean text with pencil annotations on important solved problem sets.',
    'Textbooks',
    'CSE 103',
    30,
    'Borrow',
    'Good',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    '202220015',
    'available',
    NOW() - INTERVAL '3 hours',
    '৳30 / week',
    'NUB Ashkona Cafeteria & Student Lounge',
    'Trade for Schaum''s Data Structures or Algorithms Book',
    'Deposit ৳200 refundable upon clean return. Available for 1 to 4 weeks.',
    'Ruma Akter',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    TRUE,
    112
),
(
    'ck-103',
    'Digital Logic Design Breadboard with IC 7408, 7432, 7404 Kit',
    'Complete electronics kit for Digital Logic Design (CSE 123). Standard 830-point solderless breadboard with logic gates: IC 7408 (Quad 2-input AND), IC 7432 (Quad 2-input OR), IC 7404 (Hex Inverter NOT), and IC 7400 (Quad 2-input NAND). Includes 5mm red/green indicator LEDs, 330Ω resistors, and male-to-male jumper wire bundle.',
    'Lab & Engineering',
    'CSE 123',
    50,
    'Borrow',
    'Like New',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    '202110045',
    'requested',
    NOW() - INTERVAL '5 hours',
    '৳50 / week',
    'NUB Hardware Lab 304, CSE Building (Ashkona)',
    NULL,
    'Complete TTL logic kit. Return all 4 ICs in foam protector with 65-pc jumper wire bundle.',
    'Rifat Hasan',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    TRUE,
    205
),
(
    'ck-104',
    'Microprocessor 8086 Manual & CSE 3rd Semester Lecture Notes',
    'Comprehensive handwritten and typed lecture notes for CSE 221 (Microprocessors & Assembly Language). Contains complete pin diagrams of Intel 8086, memory segmentation charts, addressing modes, and working MASM/EMU8086 assembly code routines.',
    'Notes & Study Kits',
    'CSE 221',
    0,
    'Exchange',
    'Fair',
    'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
    '202220015',
    'available',
    NOW() - INTERVAL '7 hours',
    'Trade Only',
    'Ashkona Campus Study Zone / Library Ground Floor',
    'Looking to trade for CSE 311 (Database Systems) complete notes or lab manual',
    NULL,
    'Ruma Akter',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    TRUE,
    89
),
(
    'ck-105',
    'Drafting T-Scale & Engineering Drawing Instrument Set (with tube)',
    'Heavy-duty transparent acrylic 32-inch T-Scale ruler paired with Rotring set squares (45° and 60°), technical drawing lead holder, eraser shield, and a water-resistant telescopic black carrying cylinder tube. Barely used during ME 101 semester.',
    'Lab & Engineering',
    'ME 101',
    300,
    'Sell',
    'Good',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    '202110045',
    'available',
    NOW() - INTERVAL '1 day',
    '৳300',
    'NUB Architecture & Civil Dept Hallway',
    NULL,
    NULL,
    'Rifat Hasan',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    TRUE,
    134
),
(
    'ck-106',
    'Data Communications and Networking (Behrouz A. Forouzan 5th Ed)',
    'The standard textbook for CSE 231 (Data Communications). Clear explanations of OSI layers, TCP/IP protocol suite, IP subnetting, routing algorithms, error detection (CRC), and multiplexing. Highlighted on key exam topics with sticky page markers.',
    'Textbooks',
    'CSE 231',
    420,
    'Sell',
    'Like New',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80',
    '202220015',
    'available',
    NOW() - INTERVAL '1 day',
    '৳420',
    'NUB Ashkona Campus Gate 1',
    NULL,
    NULL,
    'Ruma Akter',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    FALSE,
    97
),
(
    'ck-107',
    'Introductory Circuit Analysis (Boylestad) + Digital Multimeter DT-830D',
    'Essential bundle for EEE 101 (Electrical Circuits) and CSE hardware majors. Includes Boylestad''s Circuit Analysis text and a working digital multimeter with probe leads for measuring DC/AC voltage, DC current, and resistance in lab experiments.',
    'Tech & Electronics',
    'EEE 101',
    45,
    'Borrow',
    'Brand New',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    '202110045',
    'available',
    NOW() - INTERVAL '2 days',
    '৳45 / week',
    'NUB Electrical Machine Lab (Room 205)',
    NULL,
    'Multimeter includes 9V battery. Please return probe wires undamaged.',
    'Rifat Hasan',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    FALSE,
    76
),
(
    'ck-108',
    'Structured Programming with C (E. Balagurusamy 8th Ed) + Workbook',
    'Clean, unmarked beginner-to-intermediate programming text for CSE 111 (Structured Programming Language). Includes complete ANSI C programming exercises, pointers, structs, file handling, and semester exam sample questions.',
    'Textbooks',
    'CSE 111',
    250,
    'Sell',
    'Like New',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    '202220015',
    'available',
    NOW() - INTERVAL '2 days',
    '৳250',
    'NUB CSE Faculty Lounge Ground Floor',
    NULL,
    NULL,
    'Ruma Akter',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    FALSE,
    64
),
(
    'ck-109',
    'Casio fx-991EX ClassWiz Calculator (High-Res Natural Display)',
    'Top-tier advanced scientific calculator for engineering mathematics (MATH 201). High-resolution dot-matrix display, spreadsheet functionality, QR code generation, 552 functions, and matrix/vector calculus. Purchased last semester, genuine hologram verified.',
    'Tech & Electronics',
    'MATH 201',
    0,
    'Exchange',
    'Brand New',
    'https://images.unsplash.com/photo-1611117775350-ac3950990985?auto=format&fit=crop&w=800&q=80',
    '202110045',
    'available',
    NOW() - INTERVAL '3 days',
    'Trade Only',
    'NUB Computer Lab 102',
    'Looking to exchange for an Arduino Uno Starter Kit or Raspberry Pi Pico kit',
    NULL,
    'Rifat Hasan',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    FALSE,
    188
),
(
    'ck-110',
    'Principles of Marketing (Philip Kotler & Gary Armstrong 17th Ed)',
    'Standard textbook for BBA 201 and general business education electives. Crisp international edition detailing marketing frameworks, market research, consumer behavior, brand strategy, and digital marketing case studies.',
    'Textbooks',
    'BBA 201',
    30,
    'Borrow',
    'Good',
    'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80',
    '202220015',
    'available',
    NOW() - INTERVAL '3 days',
    '৳30 / week',
    'NUB BBA Building & Cafeteria',
    NULL,
    'Available for 2-week borrow during midterm preparation.',
    'Ruma Akter',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'Computer Science & Engineering (CSE)',
    FALSE,
    52
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    course_code = EXCLUDED.course_code,
    price = EXCLUDED.price,
    transaction_type = EXCLUDED.transaction_type,
    condition = EXCLUDED.condition,
    image_url = EXCLUDED.image_url,
    seller_id = EXCLUDED.seller_id,
    status = EXCLUDED.status;

-- ============================================================================
-- SEED DATA: Pre-seeded Transaction for DLD Breadboard Kit (ck-103)
-- Requested by Ruma Akter (202220015) from Rifat Hasan (202110045)
-- ============================================================================

INSERT INTO public.transactions (
    id, item_id, borrower_id, seller_id, status, return_due_date, 
    rating, review_text, created_at, borrower_name, borrower_email, 
    borrower_dept, duration_requested, note, offered_item
) VALUES (
    'tx-seed-101',
    'ck-103',
    '202220015',
    '202110045',
    'requested',
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 hours',
    'Ruma Akter',
    'ruma.cse@nub.ac.bd',
    'Computer Science & Engineering (CSE)',
    '14 Days (Two Weeks)',
    'Hi Rifat brother! Need this TTL logic breadboard kit for my CSE 123 midterm lab experiment next Tuesday. Will handle with care!',
    NULL
)
ON CONFLICT (id) DO NOTHING;

import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('gigflow.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT CHECK(role IN ('client', 'provider', 'admin')) NOT NULL,
    admin_role TEXT CHECK(admin_role IN ('super_admin', 'finance_admin', 'risk_admin', 'dispute_admin', 'growth_admin', 'support_admin')),
    skills TEXT,
    bio TEXT,
    location TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    legal_name TEXT,
    security_pin TEXT,
    mobile_number TEXT UNIQUE,
    theme_preference TEXT DEFAULT 'light',
    balance INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT 0,
    personality_traits TEXT,
    availability_status TEXT DEFAULT 'available',
    comm_style TEXT DEFAULT 'informal',
    preferred_language TEXT DEFAULT 'English',
    has_accepted_policy BOOLEAN DEFAULT 0,
    admin_password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_whitelist (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    added_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS virtual_accounts (
    user_id TEXT PRIMARY KEY,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    monnify_reference TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS banking_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('transfer_in', 'transfer_out', 'subscription', 'bill_payment', 'escrow_hold', 'escrow_release', 'commission')) NOT NULL,
    amount INTEGER NOT NULL,
    recipient_id TEXT,
    description TEXT,
    status TEXT DEFAULT 'completed',
    monnify_reference TEXT,
    monnify_transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS escrow_transactions (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    commission_amount INTEGER NOT NULL,
    status TEXT CHECK(status IN ('held', 'released', 'refunded', 'disputed')) DEFAULT 'held',
    monnify_reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_at DATETIME,
    FOREIGN KEY(job_id) REFERENCES jobs(id),
    FOREIGN KEY(client_id) REFERENCES users(id),
    FOREIGN KEY(provider_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    risk_score INTEGER DEFAULT 0,
    approved_by TEXT,
    monnify_reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(approved_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS risk_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    message TEXT NOT NULL,
    status TEXT CHECK(status IN ('open', 'investigating', 'resolved', 'dismissed')) DEFAULT 'open',
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget INTEGER NOT NULL,
    client_id TEXT NOT NULL,
    provider_id TEXT,
    status TEXT CHECK(status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
    escrow_funded BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES users(id),
    FOREIGN KEY(provider_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    fee INTEGER NOT NULL,
    type TEXT CHECK(type IN ('escrow_fund', 'escrow_release', 'fee_deduction')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    delivery_time TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(provider_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    cover_letter TEXT NOT NULL,
    bid_amount INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id),
    FOREIGN KEY(provider_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS connections (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(follower_id, following_id),
    FOREIGN KEY(follower_id) REFERENCES users(id),
    FOREIGN KEY(following_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS portfolio_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    project_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS post_likes (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY(post_id, user_id),
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Ensure new columns exist in users table
const migrations = [
  { column: 'has_accepted_policy', type: 'BOOLEAN DEFAULT 0' },
  { column: 'comm_style', type: "TEXT DEFAULT 'informal'" },
  { column: 'preferred_language', type: "TEXT DEFAULT 'English'" },
  { column: 'availability_status', type: "TEXT DEFAULT 'available'" },
  { column: 'personality_traits', type: 'TEXT' }
];

migrations.forEach(({ column, type }) => {
  try {
    db.prepare(`SELECT ${column} FROM users LIMIT 1`).get();
  } catch (e) {
    console.log(`Adding ${column} column to users table...`);
    db.exec(`ALTER TABLE users ADD COLUMN ${column} ${type}`);
  }
});

// Seed some initial data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (id, name, role, skills, is_admin) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('u1', 'Chidi Okafor', 'provider', 'Web Development, React, Node.js', 0);
  insertUser.run('u2', 'Amina Bello', 'client', null, 1);
  insertUser.run('u3', 'Tunde Folawiyo', 'provider', 'Graphic Design, Branding', 0);
  
  const insertJob = db.prepare('INSERT INTO jobs (id, title, description, budget, client_id, status) VALUES (?, ?, ?, ?, ?, ?)');
  insertJob.run('j1', 'Build a simple website', 'I need a website for my small business in Lagos.', 50000, 'u2', 'open');
}

// Ensure default settings exist
const settingExists = db.prepare('SELECT 1 FROM settings WHERE key = ?').get('commission_reception_method');
if (!settingExists) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('commission_reception_method', JSON.stringify({
    type: 'opay',
    account_number: '8144990299',
    account_name: 'Gigflow Commission'
  }));
  insertSetting.run('platform_fee', '10');
  insertSetting.run('withdrawal_lock_pin', '1234');
}

// Seed admin whitelist
const adminWhitelist = [
  { email: 'mhiztahkay@gmail.com', role: 'super_admin' },
  { email: 'kayoluhayero@gmail.com', role: 'super_admin' }
];

adminWhitelist.forEach(({ email, role }) => {
  db.prepare('INSERT OR IGNORE INTO admin_whitelist (email, role, added_by) VALUES (?, ?, ?)')
    .run(email, role, 'system');
});

export default db;

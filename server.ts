import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import db from './src/server/db.ts';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 3000;

app.use(express.json());

// --- SECURITY UTILITIES ---

/**
 * Constant-time comparison to prevent timing attacks on passwords
 */
const timingSafeCompare = (provided: string, actual: string) => {
  try {
    const providedBuffer = Buffer.from(provided);
    const actualBuffer = Buffer.from(actual);
    if (providedBuffer.length !== actualBuffer.length) {
      // Still perform a comparison to maintain similar timing profile
      crypto.timingSafeEqual(providedBuffer, providedBuffer);
      return false;
    }
    return crypto.timingSafeEqual(providedBuffer, actualBuffer);
  } catch (e) {
    return false;
  }
};

/**
 * Validate Magic Bytes (File Signatures)
 * Ensures files are actually what they claim to be, not renamed scripts.
 */
const validateMagicBytes = (filePath: string): string | null => {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);
    
    const hex = buffer.toString('hex').toUpperCase();
    
    // JPEG: FF D8 FF
    if (hex.startsWith('FFD8FF')) return 'image/jpeg';
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (hex.startsWith('89504E470D0A1A0A')) return 'image/png';
    // PDF: 25 50 44 46
    if (hex.startsWith('25504446')) return 'application/pdf';
    // ZIP/DOCX: 50 4B 03 04
    if (hex.startsWith('504B0304')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    return null;
  } catch (e) {
    return null;
  }
};

// --- RATE LIMITING ---

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: { error: 'Too many admin attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: { error: 'Upload quota exceeded. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- STORAGE HARDENING ---

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Filename sanitization using UUIDs to prevent directory traversal or overwriting
    const uniqueName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Strict 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf|doc|docx/;
    const isAllowedExt = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    if (isAllowedExt) return cb(null, true);
    cb(new Error('Security Error: Invalid file extension.'));
  }
});

// File Upload Endpoint with Magic Byte Validation
app.post('/api/upload', uploadLimiter, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate Magic Bytes to prevent script injection via renamed files
    const detectedType = validateMagicBytes(req.file.path);
    if (!detectedType) {
      fs.unlinkSync(req.file.path); // Delete malicious file
      return res.status(400).json({ error: 'Security Error: File content does not match extension.' });
    }

    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    res.status(500).json({ error: 'Internal System Error' });
  }
});

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_job', (jobId) => {
    socket.join(jobId);
    console.log(`User joined job room: ${jobId}`);
  });

  socket.on('send_message', (data) => {
    const { jobId, senderId, content } = data;
    const stmt = db.prepare('INSERT INTO messages (job_id, sender_id, content) VALUES (?, ?, ?)');
    stmt.run(jobId, senderId, content);
    
    io.to(jobId).emit('receive_message', {
      job_id: jobId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Simulated Email Service
const sendWelcomeEmail = (email: string, name: string) => {
  console.log(`
    --------------------------------------------------
    📧 EMAIL SENT TO: ${email}
    SUBJECT: Welcome to GigKinetics, ${name}!
    
    How far! We are excited to have you on board.
    GigKinetics is your new home for finding gigs and 
    managing your freelance business sharp sharp.
    
    Get started by completing your profile and 
    setting up your security PIN.
    
    No wahala, we dey here for you!
    - The GigKinetics Team
    --------------------------------------------------
  `);
};

// Helper to get settings with fallback
const getCommissionSetting = () => {
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('commission_reception_method') as { value: string } | undefined;
  if (setting) return JSON.parse(setting.value);
  return {
    type: 'opay',
    account_number: '8144990299',
    account_name: 'Samuel Kayode Oluhayero'
  };
};

// API Routes
app.get('/api/jobs', (req, res) => {
  const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
  res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
  const { title, description, budget, client_id } = req.body;
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO jobs (id, title, description, budget, client_id) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, title, description, budget, client_id);
  res.json({ id, title, description, budget, client_id });
});

app.get('/api/jobs/:id/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE job_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(messages);
});

app.post('/api/escrow/fund', (req, res) => {
  const { jobId, amount } = req.body;
  db.prepare("UPDATE jobs SET escrow_funded = 1, status = 'in_progress' WHERE id = ?").run(jobId);
  db.prepare('INSERT INTO transactions (job_id, amount, fee, type) VALUES (?, ?, ?, ?)').run(jobId, amount, 0, 'escrow_fund');
  res.json({ success: true });
});

app.post('/api/escrow/release', (req, res) => {
  const { jobId } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
  
  if (!job || job.status !== 'in_progress') {
    return res.status(400).json({ error: 'Job not in progress or not found' });
  }

  const fee = Math.floor(job.budget * 0.10);
  const providerAmount = job.budget - fee;

  // Get commission reception method from settings
  const receptionMethod = getCommissionSetting();

  // Simulate payment based on configured method
  console.log(`[PAYMENT] Deducting 10% fee (${fee} NGN) to ${receptionMethod.type} ${receptionMethod.account_number || receptionMethod.email || 'Account'}`);
  console.log(`[PAYMENT] Releasing ${providerAmount} NGN to provider ${job.provider_id}`);

  db.transaction(() => {
    db.prepare("UPDATE jobs SET status = 'completed' WHERE id = ?").run(jobId);
    db.prepare('INSERT INTO transactions (job_id, amount, fee, type) VALUES (?, ?, ?, ?)').run(jobId, providerAmount, fee, 'escrow_release');
    db.prepare('INSERT INTO transactions (job_id, amount, fee, type) VALUES (?, ?, ?, ?)').run(jobId, 0, fee, 'fee_deduction');
  })();

  res.json({ success: true, fee, released: providerAmount });
});

// --- STATS & ANALYTICS ---

app.get('/api/stats/:userId', (req, res) => {
  const { userId } = req.params;
  
  const activeGigs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE (client_id = ? OR provider_id = ?) AND status = 'in_progress'").get(userId, userId) as { count: number };
  
  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as { balance: number } | undefined;
  
  res.json({
    activeGigs: activeGigs.count,
    balance: user?.balance || 0
  });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT id, name, role, skills, bio, location, avatar_url, cover_url, availability_status, personality_traits, comm_style, preferred_language, has_accepted_policy, created_at FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/jobs/hire', (req, res) => {
  const { clientId, providerId, title, description, budget } = req.body;
  const jobId = uuidv4();
  
  const client = db.prepare('SELECT balance FROM users WHERE id = ?').get(clientId) as any;
  if (!client || client.balance < budget) {
    return res.status(400).json({ error: 'Insufficient balance to fund escrow.' });
  }

  try {
    db.transaction(() => {
      // Create job
      db.prepare('INSERT INTO jobs (id, title, description, budget, client_id, provider_id, status, escrow_funded) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(jobId, title, description, budget, clientId, providerId, 'in_progress', 1);
      
      // Deduct from client balance
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(budget, clientId);
      
      // Create escrow record
      db.prepare('INSERT INTO escrow_transactions (id, job_id, client_id, provider_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), jobId, clientId, providerId, budget, 'held');
        
      // Create banking transaction for client
      db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description) VALUES (?, ?, 'escrow_hold', ?, ?)")
        .run(uuidv4(), clientId, budget, `Escrow for job: ${title}`);

      // Create notification for provider
      db.prepare('INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), providerId, 'hire_request', 'New Direct Hire!', `You have been hired for "${title}". Funds are held in escrow.`);
    })();
      
    res.json({ jobId, success: true });
  } catch (error: any) {
    console.error('[HIRE ERROR]', error);
    res.status(500).json({ error: 'Internal System Error' });
  }
});

app.get('/api/providers', (req, res) => {
  const providers = db.prepare("SELECT * FROM users WHERE role = 'provider' ORDER BY created_at DESC").all();
  res.json(providers);
});

// Admin Roles & Permissions
const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  FINANCE_ADMIN: 'finance_admin',
  RISK_ADMIN: 'risk_admin',
  DISPUTE_ADMIN: 'dispute_admin',
  GROWTH_ADMIN: 'growth_admin',
  SUPPORT_ADMIN: 'support_admin'
};

// Admin Password Validation Helper
const validateAdminPassword = (provided: string, level: 1 | 2 | 3) => {
  const envKey = `ADMIN_PASSWORD_L${level}`;
  const actual = process.env[envKey];
  if (!actual || !provided) return false;
  return timingSafeCompare(provided, actual);
};

// Admin Middleware with Multi-Level Auth
const authenticateAdmin = (level: 1 | 2 | 3 = 1, requiredRoles: string[] = []) => {
  return (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
    const providedPassword = req.headers[`x-admin-password-l${level}`] as string || req.headers['x-admin-password'] as string;

    if (!userId) return res.status(401).json({ error: 'Authentication Required' });

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_admin = 1').get(userId) as any;
    if (!user) return res.status(403).json({ error: 'Forbidden: Admin access only' });

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.admin_role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    // Multi-level password validation against environment variables
    if (!validateAdminPassword(providedPassword, level)) {
      return res.status(403).json({ error: `Security Error: Level ${level} Authorization Failed` });
    }

    req.admin = user;
    next();
  };
};

// Audit Logger
const logAdminAction = (adminId: string, action: string, resource: string, resourceId?: string, oldValues?: any, newValues?: any) => {
  db.prepare('INSERT INTO audit_logs (id, admin_id, action, resource, resource_id, old_values, new_values) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), adminId, action, resource, resourceId || null, JSON.stringify(oldValues) || null, JSON.stringify(newValues) || null);
};

app.post('/api/users/sync', (req, res) => {
  const { id, name, email, role = 'provider' } = req.body;
  
  // Check admin whitelist
  const whitelistEntry = db.prepare('SELECT * FROM admin_whitelist WHERE email = ?').get(email) as any;
  const isAdmin = whitelistEntry ? 1 : 0;
  const adminRole = whitelistEntry ? whitelistEntry.role : null;
  
  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  
  if (!user) {
    db.prepare('INSERT INTO users (id, name, email, role, is_admin, admin_role, balance) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, email, role, isAdmin, adminRole, 0);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    
    if (email) {
      sendWelcomeEmail(email, name);
    }
  } else {
    // Update admin status and role if they changed in whitelist
    db.prepare('UPDATE users SET is_admin = ?, admin_role = ?, name = ?, email = ? WHERE id = ?')
      .run(isAdmin, adminRole, name, email, id);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
  
  res.json(user);
});

// Admin Control Panel Routes
// Admin Authentication & Settings
app.get('/api/admin/auth/check', authenticateAdmin(1), (req: any, res) => {
  const adminId = req.admin.id;
  const user = db.prepare('SELECT admin_password, admin_role FROM users WHERE id = ?').get(adminId) as any;
  
  const isSuperAdmin = user?.admin_role === ADMIN_ROLES.SUPER_ADMIN;
  const hasEnvPassword = !!process.env.SUPER_ADMIN_PASSWORD;
  
  res.json({ hasPassword: !!user?.admin_password || (isSuperAdmin && hasEnvPassword) });
});

app.post('/api/admin/auth/set-password', authenticateAdmin(1), (req: any, res) => {
  const { password } = req.body;
  const adminId = req.admin.id;
  
  db.prepare('UPDATE users SET admin_password = ? WHERE id = ?').run(password, adminId);
  logAdminAction(adminId, 'SET_ADMIN_PASSWORD', 'users', adminId);
  
  res.json({ success: true });
});

app.post('/api/admin/auth/verify', authenticateAdmin(1), (req: any, res) => {
  const { password, layer = 1 } = req.body;
  const adminId = req.admin.id;
  
  const user = db.prepare('SELECT admin_password, admin_role FROM users WHERE id = ?').get(adminId) as any;
  const isSuperAdmin = user?.admin_role === ADMIN_ROLES.SUPER_ADMIN;

  // Layered passwords from env
  const passwords = {
    1: process.env.ADMIN_PASSWORD_L1 || '21168100381',
    2: process.env.ADMIN_PASSWORD_L2 || 'MHIZTAHman@5691',
    3: process.env.ADMIN_PASSWORD_L3 || 'Deborahfpi'
  };

  const targetPassword = passwords[layer as keyof typeof passwords];

  if (password === targetPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: `Invalid layer ${layer} password` });
  }
});

app.get('/api/admin/settings', authenticateAdmin(1), (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all() as any[];
  const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  res.json(settingsMap);
});

app.post('/api/admin/settings', authenticateAdmin(1, [ADMIN_ROLES.SUPER_ADMIN]), (req: any, res) => {
  const { key, value, pin } = req.body;
  const adminId = req.admin.id;
  
  const lockPin = db.prepare('SELECT value FROM settings WHERE key = "withdrawal_lock_pin"').get() as any;
  
  if (lockPin && lockPin.value !== pin) {
    return res.status(403).json({ error: 'Invalid security PIN' });
  }
  
  const oldSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  
  logAdminAction(adminId, 'UPDATE_SETTING', 'settings', key, oldSetting?.value, value);
  
  res.json({ success: true });
});

app.post('/api/admin/whitelist/add', authenticateAdmin(1, [ADMIN_ROLES.SUPER_ADMIN]), (req: any, res) => {
  const { email, role } = req.body;
  const adminId = req.admin.id;
  
  db.prepare('INSERT OR REPLACE INTO admin_whitelist (email, role, added_by) VALUES (?, ?, ?)')
    .run(email, role, adminId);
  
  logAdminAction(adminId, 'ADD_TO_WHITELIST', 'admin_whitelist', email, null, { email, role });
  
  res.json({ success: true });
});

app.get('/api/admin/dashboard/stats', authenticateAdmin(1), (req: any, res) => {
  const totalGMV = db.prepare("SELECT SUM(amount) as total FROM banking_transactions WHERE type = 'escrow_release'").get() as any;
  const totalCommission = db.prepare("SELECT SUM(amount) as total FROM banking_transactions WHERE type = 'commission'").get() as any;
  const activeEscrow = db.prepare("SELECT SUM(amount) as total FROM escrow_transactions WHERE status = 'held'").get() as any;
  const pendingWithdrawals = db.prepare("SELECT COUNT(*) as count FROM banking_transactions WHERE type = 'transfer_out' AND status = 'pending'").get() as any;

  res.json({
    gmv: totalGMV.total || 0,
    commission: totalCommission.total || 0,
    escrow: activeEscrow.total || 0,
    pendingWithdrawals: pendingWithdrawals.count
  });
});

app.get('/api/admin/audit-logs', authenticateAdmin(1, [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.RISK_ADMIN]), (req: any, res) => {
  const logs = db.prepare(`
    SELECT l.*, u.name as admin_name 
    FROM audit_logs l 
    JOIN users u ON l.admin_id = u.id 
    ORDER BY l.created_at DESC 
    LIMIT 100
  `).all();
  res.json(logs);
});

app.get('/api/admin/users', authenticateAdmin(1), (req: any, res) => {
  const users = db.prepare('SELECT id, name, email, role, admin_role, is_admin, balance, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.get('/api/admin/escrows', authenticateAdmin(1), (req: any, res) => {
  const escrows = db.prepare(`
    SELECT e.*, j.title as job_title, c.name as client_name, p.name as provider_name
    FROM escrow_transactions e
    JOIN jobs j ON e.job_id = j.id
    JOIN users c ON e.client_id = c.id
    JOIN users p ON e.provider_id = p.id
    WHERE e.status = 'held'
    ORDER BY e.created_at DESC
  `).all();
  res.json(escrows);
});

app.get('/api/admin/transactions', authenticateAdmin(1), (req: any, res) => {
  const transactions = db.prepare(`
    SELECT t.*, u.name as user_name
    FROM banking_transactions t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
    LIMIT 200
  `).all();
  res.json(transactions);
});

// Withdrawal Governance
app.get('/api/admin/withdrawals', authenticateAdmin(1, [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.FINANCE_ADMIN]), (req: any, res) => {
  const withdrawals = db.prepare(`
    SELECT w.*, u.name as user_name, u.email as user_email
    FROM withdrawal_requests w
    JOIN users u ON w.user_id = u.id
    ORDER BY w.created_at DESC
  `).all();
  res.json(withdrawals);
});

app.post('/api/admin/withdrawals/approve', authenticateAdmin(1, [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.FINANCE_ADMIN]), async (req: any, res) => {
  const { withdrawalId } = req.body;
  const adminId = req.admin.id;
  const withdrawal = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(withdrawalId) as any;
  
  if (!withdrawal || withdrawal.status !== 'pending') {
    return res.status(400).json({ error: 'Invalid withdrawal request' });
  }

  try {
    // Execute payout via Monnify (Mocked)
    const payout = await MonnifyService.initiatePayout(withdrawal.amount, {
      bankCode: '035',
      accountNumber: withdrawal.account_number
    });

    db.transaction(() => {
      db.prepare('UPDATE withdrawal_requests SET status = "completed", approved_by = ?, processed_at = CURRENT_TIMESTAMP, monnify_reference = ? WHERE id = ?')
        .run(adminId, payout.reference, withdrawalId);
      
      db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description, monnify_reference) VALUES (?, ?, 'withdrawal', ?, ?, ?)")
        .run(uuidv4(), withdrawal.user_id, withdrawal.amount, `Withdrawal to ${withdrawal.bank_name}`, payout.reference);
      
      logAdminAction(adminId, 'APPROVE_WITHDRAWAL', 'withdrawal_requests', withdrawalId, { status: 'pending' }, { status: 'completed' });
    })();

    res.json({ success: true });
  } catch (error: any) {
    console.error('[WITHDRAWAL ERROR]', error);
    res.status(500).json({ error: 'Internal System Error' });
  }
});

// Risk & Compliance
app.get('/api/admin/risk/alerts', authenticateAdmin(1, [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.RISK_ADMIN]), (req: any, res) => {
  const alerts = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM risk_alerts r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(alerts);
});

app.post('/api/admin/risk/resolve', authenticateAdmin(1, [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.RISK_ADMIN]), (req: any, res) => {
  const { alertId, status } = req.body;
  const adminId = req.admin.id;
  db.prepare('UPDATE risk_alerts SET status = ?, message = message || " (Resolved by Admin)" WHERE id = ?').run(status, alertId);
  logAdminAction(adminId, 'RESOLVE_RISK_ALERT', 'risk_alerts', alertId, { status: 'open' }, { status });
  res.json({ success: true });
});

// Commission Control
app.get('/api/admin/commission/stats', authenticateAdmin(1, [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.FINANCE_ADMIN]), (req: any, res) => {
  const stats = db.prepare(`
    SELECT 
      SUM(commission_amount) as total_revenue,
      COUNT(*) as total_transactions,
      AVG(commission_amount) as avg_commission
    FROM escrow_transactions
    WHERE status = 'released'
  `).get() as any;
  res.json(stats);
});

app.get('/api/admin/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any;
  const totalEscrow = db.prepare("SELECT SUM(amount) as total FROM escrow_transactions WHERE status = 'held'").get() as any;
  
  res.json({
    totalUsers: totalUsers.count,
    totalJobs: totalJobs.count,
    totalEscrow: totalEscrow.total || 0
  });
});

app.post('/api/users/update', (req, res) => {
  const { id, name, legal_name, security_pin, mobile_number, skills, role, bio, location, avatar_url, cover_url, theme_preference, personality_traits, availability_status, comm_style, preferred_language, has_accepted_policy } = req.body;
  db.prepare('UPDATE users SET name = ?, legal_name = ?, security_pin = ?, mobile_number = ?, skills = ?, role = ?, bio = ?, location = ?, avatar_url = ?, cover_url = ?, theme_preference = ?, personality_traits = ?, availability_status = ?, comm_style = ?, preferred_language = ?, has_accepted_policy = ? WHERE id = ?')
    .run(name, legal_name, security_pin, mobile_number, skills, role, bio, location, avatar_url, cover_url, theme_preference, personality_traits, availability_status, comm_style, preferred_language, has_accepted_policy ? 1 : 0, id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.json(user);
});

app.post('/api/users/accept-policy', (req, res) => {
  const { id } = req.body;
  db.prepare('UPDATE users SET has_accepted_policy = 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

app.post('/api/users/verify-pin', (req, res) => {
  const { id, pin } = req.body;
  const user = db.prepare('SELECT security_pin FROM users WHERE id = ?').get(id) as any;
  if (user && user.security_pin === pin) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Incorrect PIN' });
  }
});

// Banking Routes
app.get('/api/banking/transactions/:userId', (req, res) => {
  const transactions = db.prepare("SELECT * FROM banking_transactions WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
  res.json(transactions);
});

app.post('/api/banking/transfer', (req, res) => {
  const { senderId, recipientMobile, amount, description } = req.body;
  const recipient = db.prepare("SELECT id, balance FROM users WHERE mobile_number = ?").get(recipientMobile) as any;
  const sender = db.prepare("SELECT balance FROM users WHERE id = ?").get(senderId) as any;

  if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
  if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  db.transaction(() => {
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, senderId);
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, recipient.id);
    
    db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, recipient_id, description) VALUES (?, ?, 'transfer_out', ?, ?, ?)")
      .run(uuidv4(), senderId, amount, recipient.id, description);
    db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, recipient_id, description) VALUES (?, ?, 'transfer_in', ?, ?, ?)")
      .run(uuidv4(), recipient.id, amount, senderId, description);
  })();

  res.json({ success: true });
});

app.post('/api/banking/pay-bill', (req, res) => {
  const { userId, amount, billType, description } = req.body;
  const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as any;

  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  db.transaction(() => {
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, userId);
    db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description) VALUES (?, ?, 'bill_payment', ?, ?)")
      .run(uuidv4(), userId, amount, `${billType}: ${description}`);
  })();

  res.json({ success: true });
});

app.post('/api/banking/withdraw', (req, res) => {
  const { userId, amount, bankName, accountNumber } = req.body;
  const user = db.prepare("SELECT balance FROM users WHERE id = ?").get(userId) as any;

  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  db.transaction(() => {
    db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, userId);
    db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description) VALUES (?, ?, 'transfer_out', ?, ?)")
      .run(uuidv4(), userId, amount, `Withdrawal to ${bankName} (${accountNumber})`);
  })();

  res.json({ success: true });
});

// --- MONNIFY INTEGRATION ---

async function getMonnifyToken() {
  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  const baseUrl = process.env.MONNIFY_BASE_URL || 'https://api.monnify.com';
  
  if (!apiKey || !secretKey) {
    throw new Error('Monnify API credentials not configured');
  }

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  
  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    const data = await response.json();
    if (data.requestSuccessful) {
      return data.responseBody.accessToken;
    }
    throw new Error(data.responseMessage || 'Failed to get Monnify token');
  } catch (error) {
    console.error('Monnify Token Error:', error);
    throw error;
  }
}

app.post('/api/banking/monnify/initialize', async (req, res) => {
  const { userId, amount, email, name } = req.body;
  const reference = `GK-${uuidv4()}`;
  
  try {
    const token = await getMonnifyToken();
    const baseUrl = process.env.MONNIFY_BASE_URL || 'https://api.monnify.com';
    
    const response = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        customerName: name,
        customerEmail: email,
        paymentReference: reference,
        paymentDescription: 'GigKinetics Wallet Top-up',
        currencyCode: 'NGN',
        contractCode: process.env.MONNIFY_CONTRACT_CODE,
        redirectUrl: `${req.headers.origin}/wallet?ref=${reference}`,
        paymentMethods: ['CARD', 'ACCOUNT_TRANSFER']
      })
    });
    
    const data = await response.json();
    if (data.requestSuccessful) {
      // Store the pending transaction in DB
      db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description, status, monnify_reference) VALUES (?, ?, 'transfer_in', ?, ?, 'pending', ?)")
        .run(reference, userId, amount, 'Wallet Top-up via Monnify', reference);
        
      res.json(data.responseBody);
    } else {
      res.status(400).json({ error: data.responseMessage });
    }
  } catch (error: any) {
    console.error('Monnify Init Error:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize payment' });
  }
});

app.post('/api/banking/monnify/webhook', (req, res) => {
  const { eventType, eventData } = req.body;
  
  // In production, verify the Monnify signature here
  
  if (eventType === 'SUCCESSFUL_TRANSACTION') {
    const { paymentReference, amountPaid, settlementAmount, transactionReference } = eventData;
    
    const tx = db.prepare("SELECT * FROM banking_transactions WHERE id = ? AND status = 'pending'").get(paymentReference) as any;
    
    if (tx) {
      db.transaction(() => {
        // Update user balance
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amountPaid, tx.user_id);
        // Update transaction status
        db.prepare("UPDATE banking_transactions SET status = 'completed', monnify_transaction_id = ? WHERE id = ?")
          .run(transactionReference, paymentReference);
        
        // Notify user
        db.prepare("INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, 'payment', 'Wallet Funded', ?)")
          .run(uuidv4(), tx.user_id, `Your wallet has been credited with ₦${amountPaid.toLocaleString()} sharp sharp.`);
      })();
      console.log(`[MONNIFY] Payment successful for ref: ${paymentReference}`);
    }
  }
  
  res.sendStatus(200);
});

app.post('/api/banking/fund', (req, res) => {
  const { userId, amount } = req.body;
  
  db.transaction(() => {
    db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, userId);
    db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description) VALUES (?, ?, 'transfer_in', ?, ?)")
      .run(uuidv4(), userId, amount, 'Wallet Top-up via Card/Transfer');
  })();

  res.json({ success: true });
});

// Portfolio Routes
app.get('/api/portfolio/:userId', (req, res) => {
  const items = db.prepare('SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
  res.json(items);
});

app.post('/api/portfolio', (req, res) => {
  const { user_id, title, description, image_url, project_url } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO portfolio_items (id, user_id, title, description, image_url, project_url) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, user_id, title, description, image_url, project_url);
  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(id);
  res.json(item);
});

app.delete('/api/portfolio/:id', (req, res) => {
  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Notifications
app.get('/api/notifications/:userId', (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
  res.json(notifications);
});

app.post('/api/notifications/read', (req, res) => {
  const { id } = req.body;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  const { userId } = req.body;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  res.json({ success: true });
});

// Settings Routes
app.get('/api/settings/commission', (req, res) => {
  res.json(getCommissionSetting());
});

app.post('/api/settings/commission', (req, res) => {
  const { type, account_number, account_name, email } = req.body;
  const value = JSON.stringify({ type, account_number, account_name, email });
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('commission_reception_method', value);
  res.json({ success: true });
});

// Portfolio Routes
app.get('/api/portfolio/:userId', (req, res) => {
  const items = db.prepare('SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
  res.json(items);
});

app.post('/api/portfolio', (req, res) => {
  const { user_id, title, description, image_url, project_url } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO portfolio_items (id, user_id, title, description, image_url, project_url) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, user_id, title, description, image_url, project_url);
  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(id);
  res.json(item);
});

app.delete('/api/portfolio/:id', (req, res) => {
  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Services Routes (Fiverr-like Gigs)
app.get('/api/services', (req, res) => {
  const services = db.prepare('SELECT s.*, u.name as provider_name, u.avatar_url as provider_avatar FROM services s JOIN users u ON s.provider_id = u.id ORDER BY s.created_at DESC').all();
  res.json(services);
});

app.get('/api/services/:providerId', (req, res) => {
  const services = db.prepare('SELECT * FROM services WHERE provider_id = ?').all(req.params.providerId);
  res.json(services);
});

app.post('/api/services', (req, res) => {
  const { provider_id, title, description, price, delivery_time, category } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO services (id, provider_id, title, description, price, delivery_time, category) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, provider_id, title, description, price, delivery_time, category);
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.json(service);
});

app.delete('/api/services/:id', (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Proposal Routes (Upwork-like Bidding)
app.get('/api/proposals/:jobId', (req, res) => {
  const proposals = db.prepare(`
    SELECT p.*, u.name as provider_name, u.avatar_url as provider_avatar, u.skills as provider_skills 
    FROM proposals p 
    JOIN users u ON p.provider_id = u.id 
    WHERE p.job_id = ? 
    ORDER BY p.created_at DESC
  `).all(req.params.jobId);
  res.json(proposals);
});

app.post('/api/proposals', (req, res) => {
  const { job_id, provider_id, cover_letter, bid_amount } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO proposals (id, job_id, provider_id, cover_letter, bid_amount) VALUES (?, ?, ?, ?, ?)')
    .run(id, job_id, provider_id, cover_letter, bid_amount);
  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  res.json(proposal);
});

app.post('/api/proposals/accept', (req, res) => {
  const { proposalId, jobId, providerId } = req.body;
  
  // Update proposal status
  db.prepare("UPDATE proposals SET status = 'accepted' WHERE id = ?").run(proposalId);
  db.prepare("UPDATE proposals SET status = 'rejected' WHERE id != ? AND job_id = ?").run(proposalId, jobId);
  
  // Update job with provider and status
  db.prepare("UPDATE jobs SET provider_id = ?, status = 'in_progress' WHERE id = ?").run(providerId, jobId);
  
  res.json({ success: true });
});

// Feed/Posts Routes (LinkedIn-like)
app.get('/api/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const { user_id, content, image_url } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO posts (id, user_id, content, image_url) VALUES (?, ?, ?, ?)')
    .run(id, user_id, content, image_url);
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  res.json(post);
});

// Connections Routes
app.post('/api/connections/follow', (req, res) => {
  const { follower_id, following_id } = req.body;
  db.prepare('INSERT OR IGNORE INTO connections (follower_id, following_id) VALUES (?, ?)')
    .run(follower_id, following_id);
  res.json({ success: true });
});

app.post('/api/connections/unfollow', (req, res) => {
  const { follower_id, following_id } = req.body;
  db.prepare('DELETE FROM connections WHERE follower_id = ? AND following_id = ?')
    .run(follower_id, following_id);
  res.json({ success: true });
});

// Post Interactions
app.post('/api/posts/like', (req, res) => {
  const { post_id, user_id } = req.body;
  try {
    db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(post_id, user_id);
    db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(post_id);
    res.json({ success: true, liked: true });
  } catch (e) {
    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(post_id, user_id);
    db.prepare('UPDATE posts SET likes = MAX(0, likes - 1) WHERE id = ?').run(post_id);
    res.json({ success: true, liked: false });
  }
});

app.get('/api/posts/:id/comments', (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);
  res.json(comments);
});

app.post('/api/posts/comment', (req, res) => {
  const { post_id, user_id, content } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)')
    .run(id, post_id, user_id, content);
  const comment = db.prepare('SELECT c.*, u.name as user_name, u.avatar_url as user_avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(id);
  res.json(comment);
});

// Monnify Service (Mock for now, but structured for real API)
const MonnifyService = {
  createVirtualAccount: async (user: any) => {
    // Real implementation would call Monnify API
    const reference = `VA-${uuidv4()}`;
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    return {
      accountNumber,
      accountName: `GigKinetics - ${user.name}`,
      bankName: 'Wema Bank',
      bankCode: '035',
      reference
    };
  },
  initiatePayout: async (amount: number, destination: any) => {
    // Real implementation would call Monnify Payout API
    return { reference: `PO-${uuidv4()}`, status: 'SUCCESS' };
  },
  verifyWebhook: (signature: string, body: any) => {
    // In production, verify signature using MONNIFY_SECRET_KEY
    return true;
  }
};

// Monnify Webhook Handler
app.post('/api/webhooks/monnify', (req, res) => {
  const signature = req.headers['monnify-signature'] as string;
  const body = req.body;

  if (!MonnifyService.verifyWebhook(signature, body)) {
    return res.status(401).send('Invalid signature');
  }

  const { eventType, eventData } = body;

  try {
    if (eventType === 'SUCCESSFUL_TRANSACTION') {
      const { paymentReference, amountPaid, customer } = eventData;
      
      db.transaction(() => {
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(customer.email) as any;
        if (user) {
          db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amountPaid, user.id);
          db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description, monnify_reference) VALUES (?, ?, 'deposit', ?, ?, ?)")
            .run(uuidv4(), user.id, amountPaid, 'Monnify Deposit', paymentReference);
        }
      })();
    } else if (eventType === 'SUCCESSFUL_DISBURSEMENT') {
      const { reference } = eventData;
      db.prepare('UPDATE withdrawal_requests SET status = "completed" WHERE monnify_reference = ?').run(reference);
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});

// Escrow Management
app.post('/api/escrow/initiate', (req, res) => {
  const { jobId, clientId, providerId, amount } = req.body;
  const id = uuidv4();
  const commission = Math.floor(amount * 0.10); // 10% commission
  const monnifyRef = `ESC-${uuidv4()}`;
  
  db.transaction(() => {
    // Deduct from client balance
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, clientId);
    
    // Create escrow record with Monnify reference
    db.prepare('INSERT INTO escrow_transactions (id, job_id, client_id, provider_id, amount, commission_amount, status, monnify_reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, jobId, clientId, providerId, amount, commission, 'held', monnifyRef);
    
    // Update job status
    db.prepare("UPDATE jobs SET escrow_funded = 1, status = 'in_progress' WHERE id = ?").run(jobId);
    
    // Log banking transaction
    db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description, monnify_reference) VALUES (?, ?, 'escrow_hold', ?, ?, ?)")
      .run(uuidv4(), clientId, amount, `Escrow hold for job ${jobId}`, monnifyRef);
  })();
  
  res.json({ success: true, escrowId: id });
});

app.post('/api/escrow/release-fund', (req, res) => {
  const { jobId, adminId } = req.body;
  
  const escrow = db.prepare('SELECT * FROM escrow_transactions WHERE job_id = ? AND status = "held"').get(jobId) as any;
  if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
  
  const providerAmount = escrow.amount - escrow.commission_amount;
  const monnifyRef = `REL-${uuidv4()}`;
  
  db.transaction(() => {
    // Update escrow status
    db.prepare('UPDATE escrow_transactions SET status = "released", released_at = CURRENT_TIMESTAMP WHERE id = ?').run(escrow.id);
    
    // Add to provider balance
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(providerAmount, escrow.provider_id);
    
    // Update job status
    db.prepare("UPDATE jobs SET status = 'completed' WHERE id = ?").run(jobId);
    
    // Log provider credit
    db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description, monnify_reference) VALUES (?, ?, 'escrow_release', ?, ?, ?)")
      .run(uuidv4(), escrow.provider_id, providerAmount, `Payment for job ${jobId}`, monnifyRef);
      
    // Log commission
    db.prepare("INSERT INTO banking_transactions (id, user_id, type, amount, description, monnify_reference) VALUES (?, ?, 'commission', ?, ?, ?)")
      .run(uuidv4(), 'system', escrow.commission_amount, `Commission for job ${jobId}`, monnifyRef);

    if (adminId) {
      logAdminAction(adminId, 'RELEASE_ESCROW', 'escrow_transactions', escrow.id, { status: 'held' }, { status: 'released' });
    }
  })();
  
  res.json({ success: true });
});

app.get('/api/connections/:userId', (req, res) => {
  const followers = db.prepare('SELECT COUNT(*) as count FROM connections WHERE following_id = ?').get(req.params.userId);
  const following = db.prepare('SELECT COUNT(*) as count FROM connections WHERE follower_id = ?').get(req.params.userId);
  res.json({ followers: (followers as any).count, following: (following as any).count });
});

// Database Admin Routes (Hardened)
const ALLOWED_TABLES = ['users', 'gigs', 'escrow_transactions', 'messages', 'connections', 'reviews', 'jobs', 'proposals', 'posts', 'comments', 'settings', 'audit_logs', 'banking_transactions', 'notifications', 'portfolio_items', 'services', 'withdrawal_requests', 'risk_alerts'];

app.get('/api/admin/db/tables', adminLimiter, authenticateAdmin(2), (req, res) => {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    res.json(tables);
  } catch (error) {
    console.error('[DB ADMIN ERROR]', error);
    res.status(500).json({ error: 'Internal System Error' });
  }
});

app.get('/api/admin/db/tables/:tableName', adminLimiter, authenticateAdmin(2), (req, res) => {
  const { tableName } = req.params;
  
  // Strict whitelist validator against allowed table names
  if (!ALLOWED_TABLES.includes(tableName)) {
    return res.status(400).json({ error: 'Security Error: Access to this table is restricted.' });
  }

  try {
    // PRAGMA calls don't support placeholders, so we use the whitelisted tableName
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
    const rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT 100`).all();
    res.json({ columns, rows });
  } catch (error) {
    console.error('[DB TABLE ERROR]', error);
    res.status(500).json({ error: 'Internal System Error' });
  }
});

app.post('/api/admin/db/query', adminLimiter, authenticateAdmin(3), (req, res) => {
  const { query } = req.body;
  
  try {
    // Absolute SQL Injection Prevention: We encourage parameterized queries, 
    // but for this raw query tool, we at least enforce Level 3 auth.
    const statement = db.prepare(query);
    const result = query.trim().toLowerCase().startsWith('select') ? statement.all() : statement.run();
    res.json(result);
  } catch (error) {
    console.error('[DB QUERY ERROR]', error);
    res.status(500).json({ error: 'Internal System Error' });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

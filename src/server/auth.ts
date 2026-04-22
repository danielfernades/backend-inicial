import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

// Middleware to verify JWT
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, fingerprint } = req.body;
    let clientIp: string = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;
    
    // If x-forwarded-for is an array, take the first one
    if (Array.isArray(clientIp)) {
      clientIp = clientIp[0];
    }
    // If it's a string with commas, take the first one
    if (typeof clientIp === 'string' && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // 1. Gmail Restriction
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ error: 'Apenas contas @gmail.com são permitidas' });
    }

    // 2. VPN/Proxy Detection
    try {
      const vpnCheckResponse = await fetch(`https://proxycheck.io/v2/${clientIp}?vpn=1&asn=1`);
      const vpnData: any = await vpnCheckResponse.json();
      
      if (vpnData[clientIp] && (vpnData[clientIp].proxy === 'yes' || vpnData[clientIp].type === 'VPN' || vpnData[clientIp].type === 'PROXY')) {
        console.log(`Blocked VPN/Proxy access from IP: ${clientIp}`);
        return res.status(403).json({ error: 'Uso de VPN ou Proxy não é permitido. Por favor, use sua conexão real.' });
      }
    } catch (vpnError) {
      console.error('Error checking VPN status:', vpnError);
      // Fail open or closed? Usually fail closed for strict security, but here we might fail open
      // to avoid blocking legit users if the service is down.
    }

    // 3. Duplicate Registration Check (IP and Fingerprint)
    const [existingIp]: any = await pool.query('SELECT * FROM users WHERE registration_ip = ?', [clientIp]);
    if (existingIp.length > 0) {
      return res.status(400).json({ error: 'Já existe um cadastro realizado deste computador ou conexão.' });
    }

    if (fingerprint) {
      const [existingFingerprint]: any = await pool.query('SELECT * FROM users WHERE registration_fingerprint = ?', [fingerprint]);
      if (existingFingerprint.length > 0) {
        return res.status(400).json({ error: 'Já existe um cadastro realizado deste dispositivo.' });
      }
    }

    // Check if user exists by email
    const [existingUsers]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result]: any = await pool.query(
      'INSERT INTO users (email, password_hash, registration_ip, registration_fingerprint) VALUES (?, ?, ?, ?)',
      [email, passwordHash, clientIp, fingerprint || null]
    );
    
    // Generate token
    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { 
        id: result.insertId, 
        email, 
        subscription_status: 'inactive', 
        exports_count: 0, 
        uploads_count: 0 
      } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        subscription_status: user.subscription_status,
        exports_count: user.exports_count || 0,
        uploads_count: user.uploads_count || 0
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const [users]: any = await pool.query('SELECT id, email, name, subscription_status, exports_count, uploads_count FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    const { name } = req.body;
    
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    
    const [users]: any = await pool.query('SELECT id, email, name, subscription_status, exports_count, uploads_count FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/increment-export', authenticateToken, async (req: any, res) => {
  try {
    await pool.query('UPDATE users SET exports_count = exports_count + 1 WHERE id = ?', [req.user.id]);
    const [users]: any = await pool.query('SELECT id, email, subscription_status, exports_count, uploads_count FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Increment export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/increment-upload', authenticateToken, async (req: any, res) => {
  try {
    await pool.query('UPDATE users SET uploads_count = uploads_count + 1 WHERE id = ?', [req.user.id]);
    const [users]: any = await pool.query('SELECT id, email, subscription_status, exports_count, uploads_count FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Increment upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

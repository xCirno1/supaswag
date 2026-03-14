import { Request, Response } from 'express';
import crypto from 'crypto';

const sessions = new Map<string, { userId: string; role: string; expiresAt: number }>();

const USERS: Record<string, { password: string; role: string; name: string }> = {
  'doctor@supacare.health': {
    password: 'unihack2026',
    role: 'doctor',
    name: 'Doctor',
  },
  'food@supacare.health': {
    password: 'unihack2026',
    role: 'food',
    name: 'Food Admin',
  },
};

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const COOKIE_NAME = 'supacare_session';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Prune expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) sessions.delete(token);
  }
}, 60_000);

// POST /auth/login
export const login = (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = USERS[email.toLowerCase().trim()];

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = generateToken();
  sessions.set(token, {
    userId: email,
    role: user.role,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });

  return res.status(200).json({
    message: 'Login successful.',
    user: { email, role: user.role, name: user.name },
  });
};

// POST /auth/logout
export const logout = (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) sessions.delete(token);

  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.status(200).json({ message: 'Logged out.' });
};

// GET /auth/me  — verify session & return current user
export const me = (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Not authenticated.' });

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.status(401).json({ message: 'Session expired.' });
  }

  const user = USERS[session.userId];
  if (!user) return res.status(401).json({ message: 'User not found.' });

  return res.status(200).json({
    user: { email: session.userId, role: session.role, name: user.name },
  });
};

export const requireAuth = (req: Request, res: Response, next: Function) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Authentication required.' });

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.status(401).json({ message: 'Session expired.' });
  }

  (req as any).user = { userId: session.userId, role: session.role };
  next();
};
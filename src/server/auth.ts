import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { User } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vortex_jwt_secret_key_production_2026';
const TOKEN_EXPIRY = '7d';

export interface AuthRequest extends Request {
  user?: User;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function extractToken(req: Request): string | null {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies && req.cookies.vortex_token) {
    return req.cookies.vortex_token;
  }
  return null;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Silakan login terlebih dahulu untuk melanjutkan.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: 'Sesi login telah kedaluwarsa atau tidak valid.' });
  }

  const user = db.findUserById(decoded.id);
  if (!user || user.status === 'BANNED') {
    return res.status(403).json({ error: 'Akun Anda tidak ditemukan atau telah dinonaktifkan.' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses area Admin Panel ini.',
      });
    }
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.id) {
      const user = db.findUserById(decoded.id);
      if (user && user.status !== 'BANNED') {
        req.user = user;
      }
    }
  }
  next();
}

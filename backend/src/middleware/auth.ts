import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  username: string;
  fullName: string;
  role: 'admin' | 'kasir';
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to verify JWT token from Authorization header.
 * Attaches decoded payload to req.user on success.
 * Returns 401 if token is missing or invalid.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token tidak ditemukan' });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'JWT secret tidak dikonfigurasi' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
  }
}

/**
 * Middleware factory for Role-Based Access Control.
 * Checks that req.user.role matches the required role.
 * Returns 403 if role doesn't match.
 */
export function requireRole(role: 'admin' | 'kasir') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Tidak terautentikasi' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: 'Akses ditolak: peran tidak sesuai' });
      return;
    }

    next();
  };
}

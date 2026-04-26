import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { JwtPayload } from '../middleware/auth';

/**
 * POST /api/auth/login
 * Accepts { username, password }, validates credentials, returns JWT token.
 * Requirements: 8.2, 8.7
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username dan password wajib diisi' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT secret tidak dikonfigurasi' });
    return;
  }

  try {
    // Find user by username
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({ error: 'Akun tidak aktif' });
      return;
    }

    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    // Build JWT payload
    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role as 'admin' | 'kasir',
    };

    const expiresIn = process.env.JWT_EXPIRES_IN ?? '8h';
    const token = jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/auth/logout
 * Stateless JWT logout — client should discard the token.
 * Requirements: 8.2
 */
export function logout(_req: Request, res: Response): void {
  // JWT is stateless; logout is handled client-side by discarding the token.
  res.json({ message: 'Logout berhasil' });
}

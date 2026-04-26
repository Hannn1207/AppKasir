import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

const SALT_ROUNDS = 10;

/**
 * GET /api/accounts
 * Returns list of all kasir accounts (excludes passwordHash).
 * Admin only.
 * Requirements: 8.1, 8.8
 */
export async function listAccounts(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'kasir' },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(users);
  } catch (err) {
    console.error('listAccounts error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/accounts
 * Creates a new kasir account.
 * Admin only.
 * Requirements: 8.1, 8.8
 */
export async function createAccount(req: Request, res: Response): Promise<void> {
  const { username, password, fullName } = req.body as {
    username?: string;
    password?: string;
    fullName?: string;
  };

  if (!username || !username.trim()) {
    res.status(400).json({ error: 'Username wajib diisi' });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ error: 'Password minimal 6 karakter' });
    return;
  }

  if (!fullName || !fullName.trim()) {
    res.status(400).json({ error: 'Nama lengkap wajib diisi' });
    return;
  }

  try {
    // Check for duplicate username
    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      res.status(409).json({ error: 'Username sudah digunakan' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        fullName: fullName.trim(),
        role: 'kasir',
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('createAccount error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/accounts/:id/deactivate
 * Deactivates a kasir account (sets isActive = false).
 * Admin only.
 * Requirements: 8.4, 8.8
 */
export async function deactivateAccount(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ error: 'Akun tidak ditemukan' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('deactivateAccount error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * DELETE /api/accounts/:id
 * Deletes a kasir account.
 * Admin only.
 * Requirements: 8.4, 8.8
 */
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      res.status(404).json({ error: 'Akun tidak ditemukan' });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Akun berhasil dihapus' });
  } catch (err) {
    console.error('deleteAccount error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/accounts/me/password
 * Changes the authenticated kasir's own password.
 * Accessible by authenticated kasir (and admin).
 * Requirements: 8.6, 8.9
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Tidak terautentikasi' });
    return;
  }

  const { oldPassword, newPassword } = req.body as {
    oldPassword?: string;
    newPassword?: string;
  };

  if (!oldPassword) {
    res.status(400).json({ error: 'Password lama wajib diisi' });
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: 'Akun tidak ditemukan' });
      return;
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);

    if (!isOldPasswordValid) {
      res.status(401).json({ error: 'Password lama tidak sesuai' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password berhasil diperbarui' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

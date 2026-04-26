import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock('../lib/prisma', () => ({
  default: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import {
  listAccounts,
  createAccount,
  deactivateAccount,
  deleteAccount,
  changePassword,
} from './accountsController';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function makeReq(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
  user?: { id: number; username: string; fullName: string; role: 'admin' | 'kasir' }
): Request {
  return { body, params, user } as unknown as Request;
}

const sampleKasir = {
  id: 1,
  username: 'kasir1',
  passwordHash: 'hashed',
  fullName: 'Kasir Satu',
  role: 'kasir' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleKasirPublic = {
  id: 1,
  username: 'kasir1',
  fullName: 'Kasir Satu',
  role: 'kasir' as const,
  isActive: true,
  createdAt: sampleKasir.createdAt,
  updatedAt: sampleKasir.updatedAt,
};

// ── listAccounts ──────────────────────────────────────────────────────────────

describe('listAccounts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of kasir accounts without passwordHash', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([sampleKasirPublic] as any);

    const req = makeReq();
    const res = makeRes();

    await listAccounts(req, res);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'kasir' } })
    );
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as typeof sampleKasirPublic[];
    expect(jsonArg).toHaveLength(1);
    expect(jsonArg[0]).not.toHaveProperty('passwordHash');
    expect(jsonArg[0].username).toBe('kasir1');
  });

  it('returns empty array when no kasir accounts exist', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    const req = makeReq();
    const res = makeRes();

    await listAccounts(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as unknown[];
    expect(jsonArg).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.user.findMany).mockRejectedValue(new Error('DB error'));

    const req = makeReq();
    const res = makeRes();

    await listAccounts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── createAccount ─────────────────────────────────────────────────────────────

describe('createAccount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when username is missing', async () => {
    const req = makeReq({ password: 'pass123', fullName: 'Kasir Baru' });
    const res = makeRes();

    await createAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('Username');
  });

  it('returns 400 when password is shorter than 6 characters', async () => {
    const req = makeReq({ username: 'kasir2', password: 'abc', fullName: 'Kasir Dua' });
    const res = makeRes();

    await createAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('6');
  });

  it('returns 400 when fullName is missing', async () => {
    const req = makeReq({ username: 'kasir2', password: 'pass123' });
    const res = makeRes();

    await createAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('Nama lengkap');
  });

  it('returns 409 when username already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(sampleKasir);

    const req = makeReq({ username: 'kasir1', password: 'pass123', fullName: 'Kasir Satu' });
    const res = makeRes();

    await createAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('sudah digunakan');
  });

  it('creates account and returns 201 with user data (no passwordHash)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(sampleKasirPublic as any);

    const req = makeReq({ username: 'kasir2', password: 'pass123', fullName: 'Kasir Dua' });
    const res = makeRes();

    await createAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as typeof sampleKasirPublic;
    expect(jsonArg).not.toHaveProperty('passwordHash');
    expect(jsonArg.role).toBe('kasir');
  });

  it('hashes the password before storing', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(sampleKasirPublic as any);

    const req = makeReq({ username: 'kasir2', password: 'pass123', fullName: 'Kasir Dua' });
    const res = makeRes();

    await createAccount(req, res);

    const createCall = vi.mocked(prisma.user.create).mock.calls[0][0];
    const storedHash = createCall.data.passwordHash as string;
    expect(storedHash).not.toBe('pass123');
    const isValid = await bcrypt.compare('pass123', storedHash);
    expect(isValid).toBe(true);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ username: 'kasir2', password: 'pass123', fullName: 'Kasir Dua' });
    const res = makeRes();

    await createAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── deactivateAccount ─────────────────────────────────────────────────────────

describe('deactivateAccount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when account not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();

    await deactivateAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('tidak ditemukan');
  });

  it('sets isActive to false and returns updated account', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(sampleKasir);
    const deactivated = { ...sampleKasirPublic, isActive: false };
    vi.mocked(prisma.user.update).mockResolvedValue(deactivated as any);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();

    await deactivateAccount(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as typeof deactivated;
    expect(jsonArg.isActive).toBe(false);
    expect(jsonArg).not.toHaveProperty('passwordHash');
  });

  it('returns 400 for invalid id', async () => {
    const req = makeReq({}, { id: 'abc' });
    const res = makeRes();

    await deactivateAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(sampleKasir);
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('DB error'));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();

    await deactivateAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── deleteAccount ─────────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when account not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes account and returns success message', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(sampleKasir);
    vi.mocked(prisma.user.delete).mockResolvedValue(sampleKasir);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();

    await deleteAccount(req, res);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { message: string };
    expect(jsonArg.message).toBeDefined();
  });

  it('returns 400 for invalid id', async () => {
    const req = makeReq({}, { id: 'xyz' });
    const res = makeRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(sampleKasir);
    vi.mocked(prisma.user.delete).mockRejectedValue(new Error('DB error'));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── changePassword ────────────────────────────────────────────────────────────

describe('changePassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when user is not authenticated', async () => {
    const req = makeReq({ oldPassword: 'old123', newPassword: 'new123' });
    const res = makeRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 when oldPassword is missing', async () => {
    const req = makeReq({ newPassword: 'new123' }, {}, {
      id: 1, username: 'kasir1', fullName: 'Kasir Satu', role: 'kasir',
    });
    const res = makeRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('lama');
  });

  it('returns 400 when newPassword is shorter than 6 characters', async () => {
    const req = makeReq({ oldPassword: 'old123', newPassword: 'abc' }, {}, {
      id: 1, username: 'kasir1', fullName: 'Kasir Satu', role: 'kasir',
    });
    const res = makeRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('6');
  });

  it('returns 404 when user account not found in DB', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = makeReq({ oldPassword: 'old123', newPassword: 'new123' }, {}, {
      id: 99, username: 'ghost', fullName: 'Ghost', role: 'kasir',
    });
    const res = makeRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 401 when old password is incorrect', async () => {
    const passwordHash = await bcrypt.hash('correct123', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...sampleKasir, passwordHash });

    const req = makeReq({ oldPassword: 'wrong123', newPassword: 'new123456' }, {}, {
      id: 1, username: 'kasir1', fullName: 'Kasir Satu', role: 'kasir',
    });
    const res = makeRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('tidak sesuai');
  });

  it('updates password and returns success message', async () => {
    const passwordHash = await bcrypt.hash('old123', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...sampleKasir, passwordHash });
    vi.mocked(prisma.user.update).mockResolvedValue({ ...sampleKasir });

    const req = makeReq({ oldPassword: 'old123', newPassword: 'new123456' }, {}, {
      id: 1, username: 'kasir1', fullName: 'Kasir Satu', role: 'kasir',
    });
    const res = makeRes();

    await changePassword(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    // Verify new password is hashed
    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    const newHash = updateCall.data.passwordHash as string;
    expect(newHash).not.toBe('new123456');
    const isValid = await bcrypt.compare('new123456', newHash);
    expect(isValid).toBe(true);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { message: string };
    expect(jsonArg.message).toBeDefined();
  });

  it('returns 500 on database error', async () => {
    const passwordHash = await bcrypt.hash('old123', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...sampleKasir, passwordHash });
    vi.mocked(prisma.user.update).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ oldPassword: 'old123', newPassword: 'new123456' }, {}, {
      id: 1, username: 'kasir1', fullName: 'Kasir Satu', role: 'kasir',
    });
    const res = makeRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

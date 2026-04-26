import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock('../lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import { login, logout } from './authController';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_SECRET = 'test-secret';

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function makeReq(body: Record<string, unknown> = {}): Request {
  return { body } as unknown as Request;
}

async function makeHashedPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

// ── login ─────────────────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    vi.clearAllMocks();
  });

  it('returns 400 when username is missing', async () => {
    const req = makeReq({ password: 'pass' });
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password is missing', async () => {
    const req = makeReq({ username: 'kasir1' });
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = makeReq({ username: 'unknown', password: 'pass' });
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when user is inactive', async () => {
    const passwordHash = await makeHashedPassword('correct');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      username: 'kasir1',
      passwordHash,
      fullName: 'Kasir Satu',
      role: 'kasir' as const,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = makeReq({ username: 'kasir1', password: 'correct' });
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('tidak aktif');
  });

  it('returns 401 when password is wrong', async () => {
    const passwordHash = await makeHashedPassword('correct');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      username: 'kasir1',
      passwordHash,
      fullName: 'Kasir Satu',
      role: 'kasir' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = makeReq({ username: 'kasir1', password: 'wrong' });
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns token and user data on successful login', async () => {
    const passwordHash = await makeHashedPassword('secret123');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 42,
      username: 'kasir1',
      passwordHash,
      fullName: 'Kasir Satu',
      role: 'kasir' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = makeReq({ username: 'kasir1', password: 'secret123' });
    const res = makeRes();

    await login(req, res);

    expect(res.status).not.toHaveBeenCalled(); // no error status
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as {
      token: string;
      user: { id: number; username: string; fullName: string; role: string };
    };

    expect(jsonArg.token).toBeDefined();
    expect(jsonArg.user.id).toBe(42);
    expect(jsonArg.user.username).toBe('kasir1');
    expect(jsonArg.user.fullName).toBe('Kasir Satu');
    expect(jsonArg.user.role).toBe('kasir');

    // Verify the token is a valid JWT with correct payload
    const decoded = jwt.verify(jsonArg.token, TEST_SECRET) as {
      id: number;
      username: string;
      fullName: string;
      role: string;
    };
    expect(decoded.id).toBe(42);
    expect(decoded.username).toBe('kasir1');
    expect(decoded.role).toBe('kasir');
  });

  it('token expires in 8 hours', async () => {
    const passwordHash = await makeHashedPassword('pass');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      username: 'admin1',
      passwordHash,
      fullName: 'Admin',
      role: 'admin' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    process.env.JWT_EXPIRES_IN = '8h';
    const req = makeReq({ username: 'admin1', password: 'pass' });
    const res = makeRes();

    await login(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { token: string };
    const decoded = jwt.decode(jsonArg.token) as { exp: number; iat: number };

    // exp - iat should be 8 hours = 28800 seconds
    expect(decoded.exp - decoded.iat).toBe(28800);
  });

  it('returns 500 when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET;
    const passwordHash = await makeHashedPassword('pass');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 1,
      username: 'kasir1',
      passwordHash,
      fullName: 'Kasir',
      role: 'kasir' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = makeReq({ username: 'kasir1', password: 'pass' });
    const res = makeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('returns success message', () => {
    const req = makeReq();
    const res = makeRes();

    logout(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { message: string };
    expect(jsonArg.message).toBeDefined();
    expect(typeof jsonArg.message).toBe('string');
  });
});

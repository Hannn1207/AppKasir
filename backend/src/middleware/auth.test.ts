import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateJWT, requireRole, JwtPayload } from './auth';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEST_SECRET = 'test-secret-key';

function makePayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    id: 1,
    username: 'kasir1',
    fullName: 'Kasir Satu',
    role: 'kasir',
    ...overrides,
  };
}

function makeToken(payload: JwtPayload, secret = TEST_SECRET, options?: jwt.SignOptions): string {
  return jwt.sign(payload, secret, options);
}

function makeMocks(authHeader?: string, user?: JwtPayload) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
    user,
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
}

// ── authenticateJWT ───────────────────────────────────────────────────────────

describe('authenticateJWT', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  it('calls next() and attaches user when token is valid', () => {
    const payload = makePayload();
    const token = makeToken(payload);
    const { req, res, next } = makeMocks(`Bearer ${token}`);

    authenticateJWT(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({
      id: payload.id,
      username: payload.username,
      fullName: payload.fullName,
      role: payload.role,
    });
  });

  it('returns 401 when Authorization header is missing', () => {
    const { req, res, next } = makeMocks(undefined);

    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', () => {
    const { req, res, next } = makeMocks('Basic sometoken');

    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid (wrong secret)', () => {
    const payload = makePayload();
    const token = makeToken(payload, 'wrong-secret');
    const { req, res, next } = makeMocks(`Bearer ${token}`);

    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const payload = makePayload();
    const token = makeToken(payload, TEST_SECRET, { expiresIn: '0s' });
    const { req, res, next } = makeMocks(`Bearer ${token}`);

    // Wait a tick so the token is definitely expired
    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is malformed', () => {
    const { req, res, next } = makeMocks('Bearer not.a.valid.jwt');

    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 when JWT_SECRET is not configured', () => {
    delete process.env.JWT_SECRET;
    const { req, res, next } = makeMocks('Bearer sometoken');

    authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── requireRole ───────────────────────────────────────────────────────────────

describe('requireRole', () => {
  it('calls next() when user role matches required role', () => {
    const { req, res, next } = makeMocks(undefined, makePayload({ role: 'admin' }));

    requireRole('admin')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 when user role does not match required role', () => {
    const { req, res, next } = makeMocks(undefined, makePayload({ role: 'kasir' }));

    requireRole('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when req.user is not set', () => {
    const { req, res, next } = makeMocks(undefined, undefined);

    requireRole('kasir')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows kasir role when required role is kasir', () => {
    const { req, res, next } = makeMocks(undefined, makePayload({ role: 'kasir' }));

    requireRole('kasir')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

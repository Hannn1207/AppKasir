import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock('../lib/prisma', () => ({
  default: {
    product: {
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
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './productsController';

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
  query: Record<string, string> = {}
): Request {
  return { body, params, query } as unknown as Request;
}

const sampleProduct = {
  id: 1,
  name: 'Kopi Hitam',
  price: { toNumber: () => 15000 } as unknown as import('@prisma/client').Prisma.Decimal,
  stockQuantity: 50,
  maxCapacity: 100,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// Helper to create a mock Decimal-like price
function makeDecimal(value: number) {
  return value as unknown as import('@prisma/client').Prisma.Decimal;
}

const sampleProductRaw = {
  ...sampleProduct,
  price: makeDecimal(15000),
};

// ── listProducts ──────────────────────────────────────────────────────────────

describe('listProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all products ordered by name', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([sampleProductRaw] as any);

    const req = makeReq();
    const res = makeRes();

    await listProducts(req, res);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } })
    );
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg).toHaveLength(1);
    expect(jsonArg[0].name).toBe('Kopi Hitam');
    expect(typeof jsonArg[0].price).toBe('number');
  });

  it('converts Decimal price to number', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([sampleProductRaw] as any);

    const req = makeReq();
    const res = makeRes();

    await listProducts(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(typeof jsonArg[0].price).toBe('number');
  });

  it('filters by search query (case-insensitive)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([sampleProductRaw] as any);

    const req = makeReq({}, {}, { search: 'kopi' });
    const res = makeRes();

    await listProducts(req, res);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { contains: 'kopi', mode: 'insensitive' } },
      })
    );
  });

  it('returns empty array when no products match search', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);

    const req = makeReq({}, {}, { search: 'nonexistent' });
    const res = makeRes();

    await listProducts(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB error'));

    const req = makeReq();
    const res = makeRes();

    await listProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── createProduct ─────────────────────────────────────────────────────────────

describe('createProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when name is missing', async () => {
    const req = makeReq({ price: 10000 });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('Nama');
  });

  it('returns 400 when name is empty string', async () => {
    const req = makeReq({ name: '   ', price: 10000 });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when price is missing', async () => {
    const req = makeReq({ name: 'Teh Manis' });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('Harga');
  });

  it('returns 400 when price is zero', async () => {
    const req = makeReq({ name: 'Teh Manis', price: 0 });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('lebih dari 0');
  });

  it('returns 400 when price is negative', async () => {
    const req = makeReq({ name: 'Teh Manis', price: -500 });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('lebih dari 0');
  });

  it('returns 409 when product name already exists', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleProductRaw as any);

    const req = makeReq({ name: 'Kopi Hitam', price: 15000 });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('sudah digunakan');
  });

  it('creates product and returns 201 with product data', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.product.create).mockResolvedValue(sampleProductRaw as any);

    const req = makeReq({ name: 'Kopi Hitam', price: 15000 });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(jsonArg.name).toBe('Kopi Hitam');
    expect(typeof jsonArg.price).toBe('number');
  });

  it('defaults stockQuantity to 0 when not provided', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.product.create).mockResolvedValue(sampleProductRaw as any);

    const req = makeReq({ name: 'Kopi Hitam', price: 15000 });
    const res = makeRes();

    await createProduct(req, res);

    const createCall = vi.mocked(prisma.product.create).mock.calls[0][0];
    expect(createCall.data.stockQuantity).toBe(0);
  });

  it('defaults maxCapacity to 0 when not provided', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.product.create).mockResolvedValue(sampleProductRaw as any);

    const req = makeReq({ name: 'Kopi Hitam', price: 15000 });
    const res = makeRes();

    await createProduct(req, res);

    const createCall = vi.mocked(prisma.product.create).mock.calls[0][0];
    expect(createCall.data.maxCapacity).toBe(0);
  });

  it('accepts valid stockQuantity and maxCapacity', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.product.create).mockResolvedValue(sampleProductRaw as any);

    const req = makeReq({ name: 'Kopi Hitam', price: 15000, stockQuantity: 10, maxCapacity: 50 });
    const res = makeRes();

    await createProduct(req, res);

    const createCall = vi.mocked(prisma.product.create).mock.calls[0][0];
    expect(createCall.data.stockQuantity).toBe(10);
    expect(createCall.data.maxCapacity).toBe(50);
  });

  it('returns 400 when stockQuantity is negative', async () => {
    const req = makeReq({ name: 'Kopi Hitam', price: 15000, stockQuantity: -1 });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.product.create).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ name: 'Kopi Hitam', price: 15000 });
    const res = makeRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── updateProduct ─────────────────────────────────────────────────────────────

describe('updateProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for invalid id', async () => {
    const req = makeReq({}, { id: 'abc' });
    const res = makeRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when product not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const req = makeReq({ name: 'Baru' }, { id: '99' });
    const res = makeRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('tidak ditemukan');
  });

  it('returns 400 when price is zero', async () => {
    const req = makeReq({ price: 0 }, { id: '1' });
    const res = makeRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('lebih dari 0');
  });

  it('returns 400 when price is negative', async () => {
    const req = makeReq({ price: -100 }, { id: '1' });
    const res = makeRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when new name conflicts with existing product', async () => {
    vi.mocked(prisma.product.findUnique)
      .mockResolvedValueOnce(sampleProductRaw as any)   // existing product
      .mockResolvedValueOnce({ ...sampleProductRaw, id: 2, name: 'Teh Manis' } as any); // name conflict

    const req = makeReq({ name: 'Teh Manis' }, { id: '1' });
    const res = makeRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('sudah digunakan');
  });

  it('updates product and returns updated data', async () => {
    vi.mocked(prisma.product.findUnique)
      .mockResolvedValueOnce(sampleProductRaw as any)
      .mockResolvedValueOnce(null); // no name conflict
    const updatedRaw = { ...sampleProductRaw, name: 'Kopi Susu', price: makeDecimal(20000) };
    vi.mocked(prisma.product.update).mockResolvedValue(updatedRaw as any);

    const req = makeReq({ name: 'Kopi Susu', price: 20000 }, { id: '1' });
    const res = makeRes();

    await updateProduct(req, res);

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(jsonArg.name).toBe('Kopi Susu');
    expect(typeof jsonArg.price).toBe('number');
  });

  it('allows updating only price without changing name', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(sampleProductRaw as any);
    const updatedRaw = { ...sampleProductRaw, price: makeDecimal(18000) };
    vi.mocked(prisma.product.update).mockResolvedValue(updatedRaw as any);

    const req = makeReq({ price: 18000 }, { id: '1' });
    const res = makeRes();

    await updateProduct(req, res);

    const updateCall = vi.mocked(prisma.product.update).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('name');
    expect(updateCall.data.price).toBe(18000);
  });

  it('does not check name conflict when name is unchanged', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(sampleProductRaw as any);
    vi.mocked(prisma.product.update).mockResolvedValue(sampleProductRaw as any);

    // Sending the same name as existing product
    const req = makeReq({ name: 'Kopi Hitam', price: 16000 }, { id: '1' });
    const res = makeRes();

    await updateProduct(req, res);

    // findUnique should only be called once (for the existing product check)
    expect(prisma.product.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.product.update).toHaveBeenCalled();
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(sampleProductRaw as any);
    vi.mocked(prisma.product.update).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ price: 20000 }, { id: '1' });
    const res = makeRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── deleteProduct ─────────────────────────────────────────────────────────────

describe('deleteProduct', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for invalid id', async () => {
    const req = makeReq({}, { id: 'xyz' });
    const res = makeRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when product not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const req = makeReq({}, { id: '99' });
    const res = makeRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('tidak ditemukan');
  });

  it('deletes product and returns success message', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleProductRaw as any);
    vi.mocked(prisma.product.delete).mockResolvedValue(sampleProductRaw as any);

    const req = makeReq({}, { id: '1' });
    const res = makeRes();

    await deleteProduct(req, res);

    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { message: string };
    expect(jsonArg.message).toBeDefined();
    expect(typeof jsonArg.message).toBe('string');
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleProductRaw as any);
    vi.mocked(prisma.product.delete).mockRejectedValue(new Error('DB error'));

    const req = makeReq({}, { id: '1' });
    const res = makeRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

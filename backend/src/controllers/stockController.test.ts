import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock('../lib/prisma', () => ({
  default: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '../lib/prisma';
import { listStock, addStock, getStockHistory } from './stockController';

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

function makeDecimal(value: number) {
  return value as unknown as import('@prisma/client').Prisma.Decimal;
}

const sampleProduct = {
  id: 1,
  name: 'Kopi Hitam',
  price: makeDecimal(15000),
  stockQuantity: 10,
  maxCapacity: 100,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const sampleHistory = {
  id: 1,
  productId: 1,
  changeType: 'addition' as const,
  quantityChange: 10,
  stockAfter: 10,
  recordedAt: new Date('2024-01-01T10:00:00Z'),
};

// ── listStock ─────────────────────────────────────────────────────────────────

describe('listStock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns all products with stock flags', async () => {
    const productWithHistory = {
      ...sampleProduct,
      stockHistories: [{ recordedAt: new Date('2024-01-01T10:00:00Z') }],
    };
    vi.mocked(prisma.product.findMany).mockResolvedValue([productWithHistory] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg).toHaveLength(1);
    expect(jsonArg[0]).toMatchObject({
      id: 1,
      name: 'Kopi Hitam',
      stockQuantity: 10,
      maxCapacity: 100,
    });
  });

  it('converts Decimal price to number', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { ...sampleProduct, stockHistories: [] },
    ] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(typeof jsonArg[0].price).toBe('number');
  });

  it('sets isLowStock=true when stockQuantity <= 5', async () => {
    const lowStockProduct = { ...sampleProduct, stockQuantity: 5, stockHistories: [] };
    vi.mocked(prisma.product.findMany).mockResolvedValue([lowStockProduct] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg[0].isLowStock).toBe(true);
  });

  it('sets isLowStock=false when stockQuantity > 5', async () => {
    const normalProduct = { ...sampleProduct, stockQuantity: 6, stockHistories: [] };
    vi.mocked(prisma.product.findMany).mockResolvedValue([normalProduct] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg[0].isLowStock).toBe(false);
  });

  it('sets isLowStock=true when stockQuantity is 0', async () => {
    const emptyProduct = { ...sampleProduct, stockQuantity: 0, stockHistories: [] };
    vi.mocked(prisma.product.findMany).mockResolvedValue([emptyProduct] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg[0].isLowStock).toBe(true);
  });

  it('sets isOverCapacity=true when stockQuantity >= maxCapacity and maxCapacity > 0', async () => {
    const fullProduct = { ...sampleProduct, stockQuantity: 100, maxCapacity: 100, stockHistories: [] };
    vi.mocked(prisma.product.findMany).mockResolvedValue([fullProduct] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg[0].isOverCapacity).toBe(true);
  });

  it('sets isOverCapacity=false when maxCapacity is 0 (unlimited)', async () => {
    const unlimitedProduct = { ...sampleProduct, stockQuantity: 999, maxCapacity: 0, stockHistories: [] };
    vi.mocked(prisma.product.findMany).mockResolvedValue([unlimitedProduct] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg[0].isOverCapacity).toBe(false);
  });

  it('sets isOverCapacity=false when stockQuantity < maxCapacity', async () => {
    const partialProduct = { ...sampleProduct, stockQuantity: 50, maxCapacity: 100, stockHistories: [] };
    vi.mocked(prisma.product.findMany).mockResolvedValue([partialProduct] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg[0].isOverCapacity).toBe(false);
  });

  it('sets lastAddedAt from most recent addition history', async () => {
    const lastDate = new Date('2024-06-15T08:00:00Z');
    const productWithHistory = {
      ...sampleProduct,
      stockHistories: [{ recordedAt: lastDate }],
    };
    vi.mocked(prisma.product.findMany).mockResolvedValue([productWithHistory] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg[0].lastAddedAt).toEqual(lastDate);
  });

  it('sets lastAddedAt=null when no addition history exists', async () => {
    const productNoHistory = { ...sampleProduct, stockHistories: [] };
    vi.mocked(prisma.product.findMany).mockResolvedValue([productNoHistory] as any);

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg[0].lastAddedAt).toBeNull();
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB error'));

    const req = makeReq();
    const res = makeRes();

    await listStock(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── addStock ──────────────────────────────────────────────────────────────────

describe('addStock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for invalid productId', async () => {
    const req = makeReq({ quantity: 5 }, { productId: 'abc' });
    const res = makeRes();

    await addStock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('ID produk tidak valid');
  });

  it('returns 400 when quantity is missing', async () => {
    const req = makeReq({}, { productId: '1' });
    const res = makeRes();

    await addStock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('wajib diisi');
  });

  it('returns 400 when quantity is 0 (Requirement 6.9)', async () => {
    const req = makeReq({ quantity: 0 }, { productId: '1' });
    const res = makeRes();

    await addStock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('lebih dari 0');
  });

  it('returns 400 when quantity is negative (Requirement 6.9)', async () => {
    const req = makeReq({ quantity: -5 }, { productId: '1' });
    const res = makeRes();

    await addStock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('lebih dari 0');
  });

  it('returns 400 when quantity is a non-integer', async () => {
    const req = makeReq({ quantity: 1.5 }, { productId: '1' });
    const res = makeRes();

    await addStock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when product not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const req = makeReq({ quantity: 10 }, { productId: '99' });
    const res = makeRes();

    await addStock(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('tidak ditemukan');
  });

  it('adds stock and creates history record (Requirements 6.2, 6.3, 6.10)', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleProduct as any);

    const updatedProduct = { ...sampleProduct, stockQuantity: 20, price: makeDecimal(15000) };
    const historyRecord = { ...sampleHistory, quantityChange: 10, stockAfter: 20 };

    vi.mocked(prisma.$transaction).mockImplementation(async (ops: any) => {
      return [updatedProduct, historyRecord];
    });

    const req = makeReq({ quantity: 10 }, { productId: '1' });
    const res = makeRes();

    await addStock(req, res);

    expect(prisma.$transaction).toHaveBeenCalled();
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(jsonArg.stockQuantity).toBe(20);
    expect(typeof jsonArg.price).toBe('number');
  });

  it('calculates correct newStock as current + quantity', async () => {
    const productWith10Stock = { ...sampleProduct, stockQuantity: 10 };
    vi.mocked(prisma.product.findUnique).mockResolvedValue(productWith10Stock as any);

    const updatedProduct = { ...sampleProduct, stockQuantity: 15, price: makeDecimal(15000) };
    vi.mocked(prisma.$transaction).mockResolvedValue([updatedProduct, {}] as any);

    const req = makeReq({ quantity: 5 }, { productId: '1' });
    const res = makeRes();

    await addStock(req, res);

    // Verify the transaction was called and the response reflects the new stock
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(jsonArg.stockQuantity).toBe(15);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleProduct as any);
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ quantity: 5 }, { productId: '1' });
    const res = makeRes();

    await addStock(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── getStockHistory ───────────────────────────────────────────────────────────

describe('getStockHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for invalid productId', async () => {
    const req = makeReq({}, { productId: 'abc' });
    const res = makeRes();

    await getStockHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('ID produk tidak valid');
  });

  it('returns 404 when product not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const req = makeReq({}, { productId: '99' });
    const res = makeRes();

    await getStockHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(jsonArg.error).toContain('tidak ditemukan');
  });

  it('returns history ordered by recordedAt descending (Requirement 6.11)', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleProduct as any);

    const historyRecords = [
      { ...sampleHistory, id: 3, recordedAt: new Date('2024-03-01T00:00:00Z') },
      { ...sampleHistory, id: 2, recordedAt: new Date('2024-02-01T00:00:00Z') },
      { ...sampleHistory, id: 1, recordedAt: new Date('2024-01-01T00:00:00Z') },
    ];
    vi.mocked(prisma.stockHistory.findMany).mockResolvedValue(historyRecords as any);

    const req = makeReq({}, { productId: '1' });
    const res = makeRes();

    await getStockHistory(req, res);

    expect(prisma.stockHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: 1 },
        orderBy: { recordedAt: 'desc' },
      })
    );
    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg).toHaveLength(3);
    expect(jsonArg[0].id).toBe(3);
  });

  it('returns empty array when product has no history', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleProduct as any);
    vi.mocked(prisma.stockHistory.findMany).mockResolvedValue([]);

    const req = makeReq({}, { productId: '1' });
    const res = makeRes();

    await getStockHistory(req, res);

    const jsonArg = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(jsonArg).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleProduct as any);
    vi.mocked(prisma.stockHistory.findMany).mockRejectedValue(new Error('DB error'));

    const req = makeReq({}, { productId: '1' });
    const res = makeRes();

    await getStockHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

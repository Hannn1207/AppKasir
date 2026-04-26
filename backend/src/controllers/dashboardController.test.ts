import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import type { JwtPayload } from '../middleware/auth';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock('../lib/prisma', () => ({
  default: {
    transaction: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    transactionItem: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import {
  getDashboardSummary,
  getPopularProducts,
  getDashboardTransactions,
} from './dashboardController';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function makeReq(
  query: Record<string, string> = {},
  user: Partial<JwtPayload> = { id: 1, username: 'kasir1', fullName: 'Kasir Satu', role: 'kasir' }
): Request {
  return { query, user } as unknown as Request;
}

function makeDecimal(value: number) {
  return value as unknown as import('@prisma/client').Prisma.Decimal;
}

// ── getDashboardSummary ───────────────────────────────────────────────────────

describe('getDashboardSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns totalIncome, totalTransactions, totalItemsSold (Requirements 5.1, 5.2, 5.3)', async () => {
    vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
      _count: { id: 5 },
      _sum: { totalAmount: makeDecimal(250000) },
      _avg: {},
      _min: {},
      _max: {},
    } as any);
    vi.mocked(prisma.transactionItem.aggregate).mockResolvedValue({
      _sum: { quantity: 12 },
      _count: {},
      _avg: {},
      _min: {},
      _max: {},
    } as any);

    const req = makeReq({ startDate: '2024-06-01', endDate: '2024-06-01' });
    const res = makeRes();

    await getDashboardSummary(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.totalIncome).toBe(250000);
    expect(body.totalTransactions).toBe(5);
    expect(body.totalItemsSold).toBe(12);
  });

  it('returns numbers (not Decimal objects) for totalIncome', async () => {
    vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
      _count: { id: 3 },
      _sum: { totalAmount: makeDecimal(75000) },
      _avg: {},
      _min: {},
      _max: {},
    } as any);
    vi.mocked(prisma.transactionItem.aggregate).mockResolvedValue({
      _sum: { quantity: 7 },
      _count: {},
      _avg: {},
      _min: {},
      _max: {},
    } as any);

    const req = makeReq({ startDate: '2024-06-01', endDate: '2024-06-01' });
    const res = makeRes();

    await getDashboardSummary(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(typeof body.totalIncome).toBe('number');
    expect(typeof body.totalTransactions).toBe('number');
    expect(typeof body.totalItemsSold).toBe('number');
  });

  it('defaults to 0 when no transactions exist', async () => {
    vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
      _count: { id: 0 },
      _sum: { totalAmount: null },
      _avg: {},
      _min: {},
      _max: {},
    } as any);
    vi.mocked(prisma.transactionItem.aggregate).mockResolvedValue({
      _sum: { quantity: null },
      _count: {},
      _avg: {},
      _min: {},
      _max: {},
    } as any);

    const req = makeReq({ startDate: '2024-06-01', endDate: '2024-06-01' });
    const res = makeRes();

    await getDashboardSummary(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.totalIncome).toBe(0);
    expect(body.totalTransactions).toBe(0);
    expect(body.totalItemsSold).toBe(0);
  });

  it('uses today as default when startDate and endDate are not provided (Requirement 5.9)', async () => {
    vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
      _count: { id: 0 },
      _sum: { totalAmount: null },
      _avg: {},
      _min: {},
      _max: {},
    } as any);
    vi.mocked(prisma.transactionItem.aggregate).mockResolvedValue({
      _sum: { quantity: null },
      _count: {},
      _avg: {},
      _min: {},
      _max: {},
    } as any);

    const req = makeReq({});
    const res = makeRes();

    await getDashboardSummary(req, res);

    // Verify the aggregate was called with a date range (gte/lte)
    const callArgs = vi.mocked(prisma.transaction.aggregate).mock.calls[0][0] as any;
    expect(callArgs.where.createdAt.gte).toBeInstanceOf(Date);
    expect(callArgs.where.createdAt.lte).toBeInstanceOf(Date);

    // The range should be within today
    const today = new Date();
    const gte: Date = callArgs.where.createdAt.gte;
    const lte: Date = callArgs.where.createdAt.lte;
    expect(gte.getUTCFullYear()).toBe(today.getUTCFullYear());
    expect(gte.getUTCMonth()).toBe(today.getUTCMonth());
    expect(gte.getUTCDate()).toBe(today.getUTCDate());
    expect(gte.getUTCHours()).toBe(0);
    expect(lte.getUTCHours()).toBe(23);
  });

  it('uses start of startDate and end of endDate for range (Requirement 5.9)', async () => {
    vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
      _count: { id: 0 },
      _sum: { totalAmount: null },
      _avg: {},
      _min: {},
      _max: {},
    } as any);
    vi.mocked(prisma.transactionItem.aggregate).mockResolvedValue({
      _sum: { quantity: null },
      _count: {},
      _avg: {},
      _min: {},
      _max: {},
    } as any);

    const req = makeReq({ startDate: '2024-06-01', endDate: '2024-06-07' });
    const res = makeRes();

    await getDashboardSummary(req, res);

    const callArgs = vi.mocked(prisma.transaction.aggregate).mock.calls[0][0] as any;
    const gte: Date = callArgs.where.createdAt.gte;
    const lte: Date = callArgs.where.createdAt.lte;

    // Start should be beginning of 2024-06-01
    expect(gte.getUTCFullYear()).toBe(2024);
    expect(gte.getUTCMonth()).toBe(5); // June = 5 (0-indexed)
    expect(gte.getUTCDate()).toBe(1);
    expect(gte.getUTCHours()).toBe(0);
    expect(gte.getUTCMinutes()).toBe(0);
    expect(gte.getUTCSeconds()).toBe(0);

    // End should be end of 2024-06-07
    expect(lte.getUTCFullYear()).toBe(2024);
    expect(lte.getUTCMonth()).toBe(5);
    expect(lte.getUTCDate()).toBe(7);
    expect(lte.getUTCHours()).toBe(23);
    expect(lte.getUTCMinutes()).toBe(59);
    expect(lte.getUTCSeconds()).toBe(59);
  });

  it('returns 500 when prisma throws', async () => {
    vi.mocked(prisma.transaction.aggregate).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ startDate: '2024-06-01', endDate: '2024-06-01' });
    const res = makeRes();

    await getDashboardSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('kesalahan server');
  });
});

// ── getPopularProducts ────────────────────────────────────────────────────────

describe('getPopularProducts', () => {
  beforeEach(() => vi.clearAllMocks());

  const sampleGrouped = [
    { productId: 3, productNameSnapshot: 'Nasi Goreng', _sum: { quantity: 20 } },
    { productId: 1, productNameSnapshot: 'Kopi Hitam', _sum: { quantity: 15 } },
    { productId: 5, productNameSnapshot: 'Jus Jeruk', _sum: { quantity: 12 } },
    { productId: 2, productNameSnapshot: 'Teh Manis', _sum: { quantity: 8 } },
    { productId: 4, productNameSnapshot: 'Mie Goreng', _sum: { quantity: 6 } },
    { productId: 6, productNameSnapshot: 'Es Campur', _sum: { quantity: 3 } },
  ];

  it('returns chart and topProducts (Requirements 5.5, 5.7)', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue(sampleGrouped as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body).toHaveProperty('chart');
    expect(body).toHaveProperty('topProducts');
  });

  it('chart contains all products ordered by totalQuantity descending (Requirement 5.5)', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue(sampleGrouped as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.chart).toHaveLength(6);
    expect(body.chart[0].totalQuantity).toBe(20);
    expect(body.chart[0].productName).toBe('Nasi Goreng');
    expect(body.chart[1].totalQuantity).toBe(15);
    expect(body.chart[5].totalQuantity).toBe(3);
  });

  it('topProducts contains only top 5 (Requirement 5.7)', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue(sampleGrouped as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.topProducts).toHaveLength(5);
    // Should not include the 6th product (Es Campur)
    const names = body.topProducts.map((p: any) => p.productName);
    expect(names).not.toContain('Es Campur');
  });

  it('topProducts matches first 5 of chart', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue(sampleGrouped as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.topProducts).toEqual(body.chart.slice(0, 5));
  });

  it('PopularProduct shape has productId, productName, totalQuantity', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue([sampleGrouped[0]] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    const product = body.chart[0];
    expect(product).toHaveProperty('productId', 3);
    expect(product).toHaveProperty('productName', 'Nasi Goreng');
    expect(product).toHaveProperty('totalQuantity', 20);
  });

  it('returns empty chart and topProducts when no data', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue([] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.chart).toHaveLength(0);
    expect(body.topProducts).toHaveLength(0);
  });

  it('topProducts has at most 5 items when fewer than 5 products exist', async () => {
    const threeProducts = sampleGrouped.slice(0, 3);
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue(threeProducts as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.topProducts).toHaveLength(3);
  });

  it('defaults to today when date is not provided', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue([] as any);

    const req = makeReq({});
    const res = makeRes();

    await getPopularProducts(req, res);

    const callArgs = vi.mocked(prisma.transactionItem.groupBy).mock.calls[0][0] as any;
    expect(callArgs.where.transaction.createdAt.gte).toBeInstanceOf(Date);
    expect(callArgs.where.transaction.createdAt.lte).toBeInstanceOf(Date);
  });

  it('uses correct date range for given date', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue([] as any);

    const req = makeReq({ date: '2024-06-15' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const callArgs = vi.mocked(prisma.transactionItem.groupBy).mock.calls[0][0] as any;
    const gte: Date = callArgs.where.transaction.createdAt.gte;
    const lte: Date = callArgs.where.transaction.createdAt.lte;

    expect(gte.getUTCDate()).toBe(15);
    expect(gte.getUTCHours()).toBe(0);
    expect(lte.getUTCDate()).toBe(15);
    expect(lte.getUTCHours()).toBe(23);
    expect(lte.getUTCMinutes()).toBe(59);
    expect(lte.getUTCSeconds()).toBe(59);
  });

  it('handles null quantity sum gracefully', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockResolvedValue([
      { productId: 1, productNameSnapshot: 'Kopi', _sum: { quantity: null } },
    ] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.chart[0].totalQuantity).toBe(0);
  });

  it('returns 500 when prisma throws', async () => {
    vi.mocked(prisma.transactionItem.groupBy).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getPopularProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('kesalahan server');
  });
});

// ── getDashboardTransactions ──────────────────────────────────────────────────

describe('getDashboardTransactions', () => {
  beforeEach(() => vi.clearAllMocks());

  const sampleTransactions = [
    {
      id: 10,
      cashierId: 1,
      customerName: 'Budi',
      totalAmount: makeDecimal(38000),
      amountPaid: makeDecimal(50000),
      changeAmount: makeDecimal(12000),
      createdAt: new Date('2024-06-01T10:30:00Z'),
      cashier: { fullName: 'Kasir Satu' },
      items: [
        {
          productNameSnapshot: 'Kopi Hitam',
          quantity: 2,
          unitPriceSnapshot: makeDecimal(15000),
          subtotal: makeDecimal(30000),
        },
        {
          productNameSnapshot: 'Teh Manis',
          quantity: 1,
          unitPriceSnapshot: makeDecimal(8000),
          subtotal: makeDecimal(8000),
        },
      ],
    },
    {
      id: 11,
      cashierId: 2,
      customerName: 'Ani',
      totalAmount: makeDecimal(15000),
      amountPaid: makeDecimal(20000),
      changeAmount: makeDecimal(5000),
      createdAt: new Date('2024-06-01T11:00:00Z'),
      cashier: { fullName: 'Kasir Dua' },
      items: [
        {
          productNameSnapshot: 'Kopi Hitam',
          quantity: 1,
          unitPriceSnapshot: makeDecimal(15000),
          subtotal: makeDecimal(15000),
        },
      ],
    },
  ];

  it('returns array of transactions with correct shape (Requirement 5.8)', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue(sampleTransactions as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
  });

  it('each transaction has required fields (Requirement 5.8)', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([sampleTransactions[0]] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any[];
    const tx = body[0];
    expect(tx).toHaveProperty('id', 10);
    expect(tx).toHaveProperty('cashierId', 1);
    expect(tx).toHaveProperty('customerName', 'Budi');
    expect(tx).toHaveProperty('totalAmount');
    expect(tx).toHaveProperty('amountPaid');
    expect(tx).toHaveProperty('changeAmount');
    expect(tx).toHaveProperty('createdAt');
    expect(tx).toHaveProperty('cashier');
    expect(tx).toHaveProperty('items');
  });

  it('cashier field contains fullName', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([sampleTransactions[0]] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(body[0].cashier.fullName).toBe('Kasir Satu');
  });

  it('items contain productNameSnapshot, quantity, unitPriceSnapshot, subtotal', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([sampleTransactions[0]] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any[];
    const item = body[0].items[0];
    expect(item).toHaveProperty('productNameSnapshot', 'Kopi Hitam');
    expect(item).toHaveProperty('quantity', 2);
    expect(item).toHaveProperty('unitPriceSnapshot');
    expect(item).toHaveProperty('subtotal');
  });

  it('converts Decimal values to numbers in response', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([sampleTransactions[0]] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any[];
    const tx = body[0];
    expect(typeof tx.totalAmount).toBe('number');
    expect(typeof tx.amountPaid).toBe('number');
    expect(typeof tx.changeAmount).toBe('number');
    for (const item of tx.items) {
      expect(typeof item.unitPriceSnapshot).toBe('number');
      expect(typeof item.subtotal).toBe('number');
    }
  });

  it('converts Decimal values correctly', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([sampleTransactions[0]] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any[];
    const tx = body[0];
    expect(tx.totalAmount).toBe(38000);
    expect(tx.amountPaid).toBe(50000);
    expect(tx.changeAmount).toBe(12000);
    expect(tx.items[0].unitPriceSnapshot).toBe(15000);
    expect(tx.items[0].subtotal).toBe(30000);
  });

  it('returns empty array when no transactions exist', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(body).toHaveLength(0);
  });

  it('defaults to today when date is not provided', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as any);

    const req = makeReq({});
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0] as any;
    expect(callArgs.where.createdAt.gte).toBeInstanceOf(Date);
    expect(callArgs.where.createdAt.lte).toBeInstanceOf(Date);

    const today = new Date();
    const gte: Date = callArgs.where.createdAt.gte;
    expect(gte.getUTCFullYear()).toBe(today.getUTCFullYear());
    expect(gte.getUTCMonth()).toBe(today.getUTCMonth());
    expect(gte.getUTCDate()).toBe(today.getUTCDate());
  });

  it('uses correct date range for given date', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as any);

    const req = makeReq({ date: '2024-06-20' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0] as any;
    const gte: Date = callArgs.where.createdAt.gte;
    const lte: Date = callArgs.where.createdAt.lte;

    expect(gte.getUTCDate()).toBe(20);
    expect(gte.getUTCHours()).toBe(0);
    expect(gte.getUTCMinutes()).toBe(0);
    expect(gte.getUTCSeconds()).toBe(0);
    expect(lte.getUTCDate()).toBe(20);
    expect(lte.getUTCHours()).toBe(23);
    expect(lte.getUTCMinutes()).toBe(59);
    expect(lte.getUTCSeconds()).toBe(59);
    expect(lte.getUTCMilliseconds()).toBe(999);
  });

  it('orders transactions by createdAt descending', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0] as any;
    expect(callArgs.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('includes cashier and items in the query', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const callArgs = vi.mocked(prisma.transaction.findMany).mock.calls[0][0] as any;
    expect(callArgs.include).toHaveProperty('cashier');
    expect(callArgs.include).toHaveProperty('items');
  });

  it('returns 500 when prisma throws', async () => {
    vi.mocked(prisma.transaction.findMany).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('kesalahan server');
  });

  it('handles multiple items per transaction correctly', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([sampleTransactions[0]] as any);

    const req = makeReq({ date: '2024-06-01' });
    const res = makeRes();

    await getDashboardTransactions(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any[];
    expect(body[0].items).toHaveLength(2);
    expect(body[0].items[0].productNameSnapshot).toBe('Kopi Hitam');
    expect(body[0].items[1].productNameSnapshot).toBe('Teh Manis');
  });
});

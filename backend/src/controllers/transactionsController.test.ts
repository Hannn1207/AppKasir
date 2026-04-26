import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import type { JwtPayload } from '../middleware/auth';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
vi.mock('../lib/prisma', () => ({
  default: {
    product: {
      findMany: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    transactionItem: {
      create: vi.fn(),
    },
    stockHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '../lib/prisma';
import { createTransaction } from './transactionsController';

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
  user: Partial<JwtPayload> = { id: 1, username: 'kasir1', fullName: 'Kasir Satu', role: 'kasir' }
): Request {
  return { body, user } as unknown as Request;
}

function makeDecimal(value: number) {
  return value as unknown as import('@prisma/client').Prisma.Decimal;
}

// Sample products in DB
const sampleProducts = [
  { id: 1, name: 'Kopi Hitam', price: makeDecimal(15000), stockQuantity: 10 },
  { id: 2, name: 'Teh Manis', price: makeDecimal(8000), stockQuantity: 5 },
];

// Valid request body
const validBody = {
  customerName: 'Budi',
  amountPaid: 50000,
  items: [
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 },
  ],
};

// Expected total: (15000 * 2) + (8000 * 1) = 38000
// Expected change: 50000 - 38000 = 12000

const sampleTransactionRecord = {
  id: 100,
  cashierId: 1,
  customerName: 'Budi',
  totalAmount: makeDecimal(38000),
  amountPaid: makeDecimal(50000),
  changeAmount: makeDecimal(12000),
  createdAt: new Date('2024-06-01T10:00:00Z'),
};

const sampleTransactionItems = [
  {
    id: 1,
    transactionId: 100,
    productId: 1,
    productNameSnapshot: 'Kopi Hitam',
    unitPriceSnapshot: makeDecimal(15000),
    quantity: 2,
    subtotal: makeDecimal(30000),
  },
  {
    id: 2,
    transactionId: 100,
    productId: 2,
    productNameSnapshot: 'Teh Manis',
    unitPriceSnapshot: makeDecimal(8000),
    quantity: 1,
    subtotal: makeDecimal(8000),
  },
];

/**
 * Sets up prisma.$transaction mock to simulate the full atomic operation.
 * The callback receives a tx object and we simulate its behavior.
 */
function mockSuccessfulTransaction() {
  vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
    let itemIndex = 0;
    const tx = {
      transaction: {
        create: vi.fn().mockResolvedValue(sampleTransactionRecord),
      },
      transactionItem: {
        create: vi.fn().mockImplementation(async () => sampleTransactionItems[itemIndex++]),
      },
      product: {
        update: vi.fn().mockResolvedValue({}),
      },
      stockHistory: {
        create: vi.fn().mockResolvedValue({}),
      },
    };
    return callback(tx);
  });
}

// ── createTransaction ─────────────────────────────────────────────────────────

describe('createTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── customerName validation ──────────────────────────────────────────────

  it('returns 400 when customerName is missing', async () => {
    const req = makeReq({ amountPaid: 50000, items: [{ productId: 1, quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('customer');
  });

  it('returns 400 when customerName is empty string', async () => {
    const req = makeReq({ customerName: '   ', amountPaid: 50000, items: [{ productId: 1, quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when customerName is not a string', async () => {
    const req = makeReq({ customerName: 123, amountPaid: 50000, items: [{ productId: 1, quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ── amountPaid validation ────────────────────────────────────────────────

  it('returns 400 when amountPaid is missing', async () => {
    const req = makeReq({ customerName: 'Budi', items: [{ productId: 1, quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('pembayaran');
  });

  it('returns 400 when amountPaid is 0', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: 0, items: [{ productId: 1, quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('lebih dari 0');
  });

  it('returns 400 when amountPaid is negative', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: -1000, items: [{ productId: 1, quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when amountPaid is not a number', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: 'abc', items: [{ productId: 1, quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ── items array validation ───────────────────────────────────────────────

  it('returns 400 when items is not an array', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items: 'not-array' });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('array');
  });

  it('returns 400 when items is empty array (Requirement 2.7)', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items: [] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('minimal 1');
  });

  it('returns 400 when items has more than 50 entries (Requirement 2.7)', async () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ productId: i + 1, quantity: 1 }));
    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('50');
  });

  it('accepts exactly 50 items (boundary)', async () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ productId: i + 1, quantity: 1 }));
    const productList = items.map((item) => ({
      id: item.productId,
      name: `Produk ${item.productId}`,
      price: makeDecimal(1000),
      stockQuantity: 10,
    }));
    vi.mocked(prisma.product.findMany).mockResolvedValue(productList as any);
    mockSuccessfulTransaction();

    const req = makeReq({ customerName: 'Budi', amountPaid: 100000, items });
    const res = makeRes();

    await createTransaction(req, res);

    // Should not return 400 for items count
    const statusCalls = vi.mocked(res.status).mock.calls;
    const has400 = statusCalls.some(([code]) => code === 400);
    expect(has400).toBe(false);
  });

  // ── item-level validation ────────────────────────────────────────────────

  it('returns 400 when item quantity is 0', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items: [{ productId: 1, quantity: 0 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('kuantitas');
  });

  it('returns 400 when item quantity is negative', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items: [{ productId: 1, quantity: -1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when item quantity is a float', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items: [{ productId: 1, quantity: 1.5 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when item productId is missing', async () => {
    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items: [{ quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ── product existence and stock validation ───────────────────────────────

  it('returns 400 when product does not exist', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);

    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items: [{ productId: 999, quantity: 1 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('tidak ditemukan');
  });

  it('returns 400 when quantity exceeds stock (Requirement 2.5)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: 1, name: 'Kopi Hitam', price: makeDecimal(15000), stockQuantity: 3 },
    ] as any);

    const req = makeReq({ customerName: 'Budi', amountPaid: 50000, items: [{ productId: 1, quantity: 5 }] });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('melebihi stok');
  });

  it('accepts quantity exactly equal to stock (boundary)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: 1, name: 'Kopi Hitam', price: makeDecimal(15000), stockQuantity: 5 },
    ] as any);
    mockSuccessfulTransaction();

    const req = makeReq({ customerName: 'Budi', amountPaid: 100000, items: [{ productId: 1, quantity: 5 }] });
    const res = makeRes();

    await createTransaction(req, res);

    const statusCalls = vi.mocked(res.status).mock.calls;
    const has400 = statusCalls.some(([code]) => code === 400);
    expect(has400).toBe(false);
  });

  // ── payment sufficiency validation ───────────────────────────────────────

  it('returns 400 when amountPaid is less than total (Requirement 4.3)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);

    // total = 15000*2 + 8000*1 = 38000, paying only 10000
    const req = makeReq({ customerName: 'Budi', amountPaid: 10000, items: validBody.items });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('tidak mencukupi');
  });

  it('accepts amountPaid exactly equal to total (boundary)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);
    mockSuccessfulTransaction();

    // total = 38000, paying exactly 38000
    const req = makeReq({ customerName: 'Budi', amountPaid: 38000, items: validBody.items });
    const res = makeRes();

    await createTransaction(req, res);

    const statusCalls = vi.mocked(res.status).mock.calls;
    const has400 = statusCalls.some(([code]) => code === 400);
    expect(has400).toBe(false);
  });

  // ── successful transaction ───────────────────────────────────────────────

  it('creates transaction and returns 201 with full data (Requirements 2.1, 4.5, 8.5)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);
    mockSuccessfulTransaction();

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.id).toBe(100);
    expect(body.cashierId).toBe(1);
    expect(body.customerName).toBe('Budi');
    expect(typeof body.totalAmount).toBe('number');
    expect(typeof body.amountPaid).toBe('number');
    expect(typeof body.changeAmount).toBe('number');
    expect(body.createdAt).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('response items contain productNameSnapshot and unitPriceSnapshot', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);
    mockSuccessfulTransaction();

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.items[0].productNameSnapshot).toBe('Kopi Hitam');
    expect(body.items[0].unitPriceSnapshot).toBe(15000);
    expect(body.items[1].productNameSnapshot).toBe('Teh Manis');
    expect(body.items[1].unitPriceSnapshot).toBe(8000);
  });

  it('response items contain correct subtotals', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);
    mockSuccessfulTransaction();

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.items[0].subtotal).toBe(30000); // 15000 * 2
    expect(body.items[1].subtotal).toBe(8000);  // 8000 * 1
  });

  it('records cashierId from req.user (Requirement 8.5)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);

    let capturedCashierId: number | undefined;
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      let itemIndex = 0;
      const tx = {
        transaction: {
          create: vi.fn().mockImplementation(async ({ data }: any) => {
            capturedCashierId = data.cashierId;
            return sampleTransactionRecord;
          }),
        },
        transactionItem: {
          create: vi.fn().mockImplementation(async () => sampleTransactionItems[itemIndex++]),
        },
        product: { update: vi.fn().mockResolvedValue({}) },
        stockHistory: { create: vi.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    });

    const req = makeReq(validBody, { id: 42, username: 'kasir2', fullName: 'Kasir Dua', role: 'kasir' });
    const res = makeRes();

    await createTransaction(req, res);

    expect(capturedCashierId).toBe(42);
  });

  it('trims customerName before saving', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);

    let capturedCustomerName: string | undefined;
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      let itemIndex = 0;
      const tx = {
        transaction: {
          create: vi.fn().mockImplementation(async ({ data }: any) => {
            capturedCustomerName = data.customerName;
            return sampleTransactionRecord;
          }),
        },
        transactionItem: {
          create: vi.fn().mockImplementation(async () => sampleTransactionItems[itemIndex++]),
        },
        product: { update: vi.fn().mockResolvedValue({}) },
        stockHistory: { create: vi.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    });

    const req = makeReq({ ...validBody, customerName: '  Budi  ' });
    const res = makeRes();

    await createTransaction(req, res);

    expect(capturedCustomerName).toBe('Budi');
  });

  it('executes stock reduction for each item (Requirement 6.8)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);

    const productUpdateMock = vi.fn().mockResolvedValue({});
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      let itemIndex = 0;
      const tx = {
        transaction: { create: vi.fn().mockResolvedValue(sampleTransactionRecord) },
        transactionItem: {
          create: vi.fn().mockImplementation(async () => sampleTransactionItems[itemIndex++]),
        },
        product: { update: productUpdateMock },
        stockHistory: { create: vi.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    });

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    // Should have called product.update twice (once per item)
    expect(productUpdateMock).toHaveBeenCalledTimes(2);

    // Verify stock reduction amounts
    const calls = productUpdateMock.mock.calls;
    const updateForProduct1 = calls.find((c: any) => c[0].where.id === 1);
    const updateForProduct2 = calls.find((c: any) => c[0].where.id === 2);
    expect(updateForProduct1?.[0].data.stockQuantity).toBe(8); // 10 - 2
    expect(updateForProduct2?.[0].data.stockQuantity).toBe(4); // 5 - 1
  });

  it('creates StockHistory with changeType reduction for each item (Requirement 6.8)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);

    const stockHistoryCreateMock = vi.fn().mockResolvedValue({});
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      let itemIndex = 0;
      const tx = {
        transaction: { create: vi.fn().mockResolvedValue(sampleTransactionRecord) },
        transactionItem: {
          create: vi.fn().mockImplementation(async () => sampleTransactionItems[itemIndex++]),
        },
        product: { update: vi.fn().mockResolvedValue({}) },
        stockHistory: { create: stockHistoryCreateMock },
      };
      return callback(tx);
    });

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    expect(stockHistoryCreateMock).toHaveBeenCalledTimes(2);

    const calls = stockHistoryCreateMock.mock.calls;
    for (const call of calls) {
      expect(call[0].data.changeType).toBe('reduction');
    }

    // Verify specific history entries
    const historyForProduct1 = calls.find((c: any) => c[0].data.productId === 1);
    const historyForProduct2 = calls.find((c: any) => c[0].data.productId === 2);
    expect(historyForProduct1?.[0].data.quantityChange).toBe(2);
    expect(historyForProduct1?.[0].data.stockAfter).toBe(8);
    expect(historyForProduct2?.[0].data.quantityChange).toBe(1);
    expect(historyForProduct2?.[0].data.stockAfter).toBe(4);
  });

  it('uses prisma.$transaction for atomicity', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);
    mockSuccessfulTransaction();

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('converts Decimal values to numbers in response', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);
    mockSuccessfulTransaction();

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(typeof body.totalAmount).toBe('number');
    expect(typeof body.amountPaid).toBe('number');
    expect(typeof body.changeAmount).toBe('number');
    for (const item of body.items) {
      expect(typeof item.unitPriceSnapshot).toBe('number');
      expect(typeof item.subtotal).toBe('number');
    }
  });

  it('calculates correct changeAmount in response', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);
    mockSuccessfulTransaction();

    // total = 38000, paid = 50000, change = 12000
    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.changeAmount).toBe(12000);
  });

  // ── error handling ───────────────────────────────────────────────────────

  it('returns 500 when prisma.product.findMany throws', async () => {
    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB error'));

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toContain('kesalahan server');
  });

  it('returns 500 when prisma.$transaction throws', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(sampleProducts as any);
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Transaction failed'));

    const req = makeReq(validBody);
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ── single item transaction ──────────────────────────────────────────────

  it('handles single item transaction correctly', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([sampleProducts[0]] as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const singleItemTx = {
        id: 101,
        cashierId: 1,
        customerName: 'Ani',
        totalAmount: makeDecimal(15000),
        amountPaid: makeDecimal(20000),
        changeAmount: makeDecimal(5000),
        createdAt: new Date(),
      };
      const singleItem = {
        id: 1,
        transactionId: 101,
        productId: 1,
        productNameSnapshot: 'Kopi Hitam',
        unitPriceSnapshot: makeDecimal(15000),
        quantity: 1,
        subtotal: makeDecimal(15000),
      };
      const tx = {
        transaction: { create: vi.fn().mockResolvedValue(singleItemTx) },
        transactionItem: { create: vi.fn().mockResolvedValue(singleItem) },
        product: { update: vi.fn().mockResolvedValue({}) },
        stockHistory: { create: vi.fn().mockResolvedValue({}) },
      };
      return callback(tx);
    });

    const req = makeReq({
      customerName: 'Ani',
      amountPaid: 20000,
      items: [{ productId: 1, quantity: 1 }],
    });
    const res = makeRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = vi.mocked(res.json).mock.calls[0][0] as any;
    expect(body.items).toHaveLength(1);
    expect(body.totalAmount).toBe(15000);
    expect(body.changeAmount).toBe(5000);
  });
});

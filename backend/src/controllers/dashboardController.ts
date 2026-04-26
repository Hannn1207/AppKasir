import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Parses a YYYY-MM-DD date string and returns the start (00:00:00.000)
 * and end (23:59:59.999) of that day as Date objects in LOCAL time.
 * Falls back to today if the string is missing or invalid.
 */
function parseDayRange(dateStr: string | undefined): { start: Date; end: Date } {
  let year: number, month: number, day: number;

  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-').map(Number);
    year = parts[0];
    month = parts[1] - 1; // 0-indexed
    day = parts[2];
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
    day = now.getDate();
  }

  // Use local time (not UTC) so filter matches server's local timezone
  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59, 999);

  return { start, end };
}

/**
 * GET /api/dashboard/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns total income, total transactions, and total items sold for the date range.
 * Defaults to today if startDate/endDate are not provided.
 * Requirements: 5.1, 5.2, 5.3, 5.9
 */
export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  const { start } = parseDayRange(startDate);
  const { end } = parseDayRange(endDate);

  try {
    // Count transactions and sum totalAmount in one aggregate query
    const [aggregate, itemsAggregate] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.transactionItem.aggregate({
        where: {
          transaction: {
            createdAt: { gte: start, lte: end },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    res.json({
      totalIncome: Number(aggregate._sum.totalAmount ?? 0),
      totalTransactions: aggregate._count.id,
      totalItemsSold: itemsAggregate._sum.quantity ?? 0,
    });
  } catch (err) {
    console.error('getDashboardSummary error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/dashboard/popular?date=YYYY-MM-DD
 * Returns chart data (all products ordered by totalQuantity desc) and
 * topProducts (top 5 by totalQuantity).
 * Defaults to today if date is not provided.
 * Requirements: 5.5, 5.7
 */
export async function getPopularProducts(req: Request, res: Response): Promise<void> {
  const { date } = req.query as { date?: string };
  const { start, end } = parseDayRange(date);

  try {
    // Group transaction items by product within the date range
    const grouped = await prisma.transactionItem.groupBy({
      by: ['productId', 'productNameSnapshot'],
      where: {
        transaction: {
          createdAt: { gte: start, lte: end },
        },
      },
      _sum: { quantity: true },
      orderBy: {
        _sum: { quantity: 'desc' },
      },
    });

    const chart = grouped.map((row) => ({
      productId: row.productId,
      productName: row.productNameSnapshot,
      totalQuantity: row._sum.quantity ?? 0,
    }));

    const topProducts = chart.slice(0, 5);

    res.json({ chart, topProducts });
  } catch (err) {
    console.error('getPopularProducts error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/dashboard/export?date=YYYY-MM-DD
 * Returns flattened export rows (one row per transaction item) for the given date.
 * Each row contains: namaMenu, jumlahDibeli, totalHarga, namaKasir, namaCustomer.
 * Defaults to today if date is not provided.
 * Requirements: 5.11, 5.12, 5.13
 */
export async function getExportData(req: Request, res: Response): Promise<void> {
  const { date } = req.query as { date?: string };
  const { start, end } = parseDayRange(date);

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        cashier: {
          select: { fullName: true },
        },
        items: {
          select: {
            productNameSnapshot: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const rows = transactions.flatMap((tx) =>
      tx.items.map((item) => ({
        namaMenu: item.productNameSnapshot,
        jumlahDibeli: item.quantity,
        totalHarga: Number(item.subtotal),
        namaKasir: tx.cashier.fullName,
        namaCustomer: tx.customerName,
      }))
    );

    res.json(rows);
  } catch (err) {
    console.error('getExportData error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/dashboard/transactions?date=YYYY-MM-DD
 * Returns all transactions for the given date with cashier info and items.
 * Defaults to today if date is not provided.
 * Requirements: 5.8
 */
export async function getDashboardTransactions(req: Request, res: Response): Promise<void> {
  const { date } = req.query as { date?: string };
  const { start, end } = parseDayRange(date);

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        cashier: {
          select: { fullName: true },
        },
        items: {
          select: {
            id: true,
            productNameSnapshot: true,
            quantity: true,
            unitPriceSnapshot: true,
            subtotal: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = transactions.map((tx) => ({
      id: tx.id,
      cashierId: tx.cashierId,
      customerName: tx.customerName,
      totalAmount: Number(tx.totalAmount),
      amountPaid: Number(tx.amountPaid),
      changeAmount: Number(tx.changeAmount),
      createdAt: tx.createdAt,
      cashier: {
        fullName: tx.cashier.fullName,
      },
      items: tx.items.map((item) => ({
        id: item.id,
        productNameSnapshot: item.productNameSnapshot,
        quantity: item.quantity,
        unitPriceSnapshot: Number(item.unitPriceSnapshot),
        subtotal: Number(item.subtotal),
      })),
    }));

    res.json(result);
  } catch (err) {
    console.error('getDashboardTransactions error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * GET /api/stock
 * Returns all products with stock info including isLowStock and isOverCapacity flags.
 * Requirements: 6.1, 6.4, 6.5, 6.6, 6.7
 */
export async function listStock(req: Request, res: Response): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        stockQuantity: true,
        maxCapacity: true,
        stockHistories: {
          where: { changeType: 'addition' },
          orderBy: { recordedAt: 'desc' },
          take: 1,
          select: { recordedAt: true },
        },
      },
    });

    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stockQuantity: p.stockQuantity,
      maxCapacity: p.maxCapacity,
      isLowStock: p.stockQuantity <= 5,
      isOverCapacity: p.maxCapacity > 0 && p.stockQuantity >= p.maxCapacity,
      lastAddedAt: p.stockHistories[0]?.recordedAt ?? null,
    }));

    res.json(result);
  } catch (err) {
    console.error('listStock error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/stock/:productId/add
 * Adds stock to a product and records a StockHistory entry.
 * Requirements: 6.2, 6.3, 6.9, 6.10
 */
export async function addStock(req: Request, res: Response): Promise<void> {
  const productId = parseInt(req.params.productId, 10);

  if (isNaN(productId)) {
    res.status(400).json({ error: 'ID produk tidak valid' });
    return;
  }

  const { quantity } = req.body as { quantity?: unknown };

  if (quantity === undefined || quantity === null) {
    res.status(400).json({ error: 'Jumlah penambahan stok wajib diisi' });
    return;
  }

  const quantityNum = Number(quantity);

  if (isNaN(quantityNum) || quantityNum <= 0 || !Number.isInteger(quantityNum)) {
    res.status(400).json({ error: 'Jumlah penambahan stok harus berupa bilangan bulat lebih dari 0' });
    return;
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan' });
      return;
    }

    const newStock = product.stockQuantity + quantityNum;

    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
        select: {
          id: true,
          name: true,
          price: true,
          stockQuantity: true,
          maxCapacity: true,
        },
      }),
      prisma.stockHistory.create({
        data: {
          productId,
          changeType: 'addition',
          quantityChange: quantityNum,
          stockAfter: newStock,
        },
      }),
    ]);

    res.json({
      ...updatedProduct,
      price: Number(updatedProduct.price),
    });
  } catch (err) {
    console.error('addStock error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * GET /api/stock/:productId/history
 * Returns stock history for a product ordered by recordedAt descending.
 * Requirements: 6.10, 6.11
 */
export async function getStockHistory(req: Request, res: Response): Promise<void> {
  const productId = parseInt(req.params.productId, 10);

  if (isNaN(productId)) {
    res.status(400).json({ error: 'ID produk tidak valid' });
    return;
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan' });
      return;
    }

    const history = await prisma.stockHistory.findMany({
      where: { productId },
      orderBy: { recordedAt: 'desc' },
    });

    res.json(history);
  } catch (err) {
    console.error('getStockHistory error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

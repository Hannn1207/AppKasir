import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * GET /api/products
 * Returns all products ordered by name.
 * Supports ?search=query for case-insensitive name filtering.
 * Requirements: 1.1, 1.7
 */
export async function listProducts(req: Request, res: Response): Promise<void> {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

  try {
    const products = await prisma.product.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        price: true,
        stockQuantity: true,
        maxCapacity: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert Decimal price to number for JSON serialization
    const result = products.map((p) => ({
      ...p,
      price: Number(p.price),
    }));

    res.json(result);
  } catch (err) {
    console.error('listProducts error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * POST /api/products
 * Creates a new product.
 * Requirements: 1.2, 1.5, 1.6
 */
export async function createProduct(req: Request, res: Response): Promise<void> {
  const { name, price, stockQuantity, maxCapacity } = req.body as {
    name?: unknown;
    price?: unknown;
    stockQuantity?: unknown;
    maxCapacity?: unknown;
  };

  // Validate name
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Nama produk wajib diisi' });
    return;
  }

  // Validate price
  if (price === undefined || price === null) {
    res.status(400).json({ error: 'Harga produk wajib diisi' });
    return;
  }
  const priceNum = Number(price);
  if (isNaN(priceNum) || priceNum <= 0) {
    res.status(400).json({ error: 'Harga produk harus lebih dari 0' });
    return;
  }

  // Validate stockQuantity (optional, defaults to 0)
  let stockQty = 0;
  if (stockQuantity !== undefined && stockQuantity !== null) {
    stockQty = Number(stockQuantity);
    if (isNaN(stockQty) || stockQty < 0 || !Number.isInteger(stockQty)) {
      res.status(400).json({ error: 'Jumlah stok harus berupa bilangan bulat non-negatif' });
      return;
    }
  }

  // Validate maxCapacity (optional, defaults to 0)
  let maxCap = 0;
  if (maxCapacity !== undefined && maxCapacity !== null) {
    maxCap = Number(maxCapacity);
    if (isNaN(maxCap) || maxCap < 0 || !Number.isInteger(maxCap)) {
      res.status(400).json({ error: 'Kapasitas maksimal harus berupa bilangan bulat non-negatif' });
      return;
    }
  }

  try {
    // Check for duplicate name
    const existing = await prisma.product.findUnique({ where: { name: name.trim() } });
    if (existing) {
      res.status(409).json({ error: 'Nama produk sudah digunakan' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: priceNum,
        stockQuantity: stockQty,
        maxCapacity: maxCap,
        category: typeof req.body.category === 'string' && req.body.category.trim()
          ? req.body.category.trim()
          : 'Lainnya',
      },
      select: {
        id: true,
        name: true,
        price: true,
        stockQuantity: true,
        maxCapacity: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({ ...product, price: Number(product.price) });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * PUT /api/products/:id
 * Updates an existing product.
 * Requirements: 1.3, 1.5, 1.6
 */
export async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  const { name, price, stockQuantity, maxCapacity } = req.body as {
    name?: unknown;
    price?: unknown;
    stockQuantity?: unknown;
    maxCapacity?: unknown;
  };

  // Build update data — only include fields that were provided
  const data: {
    name?: string;
    price?: number;
    stockQuantity?: number;
    maxCapacity?: number;
    category?: string;
  } = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Nama produk tidak boleh kosong' });
      return;
    }
    data.name = name.trim();
  }

  if (price !== undefined) {
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      res.status(400).json({ error: 'Harga produk harus lebih dari 0' });
      return;
    }
    data.price = priceNum;
  }

  if (stockQuantity !== undefined) {
    const stockQty = Number(stockQuantity);
    if (isNaN(stockQty) || stockQty < 0 || !Number.isInteger(stockQty)) {
      res.status(400).json({ error: 'Jumlah stok harus berupa bilangan bulat non-negatif' });
      return;
    }
    data.stockQuantity = stockQty;
  }

  if (maxCapacity !== undefined) {
    const maxCap = Number(maxCapacity);
    if (isNaN(maxCap) || maxCap < 0 || !Number.isInteger(maxCap)) {
      res.status(400).json({ error: 'Kapasitas maksimal harus berupa bilangan bulat non-negatif' });
      return;
    }
    data.maxCapacity = maxCap;
  }

  // Handle category update
  const categoryRaw = (req.body as { category?: unknown }).category;
  if (categoryRaw !== undefined && typeof categoryRaw === 'string' && categoryRaw.trim()) {
    data.category = categoryRaw.trim();
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Produk tidak ditemukan' });
      return;
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.product.findUnique({ where: { name: data.name } });
      if (nameConflict) {
        res.status(409).json({ error: 'Nama produk sudah digunakan' });
        return;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        price: true,
        stockQuantity: true,
        maxCapacity: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ ...updated, price: Number(updated.price) });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * DELETE /api/products/:id
 * Deletes a product.
 * Requirements: 1.4
 */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'ID tidak valid' });
    return;
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Produk tidak ditemukan' });
      return;
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

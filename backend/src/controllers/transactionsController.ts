import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * POST /api/transactions
 * Creates a new transaction atomically:
 *   1. Validates cart (1–50 items), quantities, and payment
 *   2. Saves Transaction + TransactionItems (with name/price snapshots)
 *   3. Reduces stockQuantity for each product
 *   4. Records StockHistory (changeType: 'reduction') for each product
 * Requirements: 2.1, 2.5, 2.7, 4.5, 6.8, 8.5
 */
export async function createTransaction(req: Request, res: Response): Promise<void> {
  const { customerName, amountPaid, items } = req.body as {
    customerName?: unknown;
    amountPaid?: unknown;
    items?: unknown;
  };

  // Validate customerName
  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    res.status(400).json({ error: 'Nama customer wajib diisi' });
    return;
  }

  // Validate amountPaid
  if (amountPaid === undefined || amountPaid === null) {
    res.status(400).json({ error: 'Jumlah pembayaran wajib diisi' });
    return;
  }
  const amountPaidNum = Number(amountPaid);
  if (isNaN(amountPaidNum) || amountPaidNum <= 0) {
    res.status(400).json({ error: 'Jumlah pembayaran harus lebih dari 0' });
    return;
  }

  // Validate items array
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Items harus berupa array' });
    return;
  }
  if (items.length === 0) {
    res.status(400).json({ error: 'Pesanan harus memiliki minimal 1 produk' });
    return;
  }
  if (items.length > 50) {
    res.status(400).json({ error: 'Pesanan tidak boleh melebihi 50 jenis produk' });
    return;
  }

  // Validate each item's shape
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as { productId?: unknown; quantity?: unknown };
    if (!item || typeof item !== 'object') {
      res.status(400).json({ error: `Item ke-${i + 1} tidak valid` });
      return;
    }
    const qty = Number(item.quantity);
    if (!item.productId || isNaN(Number(item.productId))) {
      res.status(400).json({ error: `Item ke-${i + 1}: productId tidak valid` });
      return;
    }
    if (item.quantity === undefined || item.quantity === null || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      res.status(400).json({ error: `Item ke-${i + 1}: kuantitas harus berupa bilangan bulat lebih dari 0` });
      return;
    }
  }

  // Fetch all products in one query
  const productIds = (items as Array<{ productId: number; quantity: number }>).map((i) =>
    Number(i.productId)
  );

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, stockQuantity: true },
    });

    // Build a map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate each item against actual product data
    const typedItems = items as Array<{ productId: number; quantity: number }>;
    for (let i = 0; i < typedItems.length; i++) {
      const item = typedItems[i];
      const product = productMap.get(Number(item.productId));
      if (!product) {
        res.status(400).json({ error: `Produk dengan ID ${item.productId} tidak ditemukan` });
        return;
      }
      if (item.quantity > product.stockQuantity) {
        res.status(400).json({
          error: `Kuantitas produk "${product.name}" melebihi stok yang tersedia (stok: ${product.stockQuantity})`,
        });
        return;
      }
    }

    // Calculate total
    let total = 0;
    for (const item of typedItems) {
      const product = productMap.get(Number(item.productId))!;
      total += Number(product.price) * item.quantity;
    }

    // Validate payment sufficiency
    if (amountPaidNum < total) {
      res.status(400).json({
        error: `Pembayaran tidak mencukupi. Total: ${total}, dibayar: ${amountPaidNum}`,
      });
      return;
    }

    const changeAmount = amountPaidNum - total;
    const cashierId = req.user!.id;

    // Execute everything in a single database transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create the Transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          cashierId,
          customerName: customerName.trim(),
          totalAmount: total,
          amountPaid: amountPaidNum,
          changeAmount,
        },
      });

      // 2. Create TransactionItems + update stock + create StockHistory for each item
      const createdItems = [];
      for (const item of typedItems) {
        const product = productMap.get(Number(item.productId))!;
        const subtotal = Number(product.price) * item.quantity;
        const newStock = product.stockQuantity - item.quantity;

        // Create TransactionItem with snapshot
        const txItem = await tx.transactionItem.create({
          data: {
            transactionId: newTransaction.id,
            productId: Number(item.productId),
            productNameSnapshot: product.name,
            unitPriceSnapshot: Number(product.price),
            quantity: item.quantity,
            subtotal,
          },
        });
        createdItems.push(txItem);

        // Reduce stock
        await tx.product.update({
          where: { id: Number(item.productId) },
          data: { stockQuantity: newStock },
        });

        // Record StockHistory (reduction)
        await tx.stockHistory.create({
          data: {
            productId: Number(item.productId),
            changeType: 'reduction',
            quantityChange: item.quantity,
            stockAfter: newStock,
          },
        });
      }

      return { transaction: newTransaction, items: createdItems };
    });

    // Build response
    res.status(201).json({
      id: transaction.transaction.id,
      cashierId: transaction.transaction.cashierId,
      customerName: transaction.transaction.customerName,
      totalAmount: Number(transaction.transaction.totalAmount),
      amountPaid: Number(transaction.transaction.amountPaid),
      changeAmount: Number(transaction.transaction.changeAmount),
      createdAt: transaction.transaction.createdAt,
      items: transaction.items.map((item) => ({
        id: item.id,
        transactionId: item.transactionId,
        productId: item.productId,
        productNameSnapshot: item.productNameSnapshot,
        unitPriceSnapshot: Number(item.unitPriceSnapshot),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
    });
  } catch (err) {
    console.error('createTransaction error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

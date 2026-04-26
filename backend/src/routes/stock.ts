import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { listStock, addStock, getStockHistory } from '../controllers/stockController';

const router = Router();

// All stock routes require authentication as kasir
router.use(authenticateJWT);
router.use(requireRole('kasir'));

// GET /api/stock — list all products with stock info
router.get('/', listStock);

// POST /api/stock/:productId/add — add stock to a product
router.post('/:productId/add', addStock);

// GET /api/stock/:productId/history — get stock history for a product
router.get('/:productId/history', getStockHistory);

export default router;

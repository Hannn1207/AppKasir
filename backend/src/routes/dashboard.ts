import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  getDashboardSummary,
  getPopularProducts,
  getDashboardTransactions,
  getExportData,
} from '../controllers/dashboardController';

const router = Router();

// All dashboard routes require authentication as kasir
router.use(authenticateJWT);
router.use(requireRole('kasir'));

// GET /api/dashboard/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/summary', getDashboardSummary);

// GET /api/dashboard/popular?date=YYYY-MM-DD
router.get('/popular', getPopularProducts);

// GET /api/dashboard/transactions?date=YYYY-MM-DD
router.get('/transactions', getDashboardTransactions);

// GET /api/dashboard/export?date=YYYY-MM-DD
router.get('/export', getExportData);

export default router;

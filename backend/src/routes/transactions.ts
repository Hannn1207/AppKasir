import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { createTransaction } from '../controllers/transactionsController';

const router = Router();

// All transaction routes require authentication as kasir
router.use(authenticateJWT);
router.use(requireRole('kasir'));

// POST /api/transactions — create new transaction
router.post('/', createTransaction);

export default router;

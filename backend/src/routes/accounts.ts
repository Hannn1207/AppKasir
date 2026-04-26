import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  listAccounts,
  createAccount,
  deactivateAccount,
  deleteAccount,
  changePassword,
} from '../controllers/accountsController';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// GET /api/accounts — list all kasir accounts (admin only)
router.get('/', requireRole('admin'), listAccounts);

// POST /api/accounts — create new kasir account (admin only)
router.post('/', requireRole('admin'), createAccount);

// PUT /api/accounts/me/password — change own password (any authenticated user)
// NOTE: This route must be defined BEFORE /:id routes to avoid "me" being parsed as an id
router.put('/me/password', changePassword);

// PUT /api/accounts/:id/deactivate — deactivate kasir account (admin only)
router.put('/:id/deactivate', requireRole('admin'), deactivateAccount);

// DELETE /api/accounts/:id — delete kasir account (admin only)
router.delete('/:id', requireRole('admin'), deleteAccount);

export default router;

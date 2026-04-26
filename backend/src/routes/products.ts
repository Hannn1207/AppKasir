import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productsController';

const router = Router();

// All product routes require authentication as kasir
router.use(authenticateJWT);
router.use(requireRole('kasir'));

// GET /api/products — list all products (supports ?search=)
router.get('/', listProducts);

// POST /api/products — create new product
router.post('/', createProduct);

// PUT /api/products/:id — update product
router.put('/:id', updateProduct);

// DELETE /api/products/:id — delete product
router.delete('/:id', deleteProduct);

export default router;

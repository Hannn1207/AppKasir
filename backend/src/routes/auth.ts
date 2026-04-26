import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout } from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

/**
 * Rate limiter: max 10 requests per minute on login endpoint.
 * Requirements: 8.7 (brute-force protection)
 */
const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.' },
});

// POST /api/auth/login — public, rate-limited
router.post('/login', loginRateLimiter, login);

// POST /api/auth/logout — requires valid JWT
router.post('/logout', authenticateJWT, logout);

export default router;

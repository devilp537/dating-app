import { Router } from 'express';
import { getMatches } from '../controllers/match.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// استفاده از نام جدید میدل‌ور
router.use(authMiddleware);

router.get('/', getMatches);

export default router;
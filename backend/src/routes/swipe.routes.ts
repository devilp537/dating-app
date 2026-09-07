// backend/src/routes/swipe.routes.ts
import { Router } from 'express';
import { getRecommendations, swipeAction } from '../controllers/swipe.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/recommendations', getRecommendations);
router.post('/action', swipeAction);

export default router;
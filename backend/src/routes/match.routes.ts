import { Router } from 'express';
import { getMatches } from '../controllers/match.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/', getMatches);

export default router;
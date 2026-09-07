import { Router } from 'express';
import { updateProfile, getProfile } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Middleware محافظتی روی تمام روت‌های این فایل اعمال می‌شود
router.use(requireAuth);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
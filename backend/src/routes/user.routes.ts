// src/routes/user.routes.ts
import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  getDiscoveryUsers, 
  swipeUser 
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// مسیرهای لاگین و OTP از اینجا حذف شدند و فقط در auth.routes.ts هستند

// مسیرهای پروفایل و دیسکاوری (نیاز به احراز هویت دارند)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/discovery', authMiddleware, getDiscoveryUsers);
router.post('/swipe', authMiddleware, swipeUser);

export default router;
import { Router } from 'express';
import { 
  requestOtp, 
  verifyOtp, 
  getProfile, // این تابع جا افتاده بود
  updateProfile, 
  getDiscoveryUsers, 
  swipeUser 
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// مسیرهای احراز هویت
router.post('/login', requestOtp);
router.post('/verify', verifyOtp);

// مسیرهای پروفایل و دیسکاوری (نیاز به احراز هویت دارند)
router.get('/profile', authMiddleware, getProfile); // اضافه شدن مسیر دریافت پروفایل
router.put('/profile', authMiddleware, updateProfile);
router.get('/discovery', authMiddleware, getDiscoveryUsers);
router.post('/swipe', authMiddleware, swipeUser);

export default router;
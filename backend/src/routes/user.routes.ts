// src/routes/user.routes.ts
import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  getDiscoveryUsers, 
  swipeUser,
  blockUser,
  reportUser,
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema, swipeSchema, blockReportSchema } from '../validators/user.validator'; // همه رو توی یک خط ایمپورت کردیم

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.get('/discovery', authMiddleware, getDiscoveryUsers);

// اعمال Zod روی آپدیت پروفایل و لایک کردن
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);
router.post('/swipe', authMiddleware, validate(swipeSchema), swipeUser);

// 👈 اینجا از کلمه درست validate استفاده کردیم و authMiddleware رو هم اضافه کردیم
router.post('/block', authMiddleware, validate(blockReportSchema), blockUser);
router.post('/report', authMiddleware, validate(blockReportSchema), reportUser);

export default router;
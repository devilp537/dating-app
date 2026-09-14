// src/routes/user.routes.ts
import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  getDiscoveryUsers, 
  swipeUser 
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
// ایمپورت میدلور و قوانین Zod 👇
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema, swipeSchema } from '../validators/user.validator';

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.get('/discovery', authMiddleware, getDiscoveryUsers);

// اعمال Zod روی آپدیت پروفایل و لایک کردن 👇
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);
router.post('/swipe', authMiddleware, validate(swipeSchema), swipeUser);

export default router;
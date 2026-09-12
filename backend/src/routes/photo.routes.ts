import { Router } from 'express';
import { requestPhotoUpload } from '../controllers/photo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// استفاده از نام جدید و استاندارد میدل‌ور
router.use(authMiddleware);
router.post('/upload-request', requestPhotoUpload);

export default router;
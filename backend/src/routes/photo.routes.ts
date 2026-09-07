import { Router } from 'express';
import { requestPhotoUpload } from '../controllers/photo.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.post('/upload-request', requestPhotoUpload);

export default router;
import { Router } from 'express';
import { sendMessage, getMessages } from '../controllers/chat.controller';
import { getMatches } from '../controllers/match.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ۱. این مسیر حتماً باید اول باشد تا Express آن را شکار کند
router.get('/matches', authMiddleware, getMatches);

// ۲. مسیرهای دارای پارامتر متغیر (مثل targetId) باید همیشه در انتهای فایل باشند
router.get('/:targetId', authMiddleware, getMessages);

// ۳. مسیر ارسال پیام
router.post('/', authMiddleware, sendMessage);

export default router;
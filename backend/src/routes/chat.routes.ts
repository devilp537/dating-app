import { Router } from 'express';
import { getMatches, getMessages, sendMessage } from '../controllers/chat.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/matches', requireAuth, getMatches);
router.get('/messages/:otherUserId', requireAuth, getMessages);
router.post('/messages', requireAuth, sendMessage);

export default router;
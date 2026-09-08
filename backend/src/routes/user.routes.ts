import { Router } from 'express';
import { requestOtp, verifyOtp, getProfile, updateProfile, getDiscoveryUsers, swipeUser } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', requestOtp);
router.post('/verify', verifyOtp);

router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.get('/discovery', requireAuth, getDiscoveryUsers); 
router.post('/swipe', requireAuth, swipeUser);

export default router;
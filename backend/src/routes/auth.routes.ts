import { Router } from 'express';
import { requestOtp, verifyOtp } from '../controllers/auth.controller';

const router = Router();

// تغییر نام مسیرها برای مطابقت با درخواست‌های فرانت‌اند (/api/auth/login و /api/auth/verify)
router.post('/login', requestOtp);
router.post('/verify', verifyOtp);

export default router;
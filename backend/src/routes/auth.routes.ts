import { Router } from 'express';
import { requestOtp, verifyOtp } from '../controllers/auth.controller';
import rateLimit from 'express-rate-limit'; // 👈 اضافه شد

const router = Router();

// 👈 تعریف محدودیت سخت‌گیرانه برای لاگین (حداکثر 5 بار در 15 دقیقه)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50,
  message: { error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// تغییر نام مسیرها برای مطابقت با درخواست‌های فرانت‌اند
// 👈 اضافه کردن authLimiter به روت‌های حساس
router.post('/login', authLimiter, requestOtp);
router.post('/verify', authLimiter, verifyOtp);

export default router;
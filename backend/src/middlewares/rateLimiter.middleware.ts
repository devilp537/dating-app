// src/middlewares/rateLimiter.middleware.ts
import rateLimit from 'express-rate-limit';

// محدودیت سخت‌گیرانه برای درخواست OTP (ارسال پیامک)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // مدت زمان: ۱۵ دقیقه
  max: 5, // حداکثر تعداد درخواست مجاز در این ۱۵ دقیقه برای هر IP
  message: { 
    error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.' 
  },
  standardHeaders: true, // هدرهای استاندارد RateLimit را برمی‌گرداند
  legacyHeaders: false, // هدرهای قدیمی را غیرفعال می‌کند
});

// محدودیت کلی برای بقیه APIها (اختیاری برای استفاده‌های بعدی)
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ۱۵ دقیقه
  max: 100, // حداکثر ۱۰۰ درخواست در ۱۵ دقیقه
  message: { 
    error: 'درخواست‌های بیش از حد به سرور. کمی صبر کنید.' 
  }
});
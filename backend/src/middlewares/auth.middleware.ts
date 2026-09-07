import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// اضافه کردن userId به type استاندارد Request در Express
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'دسترسی غیرمجاز: توکن ارسال نشده است' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token) as { userId: string } | null;

  if (!decoded || !decoded.userId) {
    res.status(401).json({ error: 'دسترسی غیرمجاز: توکن نامعتبر یا منقضی شده است' });
    return;
  }

  // ذخیره آیدی کاربر در آبجکت ریکوئست برای استفاده در کنترلرها
  req.userId = decoded.userId;
  next();
};
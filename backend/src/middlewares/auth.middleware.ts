import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// معرفی فیلد userId به تایپ‌های پیش‌فرض Express
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'توکن احراز هویت ارسال نشده است.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // استفاده از متغیر محیطی به جای هاردکد کردن SUPER_SECRET_KEY
    const secret = process.env.JWT_SECRET || 'SUPER_SECRET_KEY';
    
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    res.status(403).json({ error: 'توکن نامعتبر یا منقضی شده است.' });
  }
};
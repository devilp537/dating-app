import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = 'SUPER_SECRET_KEY'; // دقیقاً همان کلید بالا

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  console.log('--- Auth Middleware Triggered ---');
  const authHeader = req.headers.authorization;

  console.log('Auth Header Received:', authHeader ? 'Yes' : 'No');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Failed: No Bearer Token');
    res.status(401).json({ error: 'توکن ارائه نشده است' });
    return;
  }

  const token = authHeader.split(' ')[1];
  console.log('Token extracted:', token.substring(0, 20) + '...'); 

  try {
    const payload = jwt.verify(token, SECRET) as { userId: string };
    req.userId = payload.userId;
    console.log('Token Verified! UserID:', req.userId);
    next();
  } catch (error) {
    console.log('Failed: Token Verification Error', error);
    res.status(401).json({ error: 'توکن نامعتبر یا منقضی شده است' });
  }
};
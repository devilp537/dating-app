import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. گسترش تایپ Request اکسپرس
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const SECRET_KEY = process.env.JWT_SECRET;

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!SECRET_KEY) {
    res.status(500).json({ error: 'Server misconfiguration: JWT secret missing' });
    return;
  }

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied: No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// استفاده از z.ZodSchema که با نسخه‌های جدید سازگار است
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log('🔴 Zod Validation Blocked Request:', error.issues);
        res.status(400).json({
          error: 'داده‌های ورودی نامعتبر است',
          // در نسخه‌های جدید از issues به جای errors استفاده می‌شود
          details: error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      next(error);
    }
  };
};
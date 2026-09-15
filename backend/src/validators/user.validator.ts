// src/validators/user.validator.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ حرف باشد').max(50, 'نام خیلی طولانی است').optional(),
  age: z.number().min(18, 'حداقل سن ۱۸ سال است').max(100, 'سن وارد شده نامعتبر است').optional(),
  bio: z.string().max(500, 'بایو نمی‌تواند بیشتر از ۵۰۰ حرف باشد').optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  province: z.string().min(2, 'نام استان نامعتبر است').optional(),
  city: z.string().min(2, 'نام شهر نامعتبر است').optional(),
  contactId: z.string().optional(),
  showPhoneNumber: z.boolean().optional(),
});

export const swipeSchema = z.object({
  // جایگزینی required_error با message 
  targetUserId: z.string({ message: 'آیدی کاربر هدف الزامی است' }),
  interactionType: z.enum(['LIKE', 'PASS'], { message: 'نوع تعامل نامعتبر است' })
});

export const blockReportSchema = z.object({
  targetUserId: z.string({ message: 'آیدی کاربر هدف الزامی است' }),
  reason: z.string().optional() // برای ریپورت، دلیل اختیاری/اجباری
});
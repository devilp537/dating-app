import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد").optional(),
  bio: z.string().max(500, "بیوگرافی طولانی است").optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  searchGender: z.enum(['MALE', 'FEMALE']).optional(),
  city: z.string().optional(),
  // فعلا برای MVP، طول و عرض جغرافیایی را از کلاینت می‌گیریم (بر اساس شهر)
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId; // دریافت شده از Middleware
    if (!userId) {
      res.status(401).json({ error: 'کاربر شناسایی نشد' });
      return;
    }

    const validatedData = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
    });

    res.json({ message: 'پروفایل با موفقیت به‌روزرسانی شد', user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'خطای سرور در ذخیره پروفایل' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { contactInfo: true, photos: true }, // اطلاعات تماس و عکس‌ها هم برگردانده شود
    });

    if (!user) {
      res.status(404).json({ error: 'کاربر یافت نشد' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'خطای سرور' });
  }
};
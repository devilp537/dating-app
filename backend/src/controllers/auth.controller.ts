import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { z } from 'zod';

const phoneSchema = z.object({
  phoneNumber: z.string().min(10, "شماره تماس نامعتبر است"),
});

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = phoneSchema.parse(req.body);
    
    // در دنیای واقعی اینجا متد ارسال پیامک صدا زده می‌شود
    // فعلا فرض می‌کنیم کد 12345 ارسال شده است
    res.json({ message: 'کد تایید ارسال شد', mockOtp: '12345' });
  } catch (error) {
    res.status(400).json({ error: 'فرمت اطلاعات اشتباه است' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, otp } = req.body;

    if (otp !== '12345') {
      res.status(401).json({ error: 'کد تایید اشتباه است' });
      return;
    }

    // بررسی وجود کاربر یا ثبت‌نام کاربر جدید
    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          name: 'کاربر جدید', // بعدا در تکمیل پروفایل ویرایش می‌شود
        },
      });
      // ایجاد ContactInfo خالی برای کاربر جدید
      await prisma.contactInfo.create({
        data: { userId: user.id },
      });
    }

    const token = generateToken(user.id);
    res.json({ message: 'لاگین موفقیت‌آمیز', token, user });
  } catch (error) {
    res.status(500).json({ error: 'خطای سرور' });
  }
};
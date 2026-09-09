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
    res.json({ message: 'کد تایید ارسال شد', mockOtp: '12345' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
       res.status(400).json({ error: 'فرمت اطلاعات اشتباه است', details: error.issues });
       return;
    }
    res.status(400).json({ error: 'خطایی رخ داد' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, otp } = req.body;

    if (otp !== '12345') {
      res.status(401).json({ error: 'کد تایید اشتباه است' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { phoneNumber } });

    if (!user) {
      user = await prisma.user.create({
        data: { phoneNumber, name: 'کاربر جدید' },
      });
      await prisma.contactInfo.create({ data: { userId: user.id } });
    }

    const token = generateToken(user.id);
    res.json({ message: 'لاگین موفقیت‌آمیز', token, user });
  } catch (error) {
    res.status(500).json({ error: 'خطای سرور' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { contactInfo: true },
    });
    
    if (!user) {
      res.status(404).json({ error: 'کاربری یافت نشد' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'خطا در دریافت اطلاعات پروفایل' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    // اضافه شدن contactId و showPhoneNumber به مقادیر دریافتی
    const { name, bio, gender, contactId, showPhoneNumber } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name, 
        bio, 
        gender,
        contactId,
        showPhoneNumber: Boolean(showPhoneNumber)
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'خطا در بروزرسانی پروفایل' });
  }
};

export const getDiscoveryUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { gender: true },
    });

    // بررسی سخت‌گیرانه: اگر کاربر جنسیت ندارد، باید خطای 400 بدهد (اینجا فرانت‌اند کاربر را به Onboarding می‌فرستد)
    if (!currentUser || !currentUser.gender) {
      res.status(400).json({ error: 'لطفاً ابتدا پروفایل و جنسیت خود را تکمیل کنید.' });
      return;
    }

    // انتخاب جنسیت مخالف به صورت خودکار
    const targetGender = currentUser.gender === 'MALE' ? 'FEMALE' : 'MALE';

    const pastInteractions = await prisma.interaction.findMany({
      where: { swiperId: req.userId },
      select: { targetId: true },
    });
    
    const excludeIds = pastInteractions.map(i => i.targetId);
    excludeIds.push(req.userId as string); 

    const users = await prisma.user.findMany({
      where: {
        gender: targetGender,
        id: { notIn: excludeIds },
      },
      select: { id: true, name: true, bio: true, gender: true },
      take: 10,
    });

    res.json(users);
  } catch (error) {
    console.error('خطای دیسکاوری:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست کاربران' });
  }
};

export const swipeUser = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('--- دریافت درخواست Swipe ---');
    console.log('Body:', req.body);
    console.log('User ID:', req.userId);

    const { targetId, type } = req.body;
    const swiperId = req.userId as string;

    const newInteraction = await prisma.interaction.create({
      data: { swiperId, targetId, type },
    });

    console.log('تراکنش با موفقیت در دیتابیس ثبت شد:', newInteraction.id);

    let isMatch = false;
    if (type === 'LIKE') {
      const reverseInteraction = await prisma.interaction.findUnique({
        where: {
          swiperId_targetId: { swiperId: targetId, targetId: swiperId },
        },
      });

      if (reverseInteraction && reverseInteraction.type === 'LIKE') {
        isMatch = true;
      }
    }

    res.json({ success: true, isMatch });
  } catch (error) {
    console.error('خطای ثبت تعامل (Swipe Error):', error);
    res.status(500).json({ error: 'خطا در ثبت تعامل' });
  }
};
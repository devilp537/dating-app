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
    // اضافه شدن age و province به همراه مقادیر قبلی
    const { name, bio, gender, contactId, showPhoneNumber, age, province } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name, 
        bio, 
        gender,
        contactId,
        showPhoneNumber: Boolean(showPhoneNumber),
        age: age ? Number(age) : undefined, // ذخیره سن
        province // ذخیره استان
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

    // بررسی اینکه آیا کاربر اصلاً در دیتابیس وجود دارد یا خیر (مدیریت ریست دیتابیس)
    if (!currentUser) {
      res.status(401).json({ error: 'کاربر یافت نشد. حساب شما پاک شده است.' });
      return;
    }

    if (!currentUser.gender) {
      res.status(400).json({ error: 'لطفاً ابتدا پروفایل و جنسیت خود را تکمیل کنید.' });
      return;
    }

    const targetGender = currentUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
    const { province } = req.query; // دریافت فیلتر استان از درخواست فرانت‌اند

    const pastInteractions = await prisma.interaction.findMany({
      where: { swiperId: req.userId },
      select: { targetId: true },
    });
    
    const excludeIds = pastInteractions.map(i => i.targetId);
    excludeIds.push(req.userId as string); 

    // ساخت داینامیک کوئری جستجو
    const whereClause: any = {
      gender: targetGender,
      id: { notIn: excludeIds },
    };

    // اگر کاربر استانی را فیلتر کرده بود، به شرط دیتابیس اضافه می‌شود
    if (province && typeof province === 'string') {
      whereClause.province = province;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, bio: true, gender: true, contactId: true }, // contactId برای مچ مودال اضافه شد
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
    const { targetId, type } = req.body;
    const swiperId = req.userId as string;

    const newInteraction = await prisma.interaction.upsert({
      where: {
        swiperId_targetId: {
          swiperId,
          targetId,
        }
      },
      update: { type },
      create: { swiperId, targetId, type },
    });

    let isMatch = false;
    if (type === 'LIKE') {
      const reverseInteraction = await prisma.interaction.findUnique({
        where: {
          swiperId_targetId: { swiperId: targetId, targetId: swiperId },
        },
      });

      if (reverseInteraction && reverseInteraction.type === 'LIKE') {
        isMatch = true;

        // مرتب‌سازی آیدی‌ها برای جلوگیری از ثبت تکراری (همیشه آیدی کوچکتر در user1)
        const [user1Id, user2Id] = swiperId < targetId 
          ? [swiperId, targetId] 
          : [targetId, swiperId];

        // ثبت قطعی مچ در دیتابیس
        await prisma.match.upsert({
          where: {
            user1Id_user2Id: { user1Id, user2Id }
          },
          update: {},
          create: { user1Id, user2Id }
        });
      }
    }

    res.json({ success: true, isMatch });
  } catch (error) {
    console.error('خطای ثبت تعامل (Swipe Error):', error);
    res.status(500).json({ error: 'خطا در ثبت تعامل' });
  }
};
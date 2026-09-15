import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// توابع requestOtp و verifyOtp از اینجا حذف شدند (چون حالا در auth.controller هستند)

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
    const { name, bio, gender, contactId, showPhoneNumber, age, province } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name, 
        bio, 
        gender,
        contactId,
        showPhoneNumber: Boolean(showPhoneNumber),
        age: age ? Number(age) : undefined,
        province
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

    if (!currentUser) {
      res.status(401).json({ error: 'کاربر یافت نشد. حساب شما پاک شده است.' });
      return;
    }

    if (!currentUser.gender) {
      res.status(400).json({ error: 'لطفاً ابتدا پروفایل و جنسیت خود را تکمیل کنید.' });
      return;
    }

    const targetGender = currentUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
    const { province } = req.query;

    const pastInteractions = await prisma.interaction.findMany({
      where: { swiperId: req.userId },
      select: { targetId: true },
    });
    
    const excludeIds = pastInteractions.map(i => i.targetId);
    excludeIds.push(req.userId as string); 

    const whereClause: any = {
      gender: targetGender,
      id: { notIn: excludeIds },
    };

    if (province && typeof province === 'string') {
      whereClause.province = province;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, bio: true, gender: true, contactId: true }, 
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
    // 👈 تغییر مهم: دریافت نام متغیرها بر اساس Zod
    const { targetUserId, interactionType } = req.body;
    const swiperId = req.userId as string;

    // ثبت در دیتابیس
    const newInteraction = await prisma.interaction.upsert({
      where: {
        swiperId_targetId: {
          swiperId: swiperId,
          targetId: targetUserId, // استفاده از متغیر جدید
        }
      },
      update: { type: interactionType }, // استفاده از متغیر جدید
      create: { 
        swiperId: swiperId, 
        targetId: targetUserId, // استفاده از متغیر جدید
        type: interactionType // استفاده از متغیر جدید
      },
    });

    let isMatch = false;
    if (interactionType === 'LIKE') {
      const reverseInteraction = await prisma.interaction.findUnique({
        where: {
          swiperId_targetId: { swiperId: targetUserId, targetId: swiperId },
        },
      });

      if (reverseInteraction && reverseInteraction.type === 'LIKE') {
        isMatch = true;

        const [user1Id, user2Id] = swiperId < targetUserId 
          ? [swiperId, targetUserId] 
          : [targetUserId, swiperId];

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

// --- مسدود کردن کاربر (Block) ---
export const blockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetUserId } = req.body;
    const userId = req.userId as string;

    // ۱. ثبت تعامل به عنوان BLOCK (اگر قبلاً لایک بوده هم به بلاک تغییر می‌کند)
    await prisma.interaction.upsert({
      where: {
        swiperId_targetId: { swiperId: userId, targetId: targetUserId }
      },
      update: { type: 'BLOCK' },
      create: { swiperId: userId, targetId: targetUserId, type: 'BLOCK' }
    });

    // ۲. اگر با این شخص مچ بودیم، مچ باید پاک شود (Unmatch)
    const [user1Id, user2Id] = userId < targetUserId 
      ? [userId, targetUserId] 
      : [targetUserId, userId];

    await prisma.match.deleteMany({
      where: { user1Id, user2Id }
    });

    res.json({ success: true, message: 'کاربر با موفقیت مسدود شد' });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({ error: 'خطا در مسدودسازی کاربر' });
  }
};

// --- گزارش دادن کاربر (Report) ---
export const reportUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetUserId, reason } = req.body;
    const reporterId = req.userId as string;

    // ۱. ثبت گزارش در دیتابیس
    await prisma.report.create({
      data: {
        reporterId,
        reportedId: targetUserId,
        reason: reason || 'گزارش رفتار نامناسب',
      }
    });

    // ۲. معمولاً وقتی کسی را ریپورت می‌کنیم، بلافاصله بلاک هم می‌شود
    await prisma.interaction.upsert({
      where: {
        swiperId_targetId: { swiperId: reporterId, targetId: targetUserId }
      },
      update: { type: 'BLOCK' },
      create: { swiperId: reporterId, targetId: targetUserId, type: 'BLOCK' }
    });

    // پاک کردن مچ در صورت وجود
    const [user1Id, user2Id] = reporterId < targetUserId 
      ? [reporterId, targetUserId] 
      : [targetUserId, reporterId];

    await prisma.match.deleteMany({
      where: { user1Id, user2Id }
    });

    res.json({ success: true, message: 'گزارش شما ثبت و کاربر مسدود شد' });
  } catch (error) {
    console.error('Report User Error:', error);
    res.status(500).json({ error: 'خطا در ثبت گزارش' });
  }
};
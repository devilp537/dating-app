import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'کاربر شناسایی نشد' });
      return;
    }

    // دریافت اطلاعات کاربر فعلی برای فیلترها
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { searchGender: true },
    });

    // پیدا کردن ID کاربرانی که قبلا با آن‌ها تعامل داشته (لایک، رد یا بلاک)
    const previousInteractions = await prisma.interaction.findMany({
      where: { actorId: userId },
      select: { targetId: true },
    });
    
    const excludedUserIds = previousInteractions.map(i => i.targetId);
    excludedUserIds.push(userId); // خود کاربر هم نباید در لیست باشد

    // ساخت شرط جستجو
    const whereCondition: any = {
      id: { notIn: excludedUserIds },
      isActive: true,
      // کاربر هدف حتما باید حداقل نام و شهرش را وارد کرده باشد تا پروفایلش نمایش داده شود
      name: { not: '' },
      city: { not: null },
    };

    // اعمال فیلتر جنسیت در صورت وجود
    if (currentUser?.searchGender) {
      whereCondition.gender = currentUser.searchGender;
    }

    // دریافت کاربران پیشنهادی (فعلا 10 نفر در هر ریکوئست - Pagination ساده)
    const recommendations = await prisma.user.findMany({
      where: whereCondition,
      take: 10,
      select: {
        id: true,
        name: true,
        bio: true,
        birthDate: true,
        gender: true,
        city: true,
        photos: {
          orderBy: { order: 'asc' },
        },
        // اطلاعات تماس (ContactInfo) قطعا اینجا دریافت و ارسال نمی‌شود (Core Security)
      },
    });

    res.json({ users: recommendations });
  } catch (error) {
    res.status(500).json({ error: 'خطای سرور در دریافت لیست پیشنهادی' });
  }
};


const actionSchema = z.object({
  targetId: z.string().uuid(),
  type: z.enum(['LIKE', 'PASS', 'BLOCK']),
});

export const swipeAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = req.userId;
    if (!actorId) {
      res.status(401).json({ error: 'کاربر شناسایی نشد' });
      return;
    }

    const { targetId, type } = actionSchema.parse(req.body);

    if (actorId === targetId) {
      res.status(400).json({ error: 'نمی‌توانید با خودتان تعامل داشته باشید' });
      return;
    }

    // ۱. بررسی اینکه آیا قبلا تعاملی ثبت شده است یا خیر
    const existingInteraction = await prisma.interaction.findUnique({
      where: {
        actorId_targetId: { actorId, targetId }
      }
    });

    if (existingInteraction) {
      res.status(400).json({ error: 'تعامل شما با این کاربر قبلا ثبت شده است' });
      return;
    }

    // ۲. ثبت تعامل جدید در دیتابیس
    await prisma.interaction.create({
      data: { actorId, targetId, type },
    });

    // ۳. اگر اکشن LIKE بود، بررسی وقوع Match
    let isMatch = false;
    if (type === 'LIKE') {
      const reciprocalLike = await prisma.interaction.findFirst({
        where: {
          actorId: targetId,
          targetId: actorId,
          type: 'LIKE',
        }
      });

      if (reciprocalLike) {
        // مچ اتفاق افتاد! ساخت رکورد مچ
        isMatch = true;
        await prisma.match.create({
          data: {
            user1Id: actorId < targetId ? actorId : targetId, // برای جلوگیری از رکوردهای تکراری، همیشه آیدی کوچکتر در user1 قرار می‌گیرد
            user2Id: actorId > targetId ? actorId : targetId,
          }
        });
      }
    }

    res.json({ message: 'عملیات با موفقیت ثبت شد', isMatch });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'دیتای ارسالی نامعتبر است' });
      return;
    }
    res.status(500).json({ error: 'خطای سرور در ثبت اکشن' });
  }
};
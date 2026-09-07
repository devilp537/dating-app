import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'کاربر شناسایی نشد' });
      return;
    }

    // پیدا کردن تمام مچ‌هایی که کاربر فعلی در آن‌ها حضور دارد (یا به عنوان user1 یا user2)
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        // دریافت اطلاعات کاربر مقابل
        user1: {
          select: {
            id: true, name: true, bio: true, city: true,
            photos: true, contactInfo: true // اطلاعات تماس در اینجا باز می‌شود
          }
        },
        user2: {
          select: {
            id: true, name: true, bio: true, city: true,
            photos: true, contactInfo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // مرتب‌سازی خروجی تا فقط اطلاعات فرد مقابل (نه خود کاربر) به فرانت‌اند ارسال شود
    const formattedMatches = matches.map(match => {
      const isUser1 = match.user1Id === userId;
      const partner = isUser1 ? match.user2 : match.user1;
      
      return {
        matchId: match.id,
        matchedAt: match.createdAt,
        partner
      };
    });

    res.json({ matches: formattedMatches });
  } catch (error) {
    res.status(500).json({ error: 'خطای سرور در دریافت لیست مچ‌ها' });
  }
};
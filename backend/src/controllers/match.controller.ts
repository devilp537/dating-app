import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, name: true, bio: true, photos: true, showPhoneNumber: true, phoneNumber: true, contactId: true, contactInfo: true }
        },
        user2: {
          select: { id: true, name: true, bio: true, photos: true, showPhoneNumber: true, phoneNumber: true, contactId: true, contactInfo: true }
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    // 🔴 فیکس امنیتی ۲: فیلتر کردن اطلاعات تماس بر اساس رضایت کاربر (Privacy Flag)
    const safeMatches = matches.map((match) => {
      const isUser1 = match.user1Id === userId;
      const otherUser = isUser1 ? match.user2 : match.user1;

      // اگر کاربر اجازه نداده باشد، اطلاعات تماسش را از خروجی API حذف می‌کنیم
      const canShareContact = otherUser.showPhoneNumber === true;

      return {
        id: match.id,
        createdAt: match.createdAt,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          bio: otherUser.bio,
          photos: otherUser.photos,
          // اعمال فیلتر امنیتی:
          phoneNumber: canShareContact ? otherUser.phoneNumber : null,
          contactId: canShareContact ? otherUser.contactId : null,
          contactInfo: canShareContact ? otherUser.contactInfo : null,
        }
      };
    });

    res.json(safeMatches);
  } catch (error) {
    console.error('Get Matches Error:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست مچ‌ها' });
  }
};
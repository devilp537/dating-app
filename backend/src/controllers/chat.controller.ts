import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// گرفتن لیست کسانی که مچ شده‌اند (هر دو به هم لایک داده‌اند)
export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;

    // پیدا کردن تمام کسانی که کاربر فعلی آن‌ها را لایک کرده است
    const myLikes = await prisma.interaction.findMany({
      where: { swiperId: userId, type: 'LIKE' },
      select: { targetId: true },
    });
    const likedIds = myLikes.map(l => l.targetId);

    // پیدا کردن کسانی که کاربر فعلی را لایک کرده‌اند و متقابلاً او هم آن‌ها را لایک کرده
    const matches = await prisma.interaction.findMany({
      where: {
        swiperId: { in: likedIds },
        targetId: userId,
        type: 'LIKE',
      },
      include: {
        swiper: {
          select: { 
            id: true, 
            name: true, 
            bio: true, 
            gender: true, 
            phoneNumber: true, 
            contactId: true, 
            showPhoneNumber: true 
          },
        },
      },
    });

    const matchedUsers = matches.map(m => m.swiper);
    res.json(matchedUsers);
  } catch (error) {
    console.error('Match Error:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست مچ‌ها' });
  }
};

// گرفتن پیام‌های بین دو کاربر
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    
    const otherUserId = Array.isArray(req.params.otherUserId) 
      ? req.params.otherUserId[0] 
      : req.params.otherUserId;

    if (!otherUserId) {
      res.status(400).json({ error: 'شناسه کاربر مقابل نامعتبر است' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ error: 'خطا در دریافت پیام‌ها' });
  }
};

// ارسال پیام جدید
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = req.userId as string;
    const { receiverId, text } = req.body;

    if (!text || !receiverId) {
      res.status(400).json({ error: 'اطلاعات ناقص است' });
      return;
    }

    const message = await prisma.message.create({
      data: { senderId, receiverId, text },
    });

    res.json(message);
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ error: 'خطا در ارسال پیام' });
  }
};
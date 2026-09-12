import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const senderId = req.userId as string;
    const receiverId = req.body.receiverId as string;
    const content = req.body.content || req.body.text; // پشتیبانی از هر دو حالت ارسالی فرانت‌اند

    if (!receiverId || !content) {
      res.status(400).json({ error: 'اطلاعات گیرنده و متن پیام الزامی است.' });
      return;
    }

    // بررسی اینکه آیا این دو کاربر واقعاً با هم مچ هستند یا خیر
    const isMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId }
        ]
      }
    });

    if (!isMatch) {
      res.status(403).json({ error: 'شما با این کاربر مچ نیستید و اجازه ارسال پیام ندارید.' });
      return;
    }

    const message = await prisma.message.create({
      // فیلد content به فیلد text که در اسکیما تعریف کردید مپ می‌شود
      data: { senderId, receiverId, text: content as string },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ error: 'خطا در ارسال پیام' });
  }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId as string;
    const targetId = req.params.targetId as string;

    if (!targetId) {
      res.status(400).json({ error: 'آیدی مخاطب نامعتبر است.' });
      return;
    }

    // جلوگیری از خواندن پیام‌های دیگران بدون داشتن مچ
    const isMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetId },
          { user1Id: targetId, user2Id: userId }
        ]
      }
    });

    if (!isMatch) {
      res.status(403).json({ error: 'دسترسی غیرمجاز' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId },
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
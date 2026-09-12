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
          select: { 
            id: true, 
            name: true, 
            age: true, 
            gender: true, 
            bio: true, 
            province: true,
            city: true,
            photos: true, 
            showPhoneNumber: true, 
            phoneNumber: true, 
            contactId: true, 
            contactInfo: true 
          }
        },
        user2: {
          select: { 
            id: true, 
            name: true, 
            age: true, 
            gender: true, 
            bio: true, 
            province: true,
            city: true,
            photos: true, 
            showPhoneNumber: true, 
            phoneNumber: true, 
            contactId: true, 
            contactInfo: true 
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    const safeMatches = matches.map((match) => {
      const isUser1 = match.user1Id === userId;
      const otherUser = isUser1 ? match.user2 : match.user1;
      
      // فقط شماره تلفن تابع این شرط است
      const canSharePhone = otherUser.showPhoneNumber === true;

      return {
        id: match.id,
        createdAt: match.createdAt,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          age: otherUser.age,
          gender: otherUser.gender,
          bio: otherUser.bio,
          province: otherUser.province,
          city: otherUser.city,
          photos: otherUser.photos,
          
          // شماره تلفن بسته به تنظیمات مخفی یا نمایش داده می‌شود
          phoneNumber: canSharePhone ? otherUser.phoneNumber : null,
          
          // آیدی و اطلاعات ارتباطی همیشه آزاد هستند و نمایش داده می‌شوند
          contactId: otherUser.contactId,
          contactInfo: otherUser.contactInfo,
        }
      };
    });

    res.json(safeMatches);
  } catch (error) {
    console.error('Get Matches Error:', error);
    res.status(500).json({ error: 'خطا در دریافت لیست مچ‌ها' });
  }
};
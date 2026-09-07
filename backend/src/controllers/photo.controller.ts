import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generatePresignedUrl } from '../utils/s3';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const requestUploadSchema = z.object({
  fileType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const requestPhotoUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'کاربر شناسایی نشد' });
      return;
    }

    const { fileType } = requestUploadSchema.parse(req.body);

    // بررسی محدودیت حداکثر ۶ عکس
    const photoCount = await prisma.photo.count({ where: { userId } });
    if (photoCount >= 6) {
      res.status(400).json({ error: 'حداکثر تعداد عکس‌ها (۶ عدد) تکمیل شده است' });
      return;
    }

    // تولید نام یکتا برای فایل
    const extension = fileType.split('/')[1];
    const fileName = `users/${userId}/${uuidv4()}.${extension}`;

    // دریافت لینک آپلود از S3
    const { uploadUrl, fileUrl } = await generatePresignedUrl(fileName, fileType);

    // ذخیره آدرس عکس در دیتابیس (عکس هنوز آپلود نشده، ولی رکوردش را می‌سازیم)
    const newPhoto = await prisma.photo.create({
      data: {
        userId,
        url: fileUrl,
        order: photoCount + 1,
      },
    });

    res.json({
      message: 'لینک آپلود ساخته شد',
      uploadUrl,
      photo: newPhoto,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'فرمت فایل پشتیبانی نمی‌شود' });
      return;
    }
    res.status(500).json({ error: 'خطای سرور در تولید لینک آپلود' });
  }
};
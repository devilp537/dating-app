import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // برای سازگاری بهتر با سرویس‌های ایرانی
});

export const generatePresignedUrl = async (fileName: string, fileType: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType,
  });

  // لینک آپلود فقط برای ۵ دقیقه اعتبار دارد
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  
  // لینک دانلود عمومی تصویر (فرض بر این است که باکت Public است)
  const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${fileName}`;

  return { uploadUrl, fileUrl };
};
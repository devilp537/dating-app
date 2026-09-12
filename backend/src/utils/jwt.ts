import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  // استفاده از متغیر محیطی با یک مقدار پشتیبان برای محیط توسعه
  const secret = process.env.JWT_SECRET || 'dating_app_super_secret_key_2026_xyz';
  
  // توکن برای ۳۰ روز معتبر خواهد بود
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
};
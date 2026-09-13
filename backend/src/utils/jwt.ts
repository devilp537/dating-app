import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  console.error("CRITICAL ERROR: JWT_SECRET is not defined in .env file!");
  process.exit(1); // سرور در صورت نبود کلید اصلا بالا نمیاد
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '30d' });
};
import jwt from 'jsonwebtoken';
const SECRET = 'SUPER_SECRET_KEY'; // هاردکد شده برای تست
export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, SECRET, { expiresIn: '30d' });
};
import jwt from 'jsonwebtoken';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  }
  return secret;
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, getSecret(), { expiresIn: '30d' });
};
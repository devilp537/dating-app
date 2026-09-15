import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes'; 
import photoRoutes from './routes/photo.routes';
import matchRoutes from './routes/match.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// ۱. تنظیم دقیق Helmet برای امنیت بیشتر و اجبار به HTTPS
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // یک سال
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ۲. تنظیم دقیق CORS برای جلوگیری از دسترسی دامنه‌های متفرقه
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8081', // آدرس پیش‌فرض اکسپو روی وب
];

app.use(cors({
  origin: (origin, callback) => {
    // اجازه به ریکوئست‌های بدون origin (مثل خود اپلیکیشن موبایل یا Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('خطای CORS: دسترسی از این دامنه مجاز نیست'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/matches', matchRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dating App API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dating App API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
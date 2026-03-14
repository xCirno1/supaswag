import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Allow the Next.js frontend to send cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 SupaCare AI Backend running on http://localhost:${PORT}`);
});
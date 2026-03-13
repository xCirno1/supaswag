import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 NutriCare AI Backend running on http://localhost:${PORT}`);
});
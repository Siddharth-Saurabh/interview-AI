import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDb from './config/connectDb.js';

import authRoutes from './routes/auth.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { seedDummyUser } from './controllers/auth.controller.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send("InterviewAI API is operational");
});

const server = app.listen(PORT, async () => {
    console.log(`InterviewAI Server running on http://localhost:${PORT}`);
    try {
        await connectDb();
    } catch (e) {}
    await seedDummyUser();
});

// Keep process active
setInterval(() => {}, 60000);
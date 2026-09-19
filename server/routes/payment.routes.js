import express from 'express';
import { getPlans, createOrder, verifyPayment } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/plans', getPlans);
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

export default router;

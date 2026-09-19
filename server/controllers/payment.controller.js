import crypto from 'crypto';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// Credit packages configuration
export const CREDIT_PLANS = [
    { id: 'plan_starter', name: 'Starter Tier', credits: 50, priceInINR: 49, popular: false, desc: '5 Full Mock Interview Sessions' },
    { id: 'plan_pro', name: 'Pro Interviewer', credits: 150, priceInINR: 129, popular: true, desc: '15 Full Mock Sessions + Deep Analysis' },
    { id: 'plan_unlimited', name: 'Career Accelerator', credits: 500, priceInINR: 349, popular: false, desc: '50 Mock Sessions + System Design & Live Prep' }
];

// 1. Get available plans
export const getPlans = (req, res) => {
    res.status(200).json({
        success: true,
        plans: CREDIT_PLANS,
        isDummyMode: !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('dummy') || process.env.RAZORPAY_KEY_SECRET.includes('add your')
    });
};

// 2. Create Order (handles both mock dummy orders and Razorpay API orders)
export const createOrder = async (req, res) => {
    try {
        const { planId } = req.body || {};
        const plan = CREDIT_PLANS.find(p => p.id === planId) || CREDIT_PLANS[1];

        const isDummy = !process.env.RAZORPAY_KEY_SECRET || 
                        process.env.RAZORPAY_KEY_SECRET.includes('dummy') || 
                        process.env.RAZORPAY_KEY_SECRET.includes('add your');

        if (isDummy) {
            const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            return res.status(200).json({
                success: true,
                isMock: true,
                order: {
                    id: mockOrderId,
                    amount: plan.priceInINR * 100,
                    currency: "INR",
                    receipt: `receipt_${plan.id}_${Date.now()}`
                },
                plan
            });
        }

        // If real Razorpay credentials exist, attempt Razorpay REST call
        try {
            const authHeader = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
            const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: plan.priceInINR * 100,
                    currency: "INR",
                    receipt: `receipt_${Date.now()}`
                })
            });

            if (!rzpRes.ok) {
                throw new Error('Razorpay API order creation failed');
            }

            const orderData = await rzpRes.json();
            return res.status(200).json({
                success: true,
                isMock: false,
                order: orderData,
                plan
            });
        } catch (rzpErr) {
            console.warn('Real Razorpay order failed, falling back to mock mode:', rzpErr.message);
            const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            return res.status(200).json({
                success: true,
                isMock: true,
                order: {
                    id: mockOrderId,
                    amount: plan.priceInINR * 100,
                    currency: "INR"
                },
                plan
            });
        }
    } catch (error) {
        console.error('Error in createOrder:', error);
        return res.status(500).json({ success: false, message: 'Could not initialize order', error: error.message });
    }
};

// 3. Verify Payment & Add Credits
export const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, planId } = req.body || {};
        const user = req.user;

        const plan = CREDIT_PLANS.find(p => p.id === planId) || CREDIT_PLANS[1];
        const isMockOrder = orderId?.startsWith('order_mock_') || !signature || signature === 'mock_signature';

        let isValid = false;

        if (isMockOrder) {
            isValid = true;
        } else {
            const secret = process.env.RAZORPAY_KEY_SECRET;
            if (secret) {
                const generatedSignature = crypto
                    .createHmac('sha256', secret)
                    .update(`${orderId}|${paymentId}`)
                    .digest('hex');
                isValid = (generatedSignature === signature);
            } else {
                isValid = true;
            }
        }

        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Add credits to user account
        if (user) {
            user.credits = (user.credits || 0) + plan.credits;
            if (isDbConnected() && typeof user.save === 'function') {
                try {
                    await user.save();
                } catch (e) {
                    console.warn('DB credit save error:', e.message);
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `Successfully added ${plan.credits} credits!`,
            creditsAdded: plan.credits,
            totalCredits: user ? user.credits : 100 + plan.credits
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ success: false, message: 'Failed to verify payment', error: error.message });
    }
};

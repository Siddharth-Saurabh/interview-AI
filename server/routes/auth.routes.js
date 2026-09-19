import express from 'express';
import { syncUser, loginUser, registerUser, getProfile } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/sync', syncUser);
router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/profile', protect, getProfile);

export default router;

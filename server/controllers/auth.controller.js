import User from '../models/user.model.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// In-memory mock store
const memoryUsers = new Map();

// Initialize permanent dummy user in memory
const DUMMY_USER_ID = '673a11111111111111111111';
const DUMMY_EMAIL = 'demo@interviewai.dev';
const DUMMY_HASH = crypto.createHash('sha256').update('Password123!').digest('hex');

memoryUsers.set(DUMMY_EMAIL, {
    _id: DUMMY_USER_ID,
    name: 'Siddharth Demo User',
    email: DUMMY_EMAIL,
    password: DUMMY_HASH,
    credits: 250
});

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

const hashPassword = (pwd) => {
    return crypto.createHash('sha256').update(pwd).digest('hex');
};

const generateToken = (id) => {
    return jwt.sign({ id: String(id) }, process.env.JWT_SECRET || 'super_secret_interviewai_jwt_token_key_2025', {
        expiresIn: '30d'
    });
};

// Auto seed default permanent dummy account in MongoDB if connected
export const seedDummyUser = async () => {
    try {
        if (!isDbConnected()) {
            console.log('Using permanent demo account: demo@interviewai.dev / Password123!');
            return;
        }
        let user = await User.findOne({ email: DUMMY_EMAIL });
        if (!user) {
            user = await User.create({
                name: 'Siddharth Demo User',
                email: DUMMY_EMAIL,
                password: DUMMY_HASH,
                credits: 250
            });
            console.log('Seeded permanent dummy user into MongoDB: demo@interviewai.dev / Password123!');
        }
    } catch (e) {
        console.log('Using in-memory dummy account (demo@interviewai.dev / Password123!)');
    }
};

// 1. Password Login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        let user = null;
        if (isDbConnected()) {
            try {
                user = await User.findOne({ email });
            } catch (e) {
                user = null;
            }
        }

        if (!user && memoryUsers.has(email)) {
            user = memoryUsers.get(email);
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const hashedPassword = hashPassword(password);
        if (user.password && user.password !== hashedPassword && user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id || user.id || DUMMY_USER_ID);

        return res.status(200).json({
            success: true,
            user: {
                id: user._id || user.id || DUMMY_USER_ID,
                name: user.name,
                email: user.email,
                credits: user.credits || 100
            },
            token
        });
    } catch (error) {
        console.error('CRITICAL Error in loginUser:', error);
        return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
};

// 2. Register with Password
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        let user = null;
        if (isDbConnected()) {
            try {
                user = await User.findOne({ email });
                if (user) {
                    return res.status(400).json({ success: false, message: 'User with this email already exists' });
                }

                user = await User.create({
                    name: name || email.split('@')[0],
                    email,
                    password: hashPassword(password),
                    credits: 100
                });
            } catch (e) {
                user = null;
            }
        }

        if (!user) {
            if (memoryUsers.has(email)) {
                return res.status(400).json({ success: false, message: 'User with this email already exists' });
            }
            const newId = `user_${Date.now()}`;
            user = {
                _id: newId,
                name: name || email.split('@')[0],
                email,
                password: hashPassword(password),
                credits: 100
            };
            memoryUsers.set(email, user);
        }

        const token = generateToken(user._id);

        return res.status(201).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits
            },
            token
        });
    } catch (error) {
        console.error('Error in registerUser:', error);
        return res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
    }
};

// 3. Fast Sync (Firebase / Guest)
export const syncUser = async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        let user = null;
        if (isDbConnected()) {
            try {
                user = await User.findOne({ email });
                if (!user) {
                    user = await User.create({
                        name: name || email.split('@')[0],
                        email,
                        credits: 100
                    });
                } else if (name && user.name !== name) {
                    user.name = name;
                    await user.save();
                }
            } catch (e) {
                user = null;
            }
        }

        if (!user) {
            if (!memoryUsers.has(email)) {
                const newId = `user_${Date.now()}`;
                user = {
                    _id: newId,
                    name: name || email.split('@')[0],
                    email,
                    credits: 100
                };
                memoryUsers.set(email, user);
            } else {
                user = memoryUsers.get(email);
            }
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits
            },
            token
        });
    } catch (error) {
        console.error('Error in syncUser:', error);
        return res.status(500).json({ success: false, message: 'Server error syncing user', error: error.message });
    }
};

// 4. Get Profile
export const getProfile = async (req, res) => {
    try {
        let user = null;
        if (isDbConnected() && req.user?._id) {
            try {
                user = await User.findById(req.user._id);
            } catch (e) {
                user = null;
            }
        }

        if (!user && req.user?.email && memoryUsers.has(req.user.email)) {
            user = memoryUsers.get(req.user.email);
        }

        if (!user) {
            user = req.user;
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id || user.id || DUMMY_USER_ID,
                name: user.name,
                email: user.email,
                credits: user.credits || 100
            }
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        return res.status(500).json({ success: false, message: 'Server error retrieving profile' });
    }
};

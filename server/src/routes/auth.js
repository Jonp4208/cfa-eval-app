// server/src/routes/auth.js
import express from 'express';
import { register, login, getProfile, updateProfile, forgotPassword, resetPassword } from '../controllers/auth.js';
import { auth } from '../middleware/auth.js';
import { User } from '../models/index.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
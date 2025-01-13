import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No auth token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId })
      .populate({
        path: 'store',
        select: '_id storeNumber name location'
      });

    if (!user) {
      throw new Error('User not found');
    }

    console.log('Auth middleware - user:', {
      _id: user._id,
      store: user.store,
      role: user.role
    });

    req.user = {
      ...user.toObject(),
      userId: user._id
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};
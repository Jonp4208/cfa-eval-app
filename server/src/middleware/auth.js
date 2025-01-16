import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - headers:', req.headers);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware - no token provided');
      return res.status(401).json({ message: 'No auth token' });
    }

    console.log('Auth middleware - token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - decoded token:', decoded);

    const user = await User.findOne({ _id: decoded.userId })
      .populate({
        path: 'store',
        select: '_id storeNumber name location'
      });
      
    if (!user) {
      console.log('Auth middleware - user not found for id:', decoded.userId);
      throw new Error('User not found');
    }

    console.log('Auth middleware - user found:', {
      _id: user._id,
      name: user.name,
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
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Please authenticate' });
  }
};
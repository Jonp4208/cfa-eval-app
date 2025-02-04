import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
      })
      .populate('manager', '_id name position')
      .populate('evaluator', '_id name position')
      .select('+position +role +isAdmin +departments +name +email +status');
      
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.store) {
      return res.status(400).json({ message: 'User has no associated store' });
    }

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
    res.status(500).json({ message: 'Server error in auth middleware', error: error.message });
  }
};
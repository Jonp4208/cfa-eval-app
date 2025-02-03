import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
      })
      .populate('manager', '_id name position')
      .populate('evaluator', '_id name position')
      .select('+position +role +isAdmin +departments +name +email +status');
      
    if (!user) {
      console.log('Auth middleware - user not found for id:', decoded.userId);
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.store) {
      console.log('Auth middleware - store not found for user:', user._id);
      return res.status(400).json({ message: 'User has no associated store' });
    }

    console.log('Auth middleware - user details:', {
      _id: user._id,
      name: user.name,
      store: user.store,
      role: user.role,
      position: user.position,
      departments: user.departments,
      manager: user.manager,
      evaluator: user.evaluator
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
    res.status(500).json({ message: 'Server error in auth middleware', error: error.message });
  }
};
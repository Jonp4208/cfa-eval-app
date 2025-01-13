// server/src/middleware/roles.js
export const isStoreAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking admin status' });
    }
};
export const isManager = async (req, res, next) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Managers only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking manager status' });
    }
};

// Check if user has required role(s)
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - No user found' });
    }

    // If roles is empty or user is admin, allow access
    if (roles.length === 0 || req.user.role === 'admin') {
      return next();
    }

    // Check if user's role is in the allowed roles array
    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Forbidden - Insufficient permissions' 
    });
  };
};
// server/src/middleware/roles.js
export const isStoreAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'store-director') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking admin status' });
    }
};

export const isManager = async (req, res, next) => {
    try {
        const managerRoles = [
            'admin',
            'store-director',
            'kitchen-director',
            'service-director',
            'store-leader',
            'training-leader',
            'shift-leader'
        ];
        if (!managerRoles.includes(req.user.role)) {
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

    // If roles is empty or user is admin/store-director, allow access
    if (roles.length === 0 || ['admin', 'store-director'].includes(req.user.role)) {
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

// Check if user can manage their department
export const canManageDepartment = (req, res, next) => {
  try {
    const departmentRoles = {
      'kitchen-director': ['BOH'],
      'service-director': ['FOH'],
      'training-leader': ['Training'],
      'store-leader': ['FOH', 'BOH'],
      'shift-leader': ['FOH', 'BOH']
    };

    // Admins and store directors can manage all departments
    if (['admin', 'store-director'].includes(req.user.role)) {
      return next();
    }

    // Check if user can manage the target department
    const allowedDepartments = departmentRoles[req.user.role] || [];
    const targetDepartment = req.body.department || req.params.department;

    if (!targetDepartment || allowedDepartments.includes(targetDepartment)) {
      return next();
    }

    return res.status(403).json({
      message: 'Forbidden - Cannot manage this department'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking department management permissions' });
  }
};
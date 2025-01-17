// server/src/middleware/roles.js
export const isStoreAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      message: 'Forbidden - Admin access required'
    });
  }
  next();
};

export const isManager = async (req, res, next) => {
  try {
    const managerPositions = [
      'Director',
      'Leader'
    ];

    if (!managerPositions.includes(req.user.position)) {
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
    // Admins can manage all departments
    if (req.user.isAdmin) {
      return next();
    }

    // Get the target departments from request
    const targetDepartments = Array.isArray(req.body.departments) 
      ? req.body.departments 
      : [req.body.department || req.params.department];

    // Check if user's departments include all target departments
    const canManage = targetDepartments.every(dept => 
      req.user.departments.includes(dept)
    );

    if (canManage) {
      return next();
    }

    return res.status(403).json({
      message: 'Forbidden - Cannot manage this department'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking department management permissions' });
  }
};
import { Request, Response, NextFunction } from 'express';
import { ModelDefinition } from '../types';
import { AppError } from './errorHandler';

export const checkModelPermission = (
  model: ModelDefinition,
  operation: 'create' | 'read' | 'update' | 'delete'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userRole = req.user.role;
    const permissions = model.rbac[userRole] || [];

    // Check if user has 'all' permission or specific operation permission
    if (!permissions.includes('all') && !permissions.includes(operation)) {
      return next(new AppError(`Insufficient permissions for ${operation} operation`, 403));
    }

    next();
  };
};

export const checkOwnership = (model: ModelDefinition) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Admin has access to everything
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // If model has an owner field, check ownership
    if (model.ownerField && res.locals.record) {
      const record = res.locals.record;
      const ownerId = record.data[model.ownerField];

      if (ownerId && ownerId !== req.user.userId) {
        return next(new AppError('You can only modify your own records', 403));
      }
    }

    next();
  };
};

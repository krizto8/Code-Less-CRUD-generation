import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  saveModel,
  loadModel,
  loadAllModels,
  deleteModel,
  validateModel
} from '../services/modelService';
import { registerModelRoutes, unregisterModelRoutes } from '../services/dynamicRouteService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Get all models
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await loadAllModels();
    res.json({ success: true, data: models });
  } catch (error) {
    next(error);
  }
});

// Get single model
router.get('/:name', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const model = await loadModel(name);

    if (!model) {
      throw new AppError('Model not found', 404);
    }

    res.json({ success: true, data: model });
  } catch (error) {
    next(error);
  }
});

// Create/Publish new model (Admin only)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const modelData = req.body;

      // Validate model
      const errors = validateModel(modelData);
      if (errors.length > 0) {
        throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
      }

      // Save model to file
      await saveModel(modelData);

      // Register dynamic routes
      const app = req.app;
      registerModelRoutes(app, modelData);

      res.status(201).json({
        success: true,
        message: 'Model published successfully',
        data: modelData
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update model (Admin only)
router.put(
  '/:name',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;
      const modelData = req.body;

      // Check if model exists
      const existingModel = await loadModel(name);
      if (!existingModel) {
        throw new AppError('Model not found', 404);
      }

      // Validate model
      const errors = validateModel(modelData);
      if (errors.length > 0) {
        throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
      }

      // Preserve created timestamp
      modelData.createdAt = existingModel.createdAt;

      // Save updated model
      await saveModel(modelData);

      // Re-register dynamic routes
      const app = req.app;
      unregisterModelRoutes(name);
      registerModelRoutes(app, modelData);

      res.json({
        success: true,
        message: 'Model updated successfully',
        data: modelData
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete model (Admin only)
router.delete(
  '/:name',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;

      // Check if model exists
      const model = await loadModel(name);
      if (!model) {
        throw new AppError('Model not found', 404);
      }

      // Delete model file
      await deleteModel(name);

      // Unregister routes
      unregisterModelRoutes(name);

      res.json({
        success: true,
        message: 'Model deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

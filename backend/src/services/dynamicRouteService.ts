import { Application, Router, Request, Response, NextFunction } from 'express';
import { loadAllModels, loadModel } from './modelService';
import { authenticate } from '../middleware/auth';
import { checkModelPermission, checkOwnership } from '../middleware/rbac';
import { prisma } from '../server';
import { AppError } from '../middleware/errorHandler';
import { ModelDefinition } from '../types';

const dynamicRouters = new Map<string, Router>();

export const initializeDynamicRoutes = async (app: Application): Promise<void> => {
  try {
    console.log('🔄 Initializing dynamic routes...');
    const models = await loadAllModels();

    for (const model of models) {
      registerModelRoutes(app, model);
    }

    console.log(`✅ Initialized ${models.length} dynamic models`);
  } catch (error) {
    console.error('Error initializing dynamic routes:', error);
  }
};

export const registerModelRoutes = (app: Application, model: ModelDefinition) => {
  const modelName = model.name.toLowerCase();
  const routePath = `/api/${modelName}`;

  // Remove existing router if it exists
  if (dynamicRouters.has(modelName)) {
    console.log(`♻️  Updating routes for ${model.name}`);
  }

  const router = Router();

  // CREATE
  router.post(
    '/',
    authenticate,
    checkModelPermission(model, 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = req.body;

        // Validate required fields
        for (const field of model.fields) {
          if (field.required && !(field.name in data)) {
            throw new AppError(`Field ${field.name} is required`, 400);
          }
        }

        // Set owner if ownerField is defined
        if (model.ownerField && req.user) {
          data[model.ownerField] = req.user.userId;
        }

        const record = await prisma.dynamicData.create({
          data: {
            modelName: model.name,
            data,
            ownerId: model.ownerField ? req.user!.userId : null
          }
        });

        res.status(201).json({ success: true, data: record });
      } catch (error) {
        next(error);
      }
    }
  );

  // READ ALL
  router.get(
    '/',
    authenticate,
    checkModelPermission(model, 'read'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = { modelName: model.name };

        // Non-admin users with ownerField only see their own records
        if (model.ownerField && req.user!.role !== 'ADMIN') {
          where.ownerId = req.user!.userId;
        }

        const [records, total] = await Promise.all([
          prisma.dynamicData.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' }
          }),
          prisma.dynamicData.count({ where })
        ]);

        res.json({
          success: true,
          data: records,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // READ ONE
  router.get(
    '/:id',
    authenticate,
    checkModelPermission(model, 'read'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        const record = await prisma.dynamicData.findFirst({
          where: {
            id,
            modelName: model.name
          }
        });

        if (!record) {
          throw new AppError('Record not found', 404);
        }

        // Check ownership for non-admin users
        if (model.ownerField && req.user!.role !== 'ADMIN') {
          if (record.ownerId !== req.user!.userId) {
            throw new AppError('Access denied', 403);
          }
        }

        res.json({ success: true, data: record });
      } catch (error) {
        next(error);
      }
    }
  );

  // UPDATE
  router.put(
    '/:id',
    authenticate,
    checkModelPermission(model, 'update'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const data = req.body;

        const record = await prisma.dynamicData.findFirst({
          where: {
            id,
            modelName: model.name
          }
        });

        if (!record) {
          throw new AppError('Record not found', 404);
        }

        // Store record for ownership check
        res.locals.record = record;

        // Check ownership
        if (model.ownerField && req.user!.role !== 'ADMIN') {
          if (record.ownerId !== req.user!.userId) {
            throw new AppError('You can only update your own records', 403);
          }
        }

        // Merge existing data with updates
        const existingData = record.data as Record<string, any>;
        const updatedData = { ...existingData, ...data };

        const updated = await prisma.dynamicData.update({
          where: { id },
          data: { data: updatedData }
        });

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE
  router.delete(
    '/:id',
    authenticate,
    checkModelPermission(model, 'delete'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        const record = await prisma.dynamicData.findFirst({
          where: {
            id,
            modelName: model.name
          }
        });

        if (!record) {
          throw new AppError('Record not found', 404);
        }

        // Check ownership
        if (model.ownerField && req.user!.role !== 'ADMIN') {
          if (record.ownerId !== req.user!.userId) {
            throw new AppError('You can only delete your own records', 403);
          }
        }

        await prisma.dynamicData.delete({ where: { id } });

        res.json({ success: true, message: 'Record deleted successfully' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Register router
  dynamicRouters.set(modelName, router);
  app.use(routePath, router);

  console.log(`✅ Registered routes for ${model.name} at ${routePath}`);
};

export const unregisterModelRoutes = (modelName: string) => {
  dynamicRouters.delete(modelName.toLowerCase());
};

import fs from 'fs';
import path from 'path';
import { ModelDefinition } from '../types';
import { AppError } from '../middleware/errorHandler';

const MODELS_DIR = path.join(__dirname, '../../models');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

export const saveModel = async (model: ModelDefinition): Promise<void> => {
  try {
    const modelPath = path.join(MODELS_DIR, `${model.name}.json`);
    
    // Add timestamps
    const modelWithTimestamps = {
      ...model,
      tableName: model.tableName || model.name.toLowerCase() + 's',
      createdAt: model.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      modelPath,
      JSON.stringify(modelWithTimestamps, null, 2),
      'utf-8'
    );

    console.log(`✅ Model ${model.name} saved to ${modelPath}`);
  } catch (error: any) {
    console.error('Error saving model:', error);
    throw new AppError(`Failed to save model: ${error.message}`, 500);
  }
};

export const loadModel = async (modelName: string): Promise<ModelDefinition | null> => {
  try {
    const modelPath = path.join(MODELS_DIR, `${modelName}.json`);

    if (!fs.existsSync(modelPath)) {
      return null;
    }

    const fileContent = fs.readFileSync(modelPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    console.error('Error loading model:', error);
    throw new AppError(`Failed to load model: ${error.message}`, 500);
  }
};

export const loadAllModels = async (): Promise<ModelDefinition[]> => {
  try {
    if (!fs.existsSync(MODELS_DIR)) {
      return [];
    }

    const files = fs.readdirSync(MODELS_DIR);
    const models: ModelDefinition[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const modelPath = path.join(MODELS_DIR, file);
        const fileContent = fs.readFileSync(modelPath, 'utf-8');
        models.push(JSON.parse(fileContent));
      }
    }

    return models;
  } catch (error: any) {
    console.error('Error loading models:', error);
    throw new AppError(`Failed to load models: ${error.message}`, 500);
  }
};

export const deleteModel = async (modelName: string): Promise<void> => {
  try {
    const modelPath = path.join(MODELS_DIR, `${modelName}.json`);

    if (fs.existsSync(modelPath)) {
      fs.unlinkSync(modelPath);
      console.log(`✅ Model ${modelName} deleted`);
    }
  } catch (error: any) {
    console.error('Error deleting model:', error);
    throw new AppError(`Failed to delete model: ${error.message}`, 500);
  }
};

export const validateModel = (model: any): string[] => {
  const errors: string[] = [];

  if (!model.name || typeof model.name !== 'string') {
    errors.push('Model name is required and must be a string');
  }

  if (!Array.isArray(model.fields) || model.fields.length === 0) {
    errors.push('Model must have at least one field');
  }

  if (model.fields) {
    model.fields.forEach((field: any, index: number) => {
      if (!field.name) {
        errors.push(`Field at index ${index} must have a name`);
      }
      if (!['string', 'number', 'boolean', 'date'].includes(field.type)) {
        errors.push(`Field ${field.name} has invalid type: ${field.type}`);
      }
    });
  }

  if (!model.rbac || typeof model.rbac !== 'object') {
    errors.push('Model must have RBAC configuration');
  }

  return errors;
};

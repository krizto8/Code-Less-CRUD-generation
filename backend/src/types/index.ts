export interface ModelField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
  default?: any;
  unique?: boolean;
  relation?: string;
}

export interface ModelRBAC {
  [role: string]: string[];
}

export interface ModelDefinition {
  name: string;
  tableName?: string;
  fields: ModelField[];
  ownerField?: string;
  rbac: ModelRBAC;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface DynamicRecord {
  id: string;
  modelName: string;
  data: any;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

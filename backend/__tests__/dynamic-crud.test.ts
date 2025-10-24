import request from 'supertest';
import app, { prisma } from '../src/server';

describe('Dynamic CRUD and RBAC Tests', () => {
  let adminToken: string;
  let managerToken: string;
  let viewerToken: string;
  let testModelName = 'TestProduct';

  beforeAll(async () => {
    // Create test users
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `admin${Date.now()}@test.com`,
        password: 'password123',
        name: 'Admin User',
        role: 'ADMIN'
      });

    const managerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `manager${Date.now()}@test.com`,
        password: 'password123',
        name: 'Manager User',
        role: 'MANAGER'
      });

    const viewerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `viewer${Date.now()}@test.com`,
        password: 'password123',
        name: 'Viewer User',
        role: 'VIEWER'
      });

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminRes.body.data.email,
        password: 'password123'
      });

    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: managerRes.body.data.email,
        password: 'password123'
      });

    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: viewerRes.body.data.email,
        password: 'password123'
      });

    adminToken = adminLogin.body.data.token;
    managerToken = managerLogin.body.data.token;
    viewerToken = viewerLogin.body.data.token;
  });

  afterAll(async () => {
    // Clean up
    await prisma.dynamicData.deleteMany({
      where: { modelName: testModelName }
    });
    await prisma.$disconnect();
  });

  describe('Model Management', () => {
    it('should allow admin to create a model', async () => {
      const response = await request(app)
        .post('/api/models')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: testModelName,
          fields: [
            { name: 'name', type: 'string', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'inStock', type: 'boolean', default: true }
          ],
          ownerField: 'ownerId',
          rbac: {
            ADMIN: ['all'],
            MANAGER: ['create', 'read', 'update'],
            VIEWER: ['read']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should prevent non-admin from creating models', async () => {
      const response = await request(app)
        .post('/api/models')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'UnauthorizedModel',
          fields: [{ name: 'test', type: 'string' }],
          rbac: { ADMIN: ['all'] }
        });

      expect(response.status).toBe(403);
    });

    it('should retrieve all models', async () => {
      const response = await request(app)
        .get('/api/models')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Dynamic CRUD Operations', () => {
    let recordId: string;

    it('should allow manager to create a record', async () => {
      const response = await request(app)
        .post(`/api/${testModelName.toLowerCase()}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Test Product',
          price: 99.99,
          inStock: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      recordId = response.body.data.id;
    });

    it('should allow viewer to read records', async () => {
      const response = await request(app)
        .get(`/api/${testModelName.toLowerCase()}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent viewer from creating records', async () => {
      const response = await request(app)
        .post(`/api/${testModelName.toLowerCase()}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Product',
          price: 49.99
        });

      expect(response.status).toBe(403);
    });

    it('should allow manager to update their own record', async () => {
      const response = await request(app)
        .put(`/api/${testModelName.toLowerCase()}/${recordId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Updated Product',
          price: 109.99
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent viewer from deleting records', async () => {
      const response = await request(app)
        .delete(`/api/${testModelName.toLowerCase()}/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to delete any record', async () => {
      const response = await request(app)
        .delete(`/api/${testModelName.toLowerCase()}/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('RBAC Enforcement', () => {
    it('should require authentication for all endpoints', async () => {
      const response = await request(app)
        .get(`/api/${testModelName.toLowerCase()}`);

      expect(response.status).toBe(401);
    });

    it('should validate JWT tokens', async () => {
      const response = await request(app)
        .get(`/api/${testModelName.toLowerCase()}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});

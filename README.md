# Auto-Generated CRUD + RBAC Platform

A powerful low-code internal developer platform that allows users to define data models from a web UI. The system automatically generates CRUD APIs, admin interfaces, and enforces role-based access control (RBAC).

## 🌟 Features

- **Dynamic Model Definition**: Create data models via a web UI without writing code
- **Auto-Generated CRUD APIs**: RESTful endpoints are automatically created for each model
- **File-Based Persistence**: Model definitions are saved as JSON files for versioning and portability
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for Admin, Manager, and Viewer roles
- **Ownership Model**: Records can be owned by users, restricting access to owners and admins
- **Admin Interface**: Dynamic UI that adapts to your model definitions
- **Real-Time Updates**: Model changes are immediately reflected in the API and UI

## 🏗️ Architecture

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **Prisma** ORM with PostgreSQL
- **JWT** authentication
- File-based model storage in `/backend/models`

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
cd crud-rbac-platform
```

### 2. Install Dependencies

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crud_rbac_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# Server
PORT=3001
NODE_ENV="development"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

### 4. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed with test user
npx prisma studio  # Use Prisma Studio to manually add a test user
```

### 5. Run the Application

**Development mode (runs both backend and frontend):**
```bash
npm run dev
```

This starts:
- Backend API on `http://localhost:3001`
- Frontend on `http://localhost:5173`

**Or run separately:**

Backend:
```bash
npm run dev:backend
```

Frontend:
```bash
npm run dev:frontend
```

## 🎯 Usage Guide

### Creating Your First Model

1. **Register/Login** to the application at `http://localhost:5173`

2. **Navigate to Model Builder** (Admin only)
   - Click "Model Builder" in the navigation bar

3. **Define Your Model**
   - **Model Name**: e.g., "Product", "Employee", "Task"
   - **Owner Field** (optional): e.g., "ownerId" - enables ownership-based access control
   - **Fields**: Add fields with:
     - Name (e.g., "name", "price", "isActive")
     - Type (string, number, boolean, date)
     - Required checkbox
   - **RBAC Permissions**: Configure per-role access:
     - Admin: Full access (all operations)
     - Manager: create, read, update
     - Viewer: read only

4. **Publish Model**
   - Click "Publish Model"
   - Model definition is saved to `/backend/models/<ModelName>.json`
   - CRUD endpoints are automatically registered
   - UI is updated to show the new model

### Example Model Definition

```json
{
  "name": "Product",
  "fields": [
    { "name": "name", "type": "string", "required": true },
    { "name": "price", "type": "number", "required": true },
    { "name": "description", "type": "string" },
    { "name": "inStock", "type": "boolean", "default": true },
    { "name": "releaseDate", "type": "date" }
  ],
  "ownerField": "ownerId",
  "rbac": {
    "ADMIN": ["all"],
    "MANAGER": ["create", "read", "update"],
    "VIEWER": ["read"]
  }
}
```

### Managing Data

1. **Navigate to Dashboard**
   - View all available models

2. **Click "Manage Data"** on any model card
   - View all records in a table
   - Add new records with the form
   - Edit existing records
   - Delete records (with permission check)

### Generated API Endpoints

For each model (e.g., "Product"), the following endpoints are created:

```
POST   /api/product       - Create a new record
GET    /api/product       - Get all records (with pagination)
GET    /api/product/:id   - Get a single record
PUT    /api/product/:id   - Update a record
DELETE /api/product/:id   - Delete a record
```

**Example API Usage:**

```bash
# Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Create a product (use the token from login)
curl -X POST http://localhost:3001/api/product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Laptop",
    "price": 1299.99,
    "inStock": true
  }'

# Get all products
curl http://localhost:3001/api/product \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔐 Role-Based Access Control (RBAC)

### Roles

- **ADMIN**: Full access to everything
  - Create/manage models
  - Full CRUD on all data regardless of ownership
  
- **MANAGER**: Limited administrative access
  - Can create, read, and update data
  - Cannot delete or manage models
  - Respects ownership rules
  
- **VIEWER**: Read-only access
  - Can only view data
  - Respects ownership rules

### Ownership Model

When a model has an `ownerField` defined:
- Records are automatically tagged with the creator's userId
- Non-admin users can only modify their own records
- Admin users can modify all records

## 📂 Project Structure

```
crud-rbac-platform/
├── backend/
│   ├── models/              # JSON model definitions (auto-generated)
│   ├── src/
│   │   ├── middleware/      # Auth, RBAC, error handling
│   │   ├── routes/          # Static API routes
│   │   ├── services/        # Model & dynamic route services
│   │   ├── types/           # TypeScript interfaces
│   │   └── server.ts        # Main server file
│   └── __tests__/           # Backend tests
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── store/           # Zustand state management
│       ├── lib/             # API client
│       └── types/           # TypeScript interfaces
├── prisma/
│   └── schema.prisma        # Database schema
├── package.json             # Root dependencies
└── README.md
```

## 🔄 How File-Based CRUD Works

### 1. Model Publishing Flow

```
User creates model in UI
         ↓
Frontend sends POST /api/models
         ↓
Backend validates model definition
         ↓
Model saved to /backend/models/<ModelName>.json
         ↓
Dynamic routes registered in Express
         ↓
CRUD endpoints immediately available
```

### 2. Dynamic Route Registration

When the server starts or a model is published:

1. **Model Loading**: All JSON files in `/backend/models/` are loaded
2. **Route Generation**: For each model, a router is created with CRUD endpoints
3. **Middleware Injection**: RBAC and ownership checks are applied
4. **Registration**: Routes are mounted at `/api/<modelname>`

### 3. Hot Reload Support

- Models can be updated via the API
- Routes are dynamically re-registered
- No server restart required

## 🧪 Running Tests

```bash
npm test
```

Tests cover:
- Authentication flows
- Model CRUD operations
- RBAC permission checks
- Dynamic route generation

## 🛠️ API Reference

### Authentication

**Register**
```
POST /api/auth/register
Body: { email, password, name, role? }
```

**Login**
```
POST /api/auth/login
Body: { email, password }
Returns: { token, user }
```

**Get Current User**
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Model Management (Admin Only)

**Get All Models**
```
GET /api/models
```

**Get Single Model**
```
GET /api/models/:name
```

**Create Model**
```
POST /api/models
Body: ModelDefinition (see example above)
```

**Update Model**
```
PUT /api/models/:name
Body: ModelDefinition
```

**Delete Model**
```
DELETE /api/models/:name
```

### Dynamic Data Endpoints

**Create Record**
```
POST /api/<modelname>
Body: { field1: value1, field2: value2, ... }
```

**Get All Records**
```
GET /api/<modelname>?page=1&limit=10
```

**Get Single Record**
```
GET /api/<modelname>/:id
```

**Update Record**
```
PUT /api/<modelname>/:id
Body: { field1: newValue, ... }
```

**Delete Record**
```
DELETE /api/<modelname>/:id
```

## 🎨 Customization

### Adding New Field Types

1. Update `ModelField` type in `backend/src/types/index.ts`
2. Add validation in `backend/src/services/modelService.ts`
3. Update form inputs in `frontend/src/pages/DataManager.tsx`

### Custom RBAC Roles

1. Update Prisma schema enum in `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update default RBAC in `frontend/src/pages/ModelBuilder.tsx`

## 🚢 Production Deployment

### Backend

1. Set environment variables
2. Run migrations: `npx prisma migrate deploy`
3. Build: `npm run build`
4. Start: `npm start`

### Frontend

1. Build: `cd frontend && npm run build`
2. Serve the `frontend/dist` directory with a static server

### Environment Variables (Production)

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-random-secret"
JWT_EXPIRES_IN="24h"
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://yourdomain.com"
```


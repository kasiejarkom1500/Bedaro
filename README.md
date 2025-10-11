<<<<<<< HEAD
# BEDARO - BPS Data Repository Dashboard

![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC)

> **BEDARO** adalah sistem manajemen data statistik berbasis web untuk Badan Pusat Statistik (BPS) yang menyediakan dashboard administratif untuk pengelolaan artikel, FAQ, indikator, dan data statistik dengan sistem role-based access control.

## 📋 Daftar Isi


## 🚀 Fitur Utama

### 👥 Sistem Role-Based Access Control

### 📊 Manajemen Data Statistik

### 📄 Content Management

### 🔐 Security Features

### 📱 User Experience

## 🛠 Teknologi

### Frontend

### Backend  

### Development Tools

## 📁 Struktur Project

```
bedaro/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── admin/               # Admin-only endpoints
│   │   ├── auth/                # Authentication endpoints
│   │   ├── public/              # Public endpoints
│   │   └── users/               # User management
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main application page
├── components/                   # React components
│   ├── ui/                      # Base UI components (shadcn)
│   ├── admin-*.tsx              # Admin page components
│   ├── *-management.tsx         # CRUD management components
│   └── *.tsx                    # Other components
├── hooks/                        # Custom React hooks
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Authentication utilities
│   ├── db.ts                    # Database connection
│   └── utils.ts                 # Helper functions
├── types/                       # TypeScript type definitions
├── public/                      # Static assets
├── documentation/               # Project documentation
└── scripts/                     # Utility scripts
```

## 🔧 Instalasi

### Prerequisites

### 1. Clone Repository
```bash
git clone <repository-url>
cd bedaro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Import database schema
mysql -u root -p < database/schema.sql

# Import sample data (optional)
mysql -u root -p < database/sample-data.sql
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.production.example .env.local

# Edit environment variables
nano .env.local
```

### 5. Build & Run
```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## ⚙️ Konfigurasi

### Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=bps_bungo_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=production

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx
```

### Database Schema
Database menggunakan skema relational dengan tabel utama:

## 📖 Penggunaan

### 1. Login Sistem

### 2. Dashboard Admin
```typescript
// Role-based dashboard access
Super Admin → Full access to all features
Admin Ekonomi → Economic statistics only  
Admin Demografi → Demographic statistics only
Admin Lingkungan → Environmental statistics only
```

### 3. Manajemen Indikator
```typescript
// Create new indicator
const indicator = {
  name: "Indikator Baru",
  category: "Statistik Ekonomi",
  subcategory: "PDRB",
  unit: "Rupiah",
  description: "Deskripsi indikator"
}
```

### 4. Input Data
```typescript
// Add indicator data
const data = {
  indicator_id: "uuid-here",
  year: 2024,
  period_month: 12, // optional for monthly data
  value: 1234567.89,
  status: "final",
  notes: "Data verified"
}
```

## 🔌 API Documentation

### Authentication Endpoints
```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
POST /api/auth/change-password
```

### Admin Endpoints
```http
GET    /api/admin/dashboard
GET    /api/admin/indicators
POST   /api/admin/indicators
PUT    /api/admin/indicators/[id]
DELETE /api/admin/indicators/[id]

GET    /api/admin/indicator-data
POST   /api/admin/indicator-data
PUT    /api/admin/indicator-data/[id]
DELETE /api/admin/indicator-data/[id]
```

### Public Endpoints
```http
GET /api/public/indicators
GET /api/public/indicator-data
GET /api/public/articles
GET /api/public/faqs
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🗄️ Database Schema

### Key Tables

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  full_name VARCHAR(255),
  role ENUM('superadmin', 'admin_ekonomi', 'admin_demografi', 'admin_lingkungan'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Indicators Table
```sql
CREATE TABLE indicators (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(36),
  subcategory VARCHAR(255),
  unit VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔐 Security

### Authentication Flow
1. **Login**: Email/password validation dengan bcrypt
2. **JWT Token**: Generated dengan expiry 7 hari
3. **Session Storage**: Token disimpan di localStorage
4. **Auto Refresh**: Session auto-refresh setiap CRUD operation

### Authorization Levels
```typescript
// Permission matrix
const permissions = {
  superadmin: ['*'], // All permissions
  admin_ekonomi: ['indicators:ekonomi', 'data:ekonomi'],
  admin_demografi: ['indicators:demografi', 'data:demografi'], 
  admin_lingkungan: ['indicators:lingkungan', 'data:lingkungan']
}
```

### Security Best Practices

## 🚀 Deployment

### Production Deployment

#### 1. Build Application
```bash
npm run build
```

#### 2. Environment Setup
```bash
# Production environment
NODE_ENV=production
DB_HOST=production-db-host
JWT_SECRET=super-secure-production-key
```

#### 3. Database Migration
```bash
# Run database migrations
npm run migrate:production
```

#### 4. Start Application
```bash
# Using PM2 for process management
pm2 start npm --name "bedaro" -- start

# Or using Docker
docker build -t bedaro .
docker run -p 3000:3000 bedaro
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance Monitoring

### Key Metrics

### Monitoring Tools
```bash
# Performance monitoring
npm run analyze-bundle
npm run lighthouse-ci
npm run perf-test
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation updates
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## 📝 Changelog

### Version 1.0.0 (2024-10-11)

## 📞 Support

### Documentation

### Contact

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


**© 2024 Badan Pusat Statistik. All rights reserved.**

Dibuat dengan ❤️ untuk kemajuan statistik Indonesia.
=======
# Bedaro
Bedaro adalah sistem manajemen data statistik berbasis web untuk Badan Pusat Statistik (BPS) yang menyediakan dashboard administratif untuk pengelolaan artikel, FAQ, indikator, dan data statistik dengan sistem role-based access control.
>>>>>>> a4dfcd9e89c5b647f35110dfaad9ba7d0cfb3173

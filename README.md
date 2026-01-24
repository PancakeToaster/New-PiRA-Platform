# Robotics Academy Platform

A comprehensive web platform for robotics academy business with 4 layers and 5 user types.

## Features

### Four-Layer Architecture

1. **Public Layer** - Marketing/informational site
   - Home page with about us, recent activities
   - Course offerings page
   - Blog with posts and comments
   - Contact us page
   - Admin-editable content

2. **Payment Layer** - Parent portal for billing/schedules
   - Invoice listing (current and historical)
   - Invoice details with line items
   - Student-parent linking
   - View linked student progress

3. **LMS (Learning Management System)** - For students and teachers
   - Obsidian-like knowledge base with markdown
   - Mind maps and graph visualizations
   - Assignment creation and submission
   - Progress tracking
   - Teacher content management

4. **CMS (Content Management System)** - Admin control panel
   - Comprehensive metrics dashboard
   - User management with custom roles
   - Invoice creation and management
   - Content management (pages, blog, courses)
   - System performance monitoring
   - Analytics (page views, user engagement)

### Five User Types

1. **Public** - Non-authenticated users
2. **Parent** - View invoices and student progress
3. **Student** - Access LMS, submit assignments
4. **Teacher** - Create content, manage students, grade assignments
5. **Admin** - Full system access and management

## 📘 Documentation

- **[User Guide](USER_GUIDE.md)**: Comprehensive manual for all roles (Admin, Teacher, Student, Parent).
- **[Deployment Guide](DEPLOYMENT.md)**: Detailed production setup for Docker/Linux.
- **[Product Spec](PRODUCT_SPEC.md)**: Technical specifications and feature list.

## ✅ Project Status: Complete (Phase 19)

The platform is fully built and feature-complete as of **January 2026**.

**Key Capabilities:**
- **User Management**: 6 roles, approval workflows, parent-student linking
- **LMS**: Full course builder, grading system, quizzes
- **Finance**: Invoices, expenses, payroll, inventory
- **Wiki**: Knowledge base with graph visualizations
- **Projects**: Team management with Kanban boards, Gantt charts, and subteams
- **Team Management**: Safe deletion, archival workflows, and restore capabilities
- **Analytics**: System health (App+DB size), activity logging, error tracking

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Deployment**: Docker + Docker Compose + Nginx

## Prerequisites

- Node.js 18+ (for development)
- Docker and Docker Compose (for deployment)
- PostgreSQL 16 (if running without Docker)

## Getting Started

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd New-PiRA-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/robotics_academy?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

   Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**
   ```bash
   # Run migrations
   npm run prisma:migrate

   # Seed the database with initial data
   npm run prisma:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Default Admin Credentials

After seeding, use these credentials to log in:
- **Email**: admin@roboticsacademy.com
- **Password**: admin123

**⚠️ IMPORTANT: Change the admin password immediately after first login!**

## Docker Deployment (Production)

### Quick Start

1. **Configure environment variables**

   Create a `.env` file in the project root:
   ```env
   DB_PASSWORD=your_secure_database_password
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your_secure_nextauth_secret
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Start PostgreSQL database
   - Build and start the Next.js application
   - Run database migrations
   - Seed initial data
   - Start Nginx reverse proxy

3. **Access your platform**
   - HTTP: http://your-server-ip
   - HTTPS: Configure SSL certificates (see below)

### SSL Configuration (HTTPS)

1. **Obtain SSL certificates**

   Using Let's Encrypt:
   ```bash
   sudo apt-get install certbot
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

2. **Copy certificates to nginx/ssl**
   ```bash
   mkdir -p nginx/ssl
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
   ```

3. **Enable HTTPS in nginx.conf**

   Uncomment the HTTPS-related lines in `nginx/nginx.conf`:
   - `listen 443 ssl http2;`
   - SSL certificate paths
   - HTTP to HTTPS redirect

4. **Restart Nginx**
   ```bash
   docker-compose restart nginx
   ```

### Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backing Up Data

**Database Backup:**
```bash
docker exec robotics_academy_db pg_dump -U postgres robotics_academy > backup_$(date +%Y%m%d).sql
```

**Restore Database:**
```bash
docker exec -i robotics_academy_db psql -U postgres robotics_academy < backup_20240101.sql
```

**Uploads Backup:**
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

## Project Structure

```
robotics-academy-platform/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   ├── admin/               # Admin panel (CMS)
│   ├── parent/              # Parent portal
│   ├── lms/                 # Learning Management System
│   ├── blog/                # Public blog
│   ├── courses/             # Course listings
│   └── login/               # Authentication
├── components/              # Reusable React components
│   ├── ui/                  # UI components (Button, Card, etc.)
│   └── layout/              # Layout components (Navbar, Footer)
├── lib/                     # Utility libraries
│   ├── prisma.ts           # Database client
│   ├── auth.ts             # Authentication configuration
│   ├── permissions.ts      # Permission checking utilities
│   └── utils.ts            # Helper functions
├── prisma/                  # Database configuration
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Initial data seeding
├── nginx/                   # Nginx configuration
│   └── nginx.conf          # Reverse proxy config
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Application container
└── README.md               # This file
```

## Database Schema

Key models:
- **User** - All user accounts
- **Role** - Custom role definitions
- **Permission** - Granular permissions
- **ParentProfile, StudentProfile, TeacherProfile** - User-specific data
- **Invoice, InvoiceItem** - Billing system
- **KnowledgeNode** - LMS content
- **Assignment, AssignmentSubmission** - Assignment management
- **Page, Blog, Course** - Public content
- **PageView, SystemMetric** - Analytics data

## API Routes

### Public
- `GET /api/contact` - Contact form submissions

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/analytics` - Get analytics data
- `GET /api/admin/system` - System metrics

### LMS
- `GET /api/lms/knowledge` - List knowledge nodes
- `POST /api/lms/knowledge` - Create knowledge node
- `GET /api/lms/assignments` - List assignments

## Permission System

The platform uses a flexible role-based access control (RBAC) system:

- Admins can create custom roles
- Permissions are granular (resource + action)
- Example: `blog:create`, `invoice:view_own`, `knowledge:edit`
- Middleware automatically checks permissions on routes

## Monitoring & Analytics

### Built-in Analytics
- Page views (path, user role, timestamp)
- Unique visitors
- Session duration
- User engagement metrics

### System Monitoring
- CPU usage
- Memory usage
- Disk space
- Database connections
- Network traffic

Access via: `/admin/analytics`

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs app
```

### Migration Issues
```bash
# Reset database (⚠️ WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d

# Or manually run migrations
docker exec robotics_academy_app npx prisma migrate deploy
```

### Port Conflicts
If ports 3000, 5432, or 80 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8080:80"    # Change external port
  - "3001:3000"  # Change external port
```

## Performance Optimization

### Enable Caching
Next.js automatically caches static pages. Configure revalidation:
```typescript
export const revalidate = 60; // Revalidate every 60 seconds
```

### Database Indexing
Key indexes are already defined in the Prisma schema for optimal performance.

### Image Optimization
Use Next.js Image component for automatic optimization:
```tsx
import Image from 'next/image';
<Image src="/path" width={500} height={300} alt="Description" />
```

## Security Considerations

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ CSRF protection
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (React escaping)
- ✅ Rate limiting (Nginx)
- ✅ Security headers (Nginx)
- ⚠️ Regular security updates recommended
- ⚠️ Change default admin password
- ⚠️ Use strong NEXTAUTH_SECRET

## Support & Contributing

For issues, questions, or contributions, please contact the development team.

## License

Proprietary - All rights reserved

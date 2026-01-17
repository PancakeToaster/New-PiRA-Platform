# Quick Start Guide

## For Development (Local Testing)

### Prerequisites
- Node.js 18+
- PostgreSQL 16

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/robotics_academy"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ```

3. **Initialize database**
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access application**
   - Open: http://localhost:3000
   - Login: admin@roboticsacademy.com / admin123

---

## For Production (Docker)

### Prerequisites
- Docker & Docker Compose
- Domain with SSL certificate

### Steps

1. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Access application**
   - Open: https://yourdomain.com
   - Login: admin@roboticsacademy.com / admin123

---

## Default User Roles

After seeding, you have 5 default roles:

1. **Public** - Unauthenticated users
   - View public pages, blog, courses

2. **Parent** - Portal access
   - View invoices
   - View linked student progress

3. **Student** - LMS access
   - Access knowledge base
   - Submit assignments
   - Track progress

4. **Teacher** - Content creator
   - Create knowledge nodes
   - Create assignments
   - Grade work
   - View all student progress

5. **Admin** - Full access
   - All permissions
   - User management
   - System settings
   - Analytics

---

## Common Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
```

### Docker
```bash
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f app        # View app logs
docker-compose restart            # Restart services
docker-compose ps                 # View service status
```

### Database
```bash
# Backup
docker exec robotics_academy_db pg_dump -U postgres robotics_academy > backup.sql

# Restore
docker exec -i robotics_academy_db psql -U postgres robotics_academy < backup.sql
```

---

## URLs After Deployment

- **Homepage**: `/`
- **Login**: `/login`
- **Parent Portal**: `/parent`
- **LMS**: `/lms`
- **Admin Panel**: `/admin`
- **Blog**: `/blog`
- **Courses**: `/courses`
- **About**: `/about`
- **Contact**: `/contact`

---

## First Steps After Deployment

1. ✅ Login as admin
2. ✅ Change admin password
3. ✅ Create teacher accounts
4. ✅ Create student accounts
5. ✅ Create parent accounts
6. ✅ Link parents to students
7. ✅ Add courses
8. ✅ Customize pages
9. ✅ Create blog posts
10. ✅ Test all features

---

## Need Help?

- Full documentation: `README.md`
- Deployment guide: `DEPLOYMENT.md`
- Check logs: `docker-compose logs -f`

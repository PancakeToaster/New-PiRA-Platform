# Robotics Academy Platform - QA Checklist

Use this checklist to verify the platform functions correctly before production deployment.

## 1. Public Layer (No Login)
- [ ] **Homepage**: Verify all sections load (Hero, Shapes, Stats). check that "Explore Courses" link works.
- [ ] **Courses**: Ensure course list loads. Click "Learn More" -> Should go to generic Contact page (or course detail if implemented).
- [ ] **Blog**: Verify blog post list loads. Click a post -> Ensure content reads correctly.
- [ ] **Contact**: Fill out form -> Submit. Check if "Message Sent" success state appears.
- [ ] **Responsiveness**: Resize window to mobile width. Verify Navbar becomes a hamburger menu and layout stacks.

## 2. Authentication
- [ ] **Login**: Attempt login with invalid credentials -> Expect error message.
- [ ] **Login**: Log in as each user type (Admin, Teacher, Student, Parent).
- [ ] **Logout**: Verify clicking Logout redirects to login page.
- [ ] **Persistance**: Refresh page after login -> Should stay logged in.
- [ ] **Redirects**: Try accessing `/admin` as Student -> Should redirect to `/login` or 403 Page (after middleware fix).

## 3. Admin Panel (Logged in as Admin)
- [ ] **Dashboard**: Verify stats (Total Users, Revenue) match database expectations.
- [ ] **User Management**:
    - [ ] Create a new User (Student).
    - [ ] Edit that User (Change name).
    - [ ] Delete a test User.
- [ ] **Role Management**: View Roles page (Note: currently Mock data, testing if it renders).
- [ ] **Invoices**: Create a new Invoice for a Parent. Verify it appears in the list.
- [ ] **Content**: Create a new Blog post. Verify it appears on the Public site.

## 4. Student Portal (Logged in as Student)
- [ ] **LMS Dashboard**: Verify "My Courses" list is visible.
- [ ] **Assignments**: View an assignment. Submit text/file (if implemented).
- [ ] **Projects**:
    - [ ] Create a new Task.
    - [ ] Move task status (Drag & Drop if available, or Edit).
    - [ ] Comment on a task.

## 5. Parent Portal (Logged in as Parent)
- [ ] **Dashboard**: Verify linked Student(s) are visible.
- [ ] **Invoices**:
    - [ ] View list of invoices.
    - [ ] Click an invoice to view details (Line items).
    - [ ] (If enabled) Click "Pay" -> Verify mock payment flow.

## 6. Teacher Portal (Logged in as Teacher)
- [ ] **LMS**: Create a new Folder/Knowledge Node.
- [ ] **Assignments**: Create a new Assignment.
- [ ] **Grading**: View student submission and assign a grade.

## 7. Critical Edge Cases
- [ ] **Mock Data**: Verify Home Page still works even if Database is empty (due to `realData.ts` fallback).
- [ ] **Seeding**: Run `npm run prisma:seed` twice. Verify it doesn't crash or create duplicate admin users.
- [ ] **Uploads**: Upload a profile picture. Verify it persists after refresh.

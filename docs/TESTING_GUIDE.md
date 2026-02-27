# PiRA Platform - Comprehensive Testing Guide

This guide provides a structured set of manual tests to verify the functionality of the PiRA Platform. It is designed to ensure all components work as expected across different user roles.

## 1. Authentication & Roles
**Objective:** Verify access control and session management.

- [ ] **Admin Login:** Log in with an Admin account. Verify access to `/admin` dashboard.
- [ ] **Teacher Login:** Log in with a Teacher account. Verify access to `/lms` but NO access to `/admin/finance`.
- [ ] **Parent Login:** Log in with a Parent account. Verify access to `/parent` dashboard.
- [ ] **Student Login:** Log in with a Student account. Verify access to `/student` dashboard.
- [ ] **Public Access:** Visit `/` (Home), `/demo`, and `/calendar` (Public View) without logging in.

## 2. Calendar Module (New Permissions)
**Objective:** Verify strict permission logic for Events.

### 2.1 Public User
- [ ] Navigate to `/calendar`.
- [ ] **Verify:** View events marked as "Public".
- [ ] **Verify:** "Add Event" button is NOT visible.
- [ ] **Verify:** Clicking an event shows details but NO "Delete" button.

### 2.2 Teacher/Mentor
- [ ] Log in as Teacher or Mentor.
- [ ] Navigate to `/calendar`.
- [ ] **Verify:** "Add Event" button IS visible.
- [ ] **Action:** Create a new event (e.g., "Robotics Club meeting").
- [ ] **Verify:** Event appears on the calendar.
- [ ] **Action:** Click the event you just created.
- [ ] **Verify:** "Delete" button is **NOT** visible (only Admins can delete).

### 2.3 Admin
- [ ] Log in as Admin.
- [ ] Navigate to `/calendar`.
- [ ] **Action:** Click an event created by a Teacher.
- [ ] **Verify:** "Delete" button **IS** visible.
- [ ] **Action:** Click "Delete" and confirm.
- [ ] **Verify:** Event is removed from the calendar.

## 3. Build & Deployment Checks
**Objective:** Ensure the application is stable in production mode.

- [ ] **Route Conflict:** Navigate to `/demo`. Verify it loads the demo landing page without error (checking the `(demo)` -> `demo` rename fix).
- [ ] **Invoice Generation:**
    - Go to `/admin/invoices`.
    - Select an invoice.
    - Click "Send Email".
    - **Verify:** Success message appears (verifies `Resend` runtime fix).
- [ ] **Static Pages:** Navigate to standard pages (`/about`, `/contact`, `/courses`) to ensure static generation worked.

## 4. LMS & Courses
**Objective:** Verify core learning flow.

- [ ] **Course Browsing:** View course catalog. Filter by age/category.
- [ ] **Enrollment (Admin):** Manually enroll a student in a course via `/admin/users`.
- [ ] **Content Access (Student):**
    - Log in as the enrolled student.
    - Go to `/student/courses`.
    - Open the course and view a lesson.
- [ ] **Assignments:**
    - **Teacher:** Create an assignment in a course.
    - **Student:** Submit text or file for the assignment.
    - **Teacher:** Grade the submission in `/lms/grading`.

## 5. Wiki & Knowledge Base
**Objective:** Verify content creation and visualization.

- [ ] **Graph View:** Navigate to `/admin/knowledge`. Check if the Knowledge Graph renders (verifies React Flow fix).
- [ ] **Editing:** Open a wiki node. Edit content using the WYSIWYG editor. Save.
- [ ] **Suggestion:** Create a suggestion as a non-admin. Approve it as an Admin.

## 6. Finance (Admin Only)
**Objective:** Verify business operations.

- [ ] **Invoices:** Create a new invoice. Verify PDF preview.
- [ ] **Payments:** Mark an invoice as "Paid". Check status update.
- [ ] **Expenses:** Log a new expense. Upload a receipt (mock upload).

## 7. User Management
- [ ] **Profile:** Update user profile (Avatar, Bio).
- [ ] **Students (Parent):** Add a new student to a Parent account.
- [ ] **Staff:** Assign "Mentor" role to a user.

## 8. Mobile Responsiveness
- [ ] **Navigation:** Open on mobile view (Chrome DevTools). Verify Hamburger menu works.
- [ ] **Tables:** Check if data tables (Grades, Users) verify gracefully or scroll horizontally.

---

**Tester Notes:**
- Mark valid tests with [x].
- Log any bugs found in `task.md` or report directly.

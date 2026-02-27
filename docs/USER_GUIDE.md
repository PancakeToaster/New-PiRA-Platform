# Robotics Academy Platform - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Admin Guide](#admin-guide)
3. [Teacher Guide](#teacher-guide)
4. [Student Guide](#student-guide)
5. [Parent Guide](#parent-guide)

---

## Getting Started

### First Login
1. Navigate to your platform URL
2. Click **"Sign In"** or **"Join"** (for new users)
3. Enter your credentials
4. You'll be redirected to the **Portal** (app selector)

### Portal / App Switcher
After logging in, you'll see available apps based on your role:
- **Admin Panel** - System management (Admin only)
- **LMS Platform** - Courses and assignments (Teachers, Students)
- **Project Management** - Team collaboration (Mentors, Team Captains, Students)
- **Parent Portal** - Student progress tracking (Parents)
- **Knowledge Base** - Wiki and documentation (All users)

Click any app to access its features.

---

## Admin Guide

### Dashboard Overview
**Location**: Admin Panel → Dashboard

View key metrics:
- **Financial Health**: Revenue, expenses, cash flow
- **User Statistics**: Total users, new registrations
- **Content Stats**: Knowledge nodes, assignments, blogs
- **System Health**: CPU, RAM, Disk usage (App + Database)

### User Management
**Location**: Admin Panel → Users

#### Approving New Users
1. Navigate to **Users** tab
2. Find pending users (Status: Inactive)
3. Toggle the **Status Switch** to approve
4. User receives access immediately

#### Editing User Details
1. Click user's name in the list
2. Update: Email, Name, Roles, Profile info
3. **Linked Children** (Parents): Add student connections
4. Click **"Update User"**

#### Managing Roles
Available roles:
- **Admin** - Full system access
- **Teacher** - Course management, grading
- **Student** - Course enrollment, assignments
- **Parent** - View student progress
- **Mentor** - Project guidance
- **Team Captain** - Project leadership

### Financial Management
**Location**: Admin Panel → Finance & Operations

#### Invoices
- **Create**: Select parent, add line items, set due date
- **Edit**: Update status, payment date, items
- **Auto-Discounts**: Referral + Performance discounts applied automatically
- **Payment Methods**: Zelle, Venmo, Check, Cash (manual entry)

#### Expenses
- **Track**: Record expenses with receipts
- **Link**: Associate with inventory items
- **Categories**: Categorize for reporting

#### Payroll
- **Record**: Log payroll runs with amounts
- **History**: View past payroll records

#### Inventory
- **Manage**: Track items, quantities, costs
- **Hot Commodities**: View top 5 items by expense

### System Analytics
**Location**: Admin Panel → Analytics

#### Overview Tab
- User counts, revenue, page views
- Activity summary

#### System Health Tab
- **CPU Load**: Current usage, cores, speed
- **Memory**: Used/Free RAM
- **Disk Storage**: App (blue) + Database (purple) + System (gray)
- **OS Info**: Platform, uptime, Node.js version

#### Activity Logs Tab
- Track user actions (approvals, role changes, deletions)
- View who did what, when

#### Error Logs Tab
- Monitor system errors
- Mark as resolved

### Knowledge Base Management
**Location**: Wiki (Admin Mode)

- **Edit Mode**: Click pencil icon to edit content inline
- **Publish**: Toggle publish status for pages
- **Organize**: Drag & drop to reorganize (Combine Mode)
- **Create**: Add new pages/folders via "+" menu
- **Delete**: Remove pages (Admin only)

---

## Teacher Guide

### Course Management
**Location**: LMS Platform → Courses

#### Creating a Course
1. Navigate to **Admin Panel → Courses**
2. Click **"Create Course"**
3. Fill in: Title, Description, Visibility settings
4. Click **"Create"**

#### Building Course Content
1. Open your course
2. Click **"Course Builder"**
3. Add **Modules** (sections)
4. Add **Lessons** within modules
5. Drag to reorder
6. Click **"Save Changes"**

### Assignment Management

#### Creating Assignments
1. Go to course → **Assignments** tab
2. Click **"Create Assignment"**
3. Set: Title, Description, Due Date, Points
4. Click **"Create"**

#### Grading Submissions
1. Navigate to **LMS → Assignments**
2. Click assignment to view submissions
3. For each submission:
   - Review student work
   - Enter grade and feedback
   - Click **"Submit Grade"**

### Quiz Management

#### Creating Quizzes
1. Go to course → **Quizzes** tab
2. Click **"Create Quiz"**
3. Add questions via **Quiz Builder**:
   - Multiple choice
   - True/False
   - Short answer
4. Set point values
5. Click **"Save Quiz"**

#### Viewing Results
- Auto-graded: Multiple choice, True/False
- Manual grading: Short answer questions

### Gradebook
**Location**: Admin Panel → Courses → [Course] → Grades

- View all students' grades in grid format
- Export to CSV
- Track assignment completion

---

## Student Guide

### Enrolling in Courses
**Location**: LMS Platform

1. Browse available courses
2. Click **"Enroll"** on desired course
3. Access course content immediately

### Viewing Course Content
1. Open enrolled course
2. Navigate through modules and lessons
3. Mark lessons as complete
4. Track progress bar

### Submitting Assignments
**Location**: LMS → Assignments

1. Click on assignment
2. Read instructions
3. Upload file or enter text response
4. Click **"Submit Assignment"**
5. View submission confirmation

### Taking Quizzes
**Location**: Student → Quizzes

1. Click **"Take Quiz"**
2. Answer all questions
3. Click **"Submit Quiz"**
4. View results (if auto-graded)

### Viewing Grades
**Location**: Student → Profile

- View all grades and feedback
- Track overall progress
- See earned certificates and badges

### Project Management
**Location**: Project Management App

1. Join a team
2. View assigned tasks
3. Update task status (To Do → In Progress → Done)
4. Collaborate with team members

---

## Parent Guide

### Viewing Student Progress
**Location**: Parent Portal

1. Select your child from the list
2. View:
   - **Courses**: Enrolled courses and progress
   - **Grades**: Assignment scores and feedback
   - **Attendance**: Calendar view of events
   - **Achievements**: Certificates and badges

### Invoices & Payments
**Location**: Parent Portal → Invoices

1. View all invoices (Paid, Unpaid, Overdue)
2. Download PDF invoices
3. Contact admin for payment arrangements

### Calendar
**Location**: Parent Portal → Calendar

- View student's schedule
- See upcoming assignments and events
- Filter by event type

### Communication
- Contact teachers via platform messaging (if enabled)
- Receive notifications for grade updates

---

## Common Tasks

### Changing Password
1. Click profile icon (top right)
2. Select **"Profile"**
3. Click **"Change Password"**
4. Enter current and new password
5. Click **"Update"**

### Updating Profile
1. Go to **Profile** page
2. Update: Bio, Photo, Contact info
3. Click **"Save Changes"**

### Switching Apps
1. Click **App Switcher** icon (grid, top right)
2. Select desired app
3. Navigate to new context

### Searching Knowledge Base
1. Open **Wiki** app
2. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows)
3. Type search query
4. Select result

---

## Troubleshooting

### Can't Log In
- Verify email and password
- Check for typos
- Contact admin if account is not approved

### Missing Features
- Verify your role has access
- Check with admin if you need additional permissions

### Slow Performance
- Clear browser cache
- Try different browser
- Contact admin to check System Health metrics

### File Upload Issues
- Check file size (max 10MB)
- Verify file type is allowed
- Ensure stable internet connection

---

## Support

For technical issues or questions:
- **Admin**: Check System Health dashboard, Activity Logs, Error Logs
- **Users**: Contact your administrator
- **Platform Issues**: Review deployment logs

---

## Quick Reference

### Keyboard Shortcuts
- **Cmd/Ctrl + K**: Open Wiki search
- **Cmd/Ctrl + S**: Save (in editors)

### User Roles Summary
| Role | Access |
|------|--------|
| Admin | Full system control |
| Teacher | Course management, grading |
| Student | Course enrollment, assignments |
| Parent | Student progress viewing |
| Mentor | Project guidance |
| Team Captain | Project leadership |

### Key URLs
- **Portal**: `/portal`
- **Admin Panel**: `/admin`
- **LMS**: `/lms` or `/student`
- **Parent Portal**: `/parent`
- **Wiki**: `/wiki`
- **Projects**: `/projects`

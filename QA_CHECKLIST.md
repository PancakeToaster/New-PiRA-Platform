# Robotics Academy Platform - QA Checklist

Verify these key flows before official release:

## 1. Authentication & Onboarding
- [ ] **Sign Up**: Register a new user account. Verify email confirmation (if enabled) or immediate login.
- [ ] **Sign In**: Log in with existing credentials. Verify redirection to appropriate dashboard.
- [ ] **Forgot Password**: Verify the "Forgot Password" flow works (if configured).
- [ ] **Profile**: Check Profile page. Update name/email/avatar. Verify persistence.
- [ ] **Logout**: Click Logout. Verify session is cleared and redirected to login.

## 2. Team Management
- [ ] **Create Team**: Create a new team as Admin. Verify redirection to team dashboard.
- [ ] **Invite Members**: Add users to team. Verify they appear in member list with correct role.
- [ ] **Roles**: Promote a member to Captain/Mentor. Verify their permissions (e.g., can they create projects?).
- [ ] **Settings**: Update Team Name/Description/Color. Verify changes in sidebar.
- [ ] **Safe Delete**: Try to delete a team. Verify confirmation dialog requires typing name.
- [ ] **Archive Team**: Archive a team. 
  - [ ] Verify Regular Members strictly cannot see it in sidebar or list.
  - [ ] Verify Admin/Owner CAN see it in "Archived" tab.
  - [ ] Verify team is read-only (state `isActive: false`).
- [ ] **Restore Team**: Restore an archived team. Verify it reappears in "Active" tab and sidebar.
- [ ] **Member Removal**: Verify that Archiving removed regular members (check member list).

## 3. Project & Task Management
- [ ] **Create Project**: Create a project inside a team. Verify it appears in sidebar.
- [ ] **Project Settings**: Edit project details. Change status/priority.
- [ ] **Tasks**:
  - [ ] Create a Task.
  - [ ] Edit Task details/description.
  - [ ] Assign Task to a member.
  - [ ] Change Task status (Kanban drag & drop).
  - [ ] Delete Task.
- [ ] **Subteams**: Create a subteam. Assign a project to it. Verify filtering.
- [ ] **Gantt Chart**: Verify tasks appear on timeline correctly. Dependency linking (if implemented).
- [ ] **Files**: Upload a file to a project/team. Verify detailed view and download.

## 4. File Management (Team Level)
- [ ] **Upload**: Upload text, image, and PDF files. Verify preview.
- [ ] **Folders**: Create Folders and nested Subfolders.
- [ ] **Navigation**: Navigate into folders. Use Breadcrumbs and "Back" button.
- [ ] **Move**: Drag and drop files into folders. Verify move persistence.
- [ ] **View Modes**: Switch between Grid and List view. Refresh page to verify preference saved.

## 5. LMS & Wiki (If Enabled)
- [ ] **Course View**: Student can see enrolled courses.
- [ ] **Forum**: 
  - [ ] Create a Thread.
  - [ ] Reply to a Thread.
  - [ ] Verify Private vs Public thread visibility.
- [ ] **Grades**: Teacher can edit grades; Student can view own grades.
- [ ] **Wiki**: Create and nest pages. Drag and drop pages to reorder/nest.

## 6. Security & Permissions
- [ ] **Member Isolation**: Verify regular members cannot access Admin settings.
- [ ] **Cross-Team**: Verify users cannot access teams they don't belong to (unless Admin).
- [ ] **Archived Access**: Verify archived teams are read-only or hidden for non-admins.
- [ ] **Route Protection**: Try accessing `/admin` as Student. Verify Redirect/403.

## 7. Critical Edge Cases
- [ ] **Empty States**: Verify Team/Project lists look good when empty.
- [ ] **Search**: value search filters in lists (Teams, Projects).
- [ ] **Mobile View**: Resize window. Verify Sidebar toggles and layout stacks correctly.

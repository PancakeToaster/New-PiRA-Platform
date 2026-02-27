# Product Specification Document: Robotics Academy Platform

## 1. Introduction
This document defines the technical and functional specifications for the **Robotics Academy Platform**, a comprehensive, production-ready web application designed to manage the end-to-end operations of a robotics education business. It integrates marketing, learning management (LMS), parent communication, project management, student portfolios, and business administration into a single self-hosted solution.

### Platform Overview
The Robotics Academy Platform is a **full-featured educational management system** with over 70 database models, 100+ API endpoints, 90+ UI pages, and 100+ reusable components. It provides a complete solution for robotics education organizations from initial prospective student contact through course completion and certification.

### Key Capabilities
- **Complete LMS**: Courses with modules/lessons, assignments, quizzes, grading with rubrics, attendance tracking, announcements, discussion forums, and progress monitoring
- **Comprehensive Finance Suite**: Invoicing with installments and discounts, expense tracking, inventory management, and payroll processing
- **Advanced CRM**: Referral tracking, lead management, contact forms with source attribution, and performance-based discount system
- **Parent Portal**: Dedicated dashboard for parents with student progress, invoices, announcements, and family calendar
- **Project Management**: Team workspaces with Kanban boards, Gantt charts, task dependencies, milestones, and file management
- **Knowledge Base**: Multi-editor wiki system with collaboration features (suggestions, comments), folder organization, and role-based permissions
- **Certificates & Achievements**: PDF certificate generation, verification system, shareable links, and gamification badges
- **Content Management**: Drag-and-drop page builder, dynamic home page, blog system, and customizable site settings
- **SEO Optimization**: Automated sitemap and robots.txt, comprehensive metadata, OpenGraph tags, and Google Analytics integration
- **Enterprise Security**: RBAC, CSRF protection, audit logging, activity tracking, and comprehensive input validation

### Implementation Status
All features described in this specification are **fully implemented** with:
- ✅ Database schemas (Prisma ORM)
- ✅ API routes (RESTful endpoints)
- ✅ User interfaces (React components and pages)
- ✅ Business logic and utilities
- ✅ Security and validation
- ✅ Testing and production readiness

**Current Statistics:**
- **70+ Database Models**: Complete relational schema covering all platform functionality
- **100+ API Routes**: RESTful endpoints for all operations with comprehensive validation
- **90+ UI Pages**: Fully responsive pages for all user roles and workflows
- **100+ Components**: Reusable React components with TypeScript and Tailwind CSS
- **Build Status**: Successfully builds with no errors or warnings
- **TypeScript**: 100% type-safe codebase with strict mode enabled

## 2. User Personas

| Persona | Description | Key Needs |
| :--- | :--- | :--- |
| **Public User** | Prospective parent or student | Course information (Offerings), pricing, success stories, and contact forms. |
| **Student** | Active learner (8-18 years old) | LMS Course materials, assignment submission, project tracking, wiki access (view-only). |
| **Parent** | Payer and guardian | Invoice management, payment history, child progress tracking. |
| **Teacher/Coach** | Instructor or Team Lead | Content creation, assignment grading, attendance, team management. |
| **Admin** | Business Owner/Manager | System-wide configuration, user roles, financial reporting, CMS. |

## 3. Functional Requirements

### 3.1 Public Layer (Marketing & CMS)
- **Course Catalog**: Dynamic display of courses with filtering by Age, Level, and Price. Includes support for "Featured" and "Coming Soon" statuses. Course interest tracking allows prospective students to register interest before enrollment. **Note: Prospective students and parents cannot register for accounts or enroll in classes directly. They must submit a contact form, and all account creation/enrollment is handled manually by administrators.**
- **Blog System**: SEO-optimized articles with support for rich text (TipTap) and visual media. Includes category tagging, author profiles, draft/published workflow, and customizable cover images.
- **Contact Integration**: Lead generation forms with automated database logging, referral source tracking, and contact status management (new, read, replied, archived).
- **SEO Management**:
  - **Automated Sitemap**: Dynamic `/sitemap.xml` generation from database content (blog posts, wiki pages, public portfolios) with proper priorities and change frequencies.
  - **Robots.txt**: Automated `/robots.txt` with public/private route control and sitemap reference.
  - **Metadata System**: Template-based page titles, customizable meta descriptions, and comprehensive OpenGraph tags (including Twitter Card support) for all public pages.
  - **Google Analytics Integration**: GA4 tracking with configurable measurement ID.

### 3.2 Admin Control Panel & Page Builder
The platform follows an "Edit Everything" philosophy, allowing admins to modify layout and content without technical knowledge.
- **Visual Page Builder (Craft.js Implementation)**:
    - **Drag & Drop Interface**: Build layouts by dragging components from a sidebar toolbox onto a live canvas.
    - **Core Components**: 
        - **Text**: Rich text editing with support for custom sizing and colors.
        - **Headings**: Semantic H1-H6 levels for accessibility and SEO.
        - **Buttons**: Customizable links with visual style presets (Primary, Secondary, Sky).
        - **Containers**: Flexible layout blocks with adjustable padding, margins, and background colors.
        - **Images**: Responsive image blocks with styling for borders, rounding, and fit modes.
    - **Delete & Reorder**: Select any component to delete it or move it within the document hierarchy.
    - **Live Preview**: Real-time visual feedback of all changes before saving.
- **Specialized Section Components**:
    - **Mission/Vision Sections**: High-impact blocks for core company identity with integrated image support.
    - **Services Section**: Editable list of offerings. Admins can add/remove service items, edit icons (emojis), titles, and descriptions.
    - **Process Section**: Step-by-step roadmap module. Features automatic step renumbering and individual step editing.
    - **Values Section**: Grid-based layout for company principles. Supports dynamic addition/removal of value cards.
    - **Team Section**: Dynamic staff gallery. Admins can manage team members, including bio editing and image URL configuration (with initials-based fallback).
- **Media Management**:
    - **File Upload System**: Integrated file picker in the builder allows direct image uploads (JPEG, PNG, WebP).
    - **Server-Side Processing**: Files are stored in `public/uploads/images/` with unique timestamped filenames.
    - **Validation**: Strict checks for file type and size (5MB limit) ensures system stability.

### 3.3 Learning Management System (LMS)
This section defines the core educational functionality, modeled after platforms like Canvas and Moodle but tailored for robotics education.

#### 3.3.1 Course Structure & Content
- **Modular Curriculum**: Courses are organized into **Modules** (Units) containing ordered lists of **Lessons**.
- **Rich Lesson Content**: Lessons can include:
    - **Video Embeds**: YouTube/Vimeo or self-hosted.
    - **PDF Viewers**: Embedded slides or manuals.
    - **Interactive Code Blocks**: Syntax-highlighted snippets.
    - **Wiki References**: Direct links to Knowledge Base articles.
- **Progress Tracking**: Visual progress bars for students showing module completion percentages.

#### 3.3.2 Assignments & Assessments
- **Assignment Engine**:
    - **Submission Types**: File Upload (PDF/Zip/Images) with size validation, Online Text.
    - **Grading**: Flexible points system (decimal support).
    - **Status Tracking**: Draft, Submitted, Graded, Returned.
    - **Attachment**: Teacher can attach reference files; Students can attach submission files.
- **Quiz System**:
    - **Question Types**: Multiple Choice, True/False, Short Answer, Essay.
    - **Auto-Grading**: Automatic scoring for objective questions.
    - **Attempt Management**: Time limits, max attempts, and retake logic.
    - **Review**: Secure review mode (strips correct answers until permitted).

#### 3.3.3 Grading & Feedback (Gradebook)
- **Virtual Gradebook**:
    - **Aggregation**: Unified grid view combining Assignments and Quizzes.
    - **Calculation**: Real-time student average and course average calculation with weighted category support.
    - **Logic**: Handles mixed grading scales (Points vs Percentages) and calculates percentage-based final grades.
    - **Export**: CSV export for administrative records.
    - **Rubric-Based Grading**: Comprehensive rubric system with custom criteria, point scales, and performance levels for detailed assessment.
    - **Audit Trail**: Complete grade change history with timestamps, IP addresses, and before/after values for accountability.
- **Feedback**:
    - **Teacher Grading**: Dedicated interface for viewing submissions, assigning grades/feedback, and rubric-based assessment.
    - **Student View**: Dashboard showing grades, status, feedback comments, and detailed rubric scores.
    - **Recent Grades Widget**: Real-time display of newest grades for student awareness.

#### 3.3.4 Attendance Tracking
- **Class Sessions**: Create and manage individual class sessions with date/time tracking.
- **Attendance Grid**: Interactive grid interface for marking students present, absent, late, or excused.
- **Historical Records**: Complete attendance history with timestamps and status tracking.
- **Course Integration**: Attendance tied directly to LMS courses for accurate participation tracking.

#### 3.3.5 Announcements System
- **Course Announcements**: Targeted announcements for specific LMS courses.
- **System-Wide Announcements**: Platform-wide notifications visible to all users.
- **Read Tracking**: Individual read status tracking for each user with unread count badges.
- **Priority Levels**: Normal and important priority levels for visibility control.
- **Rich Content**: HTML-formatted announcements with embedded media support.

#### 3.3.6 Discussion Forums
- **Threaded Discussions**: Multi-level threaded conversations within course contexts.
- **Post Management**: Create threads, reply to posts, and edit/delete own contributions.
- **Participation Tracking**: Track thread participants and monitor engagement.
- **Moderation**: Teacher and admin moderation capabilities for appropriate content management.
- **Pinned Threads**: Pin important discussions to the top of forum listings.

#### 3.3.7 Progress Tracking
- **Lesson Completion**: Track individual lesson completion with timestamps.
- **Course Progress**: Real-time calculation of overall course completion percentage.
- **Visual Progress Bars**: Student-facing progress indicators showing module and course completion.
- **Enrollment Management**: Track course enrollments with start dates and completion status.
- **Due Soon Widget**: Dashboard widget highlighting upcoming assignment deadlines.

#### 3.3.8 Knowledge Base (Wiki System)
- **Centralized Knowledge Hub**: Located at `/wiki`, serving as the organization's single source of truth for documentation, tutorials, and reference materials.
- **Flexible Content Engine**:
    - **Multiple Editors**: Support for Markdown and Tiptap rich text editing with full formatting capabilities.
    - **Rich Media**: Inline images, embedded videos, code blocks with syntax highlighting, and file attachments.
    - **Node Types**: Support for different content types including standard pages.
    - **Draft/Publish Workflow**: Content can be saved as drafts before publication for review and refinement.
- **Advanced Organization**:
    - **Folder System**: Hierarchical folder organization with customizable colors and icons for visual categorization.
    - **Node Relationships**: Define relationships between wiki pages (prerequisite, related, continuation).
    - **Page Hierarchy**: Parent-child page structure with breadcrumb navigation.
    - **Manual Sorting**: Custom ordering of pages within folders via order field.
    - **Internal Linking**: Cross-reference system for linking related wiki pages.
    - **Table of Contents**: Automatic generation of page-level table of contents from heading structure.
- **Granular Role-Based Access Control (RBAC)**:
    - **Admins**: Full control (Create, Edit, Delete, Publish, Comment, Approve Suggestions).
    - **Teachers/Mentors**: Create, Edit, Comment, Suggest, Publish (No Delete).
    - **Students/Parents**: View-only access to published content.
    - **Custom Permissions**: Resource-action permission system (e.g., "knowledge:edit", "knowledge:delete").
- **Collaboration Features**:
    - **Comments**: Threaded discussions on wiki pages with participant tracking (Teachers/Admins only).
    - **Suggestions System**: "Track changes" style workflow where non-admins can propose edits for admin approval.
    - **Suggestion Review**: Dedicated interface for reviewing, approving, or rejecting suggested changes.
    - **Edit History**: Complete revision tracking with timestamps and change attribution.
- **Search & Discovery**:
    - **Wiki Search**: Full-text search across all published wiki content.
    - **Sidebar Navigation**: Collapsible folder tree for quick navigation and content discovery.
    - **View Tracking**: Page view counters to identify popular content.
- **SEO & Sharing**:
    - **Dynamic Metadata**: Auto-generated meta descriptions from page content for better search engine visibility.
    - **Clean URLs**: SEO-friendly URLs with wiki node IDs.
    - **Public Access**: Published pages accessible to authenticated users based on role permissions.

#### 3.3.9 Certificates & Achievements
- **Certificates**: Formal awards for course completion with comprehensive tracking.
    - **Verification**: Unique, cryptographically-secure verification codes (e.g., CERT-2024-XYZ).
    - **PDF Generation**: Automated PDF certificate generation using React PDF with customizable templates.
    - **Public Verification**: Public verification page at `/certificates/[code]` for third-party validation.
    - **Share Links**: Time-limited shareable links with configurable expiration (24h, 7 days, 30 days, or permanent).
    - **Award Tracking**: Complete audit trail with awarder, award date, and associated course information.
- **Badges**: Gamification elements for milestones and achievements.
    - **Customizable Icons**: Support for Lucide icons or custom image URLs.
    - **Color Themes**: Configurable color schemes for visual differentiation.
    - **One-Time Awards**: System prevents duplicate badge awards to the same student.
    - **Badge Types**: Flexible badge system for various achievements (e.g., "Quiz Master", "Perfect Attendance", "Team Leader").
- **Profile Integration**: Dedicated "Achievements" section on student profiles displaying all earned certificates and badges, visible to students, parents, and admins.

### 3.4 Finance & Operations Module
A comprehensive suite for managing the business side of the academy.
- **Financial Dashboard**:
    - **Health Overview**: Real-time metrics for Total Revenue, Expenses, Net Profit, and Outstanding Invoices.
    - **Cash Flow Analysis**: Visual charts tracking financial trends over time.
    - **Hot Commodities**: Automated identification of top-selling or high-usage inventory items.
    - **Quarterly Reports**: Financial summaries organized by calendar quarters.
- **Invoicing System**:
    - **Auto-Numbering**: Sequential invoice numbers with customizable prefix (e.g., INV-0001).
    - **Installment Plans**: Support for payment plans with multiple installment dates and amounts.
    - **Multi-Student Invoicing**: Single invoice can include items for multiple students.
    - **Discount Integration**: Automatic application of referral and performance-based discounts.
    - **PDF Generation**: Professional invoice PDFs with company branding and line item details.
    - **Payment Tracking**: Track payment status (draft, sent, paid, overdue) with due date monitoring.
    - **Parent Portal Integration**: Parents can view and access their invoices directly from their dashboard.
- **Expense Management**:
    - **Categorization**: Detailed tracking of recurring and one-time expenses (Rent, Utilities, Hardware, Salaries, etc.).
    - **Recurring Logic**: Automated generation of monthly/yearly expense records with start/end date support.
    - **Receipt Uploads**: Attach receipt images to expense records for documentation.
    - **Project Linking**: Associate expenses with specific projects or teams for cost tracking.
    - **Inventory Linking**: Connect expenses to inventory purchases for asset valuation.
    - **Quarterly Filtering**: View expenses by calendar quarter for reporting.
- **Inventory System**:
    - **Asset Tracking**: Centralized registry of robotics kits, computers, furniture, and consumables.
    - **Stock Alerts**: Automated low-stock indicators based on configurable reorder levels.
    - **Valuation**: Real-time calculation of total physical asset value with per-unit cost tracking.
    - **Public View**: Optional public inventory view for transparency and part catalog sharing.
    - **Categories**: Organize inventory by type (Kit, Computer, Furniture, Consumable, Tool, Other).
- **Payroll**:
    - **Staff Compensation**: Database of employee salaries (annual, hourly, per-session) and hourly rates.
    - **Payment Runs**: Create and track payroll runs with automatic per-staff item generation.
    - **Historical Logging**: Complete payroll history for tax and accounting compliance.
    - **Multi-Staff Support**: Process multiple employees in a single payroll run.
    - **Status Tracking**: Track payroll status (draft, processed, completed).

### 3.5 Parent Portal
- **Comprehensive Dashboard**: Personalized view for parents with real-time updates across all aspects of their children's education.
    - **Personalized Welcome**: Dynamic greeting with parent name and quick stats.
    - **Announcements Widget**: Context-aware display of system, course, and team announcements relevant to their children.
    - **Upcoming Events Widget**: Unified timeline of upcoming events, invoice due dates, and assignment deadlines across all children.
    - **Demo Mode**: Automatic demo mode for admins without parent profiles to preview parent experience.
- **Family Management**:
    - **Multi-Student View**: Manage and view information for all linked children in one place.
    - **Student Details**: Access complete student profiles including course enrollments, grades, and progress.
    - **Add Students**: Link additional children to parent account with admin approval.
    - **Progress Tracking**: View detailed progression, grades, and attendance for each child.
    - **Calendar Integration**: Unified family calendar showing classes and events for all children.
- **Billing & Invoices**:
    - **Invoice Listing**: Complete invoice history with status indicators (draft, sent, paid, overdue).
    - **Invoice Details**: View detailed line items, discounts, and payment information.
    - **PDF Download**: Download professional invoice PDFs for records.
    - **Payment History**: Track all payments and outstanding balances.
    - **Due Date Alerts**: Visual indicators for upcoming and overdue invoices.

### 3.6 User Management
- **Unified Directory**: Centralized, searchable list of all system users with role filtering (Student, Parent, Teacher, Admin).
    - **Tabbed Interface**: Dedicated tabs for All Users, Students, Parents, and Teachers.
    - **Search**: Real-time search across names and email addresses.
    - **User Statistics**: Dashboard cards showing total counts by role.
- **Access Control**:
    - **Registration Flow**: **Public registration is disabled by design.** All new parent and student accounts must be created manually by Administrators after initial contact/consultation. New registrations default to "Pending" status if created via internal tools; Admins activate accounts via toggle switches in the User List.
    - **Role Management**: Granular control over permissions and role assignments (supporting multiple roles per user).
    - **Bulk Operations**: Select multiple users for bulk role assignment, role removal, or deletion.
    - **Test Mode**: Role simulation system allowing admins to test the platform from any user role perspective.
- **Relationship Management**:
    - **Parent-Student Links**: Explicit database relationships linking legal guardians to student accounts.
    - **Multi-Child Support**: Parents can manage multiple students from a single account.
- **Referral Tracking & CRM**:
    - **Student-to-Student Referrals**: Track referral chains with automatic discount calculation (5% per referral, capped at 20%).
    - **Referral Source Tracking**: Capture "How did you hear about us?" data from registration and contact forms with predefined categories:
        - Friend or Family
        - Current/Former Student
        - Social Media
        - Google/Search Engine
        - School/Teacher
        - Event/Competition
        - Other
    - **Performance Discounts**: Admin-editable performance discount field (0-100%) with inline edit interface on Students tab.
    - **Combined Discount Display**: Automatic calculation showing total discount (referral + performance) on student listings.
    - **Referral Analytics Dashboard**: Collapsible analytics panel on Students tab showing:
        - **Source Breakdown**: Count of students by referral source with sorted display.
        - **Top Referrers**: Top 5 students ranked by number of successful referrals.
    - **Contact CRM**: Contact form submissions tracked with referral source and status management (new, read, replied, archived).
    - **Invoice Integration**: Referral and performance discounts automatically applied to student invoice line items with detailed breakdown.

### 3.7 Project Management (Competition Teams)
- **Team Workspaces**: Dedicated private areas for competition teams (VEX, FLL, FIRST, Custom).
    - **Team Types**: Pre-configured templates for VEX Robotics, FIRST Robotics, FLL, FTC, and Custom teams.
    - **Subteams**: Hierarchical structure allowing smaller groups within a main team (e.g., "Build Team", "Programming Team", "Marketing Team").
    - **Lifecycle Management**: Archive/restore functionality to preserve history while decluttering active dashboards.
    - **Member Management**: Add/remove team members with role assignments (Member, Captain, Mentor).
    - **Team Settings**: Customizable team names, descriptions, and visibility settings.
- **Project Organization**:
    - **Multi-Project Support**: Create multiple projects under each team with independent task tracking.
    - **Project Status**: Track project lifecycle (planning, in_progress, on_hold, completed, archived).
    - **Slug-Based URLs**: SEO-friendly URLs for teams and projects (e.g., `/projects/vex-team-alpha/robot-design`).
- **Advanced Task Management**:
    - **Task Types**: Categorize tasks as Task, Bug, Feature, Improvement, or Research.
    - **Priority Levels**: Low, Medium, High, and Urgent priority classifications.
    - **Status Workflow**: Comprehensive workflow (To Do, In Progress, Review, Done, Blocked).
    - **Task Assignment**: Assign tasks to specific team members with multiple assignees support.
    - **Subtasks**: Hierarchical task structure with parent-child relationships.
    - **Task Dependencies**: Define task dependencies with lag days for critical path management.
    - **Progress Tracking**: 0-100% progress indicators on individual tasks.
    - **Due Dates**: Set task deadlines with visual overdue indicators.
    - **Checklist Items**: Add granular checklist items within tasks with completion tracking.
    - **Tags**: Flexible tagging system for task categorization and filtering.
    - **Comments**: Threaded task comments with @ mentions and notifications.
    - **Attachments**: File attachments directly on tasks.
    - **Activity Logging**: Complete audit trail of all task changes with timestamps.
- **Visualization Tools**:
    - **Kanban Board**: Drag-and-drop Kanban board with status column organization and real-time updates.
    - **List View**: Sortable, filterable task list with bulk operations.
    - **Gantt Chart**: Timeline visualization with task dependencies, milestones, and critical path highlighting.
    - **Calendar View**: Month/week calendar views showing task due dates and milestones.
- **Milestones**:
    - **Deadline Tracking**: Create milestones for season-specific deadlines (e.g., "Regional Qualifiers", "Championship").
    - **Progress Indicators**: Visual progress tracking toward milestone completion.
    - **Milestone Dependencies**: Link tasks to specific milestones for goal-oriented planning.
- **File Management**:
    - **Folder Structure**: Nested folder organization for CAD files, code, documentation, and media.
    - **File Upload**: Direct file upload to team/project folders with version tracking.
    - **File Types**: Support for all common file types (CAD, code, documents, images, videos).
    - **Access Control**: Team-based file access with visibility restrictions.
- **Hardware Inventory Integration**:
    - **Part Checkout**: Direct integration with central inventory for tracking part usage by teams.
    - **Project-Based Tracking**: Associate inventory items and expenses with specific projects.
    - **Resource Planning**: View available inventory before task assignment.

### 3.8 Student Portfolio System
- **Portfolio Builder**: Students create public or private portfolios showcasing their work and achievements.
    - **Project Showcase**: Display completed projects with descriptions, images, and external links.
    - **Media Attachments**: Upload images and videos demonstrating project outcomes.
    - **Tagging**: Organize portfolio items with custom tags for categorization.
    - **Privacy Control**: Toggle individual portfolio items between public and private visibility.
- **Public Portfolio View**: SEO-friendly public portfolio pages at `/portfolio/[studentId]` for college applications and showcases.
- **Portfolio Management**: Edit, delete, and reorder portfolio items from student dashboard.

### 3.9 Learning Paths
- **Guided Learning Tracks**: Create structured learning sequences connecting multiple courses and resources.
    - **Sequential Steps**: Define ordered learning steps with course, resource, or custom content.
    - **Progress Tracking**: Monitor student progress through learning path completion.
    - **Flexible Paths**: Support both linear and branching learning pathways.
- **Student View**: Browse available learning paths and track personal progress through assigned paths.
- **Admin Management**: Create, edit, and manage learning paths from admin panel.

### 3.10 Calendar & Events System
- **Unified Calendar**: Platform-wide calendar system for events, classes, and deadlines.
    - **Event Types**: Class sessions, competitions, workshops, meetings, holidays, and custom events.
    - **Event Details**: Full event information including location, description, organizer, and attendee capacity.
    - **RSVP System**: Track event attendees with RSVP status (going, maybe, not_going).
    - **Recurring Events**: Support for recurring event patterns (daily, weekly, monthly).
- **Public Calendar**: Public-facing calendar at `/calendar` showing upcoming events for prospective families.
- **Admin Calendar**: Advanced admin interface for creating and managing all platform events.
- **Calendar Export**: Export calendar to ICS format for integration with external calendar applications.
- **Parent/Student Integration**: Events appear in parent and student dashboards based on relevance.

### 3.11 Analytics & Reporting Dashboard
- **Comprehensive Metrics**: Real-time dashboard tracking all aspects of academy operations.
    - **User Analytics**: Total users, students, parents, teachers, and weekly growth metrics.
    - **Financial Metrics**: Total revenue, monthly revenue, and unpaid invoice tracking.
    - **Content Metrics**: Count of knowledge nodes, assignments, blog posts, and active content.
    - **Activity Tracking**: 24-hour page views, new contacts, and assignment submissions.
- **Page View Analytics**:
    - **Top Pages**: Identify most-visited pages with view counts and page titles.
    - **Referrer Tracking**: Track traffic sources with domain grouping and referrer analysis.
    - **Time-Based Filtering**: View analytics by time period (24h, 7d, 30d, all time).
- **Activity Logs**: Complete audit trail of sensitive system actions.
    - **User Actions**: Track user creation, deletion, role changes, and profile updates.
    - **Content Actions**: Monitor wiki edits, blog publications, and content deletions.
    - **Financial Actions**: Log invoice creation, payment recording, and expense entries.
    - **Security Events**: Track login attempts, password changes, and permission modifications.
- **Error Logging**: Centralized error tracking with severity levels, stack traces, and resolution status.
- **Google Analytics Integration**: Optional GA4 integration for advanced web analytics and conversion tracking.

### 3.12 Content Management System (CMS)
- **Page Builder**: Drag-and-drop visual page builder powered by Craft.js.
    - **Component Library**: Pre-built components (Text, Heading, Container, Button, Image) with customizable styling.
    - **Specialized Sections**: High-impact section templates (Mission, Vision, Team, Services, Process, Values).
    - **Live Preview**: Real-time visual feedback during editing with immediate style changes.
    - **Media Management**: Integrated file upload system for images (JPEG, PNG, WebP) with server-side storage.
    - **Save/Cancel Workflow**: Draft changes with save confirmation before publishing.
- **Dynamic Home Page**: Fully customizable home page with configurable sections:
    - **Hero Section**: Custom banner with title, subtitle, and call-to-action button.
    - **Stats Section**: Highlight key metrics (students taught, courses offered, success rate, years of experience).
    - **Featured Sections**: Services, mission, vision, team, process, and values sections all configurable through settings.
- **History Page Builder**: Dedicated page builder for company history with:
    - **Awards Section**: Showcase competition victories and achievements with year, award name, and details.
    - **Alumni Section**: Highlight notable alumni with names, current positions, and testimonial quotes.
    - **Custom Content**: Rich text editor for additional historical narrative.
- **Blog Management**: Create and publish blog posts with rich text editing, cover images, categories, and draft workflow.
- **Testimonials**: Manage customer testimonials with author name, role, content, and optional images.
- **Staff Profiles**: Public staff directory with bios, roles, specializations, and profile images.

### 3.13 Settings & Configuration
- **Site Settings**: Centralized configuration for all platform settings.
    - **Basic Information**: Site name, description, contact email, phone, address.
    - **Feature Toggles**: Enable/disable analytics, maintenance mode, email verification, 2FA.
    - **SMTP Configuration**: Email server settings for transactional emails.
    - **Security Settings**: Session timeout, password requirements, allowed upload types, file size limits.
    - **Invoice Settings**: Configure invoice numbering, company details, tax information, payment methods.
- **Dynamic Content Management**: Store page content in database for easy updates without code changes.
- **Settings API**: RESTful API for updating individual settings or bulk updates.

## 4. Technical Specifications

### 4.1 Technology Stack
- **Framework**: Next.js 14+ (App Router) utilizing Server Components for performance.
- **Styling**: TailwindCSS for utility-first design and consistent UI tokens.
- **Database**: PostgreSQL with Prisma ORM for type-safe relational data management.
- **State Management**: React Context (for global UI) and Craft.js State (for builder operations).
- **Authentication**: NextAuth.js with JWT-based session management and Role-Based Access Control (RBAC).

### 4.2 Security Requirements
- **Authentication**:
    - **NextAuth.js**: Industry-standard authentication with JWT-based session management.
    - **Password Hashing**: Bcrypt password hashing with 10 salt rounds.
    - **Session Management**: Secure session tokens with configurable expiration.
    - **User Approval**: Two-tier registration system with admin approval before account activation.
- **Authorization & Access Control**:
    - **Role-Based Access Control (RBAC)**: Comprehensive permission system with 4 core roles (Admin, Teacher, Student, Parent).
    - **Resource Permissions**: Granular permissions on resource-action pairs (e.g., "knowledge:edit", "assignments:grade").
    - **Middleware Protection**: Automatic route protection for `/api/admin/*`, `/admin/*`, `/api/teacher/*` routes.
    - **Test Mode**: Secure admin-only test mode for role simulation without actual account switching.
    - **Wiki Permissions**: Role-based default permissions for wiki content (create, edit, delete, publish, comment, suggest).
- **CSRF Protection**:
    - **Token Generation**: Cryptographically secure CSRF tokens using crypto.randomBytes.
    - **Constant-Time Comparison**: Timing attack prevention through constant-time token validation.
    - **Cookie Security**: HttpOnly, SameSite strict cookies with 24-hour expiration.
    - **Header Validation**: CSRF token validation via 'x-csrf-token' header.
- **Input Validation & Sanitization**:
    - **Zod Schema Validation**: Strict type checking and validation on all API endpoints.
    - **Type Safety**: TypeScript enforcement throughout the application stack.
    - **Range Validation**: Numeric bounds checking (e.g., discounts 0-100%, grades 0-max points).
    - **SQL Injection Prevention**: Prisma ORM parameterized queries prevent SQL injection attacks.
    - **XSS Protection**: Content sanitization in rich text editors and user-generated content.
- **Audit & Compliance**:
    - **Activity Logging**: Complete audit trail of sensitive actions (user changes, role assignments, financial edits, content deletion).
    - **Grade Audit Logs**: Dedicated grade change tracking with IP addresses, user agents, and before/after values.
    - **Error Logging**: Centralized error capture with stack traces, severity levels, and resolution tracking.
    - **IP & User Agent Tracking**: Log request metadata for security analysis and troubleshooting.
- **File Upload Security**:
    - **Type Validation**: Strict file type checking (images, documents, code, media).
    - **Size Limits**: Configurable file size limits (default 5MB for images) to prevent DoS attacks.
    - **Server-Side Processing**: All uploads processed server-side with unique timestamped filenames.
    - **Storage Isolation**: Uploads stored in controlled directories with appropriate permissions.

### 4.3 Integrations & External Services
- **Transactional Email**: SMTP/API integration (e.g., Resend or SendGrid) for password resets, invoicing, and notifications.
- **File Storage**: Object storage compatible (AWS S3 or Cloudflare R2) for handling user uploads and media assets.
- **Payment Methods**: Primary support for manual payment recording (Zelle, Venmo, Check, Cash).
- **Online Payments**: Third party external integration outside of platform processing.

### 4.4 UX & Accessibility Standards
- **Responsive Design**: Mobile-first approach ensuring full functionality on phones (Parents/Students) and desktops (Admins/Teachers).
- **Accessibility**: Commitment to WCAG 2.1 AA compliance, featuring high-contrast modes, keyboard navigation, and screen reader support.
- **Performance**: Target Core Web Vitals scores of 90+ (LCP < 2.5s, CLS < 0.1) using Next.js optimizations.

### 4.5 Data Retention & Compliance
- **Data Minimization**: Only essential PII is collected.
- **Retention Policy**:
    - Inactive accounts archived after 2 years.
    - Financial records retained for 7 years (tax compliance).
- **Privacy**: Feature flags to enable GDPR/COPPA compliant modes (e.g., parental consent flows for users under 13).

### 4.6 System Monitoring & Telemetry
- **Application Health Monitoring**:
    - **Error Logging**: Centralized capture of runtime errors (Server & Client) with:
        - Full stack traces for debugging
        - Severity levels (low, medium, high, critical)
        - Resolution status tracking (unresolved, investigating, resolved)
        - Error frequency analysis
        - User context (if authenticated)
    - **Activity Logs**: Comprehensive audit trails for sensitive actions including:
        - User management (creation, deletion, role changes, profile updates)
        - Content operations (wiki edits, blog publications, page modifications)
        - Financial events (invoice creation, payment recording, expense entries)
        - Security events (login attempts, password changes, permission modifications)
        - Grading actions (grade changes, rubric updates)
    - **System Metrics**: Database-backed metrics storage for long-term trend analysis.
- **Analytics Dashboard**:
    - **Page View Tracking**: Real-time page view monitoring with path, user, and referrer data.
    - **Referrer Analysis**: Traffic source tracking with domain grouping and referrer URL analysis.
    - **User Growth Metrics**: Track new user registrations and growth trends.
    - **Content Metrics**: Monitor content creation rates (assignments, wiki pages, blog posts).
    - **Financial Health**: Real-time revenue tracking and invoice status monitoring.
- **Google Analytics Integration**: Optional GA4 integration for advanced web analytics, conversion tracking, and user behavior analysis.

## 5. Deployment & Infrastructure
- **Hosting**: Designed for single-node VPS environments (DigitalOcean, AWS, Vultr).
- **Orchestration**: Docker & Docker Compose for managing the Next.js app, PostgreSQL database, and Nginx reverse proxy.
- **Load Balancing**: Nginx handles SSL termination and security headers (CSP, HSTS).

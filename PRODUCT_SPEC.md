# Product Specification Document: Robotics Academy Platform

## 1. Introduction
This document defines the technical and functional specifications for the **Robotics Academy Platform**, a unified web application designed to manage the end-to-end operations of a robotics education business. It integrates marketing, learning management (LMS), parent communication, project management, and business administration into a single self-hosted solution.

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
- **Course Catalog**: Dynamic display of courses with filtering by Age, Level, and Price. Includes support for "Featured" and "Coming Soon" statuses.
- **Blog System**: SEO-optimized articles with support for rich text (TipTap) and visual media. Includes category tagging and author profiles.
- **Contact Integration**: Lead generation forms with automated database logging and email notifications (Planned).
- **SEO Management**: Customizable meta titles, descriptions, and OpenGraph images for every page and blog post.

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
    - **Calculation**: Real-time student average and course average calculation.
    - **Logic**: Handles mixed grading scales (Points vs Percentages).
    - **Export**: CSV export for administrative records.
- **Feedback**:
    - **Teacher Grading**: Interface for viewing submissions and assigning grades/feedback.
    - **Student View**: Dashboard showing grades, status, and feedback comments.

#### 3.3.4 Knowledge Base (Wiki System)
- **Centralized Hub**: Located at `/wiki`, serving as the single source of truth.
- **Content Engine**:
    - **MarkDown & Tiptap**: Rich text editing with Tiptap, supporting inline images and formatting.
    - **Visualization Modes**:
        - **Graph View**: Interactive node-link diagram showing connections between pages.
        - **Mindmap View**: Hierarchical tree visualization of page structures.
        - **Canvas Mode**: Obsidian-style infinite canvas for spatial organization of notes and media.
- **Permissions**: Granular Role-Based Access Control (RBAC):
    - **Admins**: Full control (Create, Edit, Delete, Publish, Comment).
    - **Teachers/Mentors**: Create, Edit, Comment, Suggest (No Delete).
    - **Students/Parents**: View-only access to published content.
- **Collaboration**:
    - **Comments**: Threaded discussions on wiki pages (Teachers/Admins only).
    - **Suggestions**: "Track changes" style suggestion mode for non-Admins to propose edits.

#### 3.3.5 Certificates & Achievements
- **Certificates**: Formal awards for course completion.
    - **Verification**: Unique generate codes (e.g., CERT-2024-XYZ).
    - **Templates**: Admin-definable designs.
- **Badges**: Gamification elements for milestones (e.g., "Quiz Master").
- **Profile Integration**: "Achievements" section visible to Students, Parents, and Admins.

### 3.4 Finance & Operations Module
A comprehensive suite for managing the business side of the academy.
- **Financial Dashboard**:
    - **Health Overview**: Real-time metrics for Total Revenue, Expenses, Net Profit, and Outstanding Invoices.
    - **Cash Flow Analysis**: Visual charts tracking financial trends over time.
    - **Hot Commodities**: automated identification of top-selling or high-usage inventory items.
- **Expense Management**:
    - **Categorization**: Detailed tracking of recurring and one-time expenses (Rent, Utilities, Hardware).
    - **Recurring Logic**: Automated generation of monthly/yearly expense records.
- **Inventory System**:
    - **Asset Tracking**: centralized registry of robotics kits, computers, and furniture.
    - **Stock Alerts**: Automated indicators for low-quantity items.
    - **Valuation**: Real-time calculation of total physical asset value.
- **Payroll**:
    - **Staff Compensation**: Database of employee salaries and hourly rates.
    - **Payment Runs**: Historical logging of all payroll events for tax and accounting purposes.

### 3.5 Parent Portal
- **Dashboard**: Personalized view for parents to manage their relationship with the academy.
- **Family Management**:
    - **Student Linking**: View progression, grades, and attendance for all linked children.
    - **Calendar**: Unified schedule showing classes and events for all family members.
- **Billing**: Access to invoices, payment history, and one-click payment options.

### 3.6 User Management
- **Unified Directory**: Centralized, searchable list of all system users with role filtering (Student, Parent, Teacher, Admin).
- **Access Control**:
    - **Approval System**: New registrations default to "Pending"; Admins activate accounts via a simple toggle in the User List.
    - **Role Management**: Granular control over permissions and role assignments (including multiple roles per user).
- **Relationship Management**:
    - **Parent-Student Links**: Explicit databases linking of legal guardians to student accounts.
    - **Referral Tracking**: Integrated CRM features to track referrer sources and apply performance-based discounts.

### 3.7 Project Management (Competition Teams)
- **Team Workspaces**: Dedicated private areas for competition teams (VEX, FLL, FIRST).
- **Collaboration Tools**:
    - **Task Tracking**: Kanban/Scrum boards for robot build progress and software development.
    - **Milestones**: Track season-specific deadlines (e.g., Regional Qualifiers, State Championships).
- **Hardware Inventory**: Integration with the central Inventory System for part checkouts.

## 4. Technical Specifications

### 4.1 Technology Stack
- **Framework**: Next.js 14+ (App Router) utilizing Server Components for performance.
- **Styling**: TailwindCSS for utility-first design and consistent UI tokens.
- **Database**: PostgreSQL with Prisma ORM for type-safe relational data management.
- **State Management**: React Context (for global UI) and Craft.js State (for builder operations).
- **Authentication**: NextAuth.js with JWT-based session management and Role-Based Access Control (RBAC).

### 4.2 Security Requirements
- **Data Protection**: AES-256 encryption for sensitive PII (Personally Identifiable Information).
- **Access Control**: Strict middleware checks on all `/api/admin/*` and `/admin/*` routes.
- **Input Sanitization**: Compulsory use of Zod for API request validation and XSS protection in rendered content.

### 4.3 Integrations & External Services
- **Transactional Email**: SMTP/API integration (e.g., Resend or SendGrid) for password resets, invoicing, and notifications.
- **File Storage**: Object storage compatible (AWS S3 or Cloudflare R2) for handling user uploads and media assets.
- **Payment Methods**: Primary support for manual payment recording (Zelle, Venmo, Check, Cash).
- **Online Payments**: Optional Stripe integration for credit card processing.

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
- **Hardware Metrics**: Real-time dashboard showing CPU load, Memory usage, and Disk space (App vs. Database).
- **Application Health**: 
    - **Error Logging**: Centralized capture of runtime errors (Server & Client) stored in database.
    - **Activity Logs**: Audit trails for sensitive actions (e.g., User Deletion, Role Changes, Financial Edits, Wiki Deletions).

## 5. Deployment & Infrastructure
- **Hosting**: Designed for single-node VPS environments (DigitalOcean, AWS, Vultr).
- **Orchestration**: Docker & Docker Compose for managing the Next.js app, PostgreSQL database, and Nginx reverse proxy.
- **Load Balancing**: Nginx handles SSL termination and security headers (CSP, HSTS).

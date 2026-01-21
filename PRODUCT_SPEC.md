# Product Specification Document: Robotics Academy Platform

## 1. Introduction
This document defines the technical and functional specifications for the **Robotics Academy Platform**, a unified web application designed to manage the end-to-end operations of a robotics education business. It integrates marketing, learning management (LMS), parent communication, project management, and business administration into a single self-hosted solution.

## 2. User Personas

| Persona | Description | Key Needs |
| :--- | :--- | :--- |
| **Public User** | Prospective parent or student | Course information, pricing, success stories, and contact forms. |
| **Student** | Active learner (8-18 years old) | Course materials, assignment submission, project tracking, wiki access. |
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
- **Knowledge Base (Wiki System)**:
    - **Centralized Hub**: Located at `/wiki`, serving as the single source of truth for technical documentation and curriculum notes.
    - **Markdown Native**: Writes and renders in Markdown for easy versioning and portability.
    - **Permissions**: Granular control over node accessibility (Public vs. Student-only).
- **Assignments & Grading**:
    - **Task Creation**: Teachers can set deadlines, instructions, and attach reference files.
    - **Submission Engine**: Students can upload files (PDF, ZIP, CODE) or provide text-based responses.
    - **Feedback Loop**: Support for numerical grading and qualitative instructor comments.

### 3.4 Parent Portal & Financials
- **Billing Dashboard**: Centralized view for parents to track enrollment costs and payment status.
- **Invoice Management**: 
    - **Line Items**: Detailed breakdowns for tuition, kits, and competition fees.
    - **PDF Generation**: (Planned) Automated download of invoices for record-keeping.
- **Financial Analytics**: Admin-only view of total revenue, outstanding balances, and enrollment trends.

### 3.5 Project Management (Competition Teams)
- **Team Workspaces**: Dedicated private areas for competition teams (VEX, FLL, FIRST).
- **Collaboration Tools**:
    - **Task Tracking**: Kanban/Scrum boards for robot build progress and software development.
    - **Milestones**: Track season-specific deadlines (e.g., Regional Qualifiers, State Championships).
- **Hardware Inventory**: (Planned) Registry for tracking robot components and loaner kits.

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

## 5. Deployment & Infrastructure
- **Hosting**: Designed for single-node VPS environments (DigitalOcean, AWS, Vultr).
- **Orchestration**: Docker & Docker Compose for managing the Next.js app, PostgreSQL database, and Nginx reverse proxy.
- **Load Balancing**: Nginx handles SSL termination and security headers (CSP, HSTS).

## 6. Development Roadmap
- **Phase 1 (Core)**: Complete Page Builder stability and Content Migration logic. [COMPLETED]
- **Phase 2 (UX)**: Full Item editing for specialized sections and File Upload system. [COMPLETED]
- **Phase 3 (Financials)**: Integration of automated payment reminders and payment gateway hooks.
- **Phase 4 (Advanced LMS)**: Mindmap/Graph visualization for curriculum dependencies.

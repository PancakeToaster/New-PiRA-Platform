# Product Specification Document: Robotics Academy Platform

## 1. Introduction
This document defines the specifications for the **Robotics Academy Platform**, a unified web application designed to manage the end-to-end operations of a robotics education business. It integrates marketing, learning management, parent communication, project management, and administration into a single self-hosted solution.

## 2. User Personas

| Persona | Description | Key Needs |
| :--- | :--- | :--- |
| **Public User** | Prospective parent or student | Information on courses, pricing, and proven success. Contact capability. |
| **Student** | Active learner (8-18 years old) | Access course materials, submit assignments, track competition projects. |
| **Parent** | Payer and guardian | View/pay invoices, track child's progress, manage enrollment. |
| **Teacher** | Instructor or Coach | Create/grade assignments, manage class content, track student attendance. |
| **Admin** | Business Owner/Manager | Full control over users, content, finance, and system configuration. |

## 3. Functional Requirements

### 3.1 Public Layer (Marketing)
- **Course Catalog**: Display active courses with details (Age, Level, Price).
- **Blog System**: SEO-friendly articles to drive traffic and demonstrate expertise.
- **Dynamic Homepage**: Featured courses, "Coming Soon" development classes, and recent activity feed.
- **Contact Integration**: Lead generation forms rooted in the database.

### 3.2 Learning Management System (LMS)
- **Knowledge Base**: Markdown-based content nodes organized by folders/topics.
- **Assignments**: Teachers create tasks; Students submit text/files; Teachers grade and provide feedback.
- **Progress Tracking**: Visual indicators of course completion and assignment status.
- **Resource Graph**: (Planned) Visual mapping of prerequisites and related topics.

### 3.3 Parent Portal (Billing)
- **Invoice Dashboard**: View current and past invoices.
- **Payment Structure**: Invoices support line items (e.g., "Fall Semester Tuition", "Robotics Kit Fee").
- **Student Linking**: Parents can view high-level progress of all their linked children.

### 3.4 Project Management (Competition Teams)
- **Team Workspaces**: Dedicated areas for competition teams (e.g., VEX, FLL).
- **Kanban/Task Board**: Track tasks (To Do, In Progress, Done) for robot builds.
- **Milestones**: Track deadlines for competitions and build phases.
- **Role-Based Access**: Team Captains have management rights; Members have view/update rights.

### 3.5 Admin Control Panel
- **User Management**: Create/Edit/Delete users and assign Roles (RBAC).
- **Content Management**: “Edit Everything” philosophy.Manage public pages, blogs, and courses without code.
- **Financial Overview**: Dashboard with revenue metrics (Paid vs Unpaid invoices).
- **Analytics**: System health monitoring and page view tracking.

## 4. Technical Specifications

### 4.1 Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TailwindCSS.
- **Backend**: Next.js API Routes (Serverless functions).
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: NextAuth.js (JWT-based).
- **Infrastructure**: Docker & Docker Compose with Nginx reverse proxy.

### 4.2 Security Requirements
- **Encryption**: Sensitive fields (Phone, Address) must be encrypted at rest (AES-256).
- **Access Control**: Strict RBAC enforced via API Middleware.
- **Audit Logging**: Immutable logs for all sensitive admin actions.
- **Headers**: CSP and Security Headers strictly enforced by Nginx.

## 5. Data Model (High Level)
- **User**: Central identity entity. Linked to specific profiles (Parent, Student, Teacher).
- **Course/Invoice/Assignment**: Core business entities linked to Users.
- **Team/Project/Task**: Hierarchical structure for the Project Management layer.

## 6. Deployment Strategy
- **Self-Hosted**: Designed to run on a single VPS (e.g., DigitalOcean, Vultr).
- **Containerized**: `docker-compose` orchestration for App + DB + Proxy.
- **CI/CD**: (Recommended) GitHub Actions for automated testing and image building.

## 7. Future Roadmap
- **Phase 1 (Security)**: Implementation of Field Encryption & Global Middleware (In Progress).
- **Phase 2 (Automation)**: Automated invoice generation and email notifications.
- **Phase 3 (AI)**: AI-driven tutoring assistant and content generation for teachers.

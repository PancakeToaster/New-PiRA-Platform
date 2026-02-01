# Feature Implementation Plan

Planned features based on a gap analysis comparing the PiRA Platform against similar education/LMS systems (Canvas, Moodle, Google Classroom, Teachable, PowerSchool).

## Features to implement (in order)
1. Attendance Tracking
2. Automated Backups
3. Announcement Read Tracking
4. CSRF Protection
5. Student Portfolio
6. Learning Paths
7. Rubric-Based Grading
8. Parent-Teacher Messaging (deferred)

---

## 1. Attendance Tracking

### Schema changes (`prisma/schema.prisma`)

Add two new models after the `CalendarEvent`/`EventAttendee` section:

```prisma
model ClassSession {
  id          String   @id @default(cuid())
  lmsCourseId String
  date        DateTime
  topic       String?
  notes       String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lmsCourse  LMSCourse          @relation("LMSClassSessions", fields: [lmsCourseId], references: [id], onDelete: Cascade)
  attendance AttendanceRecord[]

  @@index([lmsCourseId])
  @@index([date])
}

model AttendanceRecord {
  id        String   @id @default(cuid())
  sessionId String
  studentId String
  status    String   @default("present") // present, absent, late, excused
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session ClassSession   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  student StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([sessionId, studentId])
  @@index([sessionId])
  @@index([studentId])
  @@index([status])
}
```

Reverse relations to add:
- On `LMSCourse`: `classSessions ClassSession[] @relation("LMSClassSessions")`
- On `StudentProfile`: `attendanceRecords AttendanceRecord[]`

### API routes

- `app/api/admin/courses/[id]/attendance/route.ts` — GET (list sessions + records for a course), POST (create a new session with attendance records)
- `app/api/admin/courses/[id]/attendance/[sessionId]/route.ts` — GET (single session detail), PUT (update attendance records), DELETE (remove session)

### UI

- `app/admin/courses/[id]/attendance/page.tsx` — Admin attendance management page with session list, "Take Attendance" button, student grid with status dropdowns, bulk mark-all-present
- `components/lms/AttendanceGrid.tsx` — Reusable attendance grid component
- `app/parent/students/[studentId]/page.tsx` — Modify to add attendance summary (rate percentage, absences/lates)

### Files to create/modify
- `prisma/schema.prisma` — Add models + relations
- `app/api/admin/courses/[id]/attendance/route.ts` — New
- `app/api/admin/courses/[id]/attendance/[sessionId]/route.ts` — New
- `app/admin/courses/[id]/attendance/page.tsx` — New
- `components/lms/AttendanceGrid.tsx` — New
- `app/parent/students/[studentId]/page.tsx` — Modify (add attendance section)

---

## 2. Automated Backups

### Backup script

`scripts/backup.sh` — Shell script that:
- Runs `pg_dump` against the PostgreSQL container
- Compresses output with gzip
- Saves to `/backups/` directory with timestamped filename
- Deletes backups older than 30 days (configurable)

### Docker Compose changes (`docker-compose.yml`)

Option A — Dedicated backup container:

```yaml
  backup:
    image: postgres:16-alpine
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      PGPASSWORD: ${DB_PASSWORD:-postgres_password}
    volumes:
      - ./backups:/backups
      - ./scripts/backup.sh:/backup.sh:ro
    entrypoint: /bin/sh
    command: -c "chmod +x /backup.sh && crond -f -l 2 -L /dev/stdout"
    networks:
      - robotics_network
```

Option B — Host cron job running the script externally (simpler, documented in DEPLOYMENT.md).

### Files to create/modify
- `scripts/backup.sh` — New
- `docker-compose.yml` — Add backup volume mount, document cron usage
- `DEPLOYMENT.md` — Document backup setup and restoration

---

## 3. Announcement Read Tracking

### Schema changes (`prisma/schema.prisma`)

```prisma
model AnnouncementRead {
  id             String   @id @default(cuid())
  announcementId String
  userId         String
  readAt         DateTime @default(now())

  announcement Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([announcementId, userId])
  @@index([announcementId])
  @@index([userId])
}
```

Reverse relations to add:
- On `Announcement`: `reads AnnouncementRead[]`
- On `User`: `announcementReads AnnouncementRead[]`

### API routes

- `app/api/announcements/[id]/read/route.ts` — POST (mark as read for current user)
- `app/api/announcements/unread-count/route.ts` — GET (count of unread announcements for current user)
- Modify `app/api/admin/announcements/route.ts` GET — Include `_count: { select: { reads: true } }` for read stats

### UI changes

- Modify `components/parent/AnnouncementsWidget.tsx` — Fire POST to mark as read on display; show unread dot/badge
- Modify `components/layout/Navbar.tsx` — Add bell icon with unread announcement count badge
- Modify admin announcements page — Show read count per announcement (e.g., "Read by 12/25 users")

### Files to create/modify
- `prisma/schema.prisma` — Add model + Announcement/User relations
- `app/api/announcements/[id]/read/route.ts` — New
- `app/api/announcements/unread-count/route.ts` — New
- `app/api/admin/announcements/route.ts` — Modify (add read counts)
- `components/parent/AnnouncementsWidget.tsx` — Modify (mark as read, show badges)
- `components/layout/Navbar.tsx` — Modify (add bell icon + count)

---

## 4. CSRF Protection

NextAuth with JWT in httpOnly same-site cookies provides implicit CSRF protection. This adds explicit defense-in-depth for mutating API routes.

### Approach: Custom CSRF token middleware

- `lib/csrf.ts` — Generates a CSRF token (stored in a cookie), validates token on mutating requests (POST/PUT/PATCH/DELETE), checks `x-csrf-token` header against cookie
- `app/api/csrf/route.ts` — GET endpoint returning a fresh CSRF token
- `lib/fetch.ts` — Client-side wrapper that reads CSRF token from cookie and auto-includes as `x-csrf-token` header

### Scope

Apply CSRF validation to the most sensitive routes first:
- Auth routes (register, login)
- Admin mutation routes (user creation, deletion, password reset)
- Financial routes (invoice creation, payment)
- Upload route

### Files to create/modify
- `lib/csrf.ts` — New
- `app/api/csrf/route.ts` — New
- `app/providers.tsx` — Modify (fetch CSRF token on mount)
- Sensitive API routes — Add `validateCsrf()` call at top of POST/PUT/PATCH/DELETE handlers

---

## 5. Student Portfolio

### Schema changes (`prisma/schema.prisma`)

```prisma
model PortfolioItem {
  id          String   @id @default(cuid())
  studentId   String
  title       String
  description String?  @db.Text
  content     String?  @db.Text  // Rich text content
  media       String[] // Array of uploaded file/image URLs
  tags        String[]
  isPublic    Boolean  @default(false)
  projectUrl  String?  // External link (GitHub, etc.)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  student StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([isPublic])
  @@index([createdAt])
}
```

Reverse relation to add on `StudentProfile`:
- `portfolioItems PortfolioItem[]`

### API routes

- `app/api/student/portfolio/route.ts` — GET (list own items), POST (create item)
- `app/api/student/portfolio/[id]/route.ts` — GET, PUT, DELETE single item
- `app/api/portfolio/[studentId]/route.ts` — Public GET (only returns `isPublic: true` items)

### UI

- `app/student/portfolio/page.tsx` — Student's portfolio management (grid of items, create/edit modal)
- `app/portfolio/[studentId]/page.tsx` — Public-facing portfolio view page (no auth required for public items)
- `components/portfolio/PortfolioCard.tsx` — Card display for a portfolio item (thumbnail, title, tags)
- `components/portfolio/PortfolioForm.tsx` — Create/edit form with file upload, tag input, rich text

### Files to create/modify
- `prisma/schema.prisma` — Add model + StudentProfile relation
- `app/api/student/portfolio/route.ts` — New
- `app/api/student/portfolio/[id]/route.ts` — New
- `app/api/portfolio/[studentId]/route.ts` — New (public)
- `app/student/portfolio/page.tsx` — New
- `app/portfolio/[studentId]/page.tsx` — New (public)
- `components/portfolio/PortfolioCard.tsx` — New
- `components/portfolio/PortfolioForm.tsx` — New

---

## 6. Learning Paths

### Schema changes (`prisma/schema.prisma`)

```prisma
model LearningPath {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?  @db.Text
  image       String?
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  steps LearningPathStep[]

  @@index([isPublished])
  @@index([slug])
}

model LearningPathStep {
  id             String  @id @default(cuid())
  learningPathId String
  lmsCourseId    String
  order          Int     @default(0)
  isRequired     Boolean @default(true)

  learningPath LearningPath @relation(fields: [learningPathId], references: [id], onDelete: Cascade)
  lmsCourse    LMSCourse    @relation("LMSPathSteps", fields: [lmsCourseId], references: [id], onDelete: Cascade)

  @@unique([learningPathId, lmsCourseId])
  @@index([learningPathId])
  @@index([lmsCourseId])
  @@index([order])
}
```

Reverse relation to add on `LMSCourse`:
- `pathSteps LearningPathStep[] @relation("LMSPathSteps")`

### API routes

- `app/api/admin/learning-paths/route.ts` — GET (list all), POST (create path with steps)
- `app/api/admin/learning-paths/[id]/route.ts` — GET, PUT, DELETE
- `app/api/lms/learning-paths/route.ts` — GET (student-facing, published paths only with enrollment progress)

### UI

- `app/admin/learning-paths/page.tsx` — Admin management page with list of paths, create/edit modal with drag-and-drop course ordering
- `app/lms/learning-paths/page.tsx` — Student view with visual step progressions, completion status, progress bars
- `components/lms/LearningPathBuilder.tsx` — Drag-and-drop step editor for admin
- `components/lms/LearningPathProgress.tsx` — Visual progress display for students

### Files to create/modify
- `prisma/schema.prisma` — Add 2 models + LMSCourse relation
- `app/api/admin/learning-paths/route.ts` — New
- `app/api/admin/learning-paths/[id]/route.ts` — New
- `app/api/lms/learning-paths/route.ts` — New
- `app/admin/learning-paths/page.tsx` — New
- `app/lms/learning-paths/page.tsx` — New
- `components/lms/LearningPathBuilder.tsx` — New
- `components/lms/LearningPathProgress.tsx` — New

---

## 7. Rubric-Based Grading

### Schema changes (`prisma/schema.prisma`)

```prisma
model Rubric {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  createdBy  User             @relation("CreatedRubrics", fields: [createdById], references: [id])
  criteria   RubricCriterion[]
  assignments Assignment[]    @relation("AssignmentRubric")

  @@index([createdById])
}

model RubricCriterion {
  id          String @id @default(cuid())
  rubricId    String
  title       String
  description String? @db.Text
  maxPoints   Float
  order       Int    @default(0)

  rubric Rubric        @relation(fields: [rubricId], references: [id], onDelete: Cascade)
  scores RubricScore[]

  @@index([rubricId])
  @@index([order])
}

model RubricScore {
  id           String @id @default(cuid())
  criterionId  String
  submissionId String
  score        Float
  comment      String? @db.Text

  criterion  RubricCriterion      @relation(fields: [criterionId], references: [id], onDelete: Cascade)
  submission AssignmentSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@unique([criterionId, submissionId])
  @@index([criterionId])
  @@index([submissionId])
}
```

Relations to add on existing models:
- On `Assignment`: `rubricId String?` + `rubric Rubric? @relation("AssignmentRubric", fields: [rubricId], references: [id])`
- On `AssignmentSubmission`: `rubricScores RubricScore[]`
- On `User`: `createdRubrics Rubric[] @relation("CreatedRubrics")`

### API routes

- `app/api/admin/rubrics/route.ts` — GET (list rubrics), POST (create rubric with criteria)
- `app/api/admin/rubrics/[id]/route.ts` — GET, PUT, DELETE
- `app/api/admin/assignments/[id]/rubric-grade/route.ts` — POST (submit rubric scores for a submission)

### UI

- `app/admin/rubrics/page.tsx` — Rubric management page (list, create, edit)
- `components/lms/RubricBuilder.tsx` — Create/edit rubric with dynamic criterion rows
- `components/lms/RubricGrader.tsx` — Rubric scoring interface (criteria with score inputs, auto-sums total)
- Modify `components/lms/GradingInterface.tsx` — Add rubric grading tab when assignment has a rubric

### Files to create/modify
- `prisma/schema.prisma` — Add 3 models + Assignment/Submission/User relations
- `app/api/admin/rubrics/route.ts` — New
- `app/api/admin/rubrics/[id]/route.ts` — New
- `app/api/admin/assignments/[id]/rubric-grade/route.ts` — New
- `app/admin/rubrics/page.tsx` — New
- `components/lms/RubricBuilder.tsx` — New
- `components/lms/RubricGrader.tsx` — New
- `components/lms/GradingInterface.tsx` — Modify (add rubric tab)

---

## 8. Parent-Teacher Messaging (Deferred)

This feature is planned but deferred for now. See the full design in the internal plan file.

Summary: Conversation/DirectMessage/ConversationParticipant models, inbox page with conversation list and message thread, access control scoped to parent-teacher relationships, unread badge in navbar.

---

## Implementation Order & Dependencies

```
1. Attendance Tracking     - No dependencies, standalone feature
2. Automated Backups       - No dependencies, infrastructure only
3. Announcement Read Track - Small schema change, quick win
4. CSRF Protection         - Infrastructure, benefits all routes
5. Student Portfolio       - No dependencies, standalone
6. Learning Paths          - Depends on LMSCourse existing (it does)
7. Rubric-Based Grading    - Depends on Assignment/Submission (they exist)
8. Parent-Teacher Messaging - Deferred
```

## Verification Plan

After each feature:
1. Run `npx prisma migrate dev --name <feature_name>` to apply schema changes
2. Run `npm run build` to verify no TypeScript errors
3. Manual testing:
   - **Attendance**: Create session, take attendance, view in parent portal
   - **Backups**: Run script, verify dump file, test restore
   - **Announcement reads**: Post announcement, view as user, check read count in admin
   - **CSRF**: Verify mutating requests fail without token, succeed with it
   - **Portfolio**: Create item as student, view public page
   - **Learning paths**: Create path in admin, view as student with progress
   - **Rubrics**: Create rubric, attach to assignment, grade with rubric

import { z } from 'zod';

// ==========================================
// COURSE SCHEMAS (Public Facing)
// ==========================================

export const createCourseSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().min(1, 'Description is required'),
    level: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    ageRange: z.string().optional().nullable(),
    price: z.number().optional().nullable(),
    topics: z.array(z.string()).default([]),
    image: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    isHidden: z.boolean().default(false),
    hidePrice: z.boolean().default(false),
    isDevelopment: z.boolean().default(false),
    displayOrder: z.number().default(0),
});

export const updateCourseSchema = createCourseSchema.partial();

// ==========================================
// LMS COURSE SCHEMAS (Internal Teaching)
// ==========================================

export const createLMSCourseSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required'),
    description: z.string().optional().nullable(),
    instructorId: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    gradingScale: z.any().optional().nullable(),
    gradingWeights: z.any().optional().nullable(),
});

export const updateLMSCourseSchema = createLMSCourseSchema.partial();

// ==========================================
// ASSIGNMENT SCHEMAS
// ==========================================

export const createAssignmentSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    dueDate: z.string().datetime().or(z.date()),
    maxPoints: z.number().default(100),
    attachments: z.array(z.string()).default([]),
    allowTextEntry: z.boolean().default(true),
    allowFileUpload: z.boolean().default(true),
    teacherId: z.string().min(1, 'Teacher ID is required'),
    studentId: z.string().optional().nullable(),
    gradeCategory: z.string().optional().nullable(),
    lessonId: z.string().optional().nullable(),
    courseId: z.string().optional().nullable(),
    lmsCourseId: z.string().optional().nullable(),
    rubricId: z.string().optional().nullable(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

// ==========================================
// RUBRIC SCHEMAS
// ==========================================

export const rubricCriterionSchema = z.object({
    title: z.string().min(1, 'Criterion title is required'),
    description: z.string().optional().nullable(),
    maxPoints: z.union([z.number(), z.string()]).transform((val) => Number(val)).refine((val) => val > 0 && val <= 1000, {
        message: 'maxPoints must be between 1 and 1000',
    }),
});

export const createRubricSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    criteria: z.array(rubricCriterionSchema).min(1, 'At least one criterion is required'),
});

export const updateRubricSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional().nullable(),
    criteria: z.array(rubricCriterionSchema).optional(),
});

import { z } from 'zod';

// ==========================================
// PROJECT SCHEMAS
// ==========================================

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    teamId: z.string().min(1, 'Team ID is required'),
    description: z.string().optional().nullable(),
    status: z.string().default('planning'), // planning, active, on_hold, completed, archived
    priority: z.string().default('medium'), // low, medium, high, critical
    color: z.string().optional().nullable(),
    startDate: z.string().datetime().or(z.date()).optional().nullable(),
    endDate: z.string().datetime().or(z.date()).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ==========================================
// TASK SCHEMAS
// ==========================================

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    projectId: z.string().min(1, 'Project ID is required'),
    milestoneId: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.string().default('todo'), // todo, in_progress, review, done, blocked
    priority: z.string().default('medium'), // low, medium, high, urgent
    taskType: z.string().default('task'), // task, bug, feature, improvement, research
    startDate: z.string().datetime().or(z.date()).optional().nullable(),
    dueDate: z.string().datetime().or(z.date()).optional().nullable(),
    estimatedHours: z.number().optional().nullable(),
    actualHours: z.number().optional().nullable(),
    kanbanOrder: z.number().default(0),
    progress: z.number().default(0),
    assigneeIds: z.array(z.string()).optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const moveTaskSchema = z.object({
    status: z.string().min(1, 'Status is required'),
    kanbanOrder: z.number(),
});

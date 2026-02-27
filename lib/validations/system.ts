import { z } from 'zod';

// ==========================================
// ANNOUNCEMENT SCHEMAS
// ==========================================

export const createAnnouncementSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    type: z.string().min(1, 'Type is required'),
    targetId: z.string().nullable().optional(),
    sendToAll: z.boolean().default(false),
    sendToStudents: z.boolean().default(false),
    sendToParents: z.boolean().default(false),
    sendToTeachers: z.boolean().default(false),
});

export const updateAnnouncementSchema = z.object({
    title: z.string().min(3, 'Title is required').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    type: z.string().optional(),
    targetId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    sendToAll: z.boolean().optional(),
    sendToStudents: z.boolean().optional(),
    sendToParents: z.boolean().optional(),
    sendToTeachers: z.boolean().optional(),
});

// ==========================================
// KNOWLEDGE BASE SCHEMAS
// ==========================================

export const createKnowledgeNodeSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required'),
    content: z.string().optional(),
    nodeType: z.enum(['markdown', 'tiptap', 'folder', 'link', 'canvas', 'graph']),
    parentId: z.string().nullable().optional(),
    folderId: z.string().nullable().optional(),
    isPublished: z.boolean().default(false),
    authorId: z.string(),
});

export const updateKnowledgeNodeSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    slug: z.string().min(1, 'Slug is required').optional(),
    content: z.string().optional(),
    nodeType: z.enum(['markdown', 'tiptap', 'folder', 'link', 'canvas', 'graph']).optional(),
    parentId: z.string().nullable().optional(),
    folderId: z.string().nullable().optional(),
    isPublished: z.boolean().optional(),
});

// ==========================================
// CALENDAR SCHEMAS
// ==========================================

export const createCalendarEventSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional().nullable(),
    eventType: z.string().min(1, 'Event type is required'),
    color: z.string().optional().nullable(),
    allDay: z.boolean().default(false),
    location: z.string().optional().nullable(),
    isPublic: z.boolean().default(false),
    teamId: z.string().optional().nullable(),
});

export const updateCalendarEventSchema = z.object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional().nullable(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional().nullable(),
    eventType: z.string().optional(),
    color: z.string().optional().nullable(),
    allDay: z.boolean().optional(),
    location: z.string().optional().nullable(),
    isPublic: z.boolean().optional(),
    teamId: z.string().optional().nullable(),
});

import { z } from 'zod';

// ==========================================
// BLOG SCHEMAS
// ==========================================

export const blogCategorySchema = z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional().nullable(),
});

export const blogTagSchema = z.object({
    name: z.string().min(2, 'Tag name must be at least 2 characters'),
});

export const createBlogSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().optional().nullable(),
    coverImage: z.string().url('Cover image must be a valid URL').optional().nullable(),
    authorId: z.string().min(1, 'Author is required'),
    categoryId: z.string().min(1, 'Category is required'),
    tagIds: z.array(z.string()).optional(),
    isDraft: z.boolean().default(true),
});

export const updateBlogSchema = z.object({
    title: z.string().min(3, 'Title is required').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    excerpt: z.string().optional().nullable(),
    coverImage: z.string().url('Cover image must be a valid URL').optional().nullable(),
    authorId: z.string().min(1, 'Author is required').optional(),
    categoryId: z.string().min(1, 'Category is required').optional(),
    tagIds: z.array(z.string()).optional(),
    isDraft: z.boolean().optional(),
});

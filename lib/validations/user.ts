import { z } from 'zod';

// ==========================================
// USER SCHEMAS
// ==========================================

export const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    avatar: z.string().url('Avatar must be a valid URL').optional().nullable(),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30).optional().nullable(),
    isApproved: z.boolean().default(false),
    roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

export const updateUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional().nullable(),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30).optional().nullable(),
    isApproved: z.boolean().optional(),
    roleIds: z.array(z.string()).optional(),
    // Profiles
    studentProfile: z.object({
        dateOfBirth: z.string().optional(),
        grade: z.string().optional(),
        school: z.string().optional(),
        phoneNumber: z.string().optional(),
        performanceDiscount: z.number().min(0).max(100).optional(),
        referredById: z.string().nullable().optional(),
        referralSource: z.string().nullable().optional(),
    }).optional().nullable(),
    parentProfile: z.object({
        phone: z.string().optional(),
        address: z.string().optional(),
    }).optional().nullable(),
    teacherProfile: z.object({
        bio: z.string().optional(),
        specialization: z.string().optional(),
    }).optional().nullable(),
});

export const updatePasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ==========================================
// ROLE & PERMISSION SCHEMAS
// ==========================================

export const createRoleSchema = z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters'),
    description: z.string().optional().nullable(),
    permissionIds: z.array(z.string()).optional(),
});

export const updateRoleSchema = z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters').optional(),
    description: z.string().optional().nullable(),
    permissionIds: z.array(z.string()).optional(),
});

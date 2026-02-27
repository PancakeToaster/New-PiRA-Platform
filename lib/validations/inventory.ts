import { z } from 'zod';

// ==========================================
// INVENTORY ITEM SCHEMAS
// ==========================================

export const createInventoryItemSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    sku: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    quantity: z.number().int().min(0).default(0),
    location: z.string().optional().nullable(),
    unitCost: z.number().min(0).optional().nullable(),
    reorderLevel: z.number().int().min(0).default(5),
    imageUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

// ==========================================
// INVENTORY CHECKOUT SCHEMAS
// ==========================================

export const createInventoryCheckoutSchema = z.object({
    inventoryItemId: z.string().min(1, 'Inventory Item ID is required'),
    projectId: z.string().optional().nullable(),
    teamId: z.string().min(1, 'Team ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    quantity: z.number().int().min(1).default(1),
    expectedReturn: z.string().datetime().or(z.date()).optional().nullable(),
    status: z.string().default('active'), // active, returned, overdue, lost
    notes: z.string().optional().nullable(),
});

export const updateInventoryCheckoutSchema = z.object({
    status: z.string().optional(),
    expectedReturn: z.string().datetime().or(z.date()).optional().nullable(),
    returnDate: z.string().datetime().or(z.date()).optional().nullable(),
    quantity: z.number().int().min(1).optional(),
    notes: z.string().optional().nullable(),
});

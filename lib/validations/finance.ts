import { z } from 'zod';

// ==========================================
// EXPENSE SCHEMAS
// ==========================================

export const createExpenseSchema = z.object({
    amount: z.union([z.number(), z.string()]).transform((val) => Number(val)).refine((val) => val > 0, {
        message: 'Amount must be greater than 0',
    }),
    date: z.string().datetime().or(z.date()).optional().nullable(),
    vendor: z.string().min(1, 'Vendor is required'),
    description: z.string().optional().nullable(),
    category: z.string().min(1, 'Category is required'),
    receiptUrl: z.string().url().optional().nullable().or(z.literal('')),
    status: z.string().default('pending'), // pending, approved, paid
    incurredById: z.string().min(1, 'Incurred By ID is required'),
    projectId: z.string().optional().nullable(),
    inventoryItemId: z.string().optional().nullable(),
    quarter: z.string().optional().nullable(),
    isRecurring: z.boolean().default(false),
    recurringFrequency: z.string().optional().nullable(),
    nextRecurringDate: z.string().datetime().or(z.date()).optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// ==========================================
// INVOICE SCHEMAS
// ==========================================

export const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().min(0),
    studentId: z.string().optional().nullable(),
    courseId: z.string().optional().nullable(),
});

export const createInvoiceSchema = z.object({
    parentId: z.string().min(1, 'Parent ID is required'),
    status: z.string().default('unpaid'), // unpaid, paid, overdue, cancelled
    dueDate: z.string().datetime().or(z.date()),
    tax: z.number().min(0).default(0),
    notes: z.string().optional().nullable(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

export const updateInvoiceSchema = z.object({
    status: z.string().optional(),
    dueDate: z.string().datetime().or(z.date()).optional(),
    paidDate: z.string().datetime().or(z.date()).optional().nullable(),
    tax: z.number().min(0).optional(),
    notes: z.string().optional().nullable(),
    items: z.array(invoiceItemSchema).optional(),
});

// ==========================================
// PAYROLL SCHEMAS
// ==========================================

export const payrollItemSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    baseSalary: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional().nullable(),
    bonus: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional().nullable(),
    deductions: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional().nullable(),
    netPay: z.union([z.number(), z.string()]).transform((val) => Number(val)),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

export const createPayrollRunSchema = z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    paymentDate: z.string().datetime().or(z.date()),
    status: z.string().default('draft'), // draft, processed, paid
    notes: z.string().optional().nullable(),
    items: z.array(payrollItemSchema).default([]),
});

export const updatePayrollRunSchema = createPayrollRunSchema.partial();

export const createStaffSalarySchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    title: z.string().optional().nullable(),
    annualSalary: z.union([z.number(), z.string()]).transform((val) => Number(val)).refine((val) => val >= 0),
    taxRate: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional().nullable(),
    healthDeduction: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional().nullable(),
    otherDeductions: z.union([z.number(), z.string()]).transform((val) => Number(val)).optional().nullable(),
    paymentFrequency: z.string().default('monthly'), // weekly, biweekly, monthly
    effectiveDate: z.string().datetime().or(z.date()).optional().nullable(),
    endDate: z.string().datetime().or(z.date()).optional().nullable(),
    notes: z.string().optional().nullable(),
});

export const updateStaffSalarySchema = createStaffSalarySchema.partial();

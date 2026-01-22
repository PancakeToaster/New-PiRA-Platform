import { prisma } from '@/lib/prisma';

/**
 * Log a user activity for audit trails
 */
export async function logActivity({
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    userAgent,
}: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details: details ? JSON.parse(JSON.stringify(details)) : null,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        // Fail silently to avoid breaking the main flow
        console.error('[ActivityLog] Failed to log activity:', error);
    }
}

/**
 * Log an error for system monitoring
 */
export async function logError({
    message,
    stack,
    path,
    method,
    userId,
    severity = 'error',
}: {
    message: string;
    stack?: string;
    path?: string;
    method?: string;
    userId?: string;
    severity?: 'error' | 'warning' | 'critical';
}) {
    try {
        await prisma.errorLog.create({
            data: {
                message,
                stack,
                path,
                method,
                userId,
                severity,
            },
        });
    } catch (error) {
        // Fail silently to avoid recursive errors
        console.error('[ErrorLog] Failed to log error:', error);
    }
}

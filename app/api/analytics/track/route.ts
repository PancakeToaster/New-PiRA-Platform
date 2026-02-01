import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// Helper to extract domain from URL
function extractDomain(url: string | null): string | null {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { path, pageTitle, referrer } = body;

        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        // Get current user (if authenticated)
        const user = await getCurrentUser();

        // Extract referrer domain
        const referrerDomain = extractDomain(referrer);

        // Get user agent and IP
        const userAgent = request.headers.get('user-agent') || undefined;
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            undefined;

        // Determine user role
        let userRole: string | undefined;
        if (user) {
            // You can expand this to check actual roles
            userRole = 'authenticated';
        }

        // Create page view record
        await prisma.pageView.create({
            data: {
                path,
                pageTitle,
                userId: user?.id,
                userRole,
                referrer,
                referrerDomain,
                userAgent,
                ipAddress,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to track page view:', error);
        return NextResponse.json({ error: 'Failed to track page view' }, { status: 500 });
    }
}

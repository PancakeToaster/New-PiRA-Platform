import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import {
    getGAMetrics,
    getGATopPages,
    getGATrafficSources,
    getGADeviceCategories,
    getGACountries,
} from '@/lib/googleAnalytics';

export async function GET() {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = process.env.GA_PROPERTY_ID;

    if (!propertyId) {
        // Return empty data structure so UI can show "not configured" message
        return NextResponse.json({
            metrics: null,
            topPages: [],
            trafficSources: [],
            deviceCategories: [],
            countries: [],
            notConfigured: true,
        });
    }

    try {
        // Fetch all GA data in parallel
        const [metrics, topPages, trafficSources, deviceCategories, countries] = await Promise.all([
            getGAMetrics(propertyId),
            getGATopPages(propertyId, 10),
            getGATrafficSources(propertyId, 10),
            getGADeviceCategories(propertyId),
            getGACountries(propertyId, 10),
        ]);

        return NextResponse.json({
            metrics,
            topPages,
            trafficSources,
            deviceCategories,
            countries,
        });
    } catch (error) {
        console.error('Failed to fetch Google Analytics data:', error);
        return NextResponse.json({
            error: 'Failed to fetch analytics data',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

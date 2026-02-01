import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Initialize the GA4 Data API client
let analyticsDataClient: BetaAnalyticsDataClient | null = null;

function getAnalyticsClient() {
    if (!analyticsDataClient) {
        // Check if credentials are available
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GA_PRIVATE_KEY) {
            console.warn('Google Analytics credentials not configured');
            return null;
        }

        try {
            // If using service account JSON file path
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                analyticsDataClient = new BetaAnalyticsDataClient();
            }
            // If using environment variables for credentials
            else if (process.env.GA_PRIVATE_KEY && process.env.GA_CLIENT_EMAIL) {
                analyticsDataClient = new BetaAnalyticsDataClient({
                    credentials: {
                        client_email: process.env.GA_CLIENT_EMAIL,
                        private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    },
                });
            }
        } catch (error) {
            console.error('Failed to initialize Google Analytics client:', error);
            return null;
        }
    }
    return analyticsDataClient;
}

export interface GAMetrics {
    activeUsers: number;
    totalUsers: number;
    sessions: number;
    pageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
}

export interface GATopPage {
    path: string;
    title: string;
    views: number;
    users: number;
}

export interface GATrafficSource {
    source: string;
    medium: string;
    sessions: number;
    users: number;
}

export interface GADeviceCategory {
    category: string;
    users: number;
    sessions: number;
}

export interface GACountry {
    country: string;
    users: number;
    sessions: number;
}

export async function getGAMetrics(propertyId: string, startDate: string = '30daysAgo', endDate: string = 'today'): Promise<GAMetrics | null> {
    const client = getAnalyticsClient();
    if (!client) return null;

    try {
        const [response] = await client.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'totalUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'averageSessionDuration' },
                { name: 'bounceRate' },
            ],
        });

        const row = response.rows?.[0];
        if (!row) return null;

        return {
            activeUsers: Number.parseInt(row.metricValues?.[0]?.value || '0'),
            totalUsers: Number.parseInt(row.metricValues?.[1]?.value || '0'),
            sessions: Number.parseInt(row.metricValues?.[2]?.value || '0'),
            pageViews: Number.parseInt(row.metricValues?.[3]?.value || '0'),
            averageSessionDuration: Number.parseFloat(row.metricValues?.[4]?.value || '0'),
            bounceRate: Number.parseFloat(row.metricValues?.[5]?.value || '0'),
        };
    } catch (error) {
        console.error('Failed to fetch GA metrics:', error);
        return null;
    }
}

export async function getGATopPages(propertyId: string, limit: number = 10): Promise<GATopPage[]> {
    const client = getAnalyticsClient();
    if (!client) return [];

    try {
        const [response] = await client.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [
                { name: 'pagePath' },
                { name: 'pageTitle' },
            ],
            metrics: [
                { name: 'screenPageViews' },
                { name: 'totalUsers' },
            ],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit,
        });

        return (response.rows || []).map(row => ({
            path: row.dimensionValues?.[0]?.value || '',
            title: row.dimensionValues?.[1]?.value || '',
            views: Number.parseInt(row.metricValues?.[0]?.value || '0'),
            users: Number.parseInt(row.metricValues?.[1]?.value || '0'),
        }));
    } catch (error) {
        console.error('Failed to fetch GA top pages:', error);
        return [];
    }
}

export async function getGATrafficSources(propertyId: string, limit: number = 10): Promise<GATrafficSource[]> {
    const client = getAnalyticsClient();
    if (!client) return [];

    try {
        const [response] = await client.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [
                { name: 'sessionSource' },
                { name: 'sessionMedium' },
            ],
            metrics: [
                { name: 'sessions' },
                { name: 'totalUsers' },
            ],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit,
        });

        return (response.rows || []).map(row => ({
            source: row.dimensionValues?.[0]?.value || '',
            medium: row.dimensionValues?.[1]?.value || '',
            sessions: Number.parseInt(row.metricValues?.[0]?.value || '0'),
            users: Number.parseInt(row.metricValues?.[1]?.value || '0'),
        }));
    } catch (error) {
        console.error('Failed to fetch GA traffic sources:', error);
        return [];
    }
}

export async function getGADeviceCategories(propertyId: string): Promise<GADeviceCategory[]> {
    const client = getAnalyticsClient();
    if (!client) return [];

    try {
        const [response] = await client.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [
                { name: 'totalUsers' },
                { name: 'sessions' },
            ],
            orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        });

        return (response.rows || []).map(row => ({
            category: row.dimensionValues?.[0]?.value || '',
            users: Number.parseInt(row.metricValues?.[0]?.value || '0'),
            sessions: Number.parseInt(row.metricValues?.[1]?.value || '0'),
        }));
    } catch (error) {
        console.error('Failed to fetch GA device categories:', error);
        return [];
    }
}

export async function getGACountries(propertyId: string, limit: number = 10): Promise<GACountry[]> {
    const client = getAnalyticsClient();
    if (!client) return [];

    try {
        const [response] = await client.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'country' }],
            metrics: [
                { name: 'totalUsers' },
                { name: 'sessions' },
            ],
            orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
            limit,
        });

        return (response.rows || []).map(row => ({
            country: row.dimensionValues?.[0]?.value || '',
            users: Number.parseInt(row.metricValues?.[0]?.value || '0'),
            sessions: Number.parseInt(row.metricValues?.[1]?.value || '0'),
        }));
    } catch (error) {
        console.error('Failed to fetch GA countries:', error);
        return [];
    }
}

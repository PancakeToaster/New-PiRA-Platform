// Google Analytics event tracking helper
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, eventParams);
    }
};

// Track page views
export const trackPageView = (url: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
            page_path: url,
        });
    }
};

// Common event types
export const GA_EVENTS = {
    // User interactions
    SIGNUP: 'sign_up',
    LOGIN: 'login',
    LOGOUT: 'logout',

    // Content interactions
    PAGE_VIEW: 'page_view',
    WIKI_VIEW: 'wiki_view',
    COURSE_VIEW: 'course_view',
    BLOG_VIEW: 'blog_view',

    // Conversions
    CONTACT_SUBMIT: 'contact_submit',
    JOIN_SUBMIT: 'join_submit',
    ENROLLMENT: 'enrollment',

    // Engagement
    SEARCH: 'search',
    DOWNLOAD: 'download',
    VIDEO_PLAY: 'video_play',
} as const;

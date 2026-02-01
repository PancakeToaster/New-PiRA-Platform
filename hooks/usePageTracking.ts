'use client';

import { useEffect, useRef } from 'react';

export function usePageTracking(pageTitle?: string) {
    const hasTracked = useRef(false);

    useEffect(() => {
        // Only track once per mount
        if (hasTracked.current) return;
        hasTracked.current = true;

        const trackPageView = async () => {
            try {
                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: window.location.pathname,
                        pageTitle: pageTitle || document.title,
                        referrer: document.referrer || null,
                    }),
                });
            } catch (error) {
                // Silently fail - don't disrupt user experience
                console.error('Analytics tracking failed:', error);
            }
        };

        trackPageView();
    }, [pageTitle]);
}

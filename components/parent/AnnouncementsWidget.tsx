'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Bell, Megaphone, ChevronDown, Calendar, Flag, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: string; // system, course, team
    createdAt: Date;
    author: {
        firstName: string;
        lastName: string;
        avatar: string | null;
    };
    contextName?: string; // e.g. "Robotics 101" or "Team Alpha"
}

interface AnnouncementsWidgetProps {
    initialAnnouncements: Announcement[];
    totalAnnouncements: number;
    readAnnouncementIds?: string[];
}

export default function AnnouncementsWidget({ initialAnnouncements, totalAnnouncements, readAnnouncementIds = [] }: AnnouncementsWidgetProps) {
    const [expanded, setExpanded] = useState(false);
    const [readIds, setReadIds] = useState<Set<string>>(new Set(readAnnouncementIds));
    const markedRef = useRef<Set<string>>(new Set());
    const displayCount = expanded ? 10 : 3;
    const visibleAnnouncements = initialAnnouncements.slice(0, displayCount);
    const hasMore = initialAnnouncements.length > 3;

    const markAsRead = useCallback(async (announcementId: string) => {
        if (markedRef.current.has(announcementId) || readIds.has(announcementId)) return;
        markedRef.current.add(announcementId);
        try {
            await fetch(`/api/announcements/${announcementId}/read`, { method: 'POST' });
            setReadIds((prev) => new Set([...prev, announcementId]));
        } catch {
            // Silently fail - read tracking is non-critical
        }
    }, [readIds]);

    // Mark visible announcements as read when displayed
    useEffect(() => {
        visibleAnnouncements.forEach((a) => markAsRead(a.id));
    }, [visibleAnnouncements, markAsRead]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'system': return <Megaphone className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
            case 'course': return <BookOpen className="w-4 h-4 text-primary" />;
            case 'team': return <Flag className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
            default: return <Bell className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getTypeLabel = (announcement: Announcement) => {
        switch (announcement.type) {
            case 'system': return 'System Announcement';
            case 'course': return announcement.contextName || 'Course Update';
            case 'team': return announcement.contextName || 'Team Update';
            default: return 'Announcement';
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'system': return 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-200/20';
            case 'course': return 'bg-primary/10 text-primary border-primary/20';
            case 'team': return 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-200/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <Card className="h-full border-t-4 border-t-primary shadow-sm bg-card">
            <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                    <Megaphone className="w-5 h-5 text-primary" />
                    Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {visibleAnnouncements.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p>No new announcements at this time.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {visibleAnnouncements.map((announcement) => (
                            <div key={announcement.id} className="flex gap-4 group relative">
                                {/* Unread indicator */}
                                {!readIds.has(announcement.id) && (
                                    <div className="absolute -left-2 top-3 w-2 h-2 bg-primary rounded-full" />
                                )}
                                {/* Icon Column */}
                                <div className="flex-shrink-0 mt-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${announcement.type === 'system' ? 'bg-rose-500/10' :
                                        announcement.type === 'course' ? 'bg-primary/10' : 'bg-amber-500/10'
                                        }`}>
                                        {getTypeIcon(announcement.type)}
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-grow">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getBadgeColor(announcement.type)}`}>
                                            {getTypeLabel(announcement)}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {announcement.title}
                                    </h3>

                                    <div
                                        className="prose dark:prose-invert prose-sm text-foreground/80 mt-2 max-w-none"
                                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                                    />

                                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        {announcement.author.avatar && (
                                            <img src={announcement.author.avatar} alt="" className="w-5 h-5 rounded-full" />
                                        )}
                                        <span>Posted by {announcement.author.firstName} {announcement.author.lastName}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {initialAnnouncements.length > 3 && (
                    <div className="mt-8 text-center pt-4 border-t border-border">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            {expanded ? 'Show Less' : `Show More (${initialAnnouncements.length - 3} older)`}
                            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

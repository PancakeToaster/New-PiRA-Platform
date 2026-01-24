'use client';

import { useState } from 'react';
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
}

export default function AnnouncementsWidget({ initialAnnouncements, totalAnnouncements }: AnnouncementsWidgetProps) {
    // In a real implementation with pagination, we'd fetch more. 
    // For now, let's assume initialAnnouncements contains up to 10 if we want, or we fetch more via server action.
    // The user asked for "listing 3 then a show more button".

    const [expanded, setExpanded] = useState(false);
    const displayCount = expanded ? 10 : 3;
    const visibleAnnouncements = initialAnnouncements.slice(0, displayCount);
    const hasMore = initialAnnouncements.length > 3;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'system': return <Megaphone className="w-4 h-4 text-rose-500" />;
            case 'course': return <BookOpen className="w-4 h-4 text-sky-500" />;
            case 'team': return <Flag className="w-4 h-4 text-amber-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
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
            case 'system': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'course': return 'bg-sky-100 text-sky-700 border-sky-200';
            case 'team': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <Card className="h-full border-t-4 border-t-sky-500 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Megaphone className="w-5 h-5 text-sky-600" />
                    Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {visibleAnnouncements.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No new announcements at this time.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {visibleAnnouncements.map((announcement) => (
                            <div key={announcement.id} className="flex gap-4 group">
                                {/* Icon Column */}
                                <div className="flex-shrink-0 mt-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${announcement.type === 'system' ? 'bg-rose-50' :
                                            announcement.type === 'course' ? 'bg-sky-50' : 'bg-amber-50'
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
                                        <span className="text-xs text-gray-400 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sky-600 transition-colors">
                                        {announcement.title}
                                    </h3>

                                    <div
                                        className="prose prose-sm text-gray-600 mt-2 max-w-none"
                                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                                    />

                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
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
                    <div className="mt-8 text-center pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
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

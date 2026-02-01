'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, Clock, Trophy, AlertCircle, ArrowRight, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils'; // Assuming this exists, or use date-fns

export interface UpcomingItem {
    id: string;
    title: string;
    date: Date;
    type: 'event' | 'assignment' | 'invoice' | 'competition';
    description?: string;
    formattedDate: string;
    isOverdue?: boolean;
}

interface UpcomingWidgetProps {
    items: UpcomingItem[];
}

export default function UpcomingWidget({ items }: UpcomingWidgetProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'competition': return <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
            case 'assignment': return <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />;
            case 'invoice': return <DollarSign className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
            default: return <Calendar className="w-4 h-4 text-green-500 dark:text-green-400" />;
        }
    };

    const getColorClass = (type: string) => {
        switch (type) {
            case 'competition': return 'border-l-amber-500 bg-amber-500/10';
            case 'assignment': return 'border-l-primary bg-primary/10';
            case 'invoice': return 'border-l-rose-500 bg-rose-500/10';
            default: return 'border-l-green-500 bg-green-500/10';
        }
    };

    return (
        <div className="space-y-6">
            {/* Widget Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Upcoming
                </h2>
                <Link href="/calendar" className="text-sm font-medium text-primary hover:text-primary/80">
                    View Calendar
                </Link>
            </div>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground text-sm">
                        No upcoming events or deadlines.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={`${item.type}-${item.id}`}
                            className={`relative p-4 rounded-r-lg border-l-4 shadow-sm bg-card hover:shadow-md transition-shadow ${getColorClass(item.type)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0 pr-4">
                                    {item.type === 'invoice' && item.isOverdue && (
                                        <div className="flex items-center text-xs font-bold text-rose-600 mb-1">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            OVERDUE
                                        </div>
                                    )}
                                    <h4 className="text-sm font-bold text-foreground truncate">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                        {item.description || item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end text-right shrink-0">
                                    <div className="flex items-center text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded-md shadow-sm">
                                        {item.formattedDate}
                                    </div>
                                    <div className="mt-2">
                                        {getIcon(item.type)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Link
                href="/calendar"
                className="block w-full py-2 text-center text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors dashed border border-border"
            >
                See all events
            </Link>
        </div>
    );
}

'use client';

import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday,
    parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Define event type based on Prisma model structure + student info
interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startTime: string; // ISO string
    endTime: string | null; // ISO string
    eventType: string;
    location: string | null;
    color: string | null;
    teamId: string | null;
    allDay: boolean;
    studentNames: string[]; // Names of students involved in this event
}

interface ParentCalendarProps {
    events: CalendarEvent[];
}

export default function ParentCalendar({ events }: ParentCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    // Get calendar days (including padding for previous/next month days)
    const startDate = startOfWeek(firstDayOfMonth);
    const endDate = endOfWeek(lastDayOfMonth);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Filter events for the selected date
    const selectedDateEvents = events.filter((event) =>
        isSameDay(parseISO(event.startTime), selectedDate)
    );

    const eventTypeColors: Record<string, string> = {
        competition: 'bg-red-500/10 text-red-500 border-red-200/20',
        deadline: 'bg-orange-500/10 text-orange-500 border-orange-200/20',
        meeting: 'bg-blue-500/10 text-blue-500 border-blue-200/20',
        class: 'bg-green-500/10 text-green-500 border-green-200/20',
        practice: 'bg-purple-500/10 text-purple-500 border-purple-200/20',
        other: 'bg-muted text-muted-foreground border-border',
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Calendar Grid */}
            <Card className="flex-1 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-bold text-foreground">
                            {format(currentDate, 'MMMM yyyy')}
                        </h2>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={prevMonth}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={nextMonth}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div
                                key={day}
                                className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                        {calendarDays.map((day, dayIdx) => {
                            const dateEvents = events.filter((event) =>
                                isSameDay(parseISO(event.startTime), day)
                            );

                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentDate);

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "relative border-b border-r border-border p-2 cursor-pointer transition-colors hover:bg-accent flex flex-col",
                                        !isCurrentMonth && "bg-muted/30 text-muted-foreground/50",
                                        isSelected && "bg-primary/5 ring-2 ring-inset ring-primary z-10",
                                        isToday(day) && !isSelected && "bg-primary/5"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                                            isToday(day)
                                                ? "bg-primary text-primary-foreground"
                                                : isSelected
                                                    ? "text-primary"
                                                    : "text-foreground"
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>

                                    {/* Event Dots/Bars */}
                                    <div className="space-y-1 overflow-hidden flex-1">
                                        {dateEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    "px-1.5 py-0.5 text-xs rounded truncate border",
                                                    eventTypeColors[event.eventType] || eventTypeColors.other
                                                )}
                                                title={event.title}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dateEvents.length > 3 && (
                                            <div className="text-xs text-muted-foreground pl-1">
                                                +{dateEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Selected Date Details */}
            <Card className="w-full lg:w-80 flex flex-col h-full border-l lg:border-l-0">
                <CardHeader>
                    <CardTitle>
                        {isToday(selectedDate)
                            ? 'Today'
                            : format(selectedDate, 'EEEE, MMMM do')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pr-2">
                    {selectedDateEvents.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDateEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-3 border border-border rounded-lg bg-card space-y-2 hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                                        <span
                                            className={cn(
                                                "px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border",
                                                eventTypeColors[event.eventType] || eventTypeColors.other
                                            )}
                                        >
                                            {event.eventType}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-sm text-foreground/80">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>
                                                {event.allDay
                                                    ? 'All Day'
                                                    : `${format(parseISO(event.startTime), 'h:mm a')} - ${event.endTime
                                                        ? format(parseISO(event.endTime), 'h:mm a')
                                                        : '...'
                                                    }`}
                                            </span>
                                        </div>

                                        {event.location && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-2">
                                            <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                                            <div className="flex flex-wrap gap-1">
                                                {event.studentNames.map((name, i) => (
                                                    <span key={i} className="bg-background border border-border px-1.5 rounded text-xs text-foreground">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {event.description && (
                                        <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-10">
                            <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                                <Clock className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                            <p>No events for this day</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CalendarView, { CalendarEvent } from '@/components/calendar/CalendarView';
import Navbar from '@/components/layout/Navbar';

interface PublicEventsClientProps {
    initialEvents: CalendarEvent[];
    footer: React.ReactNode;
}

export default function PublicEventsClient({ initialEvents, footer }: PublicEventsClientProps) {
    const [events] = useState<CalendarEvent[]>(initialEvents);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);

    // Helpers
    const getDisplayEventType = (type: string) => {
        if (type === 'center_closed') return 'Center Closed';
        return 'Events';
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const handleDateClick = (date: Date) => {
        // Read-only view, do nothing or show message
        console.log('Date clicked:', date);
    };

    const handleExportICal = () => {
        // Generate iCal content
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Robot Academy//Events//EN\n";

        events.forEach(event => {
            const startDate = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const endDate = event.endTime
                ? new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
                : startDate;

            icsContent += "BEGIN:VEVENT\n";
            icsContent += `DTSTART:${startDate}\n`;
            icsContent += `DTEND:${endDate}\n`;
            icsContent += `SUMMARY:${event.title}\n`;
            icsContent += `DESCRIPTION:${event.description || ''}\n`;
            icsContent += `LOCATION:${event.location || ''}\n`;
            icsContent += "END:VEVENT\n";
        });

        icsContent += "END:VCALENDAR";

        // Create download link
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'events.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportModal(false);
    };

    const handleAddToGoogleCalendar = () => {
        if (!selectedEvent) return;

        const startTime = new Date(selectedEvent.startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const endTime = selectedEvent.endTime
            ? new Date(selectedEvent.endTime).toISOString().replace(/-|:|\.\d\d\d/g, "")
            : new Date(new Date(selectedEvent.startTime).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");

        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedEvent.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(selectedEvent.description || '')}&location=${encodeURIComponent(selectedEvent.location || '')}`;

        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1 pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Events</h1>
                            <p className="mt-1 text-muted-foreground">
                                Upcoming public events, classes, and center closures.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" onClick={() => setShowExportModal(true)}>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Upcoming Events Section */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Events</h2>
                        {events.filter(e => new Date(e.startTime) >= new Date()).length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {events
                                    .filter(e => new Date(e.startTime) >= new Date())
                                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                                    .slice(0, 3)
                                    .map((event) => (
                                        <div
                                            key={event.id}
                                            className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                                            onClick={() => handleEventClick(event)}
                                        >
                                            <div className="h-2 bg-sky-500" style={{ backgroundColor: event.color || undefined }}></div>
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${event.eventType === 'center_closed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                        event.eventType === 'public_event' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-muted text-foreground'
                                                        }`}>
                                                        {getDisplayEventType(event.eventType)}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(event.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                                                    {event.title}
                                                </h3>
                                                <p className="text-muted-foreground mb-4 line-clamp-3 text-sm flex-1">
                                                    {event.description || 'No description available.'}
                                                </p>
                                                <div className="pt-4 border-t border-border mt-auto">
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <span className="truncate">
                                                            {event.allDay ? 'All Day' : new Date(event.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                            {event.location && ` • ${event.location}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-card rounded-xl border border-border">
                                <p className="text-muted-foreground">No upcoming events scheduled.</p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-border my-8"></div>

                    {/* Calendar */}
                    <CalendarView
                        events={events}
                        onEventClick={handleEventClick}
                        onDateClick={handleDateClick}
                        isPublicView={true}
                    />

                    {/* Event Modal - Read Only */}
                    {showEventModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 border border-border">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Event Details
                                    </h3>
                                    <button
                                        onClick={() => setShowEventModal(false)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {selectedEvent && (
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h4 className="text-xl font-semibold text-foreground">
                                                {selectedEvent.title}
                                            </h4>
                                        </div>
                                        {selectedEvent.description && (
                                            <p className="text-muted-foreground">{selectedEvent.description}</p>
                                        )}
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center space-x-2 text-muted-foreground">
                                                <span className="font-medium">When:</span>
                                                <span>
                                                    {selectedEvent.allDay
                                                        ? new Date(selectedEvent.startTime).toLocaleDateString()
                                                        : new Date(selectedEvent.startTime).toLocaleString()}
                                                </span>
                                            </div>
                                            {selectedEvent.location && (
                                                <div className="flex items-center space-x-2 text-muted-foreground">
                                                    <span className="font-medium">Where:</span>
                                                    <span>{selectedEvent.location}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-2 text-muted-foreground">
                                                <span className="font-medium">Type:</span>
                                                <span className="capitalize">{getDisplayEventType(selectedEvent.eventType)}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 pt-4 border-t border-border">
                                            <Button variant="outline" onClick={handleAddToGoogleCalendar}>
                                                Add to Google Calendar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Export Modal */}
                    {showExportModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 border border-border">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                    <h3 className="text-lg font-semibold text-foreground">Export Events</h3>
                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-muted-foreground">
                                        Export public events to use in other calendar applications.
                                    </p>
                                    <div className="space-y-3">
                                        <Button className="w-full" onClick={handleExportICal}>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download .ics file
                                        </Button>
                                        <p className="text-sm text-muted-foreground text-center">
                                            Compatible with Google Calendar, Apple Calendar, Outlook, and more.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {footer}
        </div>
    );
}

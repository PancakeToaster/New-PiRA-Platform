'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  color: string | null;
  team?: {
    name: string;
    slug: string;
  } | null;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onAddEvent?: () => void;
  isPublicView?: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarView({
  events,
  onEventClick,
  onDateClick,
  onAddEvent,
  isPublicView = false,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const getEventTypeColor = (eventType: string, customColor?: string | null) => {
    if (customColor) return customColor;
    switch (eventType) {
      case 'competition':
        return '#ef4444'; // red
      case 'deadline':
        return '#f97316'; // orange
      case 'meeting':
        return '#8b5cf6'; // violet
      case 'class':
        return '#0ea5e9'; // sky
      case 'practice':
        return '#22c55e'; // green
      case 'center_closed':
        return '#dc2626'; // red-600
      case 'public_event':
        return '#2563eb'; // blue-600
      default:
        return '#6b7280'; // gray
    }
  };

  // Month View helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigate = (direction: 'prev' | 'next') => {
    switch (viewMode) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return 'All day';
    const time = new Date(event.startTime);
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get week dates for week view
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">
            {viewMode === 'day'
              ? currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
              : currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
          </h2>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'month'
                ? 'bg-sky-500 text-white'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm border-x border-border transition-colors ${viewMode === 'week'
                ? 'bg-sky-500 text-white'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'day'
                ? 'bg-sky-500 text-white'
                : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
            >
              Day
            </button>
          </div>
          {onAddEvent && !isPublicView && (
            <Button onClick={onAddEvent}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div>
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {weekDays.map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 bg-card">
            {days.map((date, index) => {
              const isToday =
                date && date.toDateString() === today.toDateString();
              const dayEvents = date ? getEventsForDate(date) : [];
              const isWeekend =
                date && (date.getDay() === 0 || date.getDay() === 6);

              return (
                <div
                  key={index}
                  onClick={() => date && onDateClick(date)}
                  className={`min-h-[120px] border-b border-r border-border p-2 cursor-pointer transition-colors hover:bg-accent/50 ${isWeekend ? 'bg-muted/10' : ''
                    }`}
                >
                  {date && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${isToday
                          ? 'w-7 h-7 flex items-center justify-center bg-sky-500 text-white rounded-full'
                          : 'text-foreground'
                          }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                            className="px-2 py-0.5 text-xs rounded truncate text-white cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: getEventTypeColor(
                                event.eventType,
                                event.color
                              ),
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-2">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="overflow-auto max-h-[600px] bg-card">
          <div className="grid grid-cols-8 border-b border-border bg-muted/50 sticky top-0 z-10">
            <div className="px-2 py-3 text-center text-sm font-medium text-muted-foreground border-r border-border">
              Time
            </div>
            {getWeekDates().map((date, i) => {
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={i}
                  className={`px-2 py-3 text-center border-r border-border ${isToday ? 'bg-sky-500/10' : ''
                    }`}
                >
                  <div className="text-xs text-muted-foreground">{weekDays[i]}</div>
                  <div
                    className={`text-lg font-medium ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-foreground'
                      }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-border">
                <div className="px-2 py-3 text-xs text-muted-foreground border-r border-border text-right pr-3">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                {getWeekDates().map((date, i) => {
                  const dayEvents = getEventsForDate(date).filter((event) => {
                    if (event.allDay) return hour === 0;
                    const eventHour = new Date(event.startTime).getHours();
                    return eventHour === hour;
                  });
                  return (
                    <div
                      key={i}
                      className="min-h-[50px] border-r border-border p-1 relative hover:bg-accent/10 transition-colors"
                      onClick={() => onDateClick(date)}
                    >
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          className="px-1 py-0.5 text-xs rounded text-white cursor-pointer hover:opacity-80 mb-1 truncate"
                          style={{
                            backgroundColor: getEventTypeColor(
                              event.eventType,
                              event.color
                            ),
                          }}
                        >
                          {formatEventTime(event)} {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="overflow-auto max-h-[600px] bg-card">
          {hours.map((hour) => {
            const dayEvents = getEventsForDate(currentDate).filter((event) => {
              if (event.allDay) return hour === 0;
              const eventHour = new Date(event.startTime).getHours();
              return eventHour === hour;
            });
            return (
              <div
                key={hour}
                className="flex border-b border-border min-h-[60px] hover:bg-accent/5 transition-colors"
              >
                <div className="w-20 px-2 py-3 text-xs text-muted-foreground border-r border-border text-right pr-3 flex-shrink-0">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                <div className="flex-1 p-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="px-3 py-2 rounded text-white cursor-pointer hover:opacity-80 mb-1"
                      style={{
                        backgroundColor: getEventTypeColor(
                          event.eventType,
                          event.color
                        ),
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm opacity-90">
                        {formatEventTime(event)}
                        {event.location && ` · ${event.location}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-3 border-t border-border bg-muted/30 flex flex-wrap items-center gap-4 text-xs">
        {isPublicView ? (
          <>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }} />
              <span className="text-muted-foreground">Center Closed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2563eb' }} />
              <span className="text-muted-foreground">Events</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-muted-foreground">Competition</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }} />
              <span className="text-muted-foreground">Deadline</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }} />
              <span className="text-muted-foreground">Meeting</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#0ea5e9' }} />
              <span className="text-muted-foreground">Class</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-muted-foreground">Practice</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }} />
              <span className="text-muted-foreground">Center Closed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2563eb' }} />
              <span className="text-muted-foreground">Public Event</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

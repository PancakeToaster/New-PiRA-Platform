'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, X, Download, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CalendarView, { CalendarEvent } from '@/components/calendar/CalendarView';

interface EventFormData {
  title: string;
  description: string;
  eventType: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  color: string;
  teamId: string;
  isPublic: boolean;
}

interface Team {
  id: string;
  name: string;
  slug: string;
}

import { Suspense } from 'react';

function CalendarContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const teamFilter = searchParams.get('team');
  const isPublicView = status === 'unauthenticated';

  // Role-based permissions
  const userRoles = (session?.user as any)?.roles || [];
  const canCreate = userRoles.some((role: string) => ['Admin', 'Teacher', 'Mentor'].includes(role));
  const canDelete = userRoles.includes('Admin');



  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: '',
    description: '',
    eventType: 'meeting',
    startTime: '',
    endTime: '',
    allDay: false,
    location: '',
    color: '',
    teamId: '',
    isPublic: false,
  });

  useEffect(() => {
    fetchData();
  }, [teamFilter, status]);

  async function fetchData() {
    try {
      // Don't fetch teams if public
      const promises = [fetch(`/api/calendar${teamFilter ? `?team=${teamFilter}` : ''}`)];
      if (!isPublicView) {
        promises.push(fetch('/api/projects/teams'));
      }

      const [eventsRes, teamsRes] = await Promise.all(promises);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        // Frontend filtering/mapping for public view just in case, though API should handle it.
        // Also map display names for public tags
        const processedEvents = data.events.map((evt: CalendarEvent) => {
          if (isPublicView) {
            // For public view, we might want to map types or ensure they are displayed nicely.
            // The user asked to "Hide competition... tags from public users. Public users can instead see 2 new tags 'Center Closed' and 'Events'"
            // This might mean we remap the displayed type, or we rely on the saved type being one of the new ones.
            // Let's assume we treat 'center_closed' -> 'Center Closed' and everything else as 'Events' if public?
            // Or just display raw if it matches, and 'Events' fallback.
            return evt;
          }
          return evt;
        });
        setEvents(processedEvents);
      }

      if (teamsRes && teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDateClick = (date: Date) => {
    if (isPublicView) return; // Disable creation for public
    setSelectedDate(date);
    setEventForm((prev) => ({
      ...prev,
      startTime: date.toISOString().slice(0, 16),
      endTime: new Date(date.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
    }));
    setShowEventModal(true);
  };

  const handleAddEvent = () => {
    if (isPublicView) return;
    setSelectedEvent(null);
    setSelectedDate(new Date());
    const now = new Date();
    setEventForm({
      title: '',
      description: '',
      eventType: 'meeting',
      startTime: now.toISOString().slice(0, 16),
      endTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
      allDay: false,
      location: '',
      color: '',
      teamId: teams[0]?.id || '',
      isPublic: false,
    });
    setShowEventModal(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
      });

      if (response.ok) {
        const data = await response.json();
        setEvents((prev) => [...prev, data.event]);
        setShowEventModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/calendar/${selectedEvent.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
        setShowEventModal(false);
        resetForm();
      } else {
        alert('Failed to delete event. You may not have permission.');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('An error occurred while deleting the event.');
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      eventType: 'meeting',
      startTime: '',
      endTime: '',
      allDay: false,
      location: '',
      color: '',
      teamId: '',
      isPublic: false,
    });
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleExportICal = async () => {
    try {
      const response = await fetch(`/api/calendar/export${teamFilter ? `?team=${teamFilter}` : ''}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'calendar.ics';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export calendar:', error);
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (!selectedEvent) return;
    const event = selectedEvent;
    const startTime = new Date(event.startTime).toISOString().replace(/-|:|\.\d+/g, '');
    const endTime = event.endTime
      ? new Date(event.endTime).toISOString().replace(/-|:|\.\d+/g, '')
      : startTime;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${startTime}/${endTime}&details=${encodeURIComponent(
      event.description || ''
    )}&location=${encodeURIComponent(event.location || '')}`;
    window.open(url, '_blank');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  // Helper to format event type for display
  const getDisplayEventType = (type: string) => {
    if (isPublicView) {
      if (type === 'center_closed') return 'Center Closed';
      return 'Event'; // Default fallback for public
    }
    // Internal view full map
    const map: Record<string, string> = {
      'center_closed': 'Center Closed',
      'public_event': 'Public Event',
      'meeting': 'Meeting',
      'competition': 'Competition',
      'deadline': 'Deadline',
      'class': 'Class',
      'practice': 'Practice',
      'other': 'Other'
    };
    return map[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="mt-1 text-gray-500">
              {teamFilter
                ? `Showing events for team`
                : 'View and manage your events'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Team Filter - Hide for public */}
        {!isPublicView && teams.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <span className="text-sm text-gray-500 flex-shrink-0">Filter by team:</span>
              <a
                href="/calendar"
                className={`px-3 py-1.5 text-sm rounded-full ${!teamFilter
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                All
              </a>
              {teams.map((team) => (
                <a
                  key={team.id}
                  href={`/calendar?team=${team.slug}`}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap ${teamFilter === team.slug
                    ? 'bg-sky-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {team.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Calendar */}
        <CalendarView
          events={events}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onAddEvent={canCreate ? handleAddEvent : undefined}
          isPublicView={isPublicView}
        />

        {/* Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEvent ? 'Event Details' : 'New Event'}
                </h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedEvent ? (
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {selectedEvent.title}
                    </h4>
                    {selectedEvent.team && !isPublicView && (
                      <p className="text-sm text-gray-500">{selectedEvent.team.name}</p>
                    )}
                  </div>
                  {selectedEvent.description && (
                    <p className="text-gray-600">{selectedEvent.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span className="font-medium">When:</span>
                      <span>
                        {selectedEvent.allDay
                          ? new Date(selectedEvent.startTime).toLocaleDateString()
                          : new Date(selectedEvent.startTime).toLocaleString()}
                      </span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <span className="font-medium">Where:</span>
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-gray-600">
                      <span className="font-medium">Type:</span>
                      <span className="capitalize">{getDisplayEventType(selectedEvent.eventType)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4 border-t justify-between">
                    <Button variant="outline" onClick={handleAddToGoogleCalendar}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Add to Google Calendar
                    </Button>
                    {canDelete && (
                      <Button variant="danger" onClick={handleDeleteEvent}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                canCreate && (
                  <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                        placeholder="Event title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={eventForm.description}
                        onChange={(e) =>
                          setEventForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                        placeholder="Event description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Type
                        </label>
                        <select
                          value={eventForm.eventType}
                          onChange={(e) =>
                            setEventForm((prev) => ({ ...prev, eventType: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                        >
                          <option value="meeting">Meeting</option>
                          <option value="competition">Competition</option>
                          <option value="deadline">Deadline</option>
                          <option value="class">Class</option>
                          <option value="practice">Practice</option>
                          <option value="center_closed">Center Closed</option>
                          <option value="public_event">Public Event</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Team
                        </label>
                        <select
                          value={eventForm.teamId}
                          onChange={(e) =>
                            setEventForm((prev) => ({ ...prev, teamId: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                        >
                          <option value="">No team (personal)</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allDay"
                        checked={eventForm.allDay}
                        onChange={(e) =>
                          setEventForm((prev) => ({ ...prev, allDay: e.target.checked }))
                        }
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allDay" className="text-sm text-gray-700">
                        All day event
                      </label>
                    </div>

                    {/* Public visibility toggle */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={eventForm.isPublic}
                        onChange={(e) => setEventForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-700">
                        Visible to Public (Login not required)
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start
                        </label>
                        <input
                          type={eventForm.allDay ? 'date' : 'datetime-local'}
                          value={eventForm.startTime}
                          onChange={(e) =>
                            setEventForm((prev) => ({ ...prev, startTime: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>

                      {!eventForm.allDay && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End
                          </label>
                          <input
                            type="datetime-local"
                            value={eventForm.endTime}
                            onChange={(e) =>
                              setEventForm((prev) => ({ ...prev, endTime: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={eventForm.location}
                        onChange={(e) =>
                          setEventForm((prev) => ({ ...prev, location: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                        placeholder="Event location"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEventModal(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Event'}
                      </Button>
                    </div>
                  </form>
                )
              )}
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Export Calendar</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-600">
                  Export your calendar events to use in other calendar applications.
                </p>
                <div className="space-y-3">
                  <Button className="w-full" onClick={handleExportICal}>
                    <Download className="w-4 h-4 mr-2" />
                    Download .ics file
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                    Compatible with Google Calendar, Apple Calendar, Outlook, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-sky-600" /></div>}>
      <CalendarContent />
    </Suspense>
  );
}

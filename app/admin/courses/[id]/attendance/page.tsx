'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Plus, Calendar, Users, Trash2, Edit2, Loader2, CheckCircle, X } from 'lucide-react';
import AttendanceGrid from '@/components/lms/AttendanceGrid';

interface Student {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email?: string;
  };
}

interface AttendanceRecordData {
  studentId: string;
  status: string;
  note?: string;
}

interface Session {
  id: string;
  date: string;
  topic: string | null;
  notes: string | null;
  attendance: Array<{
    id: string;
    studentId: string;
    status: string;
    note: string | null;
    student: Student;
  }>;
}

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [records, setRecords] = useState<AttendanceRecordData[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/attendance`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const openNewSession = () => {
    setEditingSession(null);
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionTopic('');
    setSessionNotes('');
    // Default all students to present
    setRecords(students.map((s) => ({ studentId: s.id, status: 'present' })));
    setShowModal(true);
  };

  const openEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionDate(new Date(session.date).toISOString().split('T')[0]);
    setSessionTopic(session.topic || '');
    setSessionNotes(session.notes || '');
    setRecords(
      session.attendance.map((a) => ({
        studentId: a.studentId,
        status: a.status,
        note: a.note || undefined,
      }))
    );
    setShowModal(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        date: sessionDate,
        topic: sessionTopic || null,
        notes: sessionNotes || null,
        records,
      };

      const url = editingSession
        ? `/api/admin/courses/${courseId}/attendance/${editingSession.id}`
        : `/api/admin/courses/${courseId}/attendance`;

      const res = await fetch(url, {
        method: editingSession ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/attendance/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const getStatusCounts = (attendance: Session['attendance']) => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    attendance.forEach((a) => {
      if (a.status in counts) counts[a.status as keyof typeof counts]++;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/courses/${courseId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        </div>
        <Button onClick={openNewSession}>
          <Plus className="w-4 h-4 mr-2" />
          Take Attendance
        </Button>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No attendance sessions recorded yet.</p>
            <Button onClick={openNewSession} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Take First Attendance
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Excused
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => {
                  const counts = getStatusCounts(session.attendance);
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(session.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {session.topic || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-700">{counts.present}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-red-700">{counts.absent}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-yellow-700">{counts.late}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-700">{counts.excused}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditSession(session)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(session.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingSession ? 'Edit Attendance' : 'Take Attendance'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <input
                      type="text"
                      value={sessionTopic}
                      onChange={(e) => setSessionTopic(e.target.value)}
                      placeholder="e.g. Introduction to Sensors"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={2}
                    placeholder="Optional session notes..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <AttendanceGrid
                students={students}
                records={records}
                onChange={setRecords}
              />

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {editingSession ? 'Update' : 'Save Attendance'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle } from 'lucide-react';

interface Student {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface AttendanceRecordData {
  studentId: string;
  status: string;
  note?: string;
}

interface AttendanceGridProps {
  students: Student[];
  records: AttendanceRecordData[];
  onChange: (records: AttendanceRecordData[]) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'text-green-700 bg-green-50' },
  { value: 'absent', label: 'Absent', color: 'text-red-700 bg-red-50' },
  { value: 'late', label: 'Late', color: 'text-yellow-700 bg-yellow-50' },
  { value: 'excused', label: 'Excused', color: 'text-blue-700 bg-blue-50' },
];

export default function AttendanceGrid({
  students,
  records,
  onChange,
  disabled = false,
}: AttendanceGridProps) {
  const getRecord = useCallback(
    (studentId: string) => {
      return records.find((r) => r.studentId === studentId);
    },
    [records]
  );

  const updateRecord = useCallback(
    (studentId: string, field: 'status' | 'note', value: string) => {
      const existing = records.find((r) => r.studentId === studentId);
      if (existing) {
        onChange(
          records.map((r) =>
            r.studentId === studentId ? { ...r, [field]: value } : r
          )
        );
      } else {
        onChange([
          ...records,
          {
            studentId,
            status: field === 'status' ? value : 'present',
            note: field === 'note' ? value : undefined,
          },
        ]);
      }
    },
    [records, onChange]
  );

  const markAllPresent = useCallback(() => {
    const updated = students.map((student) => {
      const existing = records.find((r) => r.studentId === student.id);
      return {
        studentId: student.id,
        status: 'present',
        note: existing?.note,
      };
    });
    onChange(updated);
  }, [students, records, onChange]);

  // Sort students alphabetically by last name, then first name
  const sortedStudents = [...students].sort((a, b) => {
    const lastCmp = a.user.lastName.localeCompare(b.user.lastName);
    if (lastCmp !== 0) return lastCmp;
    return a.user.firstName.localeCompare(b.user.firstName);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {students.length} student{students.length !== 1 ? 's' : ''}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={markAllPresent}
          disabled={disabled}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark All Present
        </Button>
      </div>

      {sortedStudents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No students enrolled in this course.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {sortedStudents.map((student) => {
                const record = getRecord(student.id);
                const status = record?.status || 'present';
                const note = record?.note || '';

                return (
                  <tr key={student.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">
                        {student.user.lastName}, {student.user.firstName}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={status}
                        onChange={(e) =>
                          updateRecord(student.id, 'status', e.target.value)
                        }
                        disabled={disabled}
                        className={`text-sm rounded-md border border-gray-300 px-2 py-1.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${STATUS_OPTIONS.find((o) => o.value === status)?.color || ''
                          }`}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={note}
                        onChange={(e) =>
                          updateRecord(student.id, 'note', e.target.value)
                        }
                        disabled={disabled}
                        placeholder="Optional note..."
                        className="text-sm w-full rounded-md border border-gray-300 px-2 py-1.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

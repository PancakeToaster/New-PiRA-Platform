'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    FileText,
    Loader2,
    ArrowRight,
} from 'lucide-react';

interface Assignment {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxPoints: number;
    lmsCourse: { name: string } | null;
    lesson: { title: string } | null;
    submissions: Array<{
        id: string;
        status: string;
        grade: number | null;
        submittedAt: string | null;
        gradedAt: string | null;
    }>;
}

interface AssignmentStats {
    total: number;
    upcoming: number;
    overdue: number;
    completed: number;
}

export default function StudentAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [upcoming, setUpcoming] = useState<Assignment[]>([]);
    const [overdue, setOverdue] = useState<Assignment[]>([]);
    const [completed, setCompleted] = useState<Assignment[]>([]);
    const [stats, setStats] = useState<AssignmentStats>({
        total: 0,
        upcoming: 0,
        overdue: 0,
        completed: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue' | 'completed'>('upcoming');

    useEffect(() => {
        fetchAssignments();
    }, []);

    async function fetchAssignments() {
        try {
            const res = await fetch('/api/student/assignments');
            if (res.ok) {
                const data = await res.json();
                setAssignments(data.assignments);
                setUpcoming(data.upcoming);
                setOverdue(data.overdue);
                setCompleted(data.completed);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    }

    const formatDueDate = (dueDate: string) => {
        const date = new Date(dueDate);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else if (diffDays <= 7) {
            return `Due in ${diffDays} days`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getStatusBadge = (assignment: Assignment) => {
        const submission = assignment.submissions[0];

        if (!submission || submission.status === 'draft') {
            const isOverdue = new Date(assignment.dueDate) < new Date();
            return isOverdue ? (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                    Not Submitted
                </span>
            ) : (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Not Started
                </span>
            );
        }

        if (submission.status === 'submitted') {
            return (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    Submitted
                </span>
            );
        }

        if (submission.status === 'graded') {
            return (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Graded
                </span>
            );
        }

        return null;
    };

    const getGrade = (assignment: Assignment) => {
        const submission = assignment.submissions[0];
        if (submission?.grade !== null && submission?.grade !== undefined) {
            return `${submission.grade}/${assignment.maxPoints}`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    const currentList = activeTab === 'upcoming' ? upcoming : activeTab === 'overdue' ? overdue : completed;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
                <p className="text-gray-600 mt-1">Track and submit your course assignments</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-500">Total Assignments</p>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-all ${activeTab === 'upcoming' ? 'ring-2 ring-sky-500 shadow-md' : 'hover:bg-gray-50'
                        }`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-sky-600">{stats.upcoming}</p>
                        <p className="text-sm text-gray-500">Upcoming</p>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-all ${activeTab === 'overdue' ? 'ring-2 ring-red-500 shadow-md' : 'hover:bg-gray-50'
                        }`}
                    onClick={() => setActiveTab('overdue')}
                >
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                        <p className="text-sm text-gray-500">Overdue</p>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-all ${activeTab === 'completed' ? 'ring-2 ring-green-500 shadow-md' : 'hover:bg-gray-50'
                        }`}
                    onClick={() => setActiveTab('completed')}
                >
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                        <p className="text-sm text-gray-500">Completed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Assignments List */}
            <Card>
                <CardHeader>
                    <CardTitle className="capitalize">{activeTab} Assignments ({currentList.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {currentList.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No {activeTab} assignments</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentList.map((assignment) => (
                                <Link
                                    key={assignment.id}
                                    href={`/student/assignments/${assignment.id}`}
                                    className="block"
                                >
                                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                                                    {getStatusBadge(assignment)}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                    {assignment.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    {assignment.lmsCourse && (
                                                        <span className="flex items-center gap-1">
                                                            <FileText className="w-4 h-4" />
                                                            {assignment.lmsCourse.name}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDueDate(assignment.dueDate)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {assignment.maxPoints} points
                                                    </span>
                                                    {getGrade(assignment) && (
                                                        <span className="flex items-center gap-1 font-medium text-green-600">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            {getGrade(assignment)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

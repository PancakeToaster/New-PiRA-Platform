'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, Save, X, Edit2, Check, GraduationCap, DollarSign, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { StudentPaymentModal } from './components/StudentPaymentModal';

interface StudentData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isApproved: boolean;
    roles: { role: { name: string } }[];
    studentProfile: {
        id: string;
        grade: string | null;
        school: string | null;
        dateOfBirth: string | null;
        phoneNumber: string | null;
        performanceDiscount: number;
        parents: {
            parent: {
                id: string;
                user: {
                    firstName: string;
                    lastName: string;
                    email: string;
                };
                invoices: {
                    id: string;
                    invoiceNumber: string;
                    status: string;
                    dueDate: string;
                    total: number;
                    items: {
                        id: string;
                        description: string;
                        total: number;
                        studentId: string | null;
                    }[];
                }[];
            };
        }[];
    } | null;
}

export default function StudentInfoPage() {
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

    // Local state for editing to avoid immediate API calls on every keystroke
    // We sync this with 'students' when edit mode is toggled or data is loaded
    const [editState, setEditState] = useState<Record<string, Partial<StudentData & { grade: string, school: string, dateOfBirth: string, phoneNumber: string, performanceDiscount: number }>>>({});

    const router = useRouter();

    useEffect(() => {
        fetchStudents();
    }, []);

    async function fetchStudents() {
        try {
            const res = await fetch('/api/admin/students');
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
                // Initialize edit state
                const initialEditState: any = {};
                data.forEach((s: StudentData) => {
                    initialEditState[s.id] = {
                        firstName: s.firstName,
                        lastName: s.lastName,
                        email: s.email,
                        grade: s.studentProfile?.grade || '',
                        school: s.studentProfile?.school || '',
                        dateOfBirth: s.studentProfile?.dateOfBirth ? new Date(s.studentProfile.dateOfBirth).toISOString().split('T')[0] : '', // YYYY-MM-DD
                        phoneNumber: s.studentProfile?.phoneNumber || '',
                        performanceDiscount: s.studentProfile?.performanceDiscount || 0
                    };
                });
                setEditState(initialEditState);
            }
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    }

    const handleEditChange = (id: string, field: string, value: any) => {
        setEditState(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSaveRow = async (id: string) => {
        setSavingId(id);
        const dataToSave = editState[id];

        try {
            const res = await fetch('/api/admin/students', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, data: dataToSave })
            });

            if (res.ok) {
                // Update local consistent state
                setStudents(prev => prev.map(s => {
                    if (s.id === id) {
                        return {
                            ...s,
                            firstName: dataToSave.firstName as string,
                            lastName: dataToSave.lastName as string,
                            email: dataToSave.email as string,
                            studentProfile: {
                                id: s.studentProfile?.id || 'temp-id',
                                grade: dataToSave.grade as string,
                                school: dataToSave.school as string,
                                dateOfBirth: dataToSave.dateOfBirth as string,
                                phoneNumber: dataToSave.phoneNumber as string,
                                performanceDiscount: dataToSave.performanceDiscount as number,
                                parents: s.studentProfile?.parents || []
                            }
                        };
                    }
                    return s;
                }));
            } else {
                alert('Failed to save changes');
            }
        } catch (e) {
            console.error('Save error', e);
            alert('Failed to save changes');
        } finally {
            setSavingId(null);
        }
    };

    const filteredStudents = students.filter(s =>
        s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                    <GraduationCap className="w-8 h-8 mr-3 text-primary" />
                    Student Info Grid
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border shadow-sm">
                        <Switch
                            checked={editMode}
                            onCheckedChange={setEditMode}
                            id="edit-mode"
                        />
                        <label htmlFor="edit-mode" className="text-sm font-medium text-foreground cursor-pointer">
                            {editMode ? 'Edit Mode ON' : 'Read-Only'}
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
                <Search className="text-muted-foreground w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground"
                />
            </div>

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-64">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-64">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">School</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Date of Birth</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Phone Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Discount (%)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Parents</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Payments</th>
                                {editMode && <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {filteredStudents.map(student => {
                                const rowData = editState[student.id];
                                return (
                                    <tr key={student.id} className="hover:bg-muted/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editMode ? (
                                                <div className="space-y-1">
                                                    <input
                                                        className="border border-input rounded px-2 py-1 w-full text-sm bg-background text-foreground"
                                                        value={rowData?.firstName || ''}
                                                        onChange={(e) => handleEditChange(student.id, 'firstName', e.target.value)}
                                                        placeholder="First Name"
                                                    />
                                                    <input
                                                        className="border border-input rounded px-2 py-1 w-full text-sm bg-background text-foreground"
                                                        value={rowData?.lastName || ''}
                                                        onChange={(e) => handleEditChange(student.id, 'lastName', e.target.value)}
                                                        placeholder="Last Name"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3">
                                                        {student.firstName[0]}
                                                    </div>
                                                    <span className="font-medium text-foreground">{student.firstName} {student.lastName}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                                {student.roles.map(r => (
                                                    <span key={r.role.name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                                        {r.role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editMode ? (
                                                <input
                                                    className="border border-input rounded px-2 py-1 w-full text-sm bg-background text-foreground"
                                                    value={rowData?.email || ''}
                                                    onChange={(e) => handleEditChange(student.id, 'email', e.target.value)}
                                                />
                                            ) : (
                                                <span className="text-sm text-muted-foreground">{student.email}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editMode ? (
                                                <input
                                                    className="border border-input rounded px-2 py-1 w-full text-sm bg-background text-foreground"
                                                    value={rowData?.grade || ''}
                                                    onChange={(e) => handleEditChange(student.id, 'grade', e.target.value)}
                                                    placeholder="Grade"
                                                />
                                            ) : (
                                                <span className="text-sm text-muted-foreground">{student.studentProfile?.grade || '-'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editMode ? (
                                                <input
                                                    className="border border-input rounded px-2 py-1 w-full text-sm bg-background text-foreground"
                                                    value={rowData?.school || ''}
                                                    onChange={(e) => handleEditChange(student.id, 'school', e.target.value)}
                                                    placeholder="School"
                                                />
                                            ) : (
                                                <span className="text-sm text-muted-foreground truncate max-w-[12rem]" title={student.studentProfile?.school || ''}>
                                                    {student.studentProfile?.school || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editMode ? (
                                                <input
                                                    type="date"
                                                    className="border border-input rounded px-2 py-1 w-full text-sm bg-background text-foreground"
                                                    value={rowData?.dateOfBirth || ''}
                                                    onChange={(e) => handleEditChange(student.id, 'dateOfBirth', e.target.value)}
                                                />
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    {student.studentProfile?.dateOfBirth
                                                        ? new Date(student.studentProfile.dateOfBirth).toLocaleDateString()
                                                        : '-'
                                                    }
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editMode ? (
                                                <input
                                                    type="tel"
                                                    className="border border-input rounded px-2 py-1 w-full text-sm bg-background text-foreground"
                                                    value={rowData?.phoneNumber || ''}
                                                    onChange={(e) => handleEditChange(student.id, 'phoneNumber', e.target.value)}
                                                    placeholder="Phone Number"
                                                />
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    {student.studentProfile?.phoneNumber || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editMode ? (
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        className="border border-input rounded px-2 py-1 w-20 text-sm bg-background text-foreground"
                                                        value={rowData?.performanceDiscount ?? 0}
                                                        onChange={(e) => handleEditChange(student.id, 'performanceDiscount', e.target.value)}
                                                    />
                                                    <span className="ml-1 text-muted-foreground">%</span>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                                                    {student.studentProfile?.performanceDiscount || 0}%
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                {student.studentProfile?.parents.map((p, i) => (
                                                    <span key={i} className="text-xs bg-muted rounded px-2 py-1 text-muted-foreground">
                                                        {p.parent.user.firstName} {p.parent.user.lastName}
                                                    </span>
                                                ))}
                                                {(!student.studentProfile?.parents.length) && <span className="text-xs text-muted-foreground">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                // Aggregate all invoices from all parents
                                                const allInvoices = student.studentProfile?.parents.flatMap(p => p.parent.invoices) || [];
                                                const totalInvoices = allInvoices.length;
                                                const unpaidCount = allInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue').length;

                                                if (totalInvoices === 0) {
                                                    return <span className="text-xs text-muted-foreground">No invoices</span>;
                                                }

                                                return (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setPaymentModalOpen(true);
                                                        }}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                        <span>{totalInvoices}</span>
                                                        {unpaidCount > 0 && (
                                                            <span className="ml-1 px-1.5 py-0.5 bg-destructive/10 text-destructive rounded text-xs font-medium">
                                                                {unpaidCount}
                                                            </span>
                                                        )}
                                                    </Button>
                                                );
                                            })()}
                                        </td>
                                        {editMode && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-primary hover:text-primary hover:bg-muted"
                                                    onClick={() => handleSaveRow(student.id)}
                                                    disabled={savingId === student.id}
                                                >
                                                    {savingId === student.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Payment Modal */}
            {selectedStudent && (
                <StudentPaymentModal
                    isOpen={paymentModalOpen}
                    onClose={() => {
                        setPaymentModalOpen(false);
                        setSelectedStudent(null);
                    }}
                    studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    studentId={selectedStudent.studentProfile?.id || ''}
                    invoices={selectedStudent.studentProfile?.parents.flatMap(p => p.parent.invoices) || []}
                />
            )}
        </div>
    );
}

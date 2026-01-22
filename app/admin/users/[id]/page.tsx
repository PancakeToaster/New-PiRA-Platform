'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import React from 'react';

interface Role {
    id: string;
    name: string;
}

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: { role: Role }[];
    studentProfile: any;
    parentProfile: any;
    teacherProfile: any;
}

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    // const { id } = React.use(params); // Removed causing error

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [students, setStudents] = useState<User[]>([]); // For referral dropdown
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '', // Optional on edit
        firstName: '',
        lastName: '',
        roles: [] as string[],
        // Student fields
        dateOfBirth: '',
        grade: '',
        school: '',
        performanceDiscount: 0,
        referredById: '',
        // Parent fields
        phone: '',
        address: '',
        studentIds: [] as string[],
        // Teacher fields
        bio: '',
        specialization: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        Promise.all([fetchRoles(), fetchUser(), fetchAllUsers()]).finally(() => setLoading(false));
    }, [id]);

    async function fetchRoles() {
        try {
            const response = await fetch('/api/admin/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data.roles);
            }
        } catch (e) { console.error(e); }
    }

    async function fetchAllUsers() {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                // Filter for potential referrers AND children (students)
                setStudents(data.users.filter((u: any) => u.roles.some((r: any) => r.role.name.toLowerCase() === 'student')));
            }
        } catch (e) { console.error(e); }
    }

    async function fetchUser() {
        try {
            const response = await fetch(`/api/admin/users/${id}`);
            if (response.ok) {
                const { user } = await response.json();
                setFormData({
                    email: user.email,
                    password: '',
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: user.roles.map((r: any) => r.role.name),
                    // Student
                    dateOfBirth: user.studentProfile?.dateOfBirth ? new Date(user.studentProfile.dateOfBirth).toISOString().split('T')[0] : '',
                    grade: user.studentProfile?.grade || '',
                    school: user.studentProfile?.school || '',
                    performanceDiscount: user.studentProfile?.performanceDiscount || 0,
                    referredById: user.studentProfile?.referredById || '',
                    // Parent
                    phone: user.parentProfile?.phone || '',
                    address: user.parentProfile?.address || '',
                    studentIds: user.parentProfile?.students?.map((s: any) => s.studentId) || [],
                    // Teacher
                    bio: user.teacherProfile?.bio || '',
                    specialization: user.teacherProfile?.specialization || '',
                });
            } else {
                setError('User not found');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to fetch user');
        }
    }

    const handleRoleToggle = (roleName: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleName)
                ? prev.roles.filter(r => r !== roleName)
                : [...prev.roles, roleName],
        }));
    };

    const handleStudentToggle = (studentProfileId: string) => {
        setFormData(prev => ({
            ...prev,
            studentIds: prev.studentIds.includes(studentProfileId)
                ? prev.studentIds.filter(id => id !== studentProfileId)
                : [...prev.studentIds, studentProfileId],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/admin/users');
                router.refresh();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update user');
            }
        } catch (err) {
            console.error('Failed to update user:', err);
            setError('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const selectedRoles = formData.roles.map(r => r.toLowerCase());
    const showStudentFields = selectedRoles.includes('student');
    const showParentFields = selectedRoles.includes('parent');
    const showTeacherFields = selectedRoles.includes('teacher');

    if (loading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-sky-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Users
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Basic Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password (Leave blank to keep current)</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Roles */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {roles
                                .filter(role => !['Public'].includes(role.name))
                                .map((role) => (
                                    <label
                                        key={role.id}
                                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.roles.includes(role.name) ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.roles.includes(role.name)}
                                            onChange={() => handleRoleToggle(role.name)}
                                            className="sr-only"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{role.name}</p>
                                        </div>
                                    </label>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                {/* --- CRM: Student Profile --- */}
                {showStudentFields && (
                    <Card className="mb-6 border-sky-200 shadow-sm">
                        <CardHeader className="bg-sky-50 rounded-t-lg">
                            <CardTitle className="text-sky-800">Student CRM & Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* Discounts Section */}
                            <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">Discounts & Referrals</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Performance Discount (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.performanceDiscount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, performanceDiscount: parseFloat(e.target.value) || 0 }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-sky-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Manual discount for student performance.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Referred By</label>
                                        <select
                                            value={formData.referredById}
                                            onChange={(e) => setFormData(prev => ({ ...prev, referredById: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-sky-500"
                                        >
                                            <option value="">-- No Referrer --</option>
                                            {students
                                                .filter(s => s.id !== id) // Exclude self
                                                .map(student => (
                                                    <option key={student.studentProfile.id} value={student.studentProfile.id}>
                                                        {student.firstName} {student.lastName}
                                                    </option>
                                                ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Links to another student for referral bonus.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                                    <input
                                        type="text"
                                        value={formData.school}
                                        onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                                <input
                                    type="text"
                                    value={formData.grade}
                                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Parent Profile */}
                {showParentFields && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Parent Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Linked Children</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                                    {students.map(student => (
                                        <label
                                            key={student.studentProfile?.id || student.id}
                                            className={`flex items-center p-2 rounded cursor-pointer border transition-all ${formData.studentIds.includes(student.studentProfile?.id)
                                                    ? 'bg-sky-100 border-sky-300 text-sky-900'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={formData.studentIds.includes(student.studentProfile?.id)}
                                                onChange={() => handleStudentToggle(student.studentProfile?.id)}
                                                disabled={!student.studentProfile?.id}
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{student.firstName} {student.lastName}</div>
                                                <div className="text-xs text-gray-500">{student.email}</div>
                                            </div>
                                        </label>
                                    ))}
                                    {students.length === 0 && <p className="text-gray-500 text-sm p-2">No students found.</p>}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Select the students that belong to this parent.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Teacher Profile */}
                {showTeacherFields && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Teacher Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                                <input
                                    type="text"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                    <Link href="/admin/users">
                        <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                </div>
            </form>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Search, UserPlus, Loader2, DollarSign, Users as UsersIcon, GraduationCap, AlertCircle, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Types reflecting the updated API response
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  // This is now fetched
  isApproved: boolean;
  roles: { role: { id: string; name: string } }[];

  studentProfile?: {
    id: string;
    performanceDiscount: number;
    referredBy?: { user: { firstName: string; lastName: string } };
    referrals: { id: string }[];
    parents: { parent: { user: { firstName: string; lastName: string } } }[];
  } | null;

  parentProfile?: {
    id: string;
    students: { student: { user: { firstName: string; lastName: string } } }[];
    invoices: { id: string; total: number; status: string; dueDate: string }[];
  } | null;

  teacherProfile?: { id: string; specialization: string } | null;
}

interface UserStats {
  total: number;
  students: number;
  parents: number;
  teachers: number;
  pending?: number; // Optional if you want to track pending here
}

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Check, Trash2, Shield, ShieldOff, MoreHorizontal, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, students: 0, parents: 0, teachers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'parents' | 'teachers'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  async function fetchRoles() {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles);
      }
    } catch (e) { }
  }


  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return; // Should be set by state

    try {
      const response = await fetch(`/api/admin/users/${userToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userToDelete));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    try {
      const newStatus = !currentStatus;
      // We are sending `approve: newStatus`.
      // If newStatus is true (Approve), API approves.
      // If newStatus is false (Deactivate), API logic (which we updated):
      // if approve is false, and no explicit 'reject' action, it deactivates.
      const response = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approve: newStatus }),
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isApproved: newStatus } : u));
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    } finally {
      setTogglingId(null);
    }
  };

  // Filtering Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'students') return user.roles.some(r => r.role.name.toLowerCase() === 'student');
    if (activeTab === 'parents') return user.roles.some(r => r.role.name.toLowerCase() === 'parent');
    if (activeTab === 'teachers') return user.roles.some(r => r.role.name.toLowerCase() === 'teacher');

    return true; // 'all'
  });

  const toggleSelection = (userId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkAction = async (action: 'delete' | 'add_role' | 'remove_role', data?: any) => {
    if (selectedIds.size === 0) return;
    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedIds.size} users?`)) return;

    setIsBulkSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedIds),
          action,
          data
        })
      });

      if (res.ok) {
        // Refresh
        fetchUsers();
        setSelectedIds(new Set());
        alert('Bulk action completed successfully');
      } else {
        const err = await res.json();
        alert(err.error || 'Bulk action failed');
      }
    } catch (e) {
      alert('Bulk action failed');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">CRM & Users</h1>
        <Link href="/admin/users/new">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Create New User
          </Button>
        </Link>
      </div>

      {/* Stats Cards - Click to switch tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className={`cursor-pointer transition-all ${activeTab === 'all' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
          onClick={() => setActiveTab('all')}
        >
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${activeTab === 'students' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
          onClick={() => setActiveTab('students')}
        >
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{stats.students}</p>
            <p className="text-sm text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${activeTab === 'parents' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
          onClick={() => setActiveTab('parents')}
        >
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.parents}</p>
            <p className="text-sm text-muted-foreground">Parents</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${activeTab === 'teachers' ? 'ring-2 ring-primary shadow-md' : 'hover:bg-muted/50'}`}
          onClick={() => setActiveTab('teachers')}
        >
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.teachers}</p>
            <p className="text-sm text-muted-foreground">Teachers</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <Search className="text-muted-foreground w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 outline-none text-sm bg-transparent text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-medium text-foreground flex items-center whitespace-nowrap">
            <div className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2 font-bold">
              {selectedIds.size}
            </div>
            Selected
          </span>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            {/* Add Role */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-full" title="Add Role">
                  <Shield className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="center">
                <DropdownMenuLabel>Add Role</DropdownMenuLabel>
                {roles.map(role => (
                  <DropdownMenuItem key={`add-${role.id}`} onClick={() => handleBulkAction('add_role', { roleName: role.name })}>
                    {role.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Remove Role */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full" title="Remove Role">
                  <ShieldOff className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="center">
                <DropdownMenuLabel>Remove Role</DropdownMenuLabel>
                {roles.map(role => (
                  <DropdownMenuItem key={`remove-${role.id}`} onClick={() => handleBulkAction('remove_role', { roleName: role.name })}>
                    {role.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete */}
            {(() => {
              const selectedUsersList = users.filter(u => selectedIds.has(u.id));
              const activeCount = selectedUsersList.filter(u => u.isApproved).length;
              const isDisabled = activeCount > 0;

              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full ${isDisabled ? 'text-gray-300 hover:text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`}
                  title={isDisabled ? `Cannot delete ${activeCount} active users` : "Delete Selected"}
                  onClick={() => {
                    if (isDisabled) {
                      alert(`Cannot delete ${activeCount} active users. Please deactivate them first.`);
                      return;
                    }
                    if (confirm(`Are you sure you want to delete ${selectedIds.size} users? This action cannot be undone.`)) {
                      handleBulkAction('delete');
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              );
            })()}
          </div>

          <div className="h-6 w-px bg-gray-200" />

          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-gray-500 hover:text-gray-700 h-8 px-2 rounded-full">
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {/* TABS CONTENT */}

          {/* --- STUDENTS TAB --- */}
          {activeTab === 'students' && (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input type="checkbox"
                      checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Parent(s)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Referrals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Discount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelection(user.id)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3">
                          {user.firstName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.studentProfile?.parents.map(p => (
                        <div key={p.parent.user.firstName} className="text-sm text-muted-foreground">
                          {p.parent.user.firstName} {p.parent.user.lastName}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {user.studentProfile?.referrals.length || 0} Students
                      </div>
                      {user.studentProfile?.referredBy && (
                        <div className="text-xs text-muted-foreground/80">
                          Referred by: {user.studentProfile.referredBy.user.firstName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isApproved}
                          onCheckedChange={() => handleStatusToggle(user.id, user.isApproved)}
                          disabled={togglingId === user.id}
                        />
                        <span className={`text-xs font-medium ${user.isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                          {user.isApproved ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">
                          {/* Calculate total discount: 5% per referral (cap 20%) + Performance */}
                          {Math.min((user.studentProfile?.referrals.length || 0) * 5, 20) + (user.studentProfile?.performanceDiscount || 0)}%
                        </span>
                        {/* TODO: Add Edit Dialog for Performance Discount */}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* --- PARENTS TAB --- */}
          {activeTab === 'parents' && (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input type="checkbox"
                      checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Children</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Payment Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredUsers.map(user => {
                  const overdueInvoices = user.parentProfile?.invoices.filter(i => {
                    // Simple check for now, can improve
                    return i.status !== 'paid' && new Date(i.dueDate) < new Date();
                  }) || [];

                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelection(user.id)}
                          className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold mr-3">
                            {user.firstName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.parentProfile?.students.map(s => (
                          <span key={s.student.user.firstName} className="inline-block bg-muted/50 rounded-full px-2 py-1 text-xs text-muted-foreground mr-2 mb-1">
                            {s.student.user.firstName} {s.student.user.lastName}
                          </span>
                        ))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isApproved}
                            onCheckedChange={() => handleStatusToggle(user.id, user.isApproved)}
                            disabled={togglingId === user.id}
                          />
                          <span className={`text-xs font-medium ${user.isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                            {user.isApproved ? 'Active' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {overdueInvoices.length > 0 ? (
                          <div className="flex items-center text-red-600 gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{overdueInvoices.length} Overdue</span>
                          </div>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Up to date</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* --- ALL / TEACHERS TAB --- */}
          {(activeTab === 'all' || activeTab === 'teachers') && (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input type="checkbox"
                      checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelection(user.id)}
                          className="rounded border-input text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role.role.id}
                              className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary"
                            >
                              {role.role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isApproved}
                            onCheckedChange={() => handleStatusToggle(user.id, user.isApproved)}
                            disabled={togglingId === user.id}
                          />
                          <span className={`text-xs font-medium ${user.isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                            {user.isApproved ? 'Active' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setUserToDelete(user.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and will remove all associated profiles and data."
        confirmText="Delete User"
        variant="danger"
      />
    </div>
  );
}

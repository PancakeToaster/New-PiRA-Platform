'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

// Mock data for roles
const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system access and control',
    userCount: 2,
    permissions: ['all'],
  },
  {
    id: '2',
    name: 'Teacher',
    description: 'Can manage courses, assignments, and student progress',
    userCount: 5,
    permissions: ['course.read', 'course.write', 'assignment.read', 'assignment.write', 'student.read'],
  },
  {
    id: '3',
    name: 'Student',
    description: 'Can access courses and submit assignments',
    userCount: 45,
    permissions: ['course.read', 'assignment.read', 'assignment.submit', 'progress.read'],
  },
  {
    id: '4',
    name: 'Parent',
    description: 'Can view student progress and manage billing',
    userCount: 32,
    permissions: ['student.read', 'invoice.read', 'invoice.pay'],
  },
  {
    id: '5',
    name: 'Public',
    description: 'Basic public access to informational pages',
    userCount: 0,
    permissions: ['page.read', 'blog.read', 'course.browse'],
  },
];

export default function AdminRolesPage() {
  const [roles] = useState<Role[]>(mockRoles);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
        <Button>
          Create New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{roles.length}</p>
              <p className="text-sm text-gray-500">Total Roles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-sky-500">
                {roles.reduce((sum, role) => sum + role.userCount, 0)}
              </p>
              <p className="text-sm text-gray-500">Users with Roles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">36</p>
              <p className="text-sm text-gray-500">Total Permissions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                </div>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                  {role.userCount} users
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions[0] === 'all' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        All Permissions
                      </span>
                    ) : (
                      role.permissions.slice(0, 5).map((permission, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                        >
                          {permission}
                        </span>
                      ))
                    )}
                    {role.permissions.length > 5 && role.permissions[0] !== 'all' && (
                      <span className="px-2 py-1 text-xs font-medium text-gray-500">
                        +{role.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 pt-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit Permissions
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Users
                  </Button>
                  {role.name !== 'Admin' && role.name !== 'Public' && (
                    <Button variant="danger" size="sm">
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Content Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• page.read, page.write, page.delete</li>
                <li>• blog.read, blog.write, blog.delete</li>
                <li>• course.read, course.write, course.delete</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">User Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• user.read, user.write, user.delete</li>
                <li>• role.read, role.write, role.delete</li>
                <li>• permission.read, permission.write</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Learning Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• assignment.read, assignment.write</li>
                <li>• knowledge.read, knowledge.write</li>
                <li>• progress.read, progress.write</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Financial</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• invoice.read, invoice.write</li>
                <li>• invoice.pay, invoice.delete</li>
                <li>• payment.read, payment.process</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Analytics</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• analytics.read, analytics.export</li>
                <li>• metrics.read, metrics.write</li>
                <li>• report.read, report.generate</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">System</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• settings.read, settings.write</li>
                <li>• system.read, system.write</li>
                <li>• log.read, log.export</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

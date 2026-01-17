'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';

interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
  portalUrl: string;
}

const testUsers: TestUser[] = [
  {
    id: 'test-parent',
    name: 'Test Parent',
    email: 'parent@test.com',
    role: 'Parent',
    portalUrl: '/parent',
  },
  {
    id: 'test-student',
    name: 'Test Student',
    email: 'student@test.com',
    role: 'Student',
    portalUrl: '/lms',
  },
  {
    id: 'test-teacher',
    name: 'Test Teacher',
    email: 'teacher@test.com',
    role: 'Teacher',
    portalUrl: '/lms',
  },
];

export default function TestUserSelector() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();

  const enterTestMode = async (user: TestUser) => {
    setIsLoading(user.id);
    try {
      const response = await fetch('/api/admin/test-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, roleName: user.role }),
      });

      if (response.ok) {
        router.push(user.portalUrl);
        router.refresh();
      } else {
        console.error('Failed to enter test mode');
      }
    } catch (error) {
      console.error('Error entering test mode:', error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-sky-200">
      <h3 className="text-xl font-bold mb-2 text-gray-900">Test Mode</h3>
      <p className="text-sm text-gray-600 mb-4">
        Preview different portal views without logging in as another user
      </p>
      <div className="space-y-2">
        {testUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => enterTestMode(user)}
            disabled={isLoading === user.id}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-sky-500" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full">
              {user.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

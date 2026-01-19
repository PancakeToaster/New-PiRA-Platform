'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ChevronDown, Check, Loader2, FlaskConical } from 'lucide-react';

interface TestRole {
  name: string;
  description: string;
  portal: string;
}

export default function TestUserSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<TestRole[]>([]);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch available roles on mount
  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch('/api/admin/test-mode');
        if (response.ok) {
          const data = await response.json();
          setAvailableRoles(data.availableRoles);
          setSelectedRole(data.currentTestRole);
        }
      } catch (error) {
        console.error('Failed to fetch test roles:', error);
      }
    }
    fetchRoles();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const enterTestMode = async (role: TestRole) => {
    setLoadingRole(role.name);
    try {
      const response = await fetch('/api/admin/test-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: role.name }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedRole(role.name);
        setIsOpen(false);
        router.push(data.portal);
        router.refresh();
      } else {
        console.error('Failed to enter test mode');
      }
    } catch (error) {
      console.error('Error entering test mode:', error);
    } finally {
      setLoadingRole(null);
    }
  };

  const exitTestMode = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/admin/test-mode', { method: 'DELETE' });
      setSelectedRole(null);
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('Failed to exit test mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get role badge color based on role type
  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Parent':
        return 'bg-purple-100 text-purple-700';
      case 'Student':
        return 'bg-green-100 text-green-700';
      case 'Teacher':
        return 'bg-blue-100 text-blue-700';
      case 'Mentor':
        return 'bg-orange-100 text-orange-700';
      case 'Team Captain':
        return 'bg-yellow-100 text-yellow-700';
      case 'Team Member':
        return 'bg-sky-100 text-sky-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-sky-200">
      <div className="flex items-center space-x-2 mb-2">
        <FlaskConical className="w-5 h-5 text-sky-500" />
        <h3 className="text-xl font-bold text-gray-900">Test Mode</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Preview the platform as different user roles. Your permissions will be temporarily changed to match the selected role.
      </p>

      {/* Dropdown Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-lg transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-sky-500" />
            <span className="font-medium text-gray-900">
              {selectedRole || 'Select a role to test...'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {selectedRole && (
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedRole)}`}>
                Active
              </span>
            )}
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {availableRoles.map((role) => (
                <button
                  key={role.name}
                  onClick={() => enterTestMode(role)}
                  disabled={loadingRole === role.name}
                  className={`w-full flex items-center justify-between p-3 hover:bg-sky-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedRole === role.name ? 'bg-sky-50' : ''
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{role.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(role.name)}`}>
                        {role.portal}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                  </div>
                  <div className="flex items-center ml-3">
                    {loadingRole === role.name ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                    ) : selectedRole === role.name ? (
                      <Check className="w-4 h-4 text-sky-500" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exit Test Mode Button */}
      {selectedRole && (
        <button
          onClick={exitTestMode}
          disabled={isLoading}
          className="w-full mt-3 flex items-center justify-center p-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Exit Test Mode
        </button>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-sky-50 rounded-lg">
        <p className="text-xs text-sky-700">
          <strong>How it works:</strong> When you enter test mode, your permissions are temporarily overridden to match the selected role. You'll see exactly what that user type can access. Click "Exit Test Mode" to return to your admin view.
        </p>
      </div>
    </div>
  );
}

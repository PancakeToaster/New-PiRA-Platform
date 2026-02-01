'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ChevronDown, Check, Loader2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
      setIsOpen(false);
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('Failed to exit test mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Parent': return 'bg-purple-500/10 text-purple-600';
      case 'Student': return 'bg-green-500/10 text-green-600';
      case 'Teacher': return 'bg-blue-500/10 text-blue-600';
      case 'Mentor': return 'bg-orange-500/10 text-orange-600';
      case 'Team Captain': return 'bg-yellow-500/10 text-yellow-600';
      case 'Team Member': return 'bg-sky-500/10 text-sky-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        // If selectedRole is active, the className handles the styling.
        className={`bg-card hover:bg-accent text-foreground border-border ${selectedRole ? 'border-primary text-primary bg-primary/10' : ''}`}
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        title="Test Mode"
      >
        <FlaskConical className={`w-4 h-4 mr-2 ${selectedRole ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="text-sm font-medium">
          {selectedRole ? `Test: ${selectedRole}` : 'Test Mode'}
        </span>
        <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card rounded-lg shadow-xl border border-border z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-border bg-muted rounded-t-lg">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              Select Role to Simulate
            </h4>
          </div>

          <div className="max-h-[300px] overflow-y-auto py-1">
            {availableRoles.map((role) => (
              <button
                key={role.name}
                onClick={() => enterTestMode(role)}
                disabled={loadingRole === role.name}
                className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-start justify-between group ${selectedRole === role.name ? 'bg-primary/10' : ''
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{role.name}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${getRoleBadgeColor(role.name)}`}>
                      {role.portal}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{role.description}</p>
                </div>
                {loadingRole === role.name ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0 mt-1" />
                ) : selectedRole === role.name && (
                  <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                )}
              </button>
            ))}
          </div>

          {selectedRole && (
            <div className="p-2 border-t border-border bg-muted rounded-b-lg">
              <button
                onClick={exitTestMode}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                Exit Test Mode
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

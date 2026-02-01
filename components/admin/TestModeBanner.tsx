'use client';

import { X, FlaskConical, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface TestRole {
  name: string;
  description: string;
  portal: string;
}

interface TestModeBannerProps {
  roleName: string;
}

export default function TestModeBanner({ roleName }: TestModeBannerProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<TestRole[]>([]);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Fetch available roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch('/api/admin/test-mode');
        if (response.ok) {
          const data = await response.json();
          setAvailableRoles(data.availableRoles);
        }
      } catch (error) {
        console.error('Failed to fetch test roles:', error);
      }
    }
    fetchRoles();
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exitTestMode = async () => {
    setIsExiting(true);
    try {
      const response = await fetch('/api/admin/test-mode', { method: 'DELETE' });
      if (response.ok) {
        window.location.href = '/admin';
      } else {
        console.error('Failed to exit test mode:', await response.text());
        setIsExiting(false);
      }
    } catch (error) {
      console.error('Failed to exit test mode:', error);
      setIsExiting(false);
    }
  };

  const switchRole = async (role: TestRole) => {
    setSwitchingTo(role.name);
    try {
      const response = await fetch('/api/admin/test-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: role.name }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsExpanded(false);
        window.location.href = data.portal;
      } else {
        console.error('Failed to switch role:', await response.text());
        setSwitchingTo(null);
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
      setSwitchingTo(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Parent':
        return 'bg-purple-500';
      case 'Student':
        return 'bg-green-500';
      case 'Teacher':
        return 'bg-blue-500';
      case 'Mentor':
        return 'bg-orange-500';
      case 'Team Captain':
        return 'bg-yellow-600';
      case 'Team Member':
        return 'bg-sky-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      ref={popupRef}
      className="fixed bottom-4 right-4 z-[100]"
    >
      {/* Collapsed State - Small Pill */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2 bg-card border border-yellow-400 shadow-lg rounded-full px-4 py-2 hover:shadow-xl transition-shadow"
        >
          <FlaskConical className="w-4 h-4 text-yellow-600" />
          <span className="font-semibold text-foreground text-sm">TEST:</span>
          <span className={`px-2 py-0.5 rounded text-white text-xs ${getRoleBadgeColor(roleName)}`}>
            {roleName}
          </span>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Expanded State - Full Popup Card */}
      {isExpanded && (
        <div className="bg-card rounded-lg shadow-2xl border border-border overflow-hidden w-72">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-4 h-4 text-gray-900" />
              <span className="font-bold text-gray-900 text-sm">TEST MODE</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Current Role */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground mb-1">Viewing as:</p>
            <span className={`px-3 py-1 rounded text-white text-sm font-medium ${getRoleBadgeColor(roleName)}`}>
              {roleName}
            </span>
          </div>

          {/* Role List */}
          <div className="max-h-48 overflow-y-auto">
            {availableRoles.map((role) => (
              <button
                key={role.name}
                onClick={() => switchRole(role)}
                disabled={switchingTo === role.name || role.name === roleName}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0 ${role.name === roleName ? 'bg-primary/10' : ''
                  } ${switchingTo === role.name ? 'opacity-50' : ''}`}
              >
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground text-sm">{role.name}</span>
                    {role.name === roleName && (
                      <span className="text-xs text-primary">(Current)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
                {switchingTo === role.name && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            ))}
          </div>

          {/* Footer - Exit Button */}
          <div className="px-4 py-3 bg-muted border-t border-border">
            <button
              onClick={exitTestMode}
              disabled={isExiting}
              className="w-full flex items-center justify-center space-x-2 bg-foreground text-yellow-400 px-4 py-2 rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 font-semibold text-sm"
            >
              <X className="w-4 h-4" />
              <span>{isExiting ? 'Exiting...' : 'Exit Test Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useState } from 'react';

interface TestModeBannerProps {
  roleName: string;
}

export default function TestModeBanner({ roleName }: TestModeBannerProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const exitTestMode = async () => {
    setIsExiting(true);
    try {
      await fetch('/api/admin/test-mode', { method: 'DELETE' });
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('Failed to exit test mode:', error);
      setIsExiting(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-gray-900 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-900 text-yellow-500 px-3 py-1 rounded-md font-bold text-sm">
            TEST MODE
          </div>
          <span className="font-semibold">
            Previewing as: <span className="font-bold">{roleName}</span>
          </span>
        </div>
        <button
          onClick={exitTestMode}
          disabled={isExiting}
          className="flex items-center space-x-2 bg-gray-900 text-yellow-500 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          <span className="font-semibold">{isExiting ? 'Exiting...' : 'Exit Test Mode'}</span>
        </button>
      </div>
    </div>
  );
}

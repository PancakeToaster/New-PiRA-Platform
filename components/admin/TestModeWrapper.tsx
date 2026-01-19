'use client';

import { useEffect, useState } from 'react';
import TestModeBanner from './TestModeBanner';

export default function TestModeWrapper() {
  const [testRole, setTestRole] = useState<string | null>(null);

  useEffect(() => {
    // Check for test mode cookie
    function getTestModeCookie() {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'test-mode-role') {
          return decodeURIComponent(value);
        }
      }
      return null;
    }

    setTestRole(getTestModeCookie());

    // Listen for cookie changes (poll every second since there's no native cookie change event)
    const interval = setInterval(() => {
      const currentRole = getTestModeCookie();
      if (currentRole !== testRole) {
        setTestRole(currentRole);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [testRole]);

  if (!testRole) {
    return null;
  }

  return <TestModeBanner roleName={testRole} />;
}

import 'server-only';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { cookies } from 'next/headers';

// Re-export client utilities for backwards compatibility
export { clientHasPermission, clientHasRole } from './permissions-client';
export type { Permission } from './permissions-client';
import type { Permission } from './permissions-client';

import { TEST_ROLE_CONFIGS } from './test-roles';
export { TEST_ROLE_CONFIGS };

// Get test mode info from cookies
async function getTestModeInfo(): Promise<{ isTestMode: boolean; testRole: string | null; originalUserId: string | null }> {
  try {
    const cookieStore = await cookies();
    const testRole = cookieStore.get('test-mode-role')?.value || null;
    const originalUserId = cookieStore.get('test-mode-original-user')?.value || null;
    return {
      isTestMode: !!testRole,
      testRole,
      originalUserId,
    };
  } catch {
    return { isTestMode: false, testRole: null, originalUserId: null };
  }
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const testModeInfo = await getTestModeInfo();

  // If in test mode, return a modified user with test role permissions
  if (testModeInfo.isTestMode && testModeInfo.testRole && session?.user) {
    const testConfig = TEST_ROLE_CONFIGS[testModeInfo.testRole];
    if (testConfig) {
      return {
        ...session.user,
        // Override roles and permissions with test role config
        roles: testConfig.roles,
        permissions: testConfig.permissions,
        // Mark as test mode for UI purposes
        isTestMode: true,
        testRole: testModeInfo.testRole,
        // Keep original admin status for exit capability
        originalRoles: session.user.roles,
      };
    }
  }

  return session?.user;
}

export async function hasPermission(resource: string, action: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Admins have all permissions
  if (user.roles?.includes('Admin')) {
    return true;
  }

  // Check if user has specific permission
  return user.permissions?.some(
    (p) => p.resource === resource && p.action === action
  ) ?? false;
}

export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Admins have all permissions
  if (user.roles?.includes('Admin')) {
    return true;
  }

  // Check if user has any of the specified permissions
  return permissions.some((perm) =>
    user.permissions?.some(
      (p) => p.resource === perm.resource && p.action === perm.action
    )
  ) ?? false;
}

export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Admins have all permissions
  if (user.roles?.includes('Admin')) {
    return true;
  }

  // Check if user has all specified permissions
  return permissions.every((perm) =>
    user.permissions?.some(
      (p) => p.resource === perm.resource && p.action === perm.action
    )
  ) ?? false;
}

export async function hasRole(roleName: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.roles?.includes(roleName) ?? false;
}

export async function isAdmin(): Promise<boolean> {
  return hasRole('Admin');
}

export async function isTeacher(): Promise<boolean> {
  return hasRole('Teacher');
}

export async function isStudent(): Promise<boolean> {
  return hasRole('Student');
}

export async function isParent(): Promise<boolean> {
  return hasRole('Parent');
}

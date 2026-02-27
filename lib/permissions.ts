import 'server-only';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { cookies } from 'next/headers';

// Re-export client utilities for backwards compatibility
export { clientHasPermission, clientHasRole } from './permissions-client';
export type { Permission } from './permissions-client';
import type { Permission } from './permissions-client';

import { TEST_ROLE_CONFIGS } from './test-roles';
export { TEST_ROLE_CONFIGS };

/**
 * Role-based defaults for wiki (knowledge base) permissions.
 * These apply automatically based on user role — no per-user DB grants needed.
 *
 * Permissions:
 *   Admin    → all knowledge actions
 *   Teacher  → create, edit, comment, suggest
 *   Student  → suggest only (view is handled by query-level isPublished filter)
 *   Parent   → no write access (view-only)
 */
const WIKI_ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: [
    'knowledge:read',
    'knowledge:create',
    'knowledge:edit',
    'knowledge:delete',
    'knowledge:publish',
    'knowledge:comment',
    'knowledge:suggest',
    'knowledge:review_suggestion',
    'knowledge:manage_folder',
  ],
  Teacher: [
    'knowledge:read',
    'knowledge:create',
    'knowledge:edit',
    'knowledge:comment',
    'knowledge:suggest',
  ],
  Student: [
    'knowledge:read',
    'knowledge:suggest',
  ],
  Parent: [
    'knowledge:read',
  ],
};

/**
 * Check if a user's roles grant them a wiki permission via the role-based defaults.
 */
function hasWikiRolePermission(roles: string[] | undefined, resource: string, action: string): boolean {
  if (!roles) return false;
  const key = `${resource}:${action}`;
  return roles.some((role) => WIKI_ROLE_PERMISSIONS[role]?.includes(key));
}

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

  // Check role-based defaults first (covers wiki and future resource types)
  if (hasWikiRolePermission(user.roles, resource, action)) {
    return true;
  }

  // Fall back to explicit per-user DB permission grants
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

  // Check role-based defaults
  if (permissions.some((perm) => hasWikiRolePermission(user.roles, perm.resource, perm.action))) {
    return true;
  }

  // Fall back to explicit per-user DB permission grants
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

  // Check if user has all specified permissions (role-based or explicit grants)
  return permissions.every(
    (perm) =>
      hasWikiRolePermission(user.roles, perm.resource, perm.action) ||
      (user.permissions?.some(
        (p) => p.resource === perm.resource && p.action === perm.action
      ) ?? false)
  );
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

/**
 * Require admin access for an API route.
 * Returns the current user if they are an admin, otherwise returns a 401 response.
 */
export async function requireAdmin(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { error: Response }
> {
  const user = await getCurrentUser();
  if (!user || !user.roles?.includes('Admin')) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user };
}

/**
 * Require authentication for an API route.
 * Returns the current user if authenticated, otherwise returns a 401 response.
 */
export async function requireAuth(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { error: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user };
}

/**
 * Require a specific wiki permission for an API route.
 * Returns the current user if they have the permission, otherwise returns a 401/403 response.
 *
 * Usage:
 *   const result = await requireWikiPermission('edit');
 *   if ('error' in result) return result.error;
 *   const { user } = result;
 */
export async function requireWikiPermission(
  action: string
): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { error: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const allowed = await hasPermission('knowledge', action);
  if (!allowed) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { user };
}

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export interface Permission {
  resource: string;
  action: string;
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
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

// Client-side permission checking utilities
export function clientHasPermission(
  user: any,
  resource: string,
  action: string
): boolean {
  if (!user) return false;
  if (user.roles?.includes('Admin')) return true;

  return user.permissions?.some(
    (p: Permission) => p.resource === resource && p.action === action
  ) ?? false;
}

export function clientHasRole(user: any, roleName: string): boolean {
  return user?.roles?.includes(roleName) ?? false;
}

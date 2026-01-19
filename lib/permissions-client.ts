// Client-safe permission utilities - no server-only imports

export interface Permission {
  resource: string;
  action: string;
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

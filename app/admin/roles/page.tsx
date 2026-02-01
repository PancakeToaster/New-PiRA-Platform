import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function AdminRolesPage() {
  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { users: true, permissions: true },
      },
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  const totalUsers = await prisma.user.count();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
        <Button>
          Create New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{roles.length}</p>
              <p className="text-sm text-muted-foreground">Total Roles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                {totalUsers}
              </p>
              <p className="text-sm text-muted-foreground">Users with Roles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {roles.reduce((sum, role) => sum + role._count.permissions, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Permissions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{role.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                </div>
                <span className="px-3xl font-medium rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {role._count.users} users
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {role._count.permissions === 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground">
                        No permissions assigned
                      </span>
                    ) : role.permissions.length > 0 ? (
                      <>
                        {role.permissions.slice(0, 5).map((rp) => (
                          <span
                            key={rp.id}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-muted text-foreground"
                          >
                            {rp.permission.resource}:{rp.permission.action}
                          </span>
                        ))}
                        {role.permissions.length > 5 && (
                          <span className="px-2 py-1 text-xs font-medium text-muted-foreground">
                            +{role.permissions.length - 5} more
                          </span>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex space-x-2 pt-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit Permissions
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Users
                  </Button>
                  {!role.isSystem && (
                    <Button variant="danger" size="sm">
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg border-border">
              <h3 className="font-medium text-foreground mb-2">Content Management</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• page.view, page.edit</li>
                <li>• blog.view, blog.create, blog.edit</li>
                <li>• course.view, course.manage</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg border-border">
              <h3 className="font-medium text-foreground mb-2">User Management</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• user.view_all, user.create</li>
                <li>• user.edit, user.delete</li>
                <li>• role.manage</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg border-border">
              <h3 className="font-medium text-foreground mb-2">Learning Management</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• knowledge.view, knowledge.create</li>
                <li>• assignment.view_all, assignment.create</li>
                <li>• assignment.grade, progress.view_all</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg border-border">
              <h3 className="font-medium text-foreground mb-2">Financial</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• invoice.view_all, invoice.create</li>
                <li>• invoice.edit, invoice.delete</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg border-border">
              <h3 className="font-medium text-foreground mb-2">Analytics</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• analytics.view</li>
                <li>• system.monitor, system.manage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

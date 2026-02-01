import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Megaphone, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminAnnouncementsPage() {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes('Admin')) {
        redirect('/');
    }

    const announcements = await prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            author: true
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
                    <p className="text-muted-foreground">Manage system-wide and targeted notifications.</p>
                </div>
                <Link href="/admin/announcements/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Announcement
                    </Button>
                </Link>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left text-muted-foreground">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Title</th>
                                    <th className="px-6 py-3 font-medium">Type</th>
                                    <th className="px-6 py-3 font-medium">Author</th>
                                    <th className="px-6 py-3 font-medium">Date</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            No announcements found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    announcements.map((announcement) => (
                                        <tr key={announcement.id} className="bg-card border-b border-border hover:bg-muted/50">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {announcement.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${announcement.type === 'system' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                                    announcement.type === 'course' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' :
                                                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                    }`}>
                                                    {announcement.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {announcement.author.firstName} {announcement.author.lastName}
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {announcement.isActive ? (
                                                    <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                                                ) : (
                                                    <span className="text-muted-foreground">Archived</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

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
                    <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
                    <p className="text-gray-600">Manage system-wide and targeted notifications.</p>
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
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Title</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Author</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No announcements found. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    announcements.map((announcement) => (
                                        <tr key={announcement.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {announcement.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${announcement.type === 'system' ? 'bg-rose-100 text-rose-800' :
                                                    announcement.type === 'course' ? 'bg-sky-100 text-sky-800' :
                                                        'bg-amber-100 text-amber-800'
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
                                                    <span className="text-green-600 font-medium">Active</span>
                                                ) : (
                                                    <span className="text-gray-400">Archived</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input'; // Assuming these exist
import { Label } from '@/components/ui/Label';
import { Megaphone, Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
// Assuming we have a rich text editor or just use textarea for now
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function CreateAnnouncementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('system');
    const [targetId, setTargetId] = useState('');

    // Minimal Tiptap setup
    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] p-3 border rounded-md',
            },
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !editor) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: editor.getHTML(),
                    type,
                    targetId: type === 'system' ? null : targetId
                }),
            });

            if (!res.ok) throw new Error('Failed to create');

            router.push('/admin/announcements');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Error creating announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link href="/admin/announcements" className="flex items-center text-gray-500 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Announcements
            </Link>

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">New Announcement</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-sky-500" />
                        Announcement Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Platform Maintenance Update"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <select
                                    id="type"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="system">System (All Users)</option>
                                    <option value="course">Course Specific</option>
                                    <option value="team">Team Specific</option>
                                </select>
                            </div>

                            {type !== 'system' && (
                                <div className="space-y-2">
                                    {/* Ideally this is a searchable dropdown of courses/teams */}
                                    <Label htmlFor="targetId">Target ID (Course/Team ID)</Label>
                                    <Input
                                        id="targetId"
                                        value={targetId}
                                        onChange={(e) => setTargetId(e.target.value)}
                                        placeholder={type === 'course' ? 'Enter Course ID' : 'Enter Team ID'}
                                        required
                                    />
                                    <p className="text-xs text-gray-500">
                                        Check the Course/Team URL for ID (e.g. /admin/courses/[id])
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label>Send To</Label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="sendToAll"
                                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">All Users</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="sendToStudents"
                                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Students</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="sendToParents"
                                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Parents</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="sendToTeachers"
                                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Teachers</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Content</Label>
                            <EditorContent editor={editor} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/admin/announcements">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Publish Announcement
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

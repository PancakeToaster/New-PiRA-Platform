'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Loader2, LayoutTemplate, FileText } from 'lucide-react';
import TiptapEditor from '@/components/editor/TiptapEditor';

export default function EditBlogPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        coverImage: '',
        isDraft: true,
        editorType: 'html', // 'html' or 'builder'
        builderData: null,
    });

    useEffect(() => {
        async function fetchPost() {
            try {
                const response = await fetch(`/api/admin/blog/${id}`);
                if (response.ok) {
                    const { post } = await response.json();
                    setFormData({
                        title: post.title || '',
                        slug: post.slug || '',
                        excerpt: post.excerpt || '',
                        content: post.content || '',
                        coverImage: post.coverImage || '',
                        isDraft: post.isDraft,
                        editorType: post.editorType || 'html',
                        builderData: post.builderData ? JSON.parse(post.builderData) : null,
                    });
                } else {
                    setError('Post not found');
                }
            } catch (err) {
                setError('Failed to fetch post');
            } finally {
                setIsFetching(false);
            }
        }
        fetchPost();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/blog/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    builderData: formData.builderData ? JSON.stringify(formData.builderData) : null
                }),
            });

            if (response.ok) {
                // Show success state or redirect
                router.push('/admin/blog');
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update post');
            }
        } catch (err) {
            setError('An error occurred while updating the post');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditorTypeChange = (type: 'html' | 'builder') => {
        if (type === formData.editorType) return;

        if (confirm(`Switching to ${type === 'builder' ? 'Page Builder' : 'Standard Editor'}? Unsaved changes in the current editor might be lost if not converted.`)) {
            setFormData(prev => ({ ...prev, editorType: type }));
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/blog">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
                </div>
                <div className="flex space-x-2">
                    <Link href={`/blog/${formData.slug}?mode=builder`} target="_blank">
                        {formData.editorType === 'builder' && (
                            <Button variant="secondary" size="sm">
                                <LayoutTemplate className="w-4 h-4 mr-2" />
                                Open Page Builder
                            </Button>
                        )}
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                                        placeholder="Post Title"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Excerpt
                                    </label>
                                    <textarea
                                        value={formData.excerpt}
                                        onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900 resize-none"
                                        placeholder="Brief summary for search results and cards..."
                                    />
                                </div>

                                <div className="flex items-center space-x-4 mb-4 border-b border-gray-200 pb-4">
                                    <button
                                        type="button"
                                        onClick={() => handleEditorTypeChange('html')}
                                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${formData.editorType === 'html'
                                            ? 'bg-sky-100 text-sky-700'
                                            : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Standard Editor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleEditorTypeChange('builder')}
                                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${formData.editorType === 'builder'
                                            ? 'bg-sky-100 text-sky-700'
                                            : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        <LayoutTemplate className="w-4 h-4 mr-2" />
                                        Page Builder
                                    </button>
                                </div>

                                {formData.editorType === 'html' ? (
                                    <div>
                                        <TiptapEditor
                                            content={formData.content}
                                            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                            placeholder="Write your post content here..."
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                                        <LayoutTemplate className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900">Page Builder Mode Active</h3>
                                        <p className="text-gray-500 mb-6">
                                            Content is managed via the visual drag-and-drop builder.
                                        </p>
                                        <Link href={`/blog/${formData.slug}?mode=builder`} target="_blank">
                                            <Button type="button">
                                                Launch Page Builder
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Publishing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        URL Slug
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">/blog/{formData.slug}</p>
                                </div>

                                <div className="flex items-center pt-2">
                                    <input
                                        type="checkbox"
                                        id="isDraft"
                                        checked={formData.isDraft}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isDraft: e.target.checked }))}
                                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isDraft" className="ml-2 text-sm text-gray-700">
                                        Save as Draft
                                    </label>
                                </div>

                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Featured Image</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={formData.coverImage}
                                        onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900 text-sm"
                                        placeholder="Image URL"
                                    />
                                    {formData.coverImage && (
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                                            <img
                                                src={formData.coverImage}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}

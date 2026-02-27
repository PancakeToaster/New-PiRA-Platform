'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Loader2, LayoutTemplate, FileText, X } from 'lucide-react';
import TiptapEditor from '@/components/editor/TiptapEditor';

export default function EditBlogPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        coverImage: '',
        isDraft: true,
        editorType: 'html', // 'html' or 'builder'
        builderData: null,
        authorId: '',
        categoryId: '',
        tags: [] as string[],
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [postRes, catsRes, tagsRes, usersRes] = await Promise.all([
                    fetch(`/api/admin/blog/${id}`),
                    fetch('/api/admin/blog/categories'),
                    fetch('/api/admin/blog/tags'),
                    fetch('/api/admin/users') // Assuming this endpoint exists
                ]);

                if (postRes.ok) {
                    const { post } = await postRes.json();
                    setFormData({
                        title: post.title || '',
                        slug: post.slug || '',
                        excerpt: post.excerpt || '',
                        content: post.content || '',
                        coverImage: post.coverImage || '',
                        isDraft: post.isDraft,
                        editorType: post.editorType || 'html',
                        builderData: post.builderData ? JSON.parse(post.builderData) : null,
                        authorId: post.authorId || '',
                        categoryId: post.categoryId || '',
                        tags: post.tags?.map((t: any) => t.id) || [],
                    });
                } else {
                    setError('Post not found');
                }

                if (catsRes.ok) {
                    const data = await catsRes.json();
                    setCategories(data.categories);
                }
                if (tagsRes.ok) {
                    const data = await tagsRes.json();
                    setTags(data.tags);
                }
                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data.users);
                }

            } catch (err) {
                setError('Failed to fetch data');
            } finally {
                setIsFetching(false);
            }
        }
        fetchData();
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
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                    <h1 className="text-3xl font-bold text-foreground">Edit Post</h1>
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
                                    <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                        placeholder="Post Title"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Excerpt
                                    </label>
                                    <textarea
                                        value={formData.excerpt}
                                        onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none"
                                        placeholder="Brief summary for search results and cards..."
                                    />
                                </div>

                                <div className="flex items-center space-x-4 mb-4 border-b border-border pb-4">
                                    <button
                                        type="button"
                                        onClick={() => handleEditorTypeChange('html')}
                                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${formData.editorType === 'html'
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Standard Editor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleEditorTypeChange('builder')}
                                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${formData.editorType === 'builder'
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
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
                                    <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-12 text-center">
                                        <LayoutTemplate className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-foreground">Page Builder Mode Active</h3>
                                        <p className="text-muted-foreground mb-6">
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
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        URL Slug
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">/blog/{formData.slug}</p>
                                </div>

                                <div>
                                    <label htmlFor="categoryId" className="block text-sm font-medium text-foreground mb-1">
                                        Category
                                    </label>
                                    <select
                                        id="categoryId"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="authorId" className="block text-sm font-medium text-foreground mb-1">
                                        Author
                                    </label>
                                    <select
                                        id="authorId"
                                        value={formData.authorId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, authorId: e.target.value }))}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    >
                                        <option value="">Default (Current User)</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.tags?.map(tagId => {
                                            const tag = tags.find(t => t.id === tagId);
                                            return tag ? (
                                                <span key={tag.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                                    {tag.name}
                                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(id => id !== tagId) }))} className="ml-1 text-primary hover:text-primary/80">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value && !formData.tags.includes(e.target.value)) {
                                                setFormData(prev => ({ ...prev, tags: [...prev.tags, e.target.value] }));
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    >
                                        <option value="">Add a tag...</option>
                                        {tags.filter(t => !formData.tags.includes(t.id)).map((tag) => (
                                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center pt-2">
                                    <input
                                        type="checkbox"
                                        id="isDraft"
                                        checked={formData.isDraft}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isDraft: e.target.checked }))}
                                        className="h-4 w-4 text-primary focus:ring-primary border-input rounded bg-background"
                                    />
                                    <label htmlFor="isDraft" className="ml-2 text-sm text-foreground">
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
                                        className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground text-sm"
                                        placeholder="Image URL"
                                    />
                                    {formData.coverImage && (
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
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

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, X, Upload } from 'lucide-react';

interface PortfolioFormProps {
  initialData?: {
    title: string;
    description: string;
    content: string;
    media: string[];
    tags: string[];
    isPublic: boolean;
    projectUrl: string;
  };
  onSubmit: (data: {
    title: string;
    description: string;
    content: string;
    media: string[];
    tags: string[];
    isPublic: boolean;
    projectUrl: string;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function PortfolioForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: PortfolioFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [media, setMedia] = useState<string[]>(initialData?.media || []);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  const [projectUrl, setProjectUrl] = useState(initialData?.projectUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'portfolio');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMedia([...media, data.url]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (url: string) => {
    setMedia(media.filter((m) => m !== url));
  };

  const handleSubmit = async () => {
    await onSubmit({
      title,
      description,
      content,
      media,
      tags,
      isPublic,
      projectUrl,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project title"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Brief description of this project"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          placeholder="Detailed write-up about your project..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
        <input
          type="url"
          value={projectUrl}
          onChange={(e) => setProjectUrl(e.target.value)}
          placeholder="https://github.com/..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Media</label>
        {media.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {media.map((url, i) => (
              <div key={i} className="relative group w-20 h-20">
                <img
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="w-full h-full object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeMedia(url)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:border-sky-400 transition-colors text-sm text-gray-600">
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-sky-50 text-sky-700 rounded-full"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type a tag and press Enter"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
        />
        <label htmlFor="isPublic" className="text-sm text-gray-700">
          Make this item public (visible on your public portfolio)
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Item'
          )}
        </Button>
      </div>
    </div>
  );
}

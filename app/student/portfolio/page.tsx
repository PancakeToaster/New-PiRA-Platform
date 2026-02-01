'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Plus, Loader2, Briefcase, X } from 'lucide-react';
import PortfolioCard from '@/components/portfolio/PortfolioCard';
import PortfolioForm from '@/components/portfolio/PortfolioForm';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  media: string[];
  tags: string[];
  isPublic: boolean;
  projectUrl: string | null;
  createdAt: string;
}

export default function StudentPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/student/portfolio');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (data: {
    title: string;
    description: string;
    content: string;
    media: string[];
    tags: string[];
    isPublic: boolean;
    projectUrl: string;
  }) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/student/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingItem(null);
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: {
    title: string;
    description: string;
    content: string;
    media: string[];
    tags: string[];
    isPublic: boolean;
    projectUrl: string;
  }) => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/student/portfolio/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingItem(null);
        fetchItems();
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    try {
      const res = await fetch(`/api/student/portfolio/${id}`, { method: 'DELETE' });
      if (res.ok) fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Your portfolio is empty.</p>
            <p className="text-sm text-gray-400 mb-4">Showcase your projects, achievements, and skills.</p>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <PortfolioCard
                item={item}
                onClick={() => openEdit(item)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="absolute top-2 left-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <PortfolioForm
                initialData={
                  editingItem
                    ? {
                        title: editingItem.title,
                        description: editingItem.description || '',
                        content: editingItem.content || '',
                        media: editingItem.media,
                        tags: editingItem.tags,
                        isPublic: editingItem.isPublic,
                        projectUrl: editingItem.projectUrl || '',
                      }
                    : undefined
                }
                onSubmit={editingItem ? handleUpdate : handleCreate}
                onCancel={() => setShowModal(false)}
                isSubmitting={isSaving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

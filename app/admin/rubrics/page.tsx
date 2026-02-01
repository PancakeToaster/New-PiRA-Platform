'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Plus, Edit2, Trash2, Loader2, ClipboardList, X } from 'lucide-react';

interface Criterion {
  id?: string;
  title: string;
  description: string;
  maxPoints: number;
}

interface Rubric {
  id: string;
  title: string;
  description: string | null;
  criteria: Criterion[];
  createdBy: { firstName: string; lastName: string };
  _count: { assignments: number };
  createdAt: string;
}

export default function RubricsPage() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([{ title: '', description: '', maxPoints: 10 }]);

  const fetchRubrics = async () => {
    try {
      const res = await fetch('/api/admin/rubrics');
      if (res.ok) {
        const data = await res.json();
        setRubrics(data.rubrics);
      }
    } catch (error) {
      console.error('Failed to fetch rubrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRubrics();
  }, []);

  const openNew = () => {
    setEditingRubric(null);
    setTitle('');
    setDescription('');
    setCriteria([{ title: '', description: '', maxPoints: 10 }]);
    setShowModal(true);
  };

  const openEdit = (rubric: Rubric) => {
    setEditingRubric(rubric);
    setTitle(rubric.title);
    setDescription(rubric.description || '');
    setCriteria(
      rubric.criteria.map((c) => ({
        title: c.title,
        description: c.description || '',
        maxPoints: c.maxPoints,
      }))
    );
    setShowModal(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const validCriteria = criteria.filter((c) => c.title.trim());
      const payload = { title, description: description || null, criteria: validCriteria };

      const url = editingRubric
        ? `/api/admin/rubrics/${editingRubric.id}`
        : '/api/admin/rubrics';

      const res = await fetch(url, {
        method: editingRubric ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchRubrics();
      }
    } catch (error) {
      console.error('Failed to save rubric:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rubric?')) return;
    try {
      const res = await fetch(`/api/admin/rubrics/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRubrics();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const addCriterion = () => {
    setCriteria([...criteria, { title: '', description: '', maxPoints: 10 }]);
  };

  const removeCriterion = (index: number) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const totalMaxPoints = criteria.reduce((sum, c) => sum + (Number(c.maxPoints) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Rubrics</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Rubric
        </Button>
      </div>

      {rubrics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No rubrics created yet.</p>
            <Button onClick={openNew} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Rubric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rubrics.map((rubric) => (
            <Card key={rubric.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{rubric.title}</h3>
                    {rubric.description && (
                      <p className="text-sm text-muted-foreground mt-1">{rubric.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{rubric.criteria.length} criteria</span>
                      <span>
                        Total: {rubric.criteria.reduce((s, c) => s + c.maxPoints, 0)} pts
                      </span>
                      <span>Used in {rubric._count.assignments} assignment{rubric._count.assignments !== 1 ? 's' : ''}</span>
                      <span>By {rubric.createdBy.firstName} {rubric.createdBy.lastName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(rubric)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(rubric.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingRubric ? 'Edit Rubric' : 'Create Rubric'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Project Presentation Rubric"
                    className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Optional description..."
                    className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                {/* Criteria */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">
                      Criteria (Total: {totalMaxPoints} pts)
                    </label>
                    <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {criteria.map((criterion, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                          <input
                            type="text"
                            value={criterion.title}
                            onChange={(e) => updateCriterion(index, 'title', e.target.value)}
                            placeholder="Criterion name"
                            className="flex-1 rounded-md border border-input bg-background text-foreground px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={criterion.maxPoints}
                              onChange={(e) => updateCriterion(index, 'maxPoints', Number(e.target.value))}
                              min={0}
                              className="w-20 rounded-md border border-input bg-background text-foreground px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <span className="text-xs text-muted-foreground">pts</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCriterion(index)}
                            disabled={criteria.length <= 1}
                            className="p-1 text-destructive/80 hover:text-destructive disabled:opacity-30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={criterion.description}
                          onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full rounded-md border border-input bg-background text-foreground px-2 py-1.5 text-sm text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent ml-8"
                          style={{ width: 'calc(100% - 2rem)' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !title.trim() || !criteria.some((c) => c.title.trim())}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingRubric ? 'Update Rubric' : 'Create Rubric'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

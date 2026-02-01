'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Plus, Edit2, Trash2, Loader2, Map, Eye, EyeOff, X, GripVertical } from 'lucide-react';

interface LearningPathStep {
  id: string;
  lmsCourseId: string;
  order: number;
  isRequired: boolean;
  lmsCourse: { id: string; name: string };
}

interface LearningPath {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  steps: LearningPathStep[];
  createdAt: string;
}

interface Course {
  id: string;
  name: string;
}

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState<Array<{ lmsCourseId: string; isRequired: boolean }>>([]);

  const fetchData = async () => {
    try {
      const [pathsRes, coursesRes] = await Promise.all([
        fetch('/api/admin/learning-paths'),
        fetch('/api/admin/courses'),
      ]);

      if (pathsRes.ok) {
        const data = await pathsRes.json();
        setPaths(data.paths);
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNew = () => {
    setEditingPath(null);
    setName('');
    setDescription('');
    setIsPublished(false);
    setSelectedSteps([]);
    setShowModal(true);
  };

  const openEdit = (path: LearningPath) => {
    setEditingPath(path);
    setName(path.name);
    setDescription(path.description || '');
    setIsPublished(path.isPublished);
    setSelectedSteps(
      path.steps.map((s) => ({ lmsCourseId: s.lmsCourseId, isRequired: s.isRequired }))
    );
    setShowModal(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name,
        description: description || null,
        isPublished,
        steps: selectedSteps,
      };

      const url = editingPath
        ? `/api/admin/learning-paths/${editingPath.id}`
        : '/api/admin/learning-paths';

      const res = await fetch(url, {
        method: editingPath ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this learning path?')) return;
    try {
      const res = await fetch(`/api/admin/learning-paths/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const addStep = (courseId: string) => {
    if (selectedSteps.find((s) => s.lmsCourseId === courseId)) return;
    setSelectedSteps([...selectedSteps, { lmsCourseId: courseId, isRequired: true }]);
  };

  const removeStep = (courseId: string) => {
    setSelectedSteps(selectedSteps.filter((s) => s.lmsCourseId !== courseId));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...selectedSteps];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSteps.length) return;
    [newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];
    setSelectedSteps(newSteps);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Learning Paths</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Path
        </Button>
      </div>

      {paths.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Map className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No learning paths created yet.</p>
            <Button onClick={openNew} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Path
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paths.map((path) => (
            <Card key={path.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">{path.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${path.isPublished
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                          }`}
                      >
                        {path.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {path.description && (
                      <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{path.steps.length} course{path.steps.length !== 1 ? 's' : ''}</span>
                      <span>Created: {new Date(path.createdAt).toLocaleDateString()}</span>
                    </div>
                    {path.steps.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {path.steps.map((step, i) => (
                          <span
                            key={step.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                          >
                            {i + 1}. {step.lmsCourse.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(path)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(path.id)}>
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
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingPath ? 'Edit Learning Path' : 'Create Learning Path'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Beginner Robotics Track"
                    className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe this learning path..."
                    className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-primary"
                  />
                  <label htmlFor="isPublished" className="text-sm text-foreground">
                    Published (visible to students)
                  </label>
                </div>

                {/* Steps */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Courses (in order)
                  </label>

                  {selectedSteps.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {selectedSteps.map((step, index) => {
                        const course = courses.find((c) => c.id === step.lmsCourseId);
                        return (
                          <div
                            key={step.lmsCourseId}
                            className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border border-border"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                            <span className="flex-1 text-sm text-foreground">{course?.name || 'Unknown'}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveStep(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                &uarr;
                              </button>
                              <button
                                type="button"
                                onClick={() => moveStep(index, 'down')}
                                disabled={index === selectedSteps.length - 1}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                &darr;
                              </button>
                              <button
                                type="button"
                                onClick={() => removeStep(step.lmsCourseId)}
                                className="p-1 text-destructive/80 hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <select
                    onChange={(e) => {
                      if (e.target.value) addStep(e.target.value);
                      e.target.value = '';
                    }}
                    className="w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Add a course...
                    </option>
                    {courses
                      .filter((c) => !selectedSteps.find((s) => s.lmsCourseId === c.id))
                      .map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingPath ? 'Update Path' : 'Create Path'
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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';

import { Task } from '@/components/projects/KanbanBoard';

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
    onChecklistAdd?: (taskId: string, content: string) => Promise<void>;
    onChecklistUpdate?: (taskId: string, itemId: string, updates: any) => Promise<void>;
    onChecklistDelete?: (taskId: string, itemId: string) => Promise<void>;
    onSubtaskCreate?: (parentId: string, title: string) => Promise<void>;
    onTaskClick?: (taskId: string) => void;
}

export function TaskDetailModal({
    task,
    isOpen,
    onClose,
    onUpdate,
    onChecklistAdd,
    onChecklistUpdate,
    onChecklistDelete,
    onSubtaskCreate,
    onTaskClick
}: TaskDetailModalProps) {
    const [formData, setFormData] = useState<Partial<Task>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [newItemContent, setNewItemContent] = useState('');

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            });
        }
    }, [task]);

    if (!task) return null;

    const handleSave = async () => {
        await onUpdate(task.id, formData);
        setIsEditing(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-card">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        {isEditing ? (
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="font-bold text-xl"
                            />
                        ) : (
                            <span>{task.title}</span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-6 py-4">
                    <div className="col-span-2 space-y-4">
                        <div>
                            <Label>Description</Label>
                            {isEditing ? (
                                <Textarea
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                />
                            ) : (
                                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                            )}
                        </div>

                        {/* Parent Task Link */}
                        {task.parent && (
                            <div className="mb-4 p-2 bg-primary/10 text-primary rounded text-sm flex items-center">
                                <span className="font-semibold mr-1">Parent Task:</span>
                                <span>{task.parent.title}</span>
                            </div>
                        )}

                        {/* Subtasks (Real Tasks) */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Subtasks</Label>
                                {(task.checklistItems?.length ?? 0) > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {Math.round(((task.checklistItems?.filter(i => i.isCompleted).length ?? 0) / (task.checklistItems?.length ?? 1)) * 100)}% done
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2 mb-3">
                                {task.checklistItems?.map((item) => (
                                    <div key={item.id} className="flex items-start space-x-3 group">
                                        <input
                                            type="checkbox"
                                            checked={item.isCompleted}
                                            onChange={(e) => {
                                                const newStatus = e.target.checked;
                                                // Optimistic or direct call
                                                if (onChecklistUpdate) onChecklistUpdate(task.id, item.id, { isCompleted: newStatus });
                                            }}
                                            className="mt-1 rounded border-border text-sky-600 focus:ring-sky-500"
                                        />
                                        <span className={`text-sm flex-1 ${item.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                            {item.content}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (onChecklistDelete) onChecklistDelete(task.id, item.id);
                                            }}
                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <AlertCircle className="w-4 h-4 rotate-45" /> {/* Using X icon concept */}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex space-x-2">
                                <Input
                                    value={newItemContent}
                                    onChange={(e) => setNewItemContent(e.target.value)}
                                    placeholder="Add a subtask..."
                                    className="text-sm h-9"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newItemContent.trim()) {
                                            if (onChecklistAdd) {
                                                onChecklistAdd(task.id, newItemContent);
                                                setNewItemContent('');
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!newItemContent.trim()}
                                    onClick={() => {
                                        if (onChecklistAdd) {
                                            onChecklistAdd(task.id, newItemContent);
                                            setNewItemContent('');
                                        }
                                    }}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Start Date</Label>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        value={formData.startDate || ''}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                ) : (
                                    <div className="flex items-center mt-1 text-sm">
                                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Due Date</Label>
                                {isEditing ? (
                                    <Input
                                        type="date"
                                        value={formData.dueDate || ''}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                ) : (
                                    <div className="flex items-center mt-1 text-sm">
                                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                        <div>
                            <Label>Status</Label>
                            <select
                                className="w-full mt-1 p-2 border border-border rounded-md text-sm bg-background text-foreground"
                                value={formData.status}
                                onChange={e => {
                                    setFormData({ ...formData, status: e.target.value });
                                    if (!isEditing) onUpdate(task.id, { status: e.target.value });
                                }}
                                disabled={!isEditing}
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>
                        <div>
                            <Label>Priority</Label>
                            <select
                                className="w-full mt-1 p-2 border border-border rounded-md text-sm bg-background text-foreground"
                                value={formData.priority}
                                onChange={e => {
                                    setFormData({ ...formData, priority: e.target.value });
                                    if (!isEditing) onUpdate(task.id, { priority: e.target.value });
                                }}
                                disabled={!isEditing}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save Changes</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose}>Close</Button>
                            <Button onClick={() => setIsEditing(true)}>Edit</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

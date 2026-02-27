'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader2, Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface GradingSettingsPageProps {
    params: {
        id: string; // Course ID
    };
}

interface GradingScaleItem {
    label: string;
    min: number;
}

export default function GradingSettingsPage({ params }: GradingSettingsPageProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Weights: { "Homework": 0.4, "Exam": 0.6 }
    const [weights, setWeights] = useState<{ category: string; weight: number }[]>([]);

    // Scale: [{ label: 'A', min: 90 }, ...]
    const [scale, setScale] = useState<GradingScaleItem[]>([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/admin/courses/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const course = data.course;

                    // Parse weights
                    const loadedWeights = course.gradingWeights
                        ? Object.entries(course.gradingWeights).map(([k, v]) => ({ category: k, weight: (v as number) * 100 }))
                        : [];
                    setWeights(loadedWeights);

                    // Parse scale
                    const loadedScale = course.gradingScale as GradingScaleItem[] || [
                        { label: 'A', min: 90 },
                        { label: 'B', min: 80 },
                        { label: 'C', min: 70 },
                        { label: 'D', min: 60 },
                        { label: 'F', min: 0 },
                    ];
                    setScale(loadedScale);
                }
            } catch (error) {
                console.error('Failed to fetch course settings', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [params.id]);

    const handleAddWeight = () => {
        setWeights([...weights, { category: '', weight: 0 }]);
    };

    const handleRemoveWeight = (idx: number) => {
        setWeights(weights.filter((_, i) => i !== idx));
    };

    const handleWeightChange = (idx: number, field: 'category' | 'weight', value: string | number) => {
        const newWeights = [...weights];
        if (field === 'category') newWeights[idx].category = value as string;
        else newWeights[idx].weight = Number(value);
        setWeights(newWeights);
    };

    const handleAddScale = () => {
        setScale([...scale, { label: '', min: 0 }]);
    };

    const handleRemoveScale = (idx: number) => {
        setScale(scale.filter((_, i) => i !== idx));
    };

    const handleScaleChange = (idx: number, field: 'label' | 'min', value: string | number) => {
        const newScale = [...scale];
        if (field === 'label') newScale[idx].label = value as string;
        else newScale[idx].min = Number(value);
        setScale(newScale);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Convert weights back to object { category: 0.x }
            const weightsObj: Record<string, number> = {};
            let totalWeight = 0;
            weights.forEach(w => {
                if (w.category) {
                    weightsObj[w.category] = w.weight / 100;
                    totalWeight += w.weight;
                }
            });

            if (weights.length > 0 && Math.abs(totalWeight - 100) > 0.1) {
                alert(`Warning: Total weights sum to ${totalWeight}%, not 100%.`);
                // Check if user wants to proceed? For now just alert and maybe proceed
            }

            const res = await fetch(`/api/admin/lms-courses/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gradingWeights: weightsObj,
                    gradingScale: scale
                })
            });

            if (res.ok) {
                router.refresh();
                // Toast success
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    const totalWeight = weights.reduce((acc, w) => acc + w.weight, 0);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link
                    href={`/admin/courses/${params.id}`}
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Course
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Grading Settings</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grading Weights */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Grade Weights</span>
                            <span className={`text-sm ${Math.abs(totalWeight - 100) < 0.1 ? 'text-green-600' : 'text-red-500'}`}>
                                Total: {totalWeight.toFixed(1)}%
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Define categories and their weight in the final grade.
                        </p>
                        {weights.map((w, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Input
                                    placeholder="Category (e.g. Homework)"
                                    value={w.category}
                                    onChange={(e) => handleWeightChange(idx, 'category', e.target.value)}
                                />
                                <div className="relative w-24">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={w.weight}
                                        onChange={(e) => handleWeightChange(idx, 'weight', e.target.value)}
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveWeight(idx)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddWeight}>
                            <Plus className="w-4 h-4 mr-2" /> Add Category
                        </Button>
                    </CardContent>
                </Card>

                {/* Grading Scale */}
                <Card>
                    <CardHeader>
                        <CardTitle>Grading Scale</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Define letter grades and minimum percentage required.
                        </p>
                        {scale.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Input
                                    placeholder="Letter (e.g. A)"
                                    value={s.label}
                                    onChange={(e) => handleScaleChange(idx, 'label', e.target.value)}
                                    className="w-24"
                                />
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={s.min}
                                        onChange={(e) => handleScaleChange(idx, 'min', e.target.value)}
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground text-xs">% Min</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveScale(idx)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={handleAddScale}>
                            <Plus className="w-4 h-4 mr-2" /> Add Level
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                </Button>
            </div>
        </div>
    );
}

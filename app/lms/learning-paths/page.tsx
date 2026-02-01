'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Map, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PathStep {
  id: string;
  order: number;
  isRequired: boolean;
  lmsCourse: {
    id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
  };
  enrollment: {
    status: string;
    progress: number | null;
  } | null;
}

interface LearningPath {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  steps: PathStep[];
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export default function StudentLearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const res = await fetch('/api/lms/learning-paths');
        if (res.ok) {
          const data = await res.json();
          setPaths(data.paths);
        }
      } catch (error) {
        console.error('Failed to fetch learning paths:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPaths();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div className="text-center py-12">
        <Map className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Learning Paths Available</h2>
        <p className="text-gray-500">Check back later for structured learning paths.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Learning Paths</h1>

      <div className="space-y-8">
        {paths.map((path) => (
          <Card key={path.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{path.name}</h2>
                  {path.description && (
                    <p className="text-gray-600 mt-1">{path.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-sky-600">{path.progress.percentage}%</span>
                  <p className="text-xs text-gray-500">
                    {path.progress.completed}/{path.progress.total} completed
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all"
                  style={{ width: `${path.progress.percentage}%` }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {path.steps.map((step, index) => {
                  const isCompleted = step.enrollment?.status === 'completed';
                  const isActive = step.enrollment?.status === 'active';

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        isCompleted
                          ? 'bg-green-50 border-green-200'
                          : isActive
                          ? 'bg-sky-50 border-sky-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className={`w-6 h-6 ${isActive ? 'text-sky-500' : 'text-gray-300'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">Step {index + 1}</span>
                          {step.isRequired && (
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Required</span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900">{step.lmsCourse.name}</h4>
                        {step.enrollment?.progress !== null && step.enrollment?.progress !== undefined && (
                          <p className="text-sm text-gray-500 mt-1">Progress: {step.enrollment.progress}%</p>
                        )}
                      </div>
                      <Link href={`/lms/courses/${step.lmsCourse.id}`}>
                        <Button variant="outline" size="sm">
                          {isCompleted ? 'Review' : isActive ? 'Continue' : 'Start'}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

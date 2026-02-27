'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle } from 'lucide-react';

interface Criterion {
  id: string;
  title: string;
  description: string | null;
  maxPoints: number;
  order: number;
}

interface RubricScore {
  criterionId: string;
  score: number;
  comment: string;
}

interface RubricGraderProps {
  assignmentId: string;
  submissionId: string;
  criteria: Criterion[];
  existingScores?: Array<{ criterionId: string; score: number; comment: string | null }>;
  onGraded?: (totalScore: number) => void;
}

export default function RubricGrader({
  assignmentId,
  submissionId,
  criteria,
  existingScores,
  onGraded,
}: RubricGraderProps) {
  const [scores, setScores] = useState<RubricScore[]>(
    criteria.map((c) => {
      const existing = existingScores?.find((s) => s.criterionId === c.id);
      return {
        criterionId: c.id,
        score: existing?.score ?? 0,
        comment: existing?.comment ?? '',
      };
    })
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const totalScore = scores.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
  const maxTotal = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

  const updateScore = (criterionId: string, field: 'score' | 'comment', value: string | number) => {
    setScores(
      scores.map((s) =>
        s.criterionId === criterionId ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/assignments/${assignmentId}/rubric-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          scores: scores.map((s) => ({
            criterionId: s.criterionId,
            score: Number(s.score),
            comment: s.comment || null,
          })),
          feedback: feedback || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onGraded?.(data.totalScore);
      }
    } catch (error) {
      console.error('Failed to submit rubric grade:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Rubric Grading</h3>
        <div className="text-lg font-bold text-sky-600">
          {totalScore} / {maxTotal}
        </div>
      </div>

      <div className="space-y-3">
        {criteria.map((criterion) => {
          const score = scores.find((s) => s.criterionId === criterion.id);
          return (
            <div key={criterion.id} className="p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-foreground">{criterion.title}</h4>
                  {criterion.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <input
                    type="number"
                    min={0}
                    max={criterion.maxPoints}
                    value={score?.score ?? 0}
                    onChange={(e) =>
                      updateScore(criterion.id, 'score', Math.min(Number(e.target.value), criterion.maxPoints))
                    }
                    className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                  <span className="text-xs text-muted-foreground">/ {criterion.maxPoints}</span>
                </div>
              </div>
              <input
                type="text"
                value={score?.comment ?? ''}
                onChange={(e) => updateScore(criterion.id, 'comment', e.target.value)}
                placeholder="Comment (optional)"
                className="w-full rounded-md border border-input px-2 py-1 text-xs text-foreground bg-background focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Overall Feedback</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          placeholder="General feedback for the student..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
        />
      </div>

      <Button onClick={handleSubmit} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving Rubric Grade...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Rubric Grade ({totalScore}/{maxTotal})
          </>
        )}
      </Button>
    </div>
  );
}

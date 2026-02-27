"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LessonCompleteButtonProps {
    lessonId: string;
    initialStatus: 'not_started' | 'in_progress' | 'completed';
}

export default function LessonCompleteButton({ lessonId, initialStatus }: LessonCompleteButtonProps) {
    const [status, setStatus] = useState(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const toggleComplete = async () => {
        setIsLoading(true);
        const newStatus = status === 'completed' ? 'in_progress' : 'completed';

        try {
            const res = await fetch('/api/lms/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update progress');

            setStatus(newStatus);
            router.refresh(); // Refresh server components to update progress bars elsewhere
        } catch (error) {
            console.error('Error updating progress:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={toggleComplete}
            disabled={isLoading}
            variant={status === 'completed' ? "primary" : "outline"}
            className="gap-2"
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <CheckCircle className={`w-5 h-5 ${status === 'completed' ? 'fill-current' : ''}`} />
            )}
            {status === 'completed' ? 'Completed' : 'Mark as Complete'}
        </Button>
    );
}

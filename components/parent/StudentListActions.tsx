'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import AddStudentModal from './AddStudentModal';

interface StudentListActionsProps {
    isEmptyState?: boolean;
}

export default function StudentListActions({ isEmptyState }: StudentListActionsProps) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <Button
                onClick={() => setShowModal(true)}
                variant={isEmptyState ? 'primary' : 'outline'}
                className={isEmptyState ? 'bg-sky-600' : ''}
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
            </Button>

            <AddStudentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />
        </>
    );
}

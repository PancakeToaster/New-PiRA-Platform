'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Loader2, AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info' | 'warning';
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Confirmation action failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <div className="p-3 bg-red-100 rounded-full text-red-600 mb-4 inline-block"><AlertTriangle className="w-6 h-6" /></div>;
            case 'warning':
                return <div className="p-3 bg-amber-100 rounded-full text-amber-600 mb-4 inline-block"><AlertTriangle className="w-6 h-6" /></div>;
            case 'info':
            default:
                return <div className="p-3 bg-sky-100 rounded-full text-sky-600 mb-4 inline-block"><Info className="w-6 h-6" /></div>;
        }
    };

    const getConfirmButtonVariant = () => {
        switch (variant) {
            case 'danger': return 'danger';
            case 'warning': return 'outline'; // Fallback or defined warning
            case 'info': return 'primary';
            default: return 'primary';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="text-center">
                {getIcon()}

                <div className="text-gray-600 mb-8">
                    {message}
                </div>

                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="w-full">
                        {cancelText}
                    </Button>
                    <Button
                        variant={getConfirmButtonVariant() as any}
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

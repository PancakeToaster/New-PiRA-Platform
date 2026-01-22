'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Mail, Check, AlertCircle } from 'lucide-react';

interface SendInvoiceEmailButtonProps {
    invoiceId: string;
    parentEmail: string;
}

export default function SendInvoiceEmailButton({ invoiceId, parentEmail }: SendInvoiceEmailButtonProps) {
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSend = async () => {
        if (!confirm(`Send invoice to ${parentEmail}?`)) return;

        setSending(true);
        setStatus('idle');

        try {
            const response = await fetch(`/api/admin/invoices/${invoiceId}/send`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send email');
            }

            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        } finally {
            setSending(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="ghost"
            onClick={handleSend}
            disabled={sending || status === 'success'}
            className={status === 'error' ? 'text-red-500 hover:text-red-600' : ''}
            title={`Send to ${parentEmail}`}
        >
            {sending ? (
                <span className="animate-pulse">Sending...</span>
            ) : status === 'success' ? (
                <Check className="w-4 h-4 text-green-500" />
            ) : status === 'error' ? (
                <AlertCircle className="w-4 h-4" />
            ) : (
                <Mail className="w-4 h-4" />
            )}
        </Button>
    );
}

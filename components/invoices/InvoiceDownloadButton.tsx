'use client';

import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default function InvoiceDownloadButton({ invoice, className }: { invoice: any, className?: string }) {
    if (!invoice?.pdfUrl) {
        return (
            <div className={className}>
                <Button size="sm" variant="outline" disabled className="gap-2">
                    <FileText className="w-4 h-4" />
                    No PDF
                </Button>
            </div>
        );
    }

    return (
        <div className={className}>
            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-2" type="button">
                    <FileText className="w-4 h-4" />
                    Download PDF
                </Button>
            </a>
        </div>
    );
}

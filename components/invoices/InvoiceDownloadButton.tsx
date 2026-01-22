'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF'; // Assuming same directory
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button'; // Assuming you have a UI Button component

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default function InvoiceDownloadButton({ invoice, className }: { invoice: any, className?: string }) {
    // Check if we are checking for SSR issues. @react-pdf/renderer sometimes needs dynamic import or client-only check
    // content inside PDFDownloadLink is the document

    return (
        <div className={className}>
            <PDFDownloadLink
                document={<InvoicePDF invoice={invoice} />}
                fileName={`Invoice_${invoice.invoiceNumber}.pdf`}
                className="inline-flex"
            >
                {/* biome-ignore lint/suspicious/noExplicitAny: <explanation> */}
                {({ blob, url, loading, error }: any) => (
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        className="gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        {loading ? 'Generating...' : 'Download PDF'}
                    </Button>
                )}
            </PDFDownloadLink>
        </div>
    );
}

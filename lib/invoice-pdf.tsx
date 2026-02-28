import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/invoices/InvoicePDF';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function generateAndSaveInvoicePdf(invoiceId: string): Promise<string | null> {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                items: true,
                parent: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (!invoice) {
            console.error('Invoice not found for PDF generation');
            return null;
        }

        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
        let logoBase64 = '';
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }

        const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={invoice as any} logoSrc={logoBase64} />);

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'invoices');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, pdfBuffer);

        const pdfUrl = `/uploads/invoices/${fileName}`;

        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { pdfUrl }
        });

        return pdfUrl;
    } catch (error) {
        console.error('Failed to generate and save invoice PDF:', error);
        return null;
    }
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, CheckCircle, Clock, AlertTriangle, Plus, Loader2, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface RecurringTemplate {
    id: string;
    vendor: string;
    amount: number;
    category: string;
    recurringFrequency: string | null;
    nextRecurringDate: string | null;
    description: string | null;
    project: { name: string } | null;
    incurredBy: { firstName: string; lastName: string } | null;
}

interface Props {
    initialTemplates: RecurringTemplate[];
    dueCount: number;
}

const FREQ_LABEL: Record<string, string> = {
    weekly: 'Every week',
    monthly: 'Every month',
    quarterly: 'Every 3 months',
    yearly: 'Every year',
};

const FREQ_COLOR: Record<string, string> = {
    weekly: 'bg-purple-500/10 text-purple-600',
    monthly: 'bg-sky-500/10 text-sky-600',
    quarterly: 'bg-emerald-500/10 text-emerald-600',
    yearly: 'bg-amber-500/10 text-amber-600',
};

export default function RecurringExpenseClient({ initialTemplates, dueCount: initialDue }: Props) {
    const router = useRouter();
    const [templates, setTemplates] = useState(initialTemplates);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ processed: number; message: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const now = new Date();
    const dueNow = templates.filter(t => t.nextRecurringDate && new Date(t.nextRecurringDate) <= now);
    const upcoming = templates.filter(t => !t.nextRecurringDate || new Date(t.nextRecurringDate) > now);

    async function processRecurring() {
        setIsProcessing(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/admin/expenses/recurring/process', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to process');
            setResult({ processed: data.processed, message: data.message });
            // Refresh page data
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsProcessing(false);
        }
    }

    function isDue(t: RecurringTemplate) {
        return t.nextRecurringDate && new Date(t.nextRecurringDate) <= now;
    }

    function daysUntil(dateStr: string) {
        const diff = new Date(dateStr).getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return (
        <div className="space-y-6">
            {/* Action bar */}
            <Card>
                <CardContent className="pt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Process Due Expenses</h3>
                        <p className="text-sm text-muted-foreground">
                            {dueNow.length > 0
                                ? `${dueNow.length} template${dueNow.length !== 1 ? 's are' : ' is'} past their due date and will be cloned as new pending expenses.`
                                : 'No recurring expenses are due right now. Check back when the next due date arrives.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/finance/expenses/new">
                            <Button variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" />New Recurring Expense
                            </Button>
                        </Link>
                        <Button onClick={processRecurring} disabled={isProcessing || dueNow.length === 0} className="gap-2">
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {isProcessing ? 'Processing...' : `Process ${dueNow.length > 0 ? `(${dueNow.length})` : ''}`}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Result / Error feedback */}
            {result && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{result.message}</span>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600">
                    <AlertTriangle className="w-5 h-5 shrink-0" />{error}
                </div>
            )}

            {/* Due now */}
            {dueNow.length > 0 && (
                <Card className="border-amber-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />Overdue / Due Now ({dueNow.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {dueNow.map(t => <TemplateRow key={t.id} t={t} isDue />)}
                    </CardContent>
                </Card>
            )}

            {/* Upcoming */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-500" />Upcoming ({upcoming.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {upcoming.length === 0 && (
                        <p className="text-center text-muted-foreground py-6 text-sm">
                            No upcoming recurring expenses.{' '}
                            <Link href="/admin/finance/expenses/new" className="text-sky-600 hover:underline">
                                Create one →
                            </Link>
                        </p>
                    )}
                    {upcoming.map(t => (
                        <TemplateRow key={t.id} t={t} isDue={false}
                            daysUntil={t.nextRecurringDate ? daysUntil(t.nextRecurringDate) : null} />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

function TemplateRow({ t, isDue, daysUntil }: { t: RecurringTemplate; isDue: boolean; daysUntil?: number | null }) {
    const freqKey = t.recurringFrequency ?? 'monthly';
    return (
        <div className={`flex items-center gap-4 p-4 rounded-lg border ${isDue ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-muted/20'}`}>
            <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{t.vendor}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLOR[freqKey] ?? 'bg-muted text-muted-foreground'}`}>
                        {FREQ_LABEL[freqKey] ?? freqKey}
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">{t.category}</span>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {t.project && <span>Project: {t.project.name}</span>}
                    {t.incurredBy && <span>By: {t.incurredBy.firstName} {t.incurredBy.lastName}</span>}
                    {t.description && <span className="truncate max-w-[200px]">{t.description}</span>}
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="font-bold text-foreground text-lg">${t.amount.toFixed(2)}</p>
                {t.nextRecurringDate && (
                    <p className={`text-xs flex items-center gap-1 ${isDue ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                        <Calendar className="w-3 h-3" />
                        {isDue ? 'Due: ' : `In ${daysUntil}d – `}
                        {new Date(t.nextRecurringDate).toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
    );
}

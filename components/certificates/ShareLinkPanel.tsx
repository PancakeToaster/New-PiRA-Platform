'use client';

import { useState } from 'react';
import { Share2, Copy, Trash2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ShareLinkPanelProps {
    code: string;
    currentToken: string | null;
    currentExpiry: string | null;
}

const DURATIONS = [
    { label: '24 hours', value: '24h' },
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
];

export default function ShareLinkPanel({ code, currentToken, currentExpiry }: ShareLinkPanelProps) {
    const [token, setToken] = useState(currentToken);
    const [expiry, setExpiry] = useState(currentExpiry);
    const [selectedDuration, setSelectedDuration] = useState('7d');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const shareUrl = token ? `${window.location.origin}/certificates/verify?token=${token}` : null;

    const isExpired = expiry ? new Date(expiry) < new Date() : false;

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const res = await fetch(`/api/certificates/${code}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration: selectedDuration }),
            });
            if (!res.ok) throw new Error('Failed to generate');
            const data = await res.json();
            setToken(data.shareToken);
            setExpiry(data.shareExpiresAt);
        } catch {
            setError('Could not generate share link. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRevoke = async () => {
        setIsRevoking(true);
        setError(null);
        try {
            const res = await fetch(`/api/certificates/${code}/share`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to revoke');
            setToken(null);
            setExpiry(null);
        } catch {
            setError('Could not revoke share link. Please try again.');
        } finally {
            setIsRevoking(false);
        }
    };

    const handleCopy = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formattedExpiry = expiry
        ? new Date(expiry).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
        : null;

    return (
        <Card className="border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Share2 className="w-4 h-4 text-sky-500" />
                    Share Link (Admin Only)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Generate a time-limited link anyone can use to view this certificate.
                    <strong className="text-foreground"> No student personal information is shown</strong> — only the certificate title, course, and dates.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {token && !isExpired ? (
                    <>
                        {/* Active share link */}
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Active share link</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                Expires {formattedExpiry}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    readOnly
                                    value={shareUrl ?? ''}
                                    className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 font-mono text-foreground truncate"
                                />
                                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                                    {copied ? (
                                        <><CheckCircle className="w-3 h-3 text-green-500 mr-1" />Copied</>
                                    ) : (
                                        <><Copy className="w-3 h-3 mr-1" />Copy</>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRevoke}
                            disabled={isRevoking}
                            className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-3 h-3 mr-2" />
                            {isRevoking ? 'Revoking...' : 'Revoke Link'}
                        </Button>
                    </>
                ) : (
                    <>
                        {token && isExpired && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Previous share link expired. Generate a new one below.
                            </div>
                        )}
                        {/* Generate new link */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">Link duration</p>
                            <div className="flex gap-2 flex-wrap">
                                {DURATIONS.map((d) => (
                                    <button
                                        key={d.value}
                                        onClick={() => setSelectedDuration(d.value)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${selectedDuration === d.value
                                                ? 'bg-sky-500 border-sky-500 text-white'
                                                : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                                <Share2 className="w-4 h-4" />
                                {isGenerating ? 'Generating...' : 'Generate Share Link'}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

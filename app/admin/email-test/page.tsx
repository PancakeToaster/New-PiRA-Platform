'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function EmailTestPage() {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setResult(null);

        try {
            const res = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    subject: 'Test Email from Robotics Academy',
                    html: `
                        <h1>Hello!</h1>
                        <p>This is a test email from the Robotics Academy platform.</p>
                        <p>If you see this, the Resend integration is working correctly.</p>
                        <hr />
                        <p><small>Sent via Resend</small></p>
                    `,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ success: true, message: 'Email sent successfully!' });
            } else {
                setResult({ success: false, message: data.error || 'Failed to send' });
            }
        } catch (error) {
            setResult({ success: false, message: 'Network error or server failed' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Test Email Integration
                    </CardTitle>
                </CardHeader>
                <form onSubmit={handleSend}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Recipient Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Note: If using Resend test mode, you can only send to the email address you signed up with.
                            </p>
                        </div>

                        {result && (
                            <div className={`p-3 rounded-md flex items-start gap-2 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {result.success ? (
                                    <CheckCircle className="w-4 h-4 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 mt-0.5" />
                                )}
                                <div>
                                    <p className="font-medium">{result.success ? 'Success' : 'Error'}</p>
                                    <p>{result.message}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={sending || !email}>
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Test Email'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

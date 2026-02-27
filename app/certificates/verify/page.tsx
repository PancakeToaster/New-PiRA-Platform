import { prisma } from '@/lib/prisma';
import { Award, CheckCircle, Calendar, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Certificate Verification — PiRA Robotics Academy',
    description: 'Verify the authenticity of a PiRA Robotics Academy certificate.',
    robots: 'noindex, nofollow',
};

interface Props {
    searchParams: Promise<{ token?: string }>;
}

export default async function CertificateVerifyPage({ searchParams }: Props) {
    const { token } = await searchParams;

    if (!token) {
        return <VerifyError message="No verification token provided. Please use a valid share link." />;
    }

    const award = await prisma.studentCertificate.findUnique({
        where: { shareToken: token },
        select: {
            awardedAt: true,
            code: true,
            shareExpiresAt: true,
            certificate: {
                select: {
                    title: true,
                    description: true,
                    lmsCourse: { select: { name: true, code: true } },
                },
            },
        },
    });

    if (!award) {
        return <VerifyError message="This share link is invalid or has been revoked." />;
    }

    if (!award.shareExpiresAt || award.shareExpiresAt < new Date()) {
        return <VerifyError message="This share link has expired. Please request a new one from the certificate holder." />;
    }

    const formattedDate = award.awardedAt.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    const formattedExpiry = award.shareExpiresAt.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const daysRemaining = Math.ceil(
        (award.shareExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-lg space-y-4">
                {/* Authenticity Banner */}
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-green-500 shrink-0" />
                    <div>
                        <p className="font-semibold text-green-600 dark:text-green-400 text-sm">Verified Certificate</p>
                        <p className="text-xs text-muted-foreground">Issued by PiRA Robotics Academy and confirmed authentic.</p>
                    </div>
                </div>

                {/* Certificate Card */}
                <Card className="border-sky-500/30 bg-gradient-to-br from-sky-950/20 to-background overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-blue-600" />
                    <CardHeader className="text-center pb-4 pt-8">
                        <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Award className="w-8 h-8 text-sky-500" />
                        </div>
                        <p className="text-xs font-medium text-sky-500 uppercase tracking-widest mb-2">Certificate of Achievement</p>
                        <CardTitle className="text-2xl font-bold text-foreground">{award.certificate.title}</CardTitle>
                        {award.certificate.description && (
                            <p className="text-muted-foreground text-sm mt-1">{award.certificate.description}</p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {award.certificate.lmsCourse && (
                                <div className="bg-muted/50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Course</p>
                                    <p className="font-semibold text-foreground text-sm">{award.certificate.lmsCourse.name}</p>
                                </div>
                            )}
                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                    <Calendar className="w-3 h-3" />Date Awarded
                                </div>
                                <p className="font-semibold text-foreground text-sm">{formattedDate}</p>
                            </div>
                        </div>

                        {/* Verification code */}
                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                <CheckCircle className="w-3 h-3" />Verification Code
                            </div>
                            <code className="font-mono text-sky-500 font-bold tracking-wider text-sm">{award.code}</code>
                        </div>

                        {/* Privacy note */}
                        <p className="text-xs text-center text-muted-foreground/60">
                            Student name and personal information are not displayed on public share links for privacy.
                        </p>
                    </CardContent>
                </Card>

                {/* Expiry notice */}
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 shrink-0" />
                    This link expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} ({formattedExpiry})
                </div>

                <p className="text-center text-xs text-muted-foreground/50">
                    PiRA Robotics Academy · Certificate Verification System
                </p>
            </div>
        </div>
    );
}

function VerifyError({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-foreground">Link Invalid or Expired</h1>
                <p className="text-muted-foreground text-sm">{message}</p>
                <p className="text-xs text-muted-foreground/60">PiRA Robotics Academy · Certificate Verification System</p>
            </div>
        </div>
    );
}

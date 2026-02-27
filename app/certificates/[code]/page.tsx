import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Award, ArrowLeft, Download, Share2, CheckCircle, Calendar, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ShareLinkPanel from '@/components/certificates/ShareLinkPanel';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    return {
        title: `Certificate Verification — ${code}`,
        robots: 'noindex, nofollow', // Never index individual cert pages
    };
}

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/auth/signin?callbackUrl=/certificates/' + (await params).code);
    }

    const { code } = await params;

    const award = await prisma.studentCertificate.findUnique({
        where: { code },
        include: {
            certificate: {
                include: {
                    lmsCourse: { select: { name: true, code: true } },
                },
            },
            student: {
                include: {
                    user: { select: { id: true, firstName: true, lastName: true } },
                },
            },
            awarder: { select: { firstName: true, lastName: true } },
        },
    });

    if (!award) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-6 text-center">
                <div className="bg-red-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Hash className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Certificate Not Found</h1>
                <p className="text-muted-foreground mb-6">No certificate found with code <code className="bg-muted px-2 py-0.5 rounded font-mono text-sm">{code}</code>.</p>
                <Link href="/lms"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button></Link>
            </div>
        );
    }

    // Access control: Admin, Teacher, or the student who owns it
    const user = session.user as any;
    const isAdmin = user.roles?.includes('Admin');
    const isTeacher = user.roles?.includes('Teacher');
    const isOwner = award.student.user?.id === user.id;

    if (!isAdmin && !isTeacher && !isOwner) {
        redirect('/lms');
    }

    const studentName = `${award.student.user?.firstName ?? ''} ${award.student.user?.lastName ?? ''}`.trim();
    const formattedDate = new Date(award.awardedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
            {/* Back */}
            <Link href="/lms" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm w-fit">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            {/* Certificate Card */}
            <Card className="border-sky-500/30 bg-gradient-to-br from-sky-950/20 to-background overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-sky-500 to-blue-600" />
                <CardHeader className="text-center pb-4 pt-8">
                    <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-10 h-10 text-sky-500" />
                    </div>
                    <p className="text-sm font-medium text-sky-500 uppercase tracking-widest mb-2">Certificate of Achievement</p>
                    <CardTitle className="text-3xl font-bold text-foreground">{award.certificate.title}</CardTitle>
                    {award.certificate.description && (
                        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">{award.certificate.description}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Awarded to */}
                    <div className="text-center border-t border-border pt-6">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Awarded to</p>
                        <p className="text-2xl font-bold text-foreground">{studentName}</p>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {award.certificate.lmsCourse && (
                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Course</p>
                                <p className="font-semibold text-foreground text-sm">{award.certificate.lmsCourse.name}</p>
                                {award.certificate.lmsCourse.code && (
                                    <p className="text-xs text-muted-foreground">{award.certificate.lmsCourse.code}</p>
                                )}
                            </div>
                        )}
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                <Calendar className="w-3 h-3" />Date Awarded
                            </div>
                            <p className="font-semibold text-foreground text-sm">{formattedDate}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                <CheckCircle className="w-3 h-3" />Verified
                            </div>
                            <p className="font-mono text-sky-500 text-xs font-bold tracking-wide">{award.code}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                        <a href={`/api/certificates/${code}/pdf`} download>
                            <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
                                <Download className="w-4 h-4" />
                                Download PDF
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* Share Link Panel — Admin only */}
            {isAdmin && (
                <ShareLinkPanel
                    code={code}
                    currentToken={award.shareToken ?? null}
                    currentExpiry={award.shareExpiresAt ? award.shareExpiresAt.toISOString() : null}
                />
            )}
        </div>
    );
}

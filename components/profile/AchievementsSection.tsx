'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Award, Shield, FileText, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AchievementsSection() {
    const [achievements, setAchievements] = useState<any>({ badges: [], certificates: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAchievements() {
            try {
                const res = await fetch('/api/student/profile/achievements');
                if (res.ok) {
                    const data = await res.json();
                    setAchievements(data);
                }
            } catch (error) {
                console.error("Failed to fetch achievements", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAchievements();
    }, []);

    if (isLoading) {
        return <div className="p-4 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Badges */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-500" />
                        <CardTitle>Badges & Credentials</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {achievements.badges.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg dashed border border-gray-200">
                            <Shield className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No badges earned yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {achievements.badges.map((item: any) => (
                                <div key={item.id} className="flex flex-col items-center text-center p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                                    <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                                        {item.badge.imageUrl ? (
                                            <img src={item.badge.imageUrl} alt={item.badge.name} className="w-12 h-12 object-contain" />
                                        ) : (
                                            <Award className="w-8 h-8 text-purple-400" />
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{item.badge.name}</h4>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {new Date(item.awardedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Certificates */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-sky-500" />
                        <CardTitle>Certificates</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {achievements.certificates.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg dashed border border-gray-200">
                            <Award className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No certificates earned yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {achievements.certificates.map((item: any) => (
                                <div key={item.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="aspect-video bg-sky-50 flex items-center justify-center border-b relative overflow-hidden">
                                        <div className="absolute inset-0 bg-sky-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm">
                                                <Download className="w-4 h-4 mr-2" />
                                                Download PDF
                                            </Button>
                                        </div>
                                        <Award className="w-16 h-16 text-sky-200" />
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-semibold text-gray-900 mb-1">{item.certificate.title}</h4>
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="text-xs text-gray-500">
                                                Issued {new Date(item.issuedAt).toLocaleDateString()}
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                {item.verificationCode}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

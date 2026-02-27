import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, GraduationCap, Calendar, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our History',
  description: 'Explore the history of PiRA - our competition awards, alumni success stories, and milestones in robotics education.',
  openGraph: {
    title: 'Our History',
    description: 'PiRA competition awards, alumni success stories, and milestones in robotics education.',
  },
};

export const revalidate = 3600; // Revalidate every hour

async function getHistoryContent() {
    const setting = await prisma.siteSetting.findUnique({
        where: { key: 'history_content' },
    });

    if (!setting || !setting.value) {
        // Return default structure if not found (matches lib/settings.ts)
        return {
            awards: [
                { date: "2025-05", competition: "Regional Robotics Championship", titles: "First Place in Innovation", image: "" },
                { date: "2024-11", competition: "National Coding Challenge", titles: "Gold Medalist Team", image: "" },
                { date: "2023-04", competition: "State STEM Fair", titles: "Best Engineering Project", image: "" }
            ],
            alumni: [
                { name: "Alex Johnson", year: "2023", college: "MIT", major: "Computer Science" },
                { name: "Sarah Lee", year: "2022", college: "Stanford", major: "Robotics Engineering" },
                { name: "Michael Chen", year: "2021", college: "Carnegie Mellon", major: "Artificial Intelligence" },
                { name: "Emily Davis", year: "2020", college: "Georgia Tech", major: "Mechanical Engineering" }
            ]
        };
    }

    try {
        return JSON.parse(setting.value);
    } catch (e) {
        console.error('Failed to parse history_content', e);
        return { awards: [], alumni: [] };
    }
}

export default async function HistoryPage() {
    const content = await getHistoryContent();

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background pt-20 pb-16">

                {/* Hero Section */}
                <section className="bg-muted/30 py-16 mb-12">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Our History & Legacy</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Celebrating years of innovation, competition success, and the bright futures of our alumni.
                        </p>
                    </div>
                </section>

                <div className="container mx-auto px-4 space-y-20">

                    {/* Awards Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Trophy className="w-8 h-8 text-primary" />
                            <h2 className="text-3xl font-bold text-foreground">Past Awards</h2>
                        </div>

                        <div className="relative border-l-4 border-primary/20 ml-4 md:ml-6 space-y-12 pl-8 md:pl-12 py-4">
                            {content.awards
                                .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
                                .map((award: any, index: number) => {
                                    // Format YYYY-MM to Month Year (avoid UTC offset)
                                    const formattedDate = (() => {
                                        try {
                                            const [year, month] = award.date.split('-').map(Number);
                                            const dateObj = new Date(year, month - 1, 1);
                                            return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                        } catch {
                                            return award.date;
                                        }
                                    })();

                                    return (
                                        <div key={index} className="relative">
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[46px] md:-left-[62px] top-1 w-6 h-6 rounded-full bg-primary border-4 border-background shadow-sm" />

                                            <Card className="hover:shadow-lg transition-shadow duration-300">
                                                <CardHeader className="pb-2">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                        <CardTitle className="text-xl font-bold text-primary">{award.competition}</CardTitle>
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                                            <Calendar className="w-3 h-3 mr-1.5" />
                                                            {formattedDate}
                                                        </span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-lg font-medium text-foreground">{award.titles}</p>
                                                    {award.image && (
                                                        <div className="mt-4 rounded-lg overflow-hidden h-48 w-full md:w-1/2 relative bg-muted">
                                                            {/* Placeholder for future image implementation */}
                                                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                                                <Award className="w-12 h-12 opacity-20" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    );
                                })}
                        </div>
                    </section>

                    {/* Alumni Section */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <GraduationCap className="w-8 h-8 text-primary" />
                            <h2 className="text-3xl font-bold text-foreground">Alumni Success</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {content.alumni.map((alum: any, index: number) => (
                                <Card key={index} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground">{alum.name}</h3>
                                                <p className="text-sm text-muted-foreground">Class of {alum.year}</p>
                                            </div>
                                            <div className="p-2 bg-muted rounded-full">
                                                <GraduationCap className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm">
                                                <span className="font-semibold text-foreground/70">University:</span>
                                                <div className="text-primary font-medium">
                                                    {alum.college}
                                                    {alum.universityClass && <div className="text-foreground/70 text-xs mt-0.5">{alum.universityClass}</div>}
                                                </div>
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-semibold text-foreground/70">Major:</span>
                                                <div className="text-foreground font-medium">{alum.major}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                </div>
            </main>
            <Footer />
        </>
    );
}

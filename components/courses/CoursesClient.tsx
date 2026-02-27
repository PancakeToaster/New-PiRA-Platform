'use client';

import Navbar from '@/components/layout/Navbar';
import PageBanner from '@/components/layout/PageBanner';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CourseInterestButton from '@/components/courses/CourseInterestButton';
import { ReactNode } from 'react';

interface Course {
    id: string;
    name: string;
    slug: string;
    description: string;
    level: string | null;
    duration: string | null;
    ageRange: string | null;
    price: number | null;
    topics: string[];
    image: string | null;
    isActive: boolean;
    isDevelopment?: boolean;
}

interface CoursesClientProps {
    courses: Course[];
    developmentCourses: Course[];
    footer: ReactNode;
}

export default function CoursesClient({ courses, developmentCourses, footer }: CoursesClientProps) {
    // We can remove the loading state since data is passed from the server
    // If you plan to add client-side filtering/search later, you might re-introduce state

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1 pt-20 pb-16">
                <PageBanner
                    title="Our Courses"
                    description="Comprehensive robotics programs designed for students of all skill levels"
                />

                <div className="container mx-auto px-4 space-y-20">
                    {courses.length === 0 ? (
                        <div className="text-center py-16">
                            <h2 className="text-2xl font-bold text-foreground mb-4">Coming Soon</h2>
                            <p className="text-muted-foreground mb-8">
                                We're preparing exciting new courses. Check back soon or contact us for more information.
                            </p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all"
                            >
                                Contact Us
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                                >
                                    {/* Course Header */}
                                    <div className="h-40 bg-muted relative flex items-center justify-center overflow-hidden">
                                        {course.image ? (
                                            <img
                                                src={course.image}
                                                alt={course.name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-5xl select-none opacity-20">📚</div>
                                        )}

                                        {course.level && (
                                            <div className="absolute top-2 left-2">
                                                <span className="px-2 py-1 bg-background/90 backdrop-blur-sm text-foreground font-semibold text-[10px] rounded-full shadow-sm">
                                                    {course.level}
                                                </span>
                                            </div>
                                        )}
                                        {course.price && (
                                            <div className="absolute top-2 right-2">
                                                <span className="px-2 py-1 bg-primary/90 text-primary-foreground font-bold text-xs rounded-full shadow-sm">
                                                    ${Number(course.price)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Course Content */}
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">{course.name}</h3>
                                        <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">{course.description}</p>

                                        <div className="mt-auto space-y-3">
                                            <div className="space-y-1.5 text-xs">
                                                {course.ageRange && (
                                                    <div className="flex justify-between border-b border-border/50 pb-1.5">
                                                        <span className="text-muted-foreground">Age Range:</span>
                                                        <span className="font-medium text-foreground">{course.ageRange}</span>
                                                    </div>
                                                )}
                                                {course.duration && (
                                                    <div className="flex justify-between border-b border-border/50 pb-1.5">
                                                        <span className="text-muted-foreground">Duration:</span>
                                                        <span className="font-medium text-foreground">{course.duration}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {course.topics && course.topics.length > 0 && (
                                                <div className="pt-1">
                                                    <div className="flex flex-wrap gap-1">
                                                        {course.topics.slice(0, 3).map((topic, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded-full"
                                                            >
                                                                {topic}
                                                            </span>
                                                        ))}
                                                        {course.topics.length > 3 && (
                                                            <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                                +{course.topics.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <Link
                                                href={`/courses/${course.slug}`}
                                                className="inline-flex items-center text-primary hover:text-primary/80 font-semibold text-xs pt-1"
                                            >
                                                Learn More
                                                <ArrowRight className="ml-1 w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Coming Soon Section */}
                    {developmentCourses.length > 0 && (
                        <div className="mt-20">
                            <div className="flex items-center justify-center mb-8 gap-4">
                                <div className="h-px bg-border flex-1" />
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Sparkles className="w-5 h-5" />
                                    <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="h-px bg-border flex-1" />
                            </div>

                            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                                We're developing new courses based on community interest. Show your interest to help us prioritize!
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {developmentCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="bg-card/50 border-2 border-dashed border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors duration-300 flex flex-col h-full"
                                    >
                                        {/* Course Header */}
                                        <div className="h-32 bg-muted/50 relative flex items-center justify-center">
                                            <div className="absolute top-2 left-2">
                                                <span className="px-2 py-1 bg-background/80 backdrop-blur-sm text-foreground font-semibold text-[10px] rounded-full shadow-sm flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    <span>In Development</span>
                                                </span>
                                            </div>
                                            {course.level && (
                                                <div className="absolute top-2 right-2">
                                                    <span className="px-2 py-1 bg-muted text-muted-foreground font-semibold text-[10px] rounded-full">
                                                        {course.level}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Course Content */}
                                        <div className="p-4 flex flex-col flex-1">
                                            <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">{course.name}</h3>
                                            <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">{course.description}</p>

                                            <div className="mt-auto pt-3 border-t border-dashed border-border">
                                                <CourseInterestButton courseId={course.id} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA Section */}
                    <div className="mt-16 text-center bg-muted/30 rounded-2xl p-12 border border-border/50">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Not sure which course is right?</h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Contact us for a free consultation and we'll help you find the perfect program for your skill level and goals.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                        >
                            Get in Touch
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </main>

            {footer}
        </div>
    );
}

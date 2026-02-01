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

            <main className="flex-1 pt-20">
                <PageBanner
                    title="Our Courses"
                    description="Comprehensive robotics programs designed for students of all skill levels"
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {courses.length === 0 ? (
                        <div className="text-center py-16">
                            <h2 className="text-2xl font-bold text-foreground mb-4">Coming Soon</h2>
                            <p className="text-muted-foreground mb-8">
                                We're preparing exciting new courses. Check back soon or contact us for more information.
                            </p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center px-6 py-3 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-all"
                            >
                                Contact Us
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                                >
                                    {/* Course Header */}
                                    <div className="h-32 bg-gradient-to-br from-sky-400 to-sky-600 relative flex items-center justify-center">
                                        {course.level && (
                                            <div className="absolute top-3 left-3">
                                                <span className="px-3 py-1.5 bg-white text-gray-900 font-semibold text-sm rounded-full shadow">
                                                    {course.level}
                                                </span>
                                            </div>
                                        )}
                                        {course.price && (
                                            <div className="absolute top-3 right-3">
                                                <span className="px-3 py-1.5 bg-sky-700/50 text-white font-bold text-lg rounded-full">
                                                    ${Number(course.price)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Course Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-foreground mb-2">{course.name}</h3>
                                        <p className="text-muted-foreground mb-4 line-clamp-2">{course.description}</p>

                                        <div className="space-y-2 text-sm mb-4">
                                            {course.ageRange && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Age Range:</span>
                                                    <span className="font-medium text-foreground">{course.ageRange}</span>
                                                </div>
                                            )}
                                            {course.duration && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Duration:</span>
                                                    <span className="font-medium text-foreground">{course.duration}</span>
                                                </div>
                                            )}
                                        </div>

                                        {course.topics && course.topics.length > 0 && (
                                            <div className="border-t border-border pt-4 mb-4">
                                                <p className="text-xs text-muted-foreground mb-2">Topics covered:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {course.topics.slice(0, 3).map((topic, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 rounded-full"
                                                        >
                                                            {topic}
                                                        </span>
                                                    ))}
                                                    {course.topics.length > 3 && (
                                                        <span className="px-2 py-1 text-xs text-muted-foreground">
                                                            +{course.topics.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <Link
                                            href={`/courses/${course.slug}`}
                                            className="inline-flex items-center text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 font-semibold text-sm"
                                        >
                                            Learn More
                                            <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Coming Soon Section */}
                    {developmentCourses.length > 0 && (
                        <div className="mt-16">
                            <div className="flex items-center justify-center mb-8">
                                <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent flex-1" />
                                <div className="px-6 flex items-center space-x-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent flex-1" />
                            </div>

                            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                                We're developing new courses based on community interest. Show your interest to help us prioritize!
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {developmentCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="bg-card border-2 border-dashed border-purple-200 dark:border-purple-800/50 rounded-2xl overflow-hidden hover:border-purple-300 dark:hover:border-purple-700/50 transition-all duration-300"
                                    >
                                        {/* Course Header */}
                                        <div className="h-32 bg-gradient-to-br from-purple-400 to-purple-600 relative flex items-center justify-center">
                                            <div className="absolute top-3 left-3">
                                                <span className="px-3 py-1.5 bg-white/90 text-purple-700 font-semibold text-sm rounded-full shadow flex items-center space-x-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    <span>In Development</span>
                                                </span>
                                            </div>
                                            {course.level && (
                                                <div className="absolute top-3 right-3">
                                                    <span className="px-3 py-1.5 bg-purple-700/50 text-white font-semibold text-sm rounded-full">
                                                        {course.level}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Course Content */}
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-foreground mb-2">{course.name}</h3>
                                            <p className="text-muted-foreground mb-4 line-clamp-3">{course.description}</p>

                                            <div className="space-y-2 text-sm mb-4">
                                                {course.ageRange && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Age Range:</span>
                                                        <span className="font-medium text-foreground">{course.ageRange}</span>
                                                    </div>
                                                )}
                                                {course.duration && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Duration:</span>
                                                        <span className="font-medium text-foreground">{course.duration}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {course.topics && course.topics.length > 0 && (
                                                <div className="border-t border-border pt-4 mb-4">
                                                    <p className="text-xs text-muted-foreground mb-2">Planned topics:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {course.topics.slice(0, 3).map((topic, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full"
                                                            >
                                                                {topic}
                                                            </span>
                                                        ))}
                                                        {course.topics.length > 3 && (
                                                            <span className="px-2 py-1 text-xs text-muted-foreground">
                                                                +{course.topics.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="border-t border-border pt-4">
                                                <CourseInterestButton courseId={course.id} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CTA Section */}
                    <div className="mt-16 text-center bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl p-12 border border-sky-100 dark:border-border">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Not sure which course is right?</h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Contact us for a free consultation and we'll help you find the perfect program for your skill level and goals.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center px-8 py-4 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-all shadow-lg hover:shadow-xl"
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

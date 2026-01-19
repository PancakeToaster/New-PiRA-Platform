'use client';

// ... imports
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { ArrowRight } from 'lucide-react';
import { Course, Activity, Testimonial } from '@prisma/client';

interface CompanyInfo {
    name: string;
    tagline: string;
    mission: string;
    contact?: any;
}

interface HomeClientProps {
    initialCourses: Course[];
    initialActivities: Activity[];
    initialTestimonials: Testimonial[];
    companyInfo: CompanyInfo;
    footer: React.ReactNode;
}

export default function HomeClient({
    initialCourses,
    initialActivities,
    initialTestimonials,
    companyInfo,
    footer
}: HomeClientProps) {
    // ... (rest of the component logic remains same until return)
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollY, setScrollY] = useState(0);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setHasLoaded(true), 100);

        const handleScroll = () => {
            if (containerRef.current) {
                setScrollY(containerRef.current.scrollTop);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
            clearTimeout(timer);
        };
    }, []);

    const featuredCourses = initialCourses.slice(0, 3);
    const recentActivities = initialActivities.slice(0, 3);

    // 3D shape transforms - orbit around the screen
    const cubeRotation = scrollY * 0.15;
    const gearRotation = scrollY * 0.2;
    const prismRotation = scrollY * 0.1;

    // Cube orbits from top-left to bottom-right
    const cubeX = 10 + Math.sin(scrollY * 0.002) * 15;
    const cubeY = 15 + Math.cos(scrollY * 0.002) * 10 + (scrollY * 0.01);

    // Gear orbits from top-right to bottom-left
    const gearX = 75 - Math.sin(scrollY * 0.0015) * 20;
    const gearY = 20 + Math.sin(scrollY * 0.0015) * 15 + (scrollY * 0.008);

    // Prism moves in a figure-8 pattern
    const prismX = 50 + Math.sin(scrollY * 0.001) * 30;
    const prismY = 70 + Math.sin(scrollY * 0.002) * 15;

    // Keep shapes visible but fade slightly as you scroll deep
    const shapesOpacity = Math.max(0.3, 1 - scrollY / 3000);

    return (
        <>
            <Navbar />

            {/* Scroll Snap Container */}
            <div
                ref={containerRef}
                className="h-screen overflow-y-auto snap-y snap-mandatory bg-white"
                style={{ scrollBehavior: 'smooth' }}
            >
                {/* Animated Background Orbs */}
                <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-[600px] h-[600px] rounded-full bg-sky-100 opacity-50 -top-40 -right-40 blur-3xl" />
                    <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-100 opacity-40 top-1/2 -left-40 blur-3xl" />
                    <div className="absolute w-[400px] h-[400px] rounded-full bg-sky-50 opacity-60 bottom-20 right-1/4 blur-3xl" />
                </div>

                {/* Fixed 3D Shapes that move around the viewport */}
                <div
                    className="fixed inset-0 z-5 pointer-events-none overflow-hidden"
                    style={{
                        perspective: '1200px',
                        opacity: shapesOpacity,
                    }}
                >
                    {/* 3D Cube */}
                    <div
                        className="absolute"
                        style={{
                            left: `${cubeX}%`,
                            top: `${Math.min(85, Math.max(10, cubeY))}%`,
                            transformStyle: 'preserve-3d',
                            transform: `rotateX(${cubeRotation}deg) rotateY(${cubeRotation * 1.5}deg)`,
                            transition: 'left 0.1s ease-out, top 0.1s ease-out',
                        }}
                    >
                        <div className="relative w-16 h-16" style={{ transformStyle: 'preserve-3d' }}>
                            <div className="absolute w-16 h-16 bg-sky-400/30 border-2 border-sky-400 backdrop-blur-sm" style={{ transform: 'translateZ(32px)' }} />
                            <div className="absolute w-16 h-16 bg-sky-400/30 border-2 border-sky-400 backdrop-blur-sm" style={{ transform: 'rotateY(180deg) translateZ(32px)' }} />
                            <div className="absolute w-16 h-16 bg-sky-500/30 border-2 border-sky-500 backdrop-blur-sm" style={{ transform: 'rotateY(-90deg) translateZ(32px)' }} />
                            <div className="absolute w-16 h-16 bg-sky-500/30 border-2 border-sky-500 backdrop-blur-sm" style={{ transform: 'rotateY(90deg) translateZ(32px)' }} />
                            <div className="absolute w-16 h-16 bg-sky-300/30 border-2 border-sky-300 backdrop-blur-sm" style={{ transform: 'rotateX(90deg) translateZ(32px)' }} />
                            <div className="absolute w-16 h-16 bg-sky-300/30 border-2 border-sky-300 backdrop-blur-sm" style={{ transform: 'rotateX(-90deg) translateZ(32px)' }} />
                        </div>
                    </div>

                    {/* 3D Gear */}
                    <div
                        className="absolute"
                        style={{
                            left: `${gearX}%`,
                            top: `${Math.min(80, Math.max(15, gearY))}%`,
                            transformStyle: 'preserve-3d',
                            transform: `rotateZ(${gearRotation}deg) rotateX(${gearRotation * 0.3}deg)`,
                            transition: 'left 0.1s ease-out, top 0.1s ease-out',
                        }}
                    >
                        <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-5 h-12 bg-blue-400/40 border-2 border-blue-400 backdrop-blur-sm"
                                    style={{
                                        transform: `rotateZ(${i * 45}deg) translateY(-24px)`,
                                        transformOrigin: 'center bottom',
                                    }}
                                />
                            ))}
                            <div className="w-12 h-12 rounded-full bg-blue-500/30 border-2 border-blue-500 backdrop-blur-sm" />
                        </div>
                    </div>

                    {/* 3D Triangular Prism */}
                    <div
                        className="absolute"
                        style={{
                            left: `${prismX}%`,
                            top: `${Math.min(85, Math.max(60, prismY))}%`,
                            transformStyle: 'preserve-3d',
                            transform: `rotateY(${prismRotation * 2}deg) rotateX(${prismRotation}deg)`,
                            transition: 'left 0.1s ease-out, top 0.1s ease-out',
                        }}
                    >
                        <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                            <div
                                className="absolute w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[52px] border-b-sky-400/40"
                                style={{ transform: 'translateZ(24px)', filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.3))' }}
                            />
                            <div
                                className="absolute w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[52px] border-b-sky-500/40"
                                style={{ transform: 'rotateY(180deg) translateZ(24px)', filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.3))' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="relative h-screen snap-center snap-always flex items-center justify-center z-10">
                    <div className="relative z-20 max-w-4xl mx-auto px-6 text-center">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-gray-900">
                            {companyInfo.tagline}
                        </h1>
                        <p className="text-lg md:text-xl lg:text-2xl mb-8 text-gray-600 max-w-3xl mx-auto">
                            {companyInfo.mission}
                        </p>
                        <div>
                            <Link
                                href="/courses"
                                className="inline-flex items-center justify-center px-8 py-4 bg-sky-500 text-white font-bold text-lg rounded-lg hover:bg-sky-600 transition-all shadow-lg hover:shadow-xl"
                            >
                                Explore Courses
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Hands-On Learning Section */}
                <section className="relative h-screen snap-end snap-always flex items-center justify-center z-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            <div>
                                <div className="aspect-video bg-gradient-to-br from-sky-400 to-sky-600 rounded-3xl shadow-2xl flex items-center justify-center text-white overflow-hidden relative">
                                    <div className="text-center p-8 relative z-10">
                                        <div className="text-6xl lg:text-7xl mb-4">🔨</div>
                                        <p className="text-xl lg:text-2xl font-bold">Hands-On Building</p>
                                        <p className="text-sky-100 mt-2">Video Coming Soon</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">Hands-On Learning</h2>
                                <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                                    Watch our students bring their ideas to life in state-of-the-art facilities. From concept to creation, they learn by doing.
                                </p>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <div className="text-4xl lg:text-5xl font-bold text-sky-500 mb-2">500+</div>
                                        <div className="text-gray-500 text-base lg:text-lg">Students Taught</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl lg:text-5xl font-bold text-sky-500 mb-2">10+</div>
                                        <div className="text-gray-500 text-base lg:text-lg">Years Experience</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Competition Section */}
                <section className="relative h-screen snap-end snap-always flex items-center justify-center z-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">Competing & Winning</h2>
                                <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                                    Our teams don't just participate—they excel. Experience the thrill of competition as our students showcase their skills on the world stage.
                                </p>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <div className="text-4xl lg:text-5xl font-bold text-sky-500 mb-2">50+</div>
                                        <div className="text-gray-500 text-base lg:text-lg">Competitions Won</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl lg:text-5xl font-bold text-sky-500 mb-2">6</div>
                                        <div className="text-gray-500 text-base lg:text-lg">Program Levels</div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-2xl flex items-center justify-center text-white overflow-hidden relative">
                                    <div className="text-center p-8 relative z-10">
                                        <div className="text-6xl lg:text-7xl mb-4">🏆</div>
                                        <p className="text-xl lg:text-2xl font-bold">Competition Action</p>
                                        <p className="text-blue-100 mt-2">Video Coming Soon</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Programs Section */}
                <section className="relative h-screen snap-end snap-always flex items-center justify-center z-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">Featured Programs</h2>
                            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
                                Comprehensive robotics education designed for every skill level
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {featuredCourses.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500"
                                >
                                    <div className="h-32 lg:h-40 bg-gradient-to-br from-sky-400 to-sky-600 relative flex items-center justify-center">
                                        <div className="absolute bottom-3 left-3">
                                            <span className="px-3 py-1.5 bg-white text-gray-900 font-semibold text-sm rounded-full shadow">
                                                {course.level}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
                                            <div className="text-xl font-bold text-sky-500">${Number(course.price)}</div>
                                        </div>
                                        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{course.description}</p>
                                        <Link
                                            href="/courses"
                                            className="inline-flex items-center text-sky-500 hover:text-sky-600 font-semibold text-sm"
                                        >
                                            Learn More
                                            <ArrowRight className="ml-2 w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-8">
                            <Link
                                href="/courses"
                                className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
                            >
                                View All Courses
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Events Section */}
                {recentActivities.length > 0 && (
                    <section className="relative h-screen snap-end snap-always flex items-center justify-center z-10">
                        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                            <div className="text-center mb-10">
                                <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">Upcoming Events</h2>
                                <p className="text-lg lg:text-xl text-gray-600">Join us for workshops and competitions</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                {recentActivities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all"
                                    >
                                        <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-3">
                                            <div className="flex items-center justify-between text-white">
                                                <span className="font-bold text-sm uppercase">{activity.category || 'Event'}</span>
                                                <span className="text-sm opacity-90" suppressHydrationWarning>{new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold mb-2 text-gray-900">{activity.title}</h3>
                                            <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{activity.description}</p>
                                            <div className="text-sm text-gray-500 space-y-1">
                                                <div suppressHydrationWarning>{new Date(activity.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA Section with Video Background */}
                <section className="relative h-screen snap-end snap-always flex items-center justify-center z-10 overflow-hidden">
                    {/* Video Background */}
                    <div className="absolute inset-0 z-0">
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                            poster="/images/cta-poster.jpg"
                        >
                        </video>
                        {/* Blur overlay */}
                        <div className="absolute inset-0 backdrop-blur-md bg-sky-600/70" />
                    </div>

                    {/* Fallback gradient background (shown until video loads) */}
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-sky-600 z-[-1]" />

                    {/* Content */}
                    <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
                            Ready to Start Your Journey?
                        </h2>
                        <p className="text-lg lg:text-xl mb-10 text-sky-100 drop-shadow-md">
                            Join our community of young innovators and start building the future today
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center px-10 py-5 bg-white text-sky-600 font-bold text-lg rounded-lg hover:bg-gray-100 transition-all shadow-2xl"
                        >
                            Get Started Today
                            <ArrowRight className="ml-3 w-6 h-6" />
                        </Link>
                    </div>
                </section>

                {/* Footer Section */}
                <section className="snap-end">
                    {footer}
                </section>
            </div>
        </>
    );
}

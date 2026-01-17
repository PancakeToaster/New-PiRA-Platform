'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { realCourses } from '@/lib/realData';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CoursesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Courses</h1>
            <p className="text-xl text-sky-100 max-w-2xl">
              Comprehensive robotics programs designed for students of all skill levels
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {realCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Course Header */}
                <div className="h-32 bg-gradient-to-br from-sky-400 to-sky-600 relative flex items-center justify-center">
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1.5 bg-white text-gray-900 font-semibold text-sm rounded-full shadow">
                      {course.level}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1.5 bg-sky-700/50 text-white font-bold text-lg rounded-full">
                      ${course.price}
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age Range:</span>
                      <span className="font-medium text-gray-900">{course.ageRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium text-gray-900">{course.duration}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Topics covered:</p>
                    <div className="flex flex-wrap gap-1">
                      {course.topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-sky-50 text-sky-700 rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-500">
                          +{course.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/contact"
                    className="inline-flex items-center text-sky-500 hover:text-sky-600 font-semibold text-sm"
                  >
                    Learn More
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-gradient-to-br from-sky-50 to-white rounded-3xl p-12 border border-sky-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Not sure which course is right?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
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

      <Footer />
    </div>
  );
}

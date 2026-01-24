import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Clock, Users, Calendar, ArrowLeft, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;

  const course = await prisma.course.findFirst({
    where: {
      slug,
      isActive: true,
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link 
            href="/courses" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {course.level && (
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-sm font-medium">
                    {course.level}
                  </span>
                )}
                {course.ageRange && (
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                    Ages {course.ageRange}
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
                {course.name}
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="w-full sm:w-auto">
                  Enroll Now
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Contact Us
                </Button>
              </div>
            </div>
            
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <span className="text-lg">No image available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Course</h2>
              <div className="prose max-w-none text-gray-600">
                <p className="whitespace-pre-wrap">{course.description}</p>
              </div>
            </section>

            {course.topics.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.topics.map((topic, i) => (
                    <div key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <span className="text-gray-700">{topic}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Duration</p>
                      <p className="text-sm text-gray-500">{course.duration || 'Flexible'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Users className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Age Group</p>
                      <p className="text-sm text-gray-500">{course.ageRange || 'All ages'}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Start Date</p>
                      <p className="text-sm text-gray-500">Open Enrollment</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-end justify-between mb-4">
                    <span className="text-gray-500">Price</span>
                    <span className="text-3xl font-bold text-gray-900">
                      {course.hidePrice ? 'Contact Us' : (course.price ? `$${course.price}` : 'Free')}
                    </span>
                  </div>
                  <Button className="w-full" size="lg">
                    Enroll Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Clock, Users, Calendar, ArrowLeft, CheckCircle } from 'lucide-react';
import CourseImage from '@/components/courses/CourseImage';

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
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Section */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link
            href="/courses"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {course.level && (
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 text-sm font-medium">
                    {course.level}
                  </span>
                )}
                {course.ageRange && (
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-sm font-medium">
                    Ages {course.ageRange}
                  </span>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-6">
                {course.name}
              </h1>

              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/contact">
                  <Button size="lg" className="w-full sm:w-auto">
                    Contact to Join
                  </Button>
                </Link>
              </div>
            </div>

            <CourseImage
              src={course.image || ''}
              alt={course.name}
            />
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">About this Course</h2>
              <div className="prose max-w-none text-muted-foreground dark:prose-invert">
                <p className="whitespace-pre-wrap">{course.description}</p>
              </div>
            </section>

            {course.topics.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.topics.map((topic, i) => (
                    <div key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <span className="text-foreground/80">{topic}</span>
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
                  <div className="flex items-center text-foreground/80">
                    <Clock className="w-5 h-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Duration</p>
                      <p className="text-sm text-muted-foreground">{course.duration || 'Flexible'}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-foreground/80">
                    <Users className="w-5 h-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Age Group</p>
                      <p className="text-sm text-muted-foreground">{course.ageRange || 'All ages'}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-foreground/80">
                    <Calendar className="w-5 h-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Start Date</p>
                      <p className="text-sm text-muted-foreground">Open Enrollment</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-end justify-between mb-4">
                    <span className="text-muted-foreground">Price</span>
                    <span className="text-3xl font-bold text-foreground">
                      {course.hidePrice ? 'Contact Us' : (course.price ? `$${course.price}` : 'Free')}
                    </span>
                  </div>
                  <Link href="/contact" className="w-full">
                    <Button className="w-full" size="lg">
                      Contact to Join
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

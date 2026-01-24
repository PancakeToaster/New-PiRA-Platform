import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { mockActivities, mockCourses } from '@/lib/mockData';
import { Rocket, Users, Trophy, BookOpen } from 'lucide-react';

export default function DemoHomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Welcome to Robotics Academy
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                Empowering the next generation of innovators through hands-on robotics education
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/courses">
                  <Button size="lg" variant="primary">
                    Explore Courses
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <Rocket className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Hands-On Learning</h3>
                <p className="text-gray-600">
                  Learn by building real robots and solving practical challenges
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <Users className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Instructors</h3>
                <p className="text-gray-600">
                  Learn from experienced robotics professionals and educators
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <Trophy className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Competition Ready</h3>
                <p className="text-gray-600">
                  Prepare for robotics competitions and tournaments
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="flex justify-center mb-4">
                  <BookOpen className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Comprehensive Curriculum</h3>
                <p className="text-gray-600">
                  From basics to advanced robotics concepts
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activities Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Recent Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="text-sm text-primary-600 font-semibold mb-2">
                      {activity.category}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{activity.title}</h3>
                    <p className="text-gray-600 mb-4">{activity.description}</p>
                    <p className="text-sm text-gray-500">
                      {activity.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Courses Preview */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Courses</h2>
              <p className="text-gray-600">
                Explore our comprehensive robotics programs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {mockCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2">{course.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                    <p className="text-sm text-gray-500">Ages: {course.ageRange}</p>
                    <p className="text-sm text-gray-500">Duration: {course.duration}</p>
                    <p className="text-lg font-bold text-primary-600 mt-3">
                      ${course.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/courses">
                <Button variant="primary">View All Courses</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Robotics Journey?</h2>
            <p className="text-xl mb-8 text-primary-100">
              Join our community of young innovators and start building the future
            </p>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                Get Started Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

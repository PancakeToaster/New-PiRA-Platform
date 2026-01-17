import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { realActivities, realCourses, companyInfo, learningProcess, services } from '@/lib/realData';
import { Rocket, Users, Trophy, BookOpen } from 'lucide-react';

export default function HomePage() {
  const recentActivities = realActivities.slice(0, 3);
  const activeCourses = realCourses.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {companyInfo.tagline}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                {companyInfo.mission}
              </p>
              <p className="text-lg mb-8 text-primary-100 italic">
                {companyInfo.vision}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="primary" asChild>
                  <Link href="/courses">Explore Courses</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact" className="text-white border-white hover:bg-white hover:text-primary-600">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">Our Learning Process</h2>
            <p className="text-center text-gray-600 mb-12">Engaging students through hands-on learning</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {learningProcess.map((step) => (
                <div key={step.id} className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <div className="text-sm font-semibold text-primary-600 mb-2">Step {step.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">What We Offer</h2>
            <p className="text-center text-gray-600 mb-12">{companyInfo.yearsFounded}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service) => (
                <div key={service.id} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Events Section */}
        {recentActivities.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12">Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                          {activity.type}
                        </span>
                        <span className="text-sm text-gray-500">{activity.ageRange}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{activity.title}</h3>
                      <p className="text-gray-600 mb-4">{activity.description}</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-500">
                          <span className="font-semibold">Date:</span> {activity.date.toLocaleDateString()}
                        </p>
                        <p className="text-gray-500">
                          <span className="font-semibold">Location:</span> {activity.location}
                        </p>
                        {activity.spotsAvailable && (
                          <p className="text-green-600 font-semibold">
                            {activity.spotsAvailable} spots available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Courses Preview */}
        {activeCourses.length > 0 && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Courses</h2>
                <p className="text-gray-600">
                  Explore our comprehensive robotics programs
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {activeCourses.map((course) => (
                  <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {course.level}
                        </span>
                        <span className="text-lg font-bold text-primary-600">${course.price}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p><span className="font-semibold">Ages:</span> {course.ageRange}</p>
                        <p><span className="font-semibold">Duration:</span> {course.duration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Button variant="primary" asChild>
                  <Link href="/courses">View All Courses</Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-primary-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Robotics Journey?</h2>
            <p className="text-xl mb-8 text-primary-100">
              Join our community of young innovators and start building the future
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact" className="text-white border-white hover:bg-white hover:text-primary-600">
                Get Started Today
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

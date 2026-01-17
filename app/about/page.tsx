import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { companyInfo, teamMembers, learningProcess, services } from '@/lib/realData';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="bg-primary-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">About {companyInfo.name}</h1>
            <p className="text-xl text-primary-100">
              {companyInfo.tagline}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-700 mb-4">
                {companyInfo.mission}
              </p>
              <p className="text-gray-700 mb-4">
                {companyInfo.description}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-gray-700 mb-4 text-xl italic">
                {companyInfo.vision}
              </p>
              <p className="text-gray-700">
                With {companyInfo.yearsFounded}, we have helped countless students develop their skills
                in robotics, programming, and STEM education through hands-on learning experiences and
                competitive opportunities.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">What We Offer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service) => (
                  <div key={service.id} className="bg-gray-50 p-6 rounded-lg">
                    <div className="text-4xl mb-3">{service.icon}</div>
                    <h3 className="text-xl font-bold mb-2 text-primary-600">{service.title}</h3>
                    <p className="text-gray-700">{service.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Learning Process</h2>
              <p className="text-gray-700 mb-6">
                We follow a proven four-step approach to robotics education:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {learningProcess.map((step) => (
                  <div key={step.id} className="text-center">
                    <div className="text-5xl mb-3">{step.icon}</div>
                    <div className="text-sm font-semibold text-primary-600 mb-1">Step {step.step}</div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-primary-600">Innovation</h3>
                  <p className="text-gray-700">
                    We encourage creative thinking and innovative solutions to real-world problems.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-primary-600">Excellence</h3>
                  <p className="text-gray-700">
                    We strive for excellence in everything we do, from curriculum design to student support.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-primary-600">Inclusivity</h3>
                  <p className="text-gray-700">
                    We believe robotics education should be accessible to all students.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-primary-600">Collaboration</h3>
                  <p className="text-gray-700">
                    We foster a collaborative learning environment where students learn from each other.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl font-bold text-primary-600">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary-600 font-semibold mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm">{member.bio}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

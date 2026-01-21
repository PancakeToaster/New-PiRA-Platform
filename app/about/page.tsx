import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageBanner from '@/components/layout/PageBanner';
import { getCompanyInfo, getServices, getLearningProcess } from '@/lib/siteSettings';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import PageBuilder from '@/components/admin/PageBuilder';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Edit } from 'lucide-react';

// Import PageViewer as client-only to avoid hydration issues with dangerouslySetInnerHTML
const PageViewer = dynamic(() => import('@/components/admin/PageViewer'), {
  ssr: false,
});

// Helper to wrap existing HTML in a Craft.js Text block
const createInitialState = (content: string, companyInfo: any, services: any[], learningProcess: any[], teamMembers: any[]) => {
  return JSON.stringify({
    ROOT: {
      type: { resolvedName: 'Container' },
      isCanvas: true,
      props: { background: '#ffffff', padding: '40px', flexDirection: 'column', gap: '40px' },
      displayName: 'Container',
      custom: {},
      hidden: false,
      nodes: ['text-node-1', 'mission-node', 'vision-node', 'services-node', 'process-node', 'values-node', 'team-node'],
      linkedNodes: {},
    },
    'text-node-1': {
      type: { resolvedName: 'Text' },
      isCanvas: false,
      props: { text: content },
      displayName: 'Intro Text',
      custom: {},
      parent: 'ROOT',
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    'mission-node': {
      type: { resolvedName: 'MissionSection' },
      isCanvas: false,
      props: {
        mission: companyInfo?.mission,
        description: companyInfo?.description
      },
      displayName: 'Mission Section',
      custom: {},
      parent: 'ROOT',
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    'vision-node': {
      type: { resolvedName: 'VisionSection' },
      isCanvas: false,
      props: {
        vision: companyInfo?.vision,
        description: `With ${companyInfo?.yearsFounded || '10+ years'}, we have helped countless students develop their skills in robotics, programming, and STEM education through hands-on learning experiences and competitive opportunities.`
      },
      displayName: 'Vision Section',
      custom: {},
      parent: 'ROOT',
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    'services-node': {
      type: { resolvedName: 'ServicesSection' },
      isCanvas: false,
      props: { services },
      displayName: 'Services Section',
      custom: {},
      parent: 'ROOT',
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    'process-node': {
      type: { resolvedName: 'ProcessSection' },
      isCanvas: false,
      props: { steps: learningProcess },
      displayName: 'Process Section',
      custom: {},
      parent: 'ROOT',
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    'values-node': {
      type: { resolvedName: 'ValuesSection' },
      isCanvas: false,
      props: {
        values: [
          { title: 'Innovation', description: 'We encourage creative thinking and innovative solutions to real-world problems.' },
          { title: 'Excellence', description: 'We strive for excellence in everything we do, from curriculum design to student support.' },
          { title: 'Inclusivity', description: 'We believe robotics education should be accessible to all students.' },
          { title: 'Collaboration', description: 'We foster a collaborative learning environment where students learn from each other.' },
        ]
      },
      displayName: 'Values Section',
      custom: {},
      parent: 'ROOT',
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
    'team-node': {
      type: { resolvedName: 'TeamSection' },
      isCanvas: false,
      props: { members: teamMembers },
      displayName: 'Team Section',
      custom: {},
      parent: 'ROOT',
      hidden: false,
      nodes: [],
      linkedNodes: {},
    },
  });
};

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const companyInfo = await getCompanyInfo();
  const services = await getServices();
  const learningProcess = await getLearningProcess();
  const teamMembers = await prisma.publicStaff.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  // Fetch the About page content from database
  const aboutPage = await prisma.page.findUnique({
    where: { slug: 'about' },
  });

  // Check if user is admin
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  // Check if we're in builder mode
  const params = await searchParams;
  const isBuilderMode = params.mode === 'builder' && userIsAdmin;

  // Type assertion for properties not yet in Prisma schema
  const pageWithBuilder = aboutPage as typeof aboutPage & { editorType?: string; builderData?: string };

  // Prepare initial data: use builderData if exists, otherwise generate from content
  const initialBuilderData = pageWithBuilder?.builderData
    ? pageWithBuilder.builderData
    : (aboutPage?.content ? createInitialState(aboutPage.content, companyInfo, services, learningProcess, teamMembers) : undefined);

  // If in builder mode, show full-screen editor
  if (isBuilderMode && aboutPage) {
    return (
      <PageBuilder
        initialData={initialBuilderData}
        id={aboutPage.id}
        apiEndpoint="/api/admin/pages"
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 pt-20">
        <PageBanner
          title={`About ${companyInfo.name}`}
          description={companyInfo.tagline}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Editable About Content Section */}
          {aboutPage && (
            <section className="mb-16">
              {/* Unified Header for Admin */}
              {userIsAdmin && (
                <div className="mb-6 flex justify-end">
                  <Link
                    href="/about?mode=builder"
                    className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-500 px-3 py-1.5 text-sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Content & Layout
                  </Link>
                </div>
              )}

              {pageWithBuilder.editorType === 'builder' && pageWithBuilder.builderData ? (
                // Render Craft.js content
                <PageViewer data={pageWithBuilder.builderData} />
              ) : (
                // Render HTML content (legacy)
                <article
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: aboutPage.content }}
                />
              )}
            </section>
          )}

          {/* Hardcoded Sections - Only show if not in builder mode */}
          {(!pageWithBuilder || pageWithBuilder.editorType !== 'builder') && (
            <>
              {/* Mission Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Mission</h2>
                <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                  {companyInfo.mission}
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {companyInfo.description}
                </p>
              </section>

              {/* Vision Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Vision</h2>
                <p className="text-xl text-gray-700 mb-4 italic border-l-4 border-sky-500 pl-6">
                  {companyInfo.vision}
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  With {companyInfo.yearsFounded}, we have helped countless students develop their skills
                  in robotics, programming, and STEM education through hands-on learning experiences and
                  competitive opportunities.
                </p>
              </section>

              {/* What We Offer Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-gray-900">What We Offer</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                      <div className="text-4xl mb-4">{service.icon}</div>
                      <h3 className="text-xl font-bold mb-2 text-sky-600">{service.title}</h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Learning Process Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Learning Process</h2>
                <p className="text-lg text-gray-600 mb-8">
                  We follow a proven four-step approach to robotics education:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {learningProcess.map((step) => (
                    <div key={step.id} className="text-center">
                      <div className="text-5xl mb-4">{step.icon}</div>
                      <div className="inline-block px-3 py-1 bg-sky-100 text-sky-600 text-sm font-semibold rounded-full mb-2">
                        Step {step.step}
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-gray-900">{step.title}</h3>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Values Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-gray-900">Our Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-sky-50 to-white p-6 rounded-2xl border border-sky-100">
                    <h3 className="text-xl font-bold mb-2 text-sky-600">Innovation</h3>
                    <p className="text-gray-600">
                      We encourage creative thinking and innovative solutions to real-world problems.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-white p-6 rounded-2xl border border-sky-100">
                    <h3 className="text-xl font-bold mb-2 text-sky-600">Excellence</h3>
                    <p className="text-gray-600">
                      We strive for excellence in everything we do, from curriculum design to student support.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-white p-6 rounded-2xl border border-sky-100">
                    <h3 className="text-xl font-bold mb-2 text-sky-600">Inclusivity</h3>
                    <p className="text-gray-600">
                      We believe robotics education should be accessible to all students.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-white p-6 rounded-2xl border border-sky-100">
                    <h3 className="text-xl font-bold mb-2 text-sky-600">Collaboration</h3>
                    <p className="text-gray-600">
                      We foster a collaborative learning environment where students learn from each other.
                    </p>
                  </div>
                </div>
              </section>

              {/* Team Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold mb-8 text-gray-900">Our Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-xl transition-shadow">
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl font-bold text-white">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      )}
                      <h3 className="text-xl font-bold mb-1 text-gray-900">{member.name}</h3>
                      <p className="text-sky-600 font-semibold mb-3">{member.role}</p>
                      <p className="text-gray-600 text-sm">{member.bio}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

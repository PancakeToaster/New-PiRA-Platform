import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageBanner from '@/components/layout/PageBanner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import AdminContentEditor from '@/components/admin/AdminContentEditor';
import PageViewer from '@/components/admin/PageViewer';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blog.findUnique({
    where: { slug },
  });

  if (!post || post.isDraft) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.blog.findUnique({
    where: { slug },
  });

  if (!post || post.isDraft) {
    // Admins can see drafts
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();
    if (!post || (!userIsAdmin && post.isDraft)) {
      notFound();
    }
  }

  // Check if user is admin
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  // Handle Page Builder Content
  if (post?.editorType === 'builder' && post.builderData) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 pt-20">
          {/* If admin, we can link back to edit page or show a small edit bar if desired */}
          {userIsAdmin && (
            <div className="fixed bottom-4 right-4 z-50">
              <Link href={`/admin/blog/${post.id}`}>
                <div className="bg-sky-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-sky-700 transition cursor-pointer">
                  Edit Page
                </div>
              </Link>
            </div>
          )}
          <PageViewer data={post.builderData} />
        </main>
        <Footer />
      </div>
    );
  }

  // Handle Standard Content
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 pt-20">
        <PageBanner
          title={post?.title || ''}
          description={
            post?.publishedAt
              ? `Published on ${new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}`
              : 'Draft Post'
          }
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/blog"
            className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {post?.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8"
            />
          )}

          {userIsAdmin && post ? (
            <AdminContentEditor
              initialContent={post.content}
              id={post.id}
              apiEndpoint="/api/admin/blog"
            />
          ) : (
            <article
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post?.content || '' }}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

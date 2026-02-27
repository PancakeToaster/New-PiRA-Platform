import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageBanner from '@/components/layout/PageBanner';
import Link from 'next/link';
import { ArrowLeft, LayoutTemplate } from 'lucide-react';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import PageBuilder from '@/components/admin/PageBuilder';
import AdminContentEditor from '@/components/admin/AdminContentEditor';
import PageViewer from '@/components/admin/PageViewer';

interface Props {
  params: { slug: string };
  searchParams: { mode?: string };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = params;
  const post = await prisma.blog.findUnique({
    where: { slug },
  });

  if (!post || post.isDraft) {
    return { title: 'Post Not Found' };
  }

  const description = post.excerpt || undefined;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
      authors: post.authorId ? [post.authorId] : [], // Optionally include author info
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    }
  };
}

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = params;

  const post = await prisma.blog.findUnique({
    where: { slug },
  });

  // Check if user is admin
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!post || post.isDraft) {
    // Admins can see drafts
    if (!post || (!userIsAdmin && post.isDraft)) {
      notFound();
    }
  }

  // Handle Builder Mode (Editing)
  if (searchParams.mode === 'builder' && userIsAdmin && post) {
    return (
      <PageBuilder
        initialData={post.builderData || undefined}
        id={post.id}
        apiEndpoint="/api/admin/blog"
      />
    );
  }

  // Handle Page Builder Content
  if (post?.editorType === 'builder' && post.builderData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-20">
          {/* If admin, we can link back to edit page or show a small edit bar if desired */}
          {userIsAdmin && (
            <div className="fixed bottom-4 right-4 z-50">
              <Link href="?mode=builder">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition cursor-pointer flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" />
                  Edit Page
                </div>
              </Link>
              <Link href={`/admin/blog/${post.id}`}>
                <div className="bg-card text-card-foreground px-4 py-2 rounded-full shadow-lg hover:bg-accent transition cursor-pointer border border-border text-sm font-medium">
                  Settings
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
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
            className="inline-flex items-center text-primary hover:text-primary/80 mb-8"
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
              className="prose prose-lg dark:prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: post?.content || '' }}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

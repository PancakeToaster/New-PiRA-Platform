import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageBanner from '@/components/layout/PageBanner';
import { prisma } from '@/lib/prisma';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest news, tutorials, and stories from PiRA. Stay up to date with robotics education insights and student achievements.',
  openGraph: {
    title: 'Blog',
    description: 'Latest news, tutorials, and stories from PiRA. Robotics education insights and student achievements.',
  },
};

export default async function BlogPage() {
  const posts = await prisma.blog.findMany({
    where: {
      isDraft: false,
      publishedAt: {
        not: null,
      },
    },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-20 pb-20">
        <PageBanner
          title="Blog"
          description="Latest news, updates, and insights from our robotics academy"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col h-full"
                >
                  {/* Post Header */}
                  <div className="h-40 bg-muted relative flex items-center justify-center overflow-hidden">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-5xl select-none">📝</span>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h2 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>

                    <div className="flex-1">
                      {post.excerpt && (
                        <p className="text-muted-foreground mb-3 line-clamp-3 text-xs">{post.excerpt}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-border pt-3 mt-auto">
                      <span className="text-muted-foreground">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          : 'Draft'}
                      </span>

                      <span className="inline-flex items-center text-primary hover:text-primary/80 font-semibold">
                        Read More
                        <ArrowRight className="ml-1 w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📰</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No Posts Yet</h2>
              <p className="text-muted-foreground">Check back soon for updates and news!</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

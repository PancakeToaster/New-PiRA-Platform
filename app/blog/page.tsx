import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageBanner from '@/components/layout/PageBanner';
import { prisma } from '@/lib/prisma';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

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

      <main className="flex-1 pt-20">
        <PageBanner
          title="Blog"
          description="Latest news, updates, and insights from our robotics academy"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Post Header */}
                  <div className="h-48 bg-gradient-to-br from-sky-400 to-sky-600 relative flex items-center justify-center">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl">📝</span>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  </div>

                  {/* Post Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-2 text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                    )}

                    <div className="flex items-center justify-between text-sm border-t border-border pt-4">
                      <span className="text-muted-foreground">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          : 'Draft'}
                      </span>
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="mt-4 inline-flex items-center text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 font-semibold text-sm"
                    >
                      Read More
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </article>
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

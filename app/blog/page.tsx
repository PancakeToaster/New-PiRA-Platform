'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { realBlogs } from '@/lib/realData';
import { ArrowRight } from 'lucide-react';

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-sky-100 max-w-2xl">
              Latest news, updates, and insights from our robotics academy
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {realBlogs.map((post) => (
              <article
                key={post.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Post Header */}
                <div className="h-48 bg-gradient-to-br from-sky-400 to-sky-600 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <span className="text-6xl">📝</span>
                </div>

                {/* Post Content */}
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-sky-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>

                  <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                    <span className="text-gray-700 font-medium">{post.author.name}</span>
                    <span className="text-gray-500">
                      {post.publishedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <button className="mt-4 inline-flex items-center text-sky-500 hover:text-sky-600 font-semibold text-sm">
                    Read More
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Empty State */}
          {realBlogs.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Posts Yet</h2>
              <p className="text-gray-600">Check back soon for updates and news!</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

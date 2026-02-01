'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, Briefcase, User, ExternalLink } from 'lucide-react';
import PortfolioCard from '@/components/portfolio/PortfolioCard';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  media: string[];
  tags: string[];
  isPublic: boolean;
  projectUrl: string | null;
  createdAt: string;
}

interface StudentInfo {
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export default function PublicPortfolioPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`/api/portfolio/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          setStudent(data.student);
          setItems(data.items);
        }
      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Portfolio not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={`${student.firstName} ${student.lastName}`}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-sky-600" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          {student.firstName} {student.lastName}
        </h1>
        <p className="text-gray-500 mt-1">Student Portfolio</p>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No public portfolio items yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedItem(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Media */}
              {selectedItem.media.length > 0 && (
                <div className="aspect-video bg-gray-100">
                  <img
                    src={selectedItem.media[0]}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedItem.title}</h2>

                {selectedItem.description && (
                  <p className="text-gray-600 mt-2">{selectedItem.description}</p>
                )}

                {selectedItem.content && (
                  <div className="prose prose-sm mt-4 text-gray-700">
                    {selectedItem.content}
                  </div>
                )}

                {selectedItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-xs bg-sky-50 text-sky-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-400">
                    {new Date(selectedItem.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-3">
                    {selectedItem.projectUrl && (
                      <a
                        href={selectedItem.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Project
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

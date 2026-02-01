'use client';

import { ExternalLink, Tag } from 'lucide-react';

interface PortfolioCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    media: string[];
    tags: string[];
    isPublic: boolean;
    projectUrl: string | null;
    createdAt: string;
  };
  onClick?: () => void;
}

export default function PortfolioCard({ item, onClick }: PortfolioCardProps) {
  const thumbnail = item.media?.[0];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-gray-300">
              {item.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {!item.isPublic && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-gray-800/70 text-white rounded-full">
            Private
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 text-xs bg-sky-50 text-sky-700 rounded-full"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 4 && (
              <span className="text-xs text-gray-400">+{item.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
          {item.projectUrl && (
            <a
              href={item.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View Project
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

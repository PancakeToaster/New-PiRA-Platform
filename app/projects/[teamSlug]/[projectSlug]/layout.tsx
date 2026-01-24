'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, List, BarChart3, FileText, Settings, Folder } from 'lucide-react';

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { teamSlug: string; projectSlug: string };
}) {
  const { teamSlug, projectSlug } = params;
  const pathname = usePathname();

  const basePath = `/projects/${teamSlug}/${projectSlug}`;

  const tabs = [
    { name: 'Overview', href: basePath, icon: FileText },
    { name: 'Board', href: `${basePath}/board`, icon: LayoutGrid },
    { name: 'List', href: `${basePath}/list`, icon: List },
    { name: 'Settings', href: `${basePath}/settings`, icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

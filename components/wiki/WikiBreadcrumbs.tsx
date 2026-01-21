'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface Breadcrumb {
    label: string;
    href?: string;
}

interface WikiBreadcrumbsProps {
    breadcrumbs: Breadcrumb[];
}

export default function WikiBreadcrumbs({ breadcrumbs }: WikiBreadcrumbsProps) {
    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link
                href="/wiki"
                className="flex items-center hover:text-gray-900 transition-colors"
            >
                <Home className="w-4 h-4" />
            </Link>

            {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    {crumb.href ? (
                        <Link
                            href={crumb.href}
                            className="hover:text-gray-900 transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className="text-gray-900 font-medium">{crumb.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}

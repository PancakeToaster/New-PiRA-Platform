'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface WikiTableOfContentsProps {
    content: string; // Markdown or Tiptap JSON
}

export default function WikiTableOfContents({ content }: WikiTableOfContentsProps) {
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        try {
            // Try to parse as Tiptap JSON first
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
                // It's Tiptap JSON, extract text first
                const markdownText = extractTextFromTiptap(parsed);
                const extractedHeadings = extractMarkdownHeadings(markdownText);
                setHeadings(extractedHeadings);
            } else {
                // It's plain text/markdown
                const extractedHeadings = extractMarkdownHeadings(content);
                setHeadings(extractedHeadings);
            }
        } catch (error) {
            // Not JSON, treat as markdown
            const extractedHeadings = extractMarkdownHeadings(content);
            setHeadings(extractedHeadings);
        }
    }, [content]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-100px 0px -80% 0px' }
        );

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    // Extract text from Tiptap JSON
    const extractTextFromTiptap = (node: any): string => {
        if (!node) return '';

        if (node.type === 'text') {
            return node.text || '';
        }

        if (node.content && Array.isArray(node.content)) {
            return node.content.map((child: any) => {
                const text = extractTextFromTiptap(child);
                if (node.type === 'paragraph' || node.type === 'heading') {
                    return text + '\n\n';
                }
                return text;
            }).join('');
        }

        return '';
    };

    // Extract headings from markdown text
    const extractMarkdownHeadings = (markdown: string): Heading[] => {
        if (!markdown) return [];

        const headings: Heading[] = [];
        const lines = markdown.split('\n');
        let headingCount = 0;

        lines.forEach((line) => {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const text = match[2].trim();
                const id = `heading-${headingCount++}`;
                headings.push({ id, text, level });
            }
        });

        return headings;
    };

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (headings.length === 0) return null;

    return (
        <div className="sticky top-20 w-64 hidden xl:block">
            <div className="border-l border-gray-200 pl-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                    <List className="w-4 h-4" />
                    On this page
                </div>
                <nav className="space-y-2">
                    {headings.map((heading) => (
                        <button
                            key={heading.id}
                            onClick={() => scrollToHeading(heading.id)}
                            className={`block text-left text-sm transition-colors w-full ${activeId === heading.id
                                ? 'text-sky-600 font-medium'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                        >
                            {heading.text}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}

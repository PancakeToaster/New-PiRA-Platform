'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Loader2 } from 'lucide-react';
import Fuse from 'fuse.js';

interface SearchResult {
    id: string;
    title: string;
    excerpt: string;
    nodeType: string;
}

interface WikiSearchProps {
    nodes: Array<{
        id: string;
        title: string;
        content: string;
        nodeType: string;
    }>;
}

export default function WikiSearch({ nodes }: WikiSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Initialize Fuse.js
    const fuse = useRef(
        new Fuse(nodes, {
            keys: ['title', 'content'],
            threshold: 0.3,
            includeScore: true,
            minMatchCharLength: 2,
        })
    );

    // Keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search logic
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const searchResults = fuse.current.search(query).slice(0, 10);
        setResults(
            searchResults.map((result) => ({
                id: result.item.id,
                title: result.item.title,
                excerpt: extractExcerpt(result.item.content, query),
                nodeType: result.item.nodeType,
            }))
        );
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleSelect(results[selectedIndex].id);
        }
    };

    const handleSelect = (nodeId: string) => {
        router.push(`/wiki/${nodeId}`);
        setIsOpen(false);
        setQuery('');
    };

    const extractExcerpt = (content: string, query: string): string => {
        try {
            const parsed = JSON.parse(content);
            const text = extractTextFromTiptap(parsed);
            const index = text.toLowerCase().indexOf(query.toLowerCase());
            if (index === -1) return text.slice(0, 100) + '...';
            const start = Math.max(0, index - 40);
            const end = Math.min(text.length, index + 60);
            return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
        } catch {
            return content.slice(0, 100) + '...';
        }
    };

    const extractTextFromTiptap = (doc: any): string => {
        if (!doc || !doc.content) return '';
        return doc.content
            .map((node: any) => {
                if (node.type === 'paragraph' && node.content) {
                    return node.content.map((n: any) => n.text || '').join('');
                }
                return '';
            })
            .join(' ');
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Search className="w-4 h-4" />
                <span>Search...</span>
                <kbd className="ml-auto px-2 py-0.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded">
                    ⌘K
                </kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search knowledge base..."
                        className="flex-1 text-base outline-none"
                    />
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setQuery('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {query.length < 2 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                            Type at least 2 characters to search
                        </div>
                    ) : results.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="py-2">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect(result.id)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${index === selectedIndex ? 'bg-sky-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {result.title}
                                            </div>
                                            <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                {result.excerpt}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded">↓</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded">↵</kbd>
                            to select
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded">esc</kbd>
                        to close
                    </span>
                </div>
            </div>
        </div>
    );
}

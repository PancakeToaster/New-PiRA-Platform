'use client';

import { createElement, Fragment } from 'react'; // Add imports
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { common, createLowlight } from 'lowlight';
import './syntax-theme.css';

const lowlight = createLowlight(common);

interface MarkdownRendererProps {
    content: string;
}

const slugify = (str: string) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const extractText = (children: any): string => {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(extractText).join('');
    if (children?.props?.children) return extractText(children.props.children);
    return '';
};


export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="prose prose-sky dark:prose-invert max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children, ...props }) => <h1 className="scroll-mt-24" id={slugify(extractText(children))} {...props}>{children}</h1>,
                    h2: ({ children, ...props }) => <h2 className="scroll-mt-24" id={slugify(extractText(children))} {...props}>{children}</h2>,
                    h3: ({ children, ...props }) => <h3 className="scroll-mt-24" id={slugify(extractText(children))} {...props}>{children}</h3>,
                    h4: ({ children, ...props }) => <h4 className="scroll-mt-24" id={slugify(extractText(children))} {...props}>{children}</h4>,
                    h5: ({ children, ...props }) => <h5 className="scroll-mt-24" id={slugify(extractText(children))} {...props}>{children}</h5>,
                    h6: ({ children, ...props }) => <h6 className="scroll-mt-24" id={slugify(extractText(children))} {...props}>{children}</h6>,
                    code(props) {
                        const { children, className, node, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : null;

                        // Heuristic: Highlight if it has a language tag (explicit) or contains newlines (block)
                        const shouldHighlight = language || String(children).includes('\n');

                        if (shouldHighlight) {
                            try {
                                let tree;
                                let detectedLang = language;

                                if (language) {
                                    try {
                                        tree = lowlight.highlight(language, String(children).replace(/\n$/, ''));
                                    } catch (e) {
                                        // Language not found in 'common' set, try auto-detection
                                        const auto = lowlight.highlightAuto(String(children).replace(/\n$/, ''));
                                        tree = auto;
                                        detectedLang = auto.data?.language || null;
                                    }
                                } else {
                                    // No language specified, auto-detect
                                    const auto = lowlight.highlightAuto(String(children).replace(/\n$/, ''));
                                    tree = auto;
                                    detectedLang = auto.data?.language || null;
                                }

                                return (
                                    <code className={`hljs language-${detectedLang} ${className || ''}`} {...rest}>
                                        {tree.children.map((child, i) => renderHastNode(child, i))}
                                    </code>
                                );
                            } catch (e) {
                                // Fallback to plain rendering if highlighting fails completely
                            }
                        }

                        return <code className={className} {...rest}>{children}</code>;
                    }
                }}
            >
                {content || '*No content*'}
            </ReactMarkdown >
        </div >
    );
}

// Simple HAST to React renderer for Lowlight trees
function renderHastNode(node: any, index: number): React.ReactNode {
    if (node.type === 'text') {
        return node.value;
    }

    if (node.type === 'element') {
        const children = node.children ? node.children.map((child: any, i: number) => renderHastNode(child, i)) : null;
        const props = { ...node.properties, key: index };

        // Convert class array to string if needed (lowlight uses array)
        if (Array.isArray(props.className)) {
            props.className = props.className.join(' ');
        }

        return createElement(node.tagName, props, children);
    }

    return null;
}

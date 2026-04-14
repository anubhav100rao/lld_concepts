import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface MarkdownViewerProps {
  content: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const syntaxTheme: { [key: string]: CSSProperties } = vscDarkPlus as { [key: string]: CSSProperties };

const CopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="code-copy-btn" onClick={handleCopy} aria-label="Copy code">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Build TOC from rendered headings
  useEffect(() => {
    if (!contentRef.current) return;

    // Small delay to let markdown render
    const timer = setTimeout(() => {
      const headings = contentRef.current!.querySelectorAll('h1, h2, h3');
      const items: TocItem[] = [];
      headings.forEach((heading) => {
        const text = heading.textContent || '';
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        heading.id = id;
        items.push({ id, text, level: parseInt(heading.tagName[1]) });
      });
      setTocItems(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  // Track active heading on scroll
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll('h1, h2, h3');
    let current = '';
    headings.forEach((heading) => {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= 120) {
        current = heading.id;
      }
    });
    setActiveId(current);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      return match ? (
        <div className="code-block-wrapper">
          <div className="code-block-header">
            <span className="code-block-lang">{match[1]}</span>
            <CopyButton code={codeString} />
          </div>
          <SyntaxHighlighter
            style={syntaxTheme}
            language={match[1]}
            PreTag="div"
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className="markdown-layout">
      <div className="markdown-content" ref={contentRef}>
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>

      {tocItems.length > 2 && (
        <aside className="toc-sidebar">
          <div className="toc-container">
            <h4 className="toc-title">On this page</h4>
            <ul className="toc-list">
              {tocItems.map((item) => (
                <li key={item.id} className={`toc-item toc-level-${item.level} ${activeId === item.id ? 'toc-active' : ''}`}>
                  <a href={`#${item.id}`}>{item.text}</a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
};

export default MarkdownViewer;

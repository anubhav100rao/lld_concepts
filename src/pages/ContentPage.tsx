import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import MarkdownViewer from '../components/MarkdownViewer';
import { getMarkdownContent, getSubTopicsForCategory, TOPIC_MAPPING, getAllTopicSlugs } from '../utils/contentLoader';

// Map category IDs to display names
const CATEGORY_NAMES: Record<string, string> = {
  'core-infrastructure': 'Core Infrastructure & Storage',
  'concurrency': 'Concurrency & Scheduling',
  'networking': 'Networking & Protocols',
  'messaging': 'Messaging & Event Systems',
  'api': 'API & Access Control',
  'file-systems': 'File Systems & IO',
  'payments': 'Payments & Transactions',
  'observability': 'Observability & Reliability',
  'caching': 'Caching & Proxies',
  'practical-systems': 'Practical System Components',
  'algorithms': 'Algorithms & Data Structures',
};

function formatTitle(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const ContentPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      setLoading(true);
      setNotFound(false);
      if (slug) {
        const markdown = await getMarkdownContent(slug);
        if (isMounted) {
          if (markdown.trimStart().startsWith('# Content Not Found')) {
            setNotFound(true);
          }
          setContent(markdown);
          setLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Prev / Next navigation
  const { prev, next } = useMemo(() => {
    const allSlugs = getAllTopicSlugs();
    const idx = slug ? allSlugs.indexOf(slug) : -1;
    return {
      prev: idx > 0 ? { slug: allSlugs[idx - 1], title: formatTitle(allSlugs[idx - 1]) } : null,
      next: idx >= 0 && idx < allSlugs.length - 1 ? { slug: allSlugs[idx + 1], title: formatTitle(allSlugs[idx + 1]) } : null,
    };
  }, [slug]);

  // Keyboard left/right arrow navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft' && prev) {
        window.location.href = `/topic/${prev.slug}`;
      } else if (e.key === 'ArrowRight' && next) {
        window.location.href = `/topic/${next.slug}`;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  if (loading) {
    return (
      <div className="glass-panel content-skeleton" style={{ padding: '3rem', marginTop: '2rem' }}>
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-short" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-medium" />
        <div className="skeleton-block" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-short" />
      </div>
    );
  }

  const categoryId = slug ? (TOPIC_MAPPING[slug] || slug) : '';
  const categoryName = CATEGORY_NAMES[categoryId];
  const isSubTopic = slug ? !!TOPIC_MAPPING[slug] : false;
  const pageTitle = slug ? formatTitle(slug) : '';
  const subTopics = categoryId ? getSubTopicsForCategory(categoryId) : [];

  if (notFound && !isSubTopic) {
    return (
      <div className="glass-panel category-topic-list fade-in" style={{ padding: '3rem', marginTop: '2rem' }}>
        <div className="category-topic-list-header">
          <span className="category-topic-list-kicker">Sub-topics</span>
          <h1>{categoryName || pageTitle}</h1>
          <p>Choose a topic to continue.</p>
        </div>

        {subTopics.length > 0 ? (
          <div className="category-topic-grid">
            {subTopics.map((topic) => (
              <Link key={topic.id} to={`/topic/${topic.id}`} className="category-topic-card">
                <span>{topic.title}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <p className="category-topic-empty">No sub-topics available in this category yet.</p>
        )}

        {/* Prev/Next even on category pages */}
        <PrevNextNav prev={prev} next={next} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="glass-panel empty-state fade-in" style={{ padding: '3rem', marginTop: '2rem' }}>
        <div className="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <h2>Content Not Found</h2>
        <p>No content available for <strong>{pageTitle}</strong> yet.</p>
        <div className="empty-state-cta">
          <p>Create a file at <code>content/{slug}.md</code> to populate this page.</p>
          <Link to="/" className="empty-state-btn">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      {isSubTopic && categoryName && (
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to={`/topic/${categoryId}`}>{categoryName}</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{pageTitle}</span>
        </nav>
      )}

      <div className="glass-panel" style={{ padding: '3rem', marginTop: isSubTopic ? '0.5rem' : '2rem' }}>
        <MarkdownViewer content={content} />
      </div>

      {/* Previous / Next */}
      <PrevNextNav prev={prev} next={next} />
    </div>
  );
};

const PrevNextNav: React.FC<{
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}> = ({ prev, next }) => {
  if (!prev && !next) return null;

  return (
    <nav className="prev-next-nav">
      {prev ? (
        <Link to={`/topic/${prev.slug}`} className="prev-next-link prev-next-prev">
          <span className="prev-next-label">Previous</span>
          <span className="prev-next-title">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link to={`/topic/${next.slug}`} className="prev-next-link prev-next-next">
          <span className="prev-next-label">Next</span>
          <span className="prev-next-title">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
};

export default ContentPage;

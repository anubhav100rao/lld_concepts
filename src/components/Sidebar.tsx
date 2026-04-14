import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getSubTopicsForCategory, TOPIC_MAPPING } from '../utils/contentLoader';

const topics = [
  { id: 'core-infrastructure', title: '1. Core Infrastructure & Storage' },
  { id: 'concurrency', title: '2. Concurrency & Scheduling' },
  { id: 'networking', title: '3. Networking & Protocols' },
  { id: 'messaging', title: '4. Messaging & Event Systems' },
  { id: 'api', title: '5. API & Access Control' },
  { id: 'file-systems', title: '6. File Systems & IO' },
  { id: 'payments', title: '7. Payments & Transactions' },
  { id: 'observability', title: '8. Observability & Reliability' },
  { id: 'caching', title: '9. Caching & Proxies' },
  { id: 'practical-systems', title: '10. Practical System components' },
  { id: 'algorithms', title: '11. Algorithms & Data Structures' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine which category the current slug belongs to
  const currentSlug = location.pathname.replace('/topic/', '');
  const activeCategory = TOPIC_MAPPING[currentSlug] || currentSlug;

  // Track expanded categories — auto-expand the active one
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (activeCategory) init[activeCategory] = true;
    return init;
  });

  // Keep active category expanded when route changes
  React.useEffect(() => {
    if (activeCategory) {
      setExpanded((prev) => ({ ...prev, [activeCategory]: true }));
    }
  }, [activeCategory]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter topics and sub-topics based on search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase();
    return topics.filter((topic) => {
      if (topic.title.toLowerCase().includes(q)) return true;
      const subs = getSubTopicsForCategory(topic.id);
      return subs.some((s) => s.title.toLowerCase().includes(q));
    });
  }, [searchQuery]);

  const closeMobile = () => setMobileOpen(false);

  // Esc to close mobile sidebar
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) closeMobile();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <span /><span /><span />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <aside className={`sidebar glass-panel ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" onClick={closeMobile}>
            <h2>LLD Masterclass</h2>
          </Link>
          <button className="sidebar-close" onClick={closeMobile} aria-label="Close navigation">
            &times;
          </button>
        </div>

        {/* Search / filter */}
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search topics...  (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar-search-input"
          />
        </div>

        <nav className="nav-links">
          {filteredTopics.map((topic) => {
            const subTopics = getSubTopicsForCategory(topic.id);
            const q = searchQuery.toLowerCase();
            const filteredSubs = searchQuery.trim()
              ? subTopics.filter((s) => s.title.toLowerCase().includes(q) || topic.title.toLowerCase().includes(q))
              : subTopics;

            const isParentActive = location.pathname === `/topic/${topic.id}`;
            const isParentHighlighted = activeCategory === topic.id;
            const isExpanded = expanded[topic.id] || false;
            const hasChildren = filteredSubs.length > 0;

            // Auto-expand when search matches children
            const shouldShow = searchQuery.trim() ? true : isExpanded;

            return (
              <div key={topic.id} className="nav-group">
                <div className={`nav-item-row ${isParentActive ? 'active' : ''} ${isParentHighlighted && !isParentActive ? 'highlighted' : ''}`}>
                  <Link
                    to={`/topic/${topic.id}`}
                    className="nav-item-link"
                    onClick={closeMobile}
                  >
                    {topic.title}
                  </Link>
                  {hasChildren && (
                    <button
                      className="nav-expand-btn"
                      onClick={() => toggleExpand(topic.id)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <span className={`nav-chevron ${shouldShow ? 'nav-chevron--open' : ''}`} />
                    </button>
                  )}
                </div>

                {hasChildren && shouldShow && (
                  <div className="sub-nav-links">
                    {filteredSubs.map((sub) => {
                      const isSubActive = location.pathname === `/topic/${sub.id}`;
                      return (
                        <Link
                          key={sub.id}
                          to={`/topic/${sub.id}`}
                          className={`nav-item sub-item ${isSubActive ? 'active' : ''}`}
                          onClick={closeMobile}
                        >
                          {sub.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filteredTopics.length === 0 && (
            <p className="sidebar-no-results">No topics found.</p>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

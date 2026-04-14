import React from 'react';
import { Link } from 'react-router-dom';
import { getSubTopicsForCategory } from '../utils/contentLoader';

const categories = [
  { id: 'core-infrastructure', title: 'Core Infrastructure & Storage', icon: 'db' },
  { id: 'concurrency', title: 'Concurrency & Scheduling', icon: 'cpu' },
  { id: 'networking', title: 'Networking & Protocols', icon: 'net' },
  { id: 'messaging', title: 'Messaging & Event Systems', icon: 'msg' },
  { id: 'api', title: 'API & Access Control', icon: 'key' },
  { id: 'file-systems', title: 'File Systems & IO', icon: 'file' },
  { id: 'payments', title: 'Payments & Transactions', icon: 'pay' },
  { id: 'observability', title: 'Observability & Reliability', icon: 'eye' },
  { id: 'caching', title: 'Caching & Proxies', icon: 'cache' },
  { id: 'practical-systems', title: 'Practical Systems', icon: 'gear' },
  { id: 'algorithms', title: 'Algorithms & Data Structures', icon: 'algo' },
];

type ThemeMode = 'system' | 'light' | 'dark';

interface DashboardProps {
  themeMode: ThemeMode;
  onThemeModeChange: (themeMode: ThemeMode) => void;
}

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const CategoryIcon: React.FC<{ type: string }> = ({ type }) => {
  const icons: Record<string, React.ReactNode> = {
    db: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    cpu: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
      </svg>
    ),
    net: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    msg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    key: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    file: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    pay: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    eye: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
    cache: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 9 8 12 2 12" />
      </svg>
    ),
    gear: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    algo: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h4L12 4l4 16h4" /><line x1="2" y1="16" x2="22" y2="16" />
      </svg>
    ),
  };
  return <span className="domain-card-icon">{icons[type]}</span>;
};

const Dashboard: React.FC<DashboardProps> = ({ themeMode, onThemeModeChange }) => {
  // Compute live stats
  const enriched = categories.map((cat) => {
    const subs = getSubTopicsForCategory(cat.id);
    return { ...cat, count: subs.length };
  });
  const totalTopics = enriched.reduce((sum, c) => sum + c.count, 0);
  const activeCategories = enriched.filter((c) => c.count > 0).length;

  // Find first category with content for the CTA
  const firstWithContent = enriched.find((c) => c.count > 0);

  return (
    <div className="dashboard">
      <div className="dashboard-theme-control">
        <label className="theme-compact">
          <span>Theme</span>
          <select
            value={themeMode}
            onChange={(event) => onThemeModeChange(event.target.value as ThemeMode)}
            aria-label="Theme"
          >
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Hero */}
      <section className="dashboard-hero">
        <h1>LLD Interview Prep</h1>
        <p>
          Master Low Level Design through carefully curated architectural problems,
          design patterns, and production-grade solutions.
        </p>
        {firstWithContent && (
          <Link to={`/topic/${firstWithContent.id}`} className="dashboard-cta">
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
            </svg>
          </Link>
        )}
      </section>

      {/* Live stats bar */}
      <section className="dashboard-stats">
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{categories.length}</span>
          <span className="dashboard-stat-label">Domains</span>
        </div>
        <div className="dashboard-stat-divider" />
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{totalTopics}</span>
          <span className="dashboard-stat-label">Topics</span>
        </div>
        <div className="dashboard-stat-divider" />
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{activeCategories}</span>
          <span className="dashboard-stat-label">Active</span>
        </div>
      </section>

      {/* Domain grid */}
      <section className="dashboard-grid">
        {enriched.map((cat) => (
          <Link key={cat.id} to={`/topic/${cat.id}`} className="domain-card glass-panel">
            <div className="domain-card-top">
              <CategoryIcon type={cat.icon} />
              {cat.count > 0 && (
                <span className="domain-card-badge">{cat.count}</span>
              )}
            </div>
            <h3 className="domain-card-title">{cat.title}</h3>
            <span className="domain-card-link">
              {cat.count > 0 ? 'Explore' : 'Coming soon'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default Dashboard;

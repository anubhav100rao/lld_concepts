import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ContentPage from './pages/ContentPage';
import BackToTop from './components/BackToTop';
import ReadingProgress from './components/ReadingProgress';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'lld-theme-mode';

function getInitialThemeMode(): ThemeMode {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const KeyboardShortcuts = () => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K to focus sidebar search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('.sidebar-search-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return null;
};

const App: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  useEffect(() => {
    const root = document.documentElement;

    if (themeMode === 'system') {
      root.removeAttribute('data-theme');
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      root.setAttribute('data-theme', themeMode);
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    }
  }, [themeMode]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <KeyboardShortcuts />
      <ReadingProgress />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<Dashboard themeMode={themeMode} onThemeModeChange={setThemeMode} />}
            />
            <Route path="/topic/:slug" element={<ContentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <BackToTop />
    </BrowserRouter>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ReadingProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const isContentPage = location.pathname.startsWith('/topic/');

  useEffect(() => {
    if (!isContentPage) {
      return;
    }

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    const frameId = window.requestAnimationFrame(onScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isContentPage, location.pathname]);

  if (!isContentPage || progress === 0) return null;

  return (
    <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
  );
};

export default ReadingProgress;

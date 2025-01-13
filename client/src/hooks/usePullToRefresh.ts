import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  pullDistance?: number;
  resistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  pullDistance = 100,
  resistance = 2.5,
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const pullDeltaY = useRef(0);
  const isScrolled = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when at the top of the page
      isScrolled.current = window.scrollY > 0;
      if (isScrolled.current) return;

      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isScrolled.current || isRefreshing) return;

      const touchY = e.touches[0].clientY;
      pullDeltaY.current = (touchY - touchStartY.current) / resistance;

      if (pullDeltaY.current > 0) {
        e.preventDefault();
        const progress = Math.min((pullDeltaY.current / pullDistance) * 100, 100);
        setPullProgress(progress);

        // Add visual feedback
        document.body.style.setProperty('--pull-distance', `${pullDeltaY.current}px`);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isScrolled.current) return;

      if (pullDeltaY.current >= pullDistance) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      // Reset
      pullDeltaY.current = 0;
      setPullProgress(0);
      setIsPulling(false);
      document.body.style.removeProperty('--pull-distance');
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, onRefresh, pullDistance, resistance]);

  return {
    isPulling,
    isRefreshing,
    pullProgress,
  };
} 
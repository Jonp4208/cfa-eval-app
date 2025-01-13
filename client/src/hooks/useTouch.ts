import { useEffect, useRef, useState } from 'react';

interface TouchState {
  startX: number;
  startY: number;
  moveX: number;
  moveY: number;
  isMoving: boolean;
}

interface TouchCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface UseTouchOptions {
  threshold?: number;
  preventScroll?: boolean;
}

export function useTouch(
  callbacks: TouchCallbacks,
  options: UseTouchOptions = {}
) {
  const { threshold = 50, preventScroll = false } = options;
  const touchRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    moveX: 0,
    moveY: 0,
    isMoving: false,
  });
  const [isTouching, setIsTouching] = useState(false);

  useEffect(() => {
    const element = document;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        moveX: 0,
        moveY: 0,
        isMoving: false,
      };
      startTime = Date.now();
      setIsTouching(true);

      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchRef.current.isMoving) {
        touchRef.current.isMoving = true;
      }

      const touch = e.touches[0];
      touchRef.current.moveX = touch.clientX - touchRef.current.startX;
      touchRef.current.moveY = touch.clientY - touchRef.current.startY;

      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchDuration = Date.now() - startTime;
      const isQuickTouch = touchDuration < 300;

      if (touchRef.current.isMoving && isQuickTouch) {
        const { moveX, moveY } = touchRef.current;
        const absX = Math.abs(moveX);
        const absY = Math.abs(moveY);

        if (absX > threshold || absY > threshold) {
          if (absX > absY) {
            // Horizontal swipe
            if (moveX > 0) {
              callbacks.onSwipeRight?.();
            } else {
              callbacks.onSwipeLeft?.();
            }
          } else {
            // Vertical swipe
            if (moveY > 0) {
              callbacks.onSwipeDown?.();
            } else {
              callbacks.onSwipeUp?.();
            }
          }
        }
      }

      touchRef.current.isMoving = false;
      setIsTouching(false);

      if (preventScroll) {
        e.preventDefault();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventScroll });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [callbacks, threshold, preventScroll]);

  return { isTouching };
} 
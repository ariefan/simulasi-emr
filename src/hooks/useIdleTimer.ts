import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIdleTimerOptions {
  timeoutMs?: number; // Inactivity threshold before showing warning (default 2 mins)
  countdownMs?: number; // Countdown before auto-resetting (default 15s)
  onReset: () => void;
  enabled?: boolean;
}

export function useIdleTimer({
  timeoutMs = 120_000,
  countdownMs = 15_000,
  onReset,
  enabled = true,
}: UseIdleTimerOptions) {
  const [isWarning, setIsWarning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(Math.ceil(countdownMs / 1000));

  const timeoutTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const countdownEndRef = useRef<number>(0);

  const clearAllTimers = useCallback(() => {
    if (timeoutTimerRef.current) {
      window.clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const triggerReset = useCallback(() => {
    clearAllTimers();
    setIsWarning(false);
    onReset();
  }, [clearAllTimers, onReset]);

  const stayActive = useCallback(() => {
    clearAllTimers();
    setIsWarning(false);

    if (!enabled) return;

    // Start idle timer
    timeoutTimerRef.current = window.setTimeout(() => {
      setIsWarning(true);
      const totalSeconds = Math.ceil(countdownMs / 1000);
      setSecondsRemaining(totalSeconds);
      countdownEndRef.current = Date.now() + countdownMs;

      // Start countdown tick
      countdownIntervalRef.current = window.setInterval(() => {
        const left = Math.max(0, Math.ceil((countdownEndRef.current - Date.now()) / 1000));
        setSecondsRemaining(left);

        if (left <= 0) {
          triggerReset();
        }
      }, 500);
    }, timeoutMs);
  }, [clearAllTimers, countdownMs, enabled, timeoutMs, triggerReset]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setIsWarning(false);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleActivity = () => {
      // If we are already in warning mode, only explicit button clicks in modal should dismiss,
      // or we can dismiss warning on deliberate key/click
      if (!isWarning) {
        stayActive();
      }
    };

    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    stayActive();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
      clearAllTimers();
    };
  }, [enabled, isWarning, stayActive, clearAllTimers]);

  return {
    isWarning,
    secondsRemaining,
    stayActive,
    triggerReset,
  };
}

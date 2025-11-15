import { useCallback, useEffect, useMemo, useRef } from 'react';

type DebouncedFunction<T extends (...args: Array<any>) => void> = ((
  ...args: Parameters<T>
) => void) & { cancel: () => void };

/**
 * Returns a stable debounced callback that can be cancelled manually.
 */
export function useDebouncedCallback<T extends (...args: Array<any>) => void>(
  callback: T,
  delay: number
): DebouncedFunction<T> {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return useMemo(() => {
    const debounced = debouncedFn as DebouncedFunction<T>;
    debounced.cancel = cancel;
    return debounced;
  }, [debouncedFn, cancel]);
}

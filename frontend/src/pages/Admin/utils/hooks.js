import { useState, useEffect, useRef, useCallback } from 'react';

// Debounce hook
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Cache hook for API calls
export function useCache(key, fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cache = useRef({});

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Check cache first
      if (cache.current[key]) {
        setData(cache.current[key]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await fetchFn();
        if (isMounted) {
          cache.current[key] = result;
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [key, ...dependencies]);

  const invalidateCache = useCallback(() => {
    delete cache.current[key];
  }, [key]);

  return { data, loading, error, invalidateCache };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [options]);

  return [targetRef, isIntersecting];
}

import { useEffect, useRef, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useDebouncedCallback(callback, delay = 300) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => cbRef.current(...args), delay);
  };
}

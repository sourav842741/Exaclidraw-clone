import { useEffect } from 'react';

export function useHotkeys(handlers, deps = []) {
  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      for (const [combo, fn] of Object.entries(handlers)) {
        const parts = combo.split('+').map((p) => p.toLowerCase());
        const wantsCtrl = parts.includes('ctrl');
        const wantsShift = parts.includes('shift');
        const wantsAlt = parts.includes('alt');
        const keyPart = parts[parts.length - 1];
        const baseMatches = wantsCtrl === ctrl && wantsShift === shift && wantsAlt === alt;
        if (!baseMatches) continue;
        if (ctrl && !wantsCtrl) continue;
        if (key === keyPart) {
          e.preventDefault();
          fn(e);
          break;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

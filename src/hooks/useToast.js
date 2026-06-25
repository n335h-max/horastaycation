import { useState, useCallback, useEffect } from 'react';
import { TOAST_DURATION_MS } from '../lib/constants';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!toasts.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, TOAST_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  const pushToast = useCallback((message, type = 'info', icon = 'email') => {
    setToasts((current) => [...current, { id: crypto.randomUUID(), message, type, icon }]);
  }, []);

  return {
    toasts,
    pushToast,
  };
}

import { useRef } from 'react';

/**
 * A custom hook to prevent double submissions.
 * It provides a `withLock` wrapper that synchronously locks the execution
 * of the provided async function until it completes.
 */
export const useSubmitLock = () => {
  const isSubmitting = useRef(false);

  const withLock = (fn) => async (...args) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      await fn(...args);
    } finally {
      isSubmitting.current = false;
    }
  };

  return { withLock, isSubmitting };
};

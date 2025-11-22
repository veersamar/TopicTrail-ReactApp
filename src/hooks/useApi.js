import { useState, useCallback } from 'react';

export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'https://localhost:7083';
  const timeout = parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000;

  const fetch = useCallback(
    async (method = 'GET', body = null) => {
      try {
        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await window.fetch(`${apiUrl}${url}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            ...options.headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          ...options,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        return result;
      } catch (err) {
        const errorMsg = err.name === 'AbortError' ? 'Request timeout' : err.message;
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, timeout, options]
  );

  return { data, loading, error, fetch };
}
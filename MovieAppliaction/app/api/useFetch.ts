import { apiCallWithManualRefresh } from "@/shared/apiWithManualRefresh";
import { useState, useEffect } from "react";

export const useFetch = <T,>(fetchFunction: () => Promise<T>, autoFetch = true) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCallWithManualRefresh(() => fetchFunction());
      setData(result);
    } catch (error) {
      setError(error instanceof Error ? error : new Error("An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(true);
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, []);

  return { data, error, loading, refetch: fetchData, reset };
};

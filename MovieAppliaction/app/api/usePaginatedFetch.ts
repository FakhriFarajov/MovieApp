import { useEffect, useState } from "react";
import { api } from "./AuthContext";
import { apiCallWithManualRefresh } from "@/shared/apiWithManualRefresh";

interface PaginatedResult<T> {
  results: T[];
  total_pages: number;
  total_results: number;
}

export const usePaginatedFetch = <T>(
  fetchFunction: (page: number) => Promise<PaginatedResult<T>>,
  deps: any[] = [],
  autoFetch = true
) => {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCallWithManualRefresh(() => fetchFunction(p));
      if (p === 1) {
        setData(result.results);
      } else {
        setData(prev => [...prev, ...result.results]);
      }
      setTotalPages(result.total_pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setPage(p);
    }
  };

  const nextPage = () => {
    if (page < totalPages) setPage(prev => prev + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(prev => prev - 1);
  };

  const reset = () => {
    setData([]);
    setPage(1);
    setTotalPages(1);
    setError(null);
  };

  useEffect(() => {
    if (autoFetch) fetchPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ...deps]); // refetch on page change or dependencies change

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    setPage: goToPage,
    nextPage,
    prevPage,
    refetch: () => fetchPage(page),
    refetchPage: (p: number) => fetchPage(p),
    reset,
  };
};

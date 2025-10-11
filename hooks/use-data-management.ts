import { useState, useEffect, useCallback } from 'react';
import apiClient, { 
  Indicator, 
  IndicatorData, 
  CreateIndicatorRequest, 
  CreateIndicatorDataRequest,
  DashboardStats,
  IndicatorFilters,
  IndicatorDataFilters 
} from '@/lib/api-client';
import { toast } from 'sonner';

// Hook for dashboard statistics
export function useDashboardStats(category?: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [accessibleCategories, setAccessibleCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getDashboardStats(category);
      
      if (response.success) {
        setStats(response.data.statistics);
        setUserRole(response.data.user_role);
        setAccessibleCategories(response.data.accessible_categories);
      } else {
        setError(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    userRole,
    accessibleCategories,
    loading,
    error,
    refetch: fetchStats
  };
}

// Hook for indicators management
export function useIndicators(filters: IndicatorFilters = {}) {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  });
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getIndicators(filters);
      
      if (response.success) {
        setIndicators(response.data.indicators);
        setPagination(response.data.pagination);
        setStatistics(response.data.statistics);
      } else {
        setError(response.error || 'Failed to fetch indicators');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.search, filters.category, filters.subcategory, filters.status]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  const createIndicator = async (data: CreateIndicatorRequest) => {
    try {
      const response = await apiClient.createIndicator(data);
      
      if (response.success) {
        toast.success('Indikator berhasil dibuat');
        fetchIndicators(); // Refresh list
        return response.data;
      } else {
        toast.error(response.error || 'Gagal membuat indikator');
        throw new Error(response.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const updateIndicator = async (id: string, data: Partial<CreateIndicatorRequest>) => {
    try {
      const response = await apiClient.updateIndicator(id, data);
      
      if (response.success) {
        toast.success('Indikator berhasil diperbarui');
        fetchIndicators(); // Refresh list
        return response.data;
      } else {
        toast.error(response.error || 'Gagal memperbarui indikator');
        throw new Error(response.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const deleteIndicator = async (id: string) => {
    try {
      const response = await apiClient.deleteIndicator(id);
      
      if (response.success) {
        toast.success('Indikator berhasil dihapus');
        fetchIndicators(); // Refresh list
        return response.data;
      } else {
        toast.error(response.error || 'Gagal menghapus indikator');
        throw new Error(response.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  return {
    indicators,
    pagination,
    statistics,
    loading,
    error,
    refetch: fetchIndicators,
    createIndicator,
    updateIndicator,
    deleteIndicator
  };
}

// Hook for indicator data management
export function useIndicatorData(filters: IndicatorDataFilters = {}) {
  const [data, setData] = useState<IndicatorData[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  });
  const [statistics, setStatistics] = useState<any>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicatorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getIndicatorData(filters);
      
      if (response.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
        setStatistics(response.data.statistics);
        setAvailableYears(response.data.available_years);
      } else {
        setError(response.error || 'Failed to fetch indicator data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.search, filters.year, filters.status, filters.indicator_id, filters.category]);

  useEffect(() => {
    fetchIndicatorData();
  }, [fetchIndicatorData]);

  const createIndicatorData = async (dataReq: CreateIndicatorDataRequest) => {
    try {
      const response = await apiClient.createIndicatorData(dataReq);
      
      if (response.success) {
        toast.success('Data indikator berhasil dibuat');
        fetchIndicatorData(); // Refresh list
        return response.data;
      } else {
        // Check if it's a duplicate error (409)
        if (response.status === 409) {
          const error = new Error(response.error || 'Data sudah ada');
          (error as any).status = 409;
          throw error;
        }
        
        toast.error(response.error || 'Gagal membuat data indikator');
        throw new Error(response.error);
      }
    } catch (err: any) {
      // Don't show toast for duplicate errors - let form handle it
      if (err.status !== 409) {
        toast.error(err instanceof Error ? err.message : 'Unknown error');
      }
      throw err;
    }
  };

  const updateIndicatorData = async (id: string, dataReq: Partial<CreateIndicatorDataRequest>) => {
    try {
      const response = await apiClient.updateIndicatorData(id, dataReq);
      
      if (response.success) {
        toast.success('Data indikator berhasil diperbarui');
        fetchIndicatorData(); // Refresh list
        return response.data;
      } else {
        toast.error(response.error || 'Gagal memperbarui data indikator');
        throw new Error(response.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const deleteIndicatorData = async (id: string) => {
    try {
      const response = await apiClient.deleteIndicatorData(id);
      
      if (response.success) {
        toast.success('Data indikator berhasil dihapus');
        fetchIndicatorData(); // Refresh list
        return response.data;
      } else {
        toast.error(response.error || 'Gagal menghapus data indikator');
        throw new Error(response.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const verifyIndicatorData = async (id: string) => {
    try {
      const response = await apiClient.verifyIndicatorData(id);
      
      if (response.success) {
        toast.success('Data indikator berhasil diverifikasi');
        fetchIndicatorData(); // Refresh list
        return response.data;
      } else {
        toast.error(response.error || 'Gagal memverifikasi data indikator');
        throw new Error(response.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  return {
    data,
    pagination,
    statistics,
    availableYears,
    loading,
    error,
    refetch: fetchIndicatorData,
    createIndicatorData,
    updateIndicatorData,
    deleteIndicatorData,
    verifyIndicatorData
  };
}

// Hook for single indicator
export function useIndicator(id: string | null) {
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicator = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getIndicator(id);
      
      if (response.success) {
        setIndicator(response.data);
      } else {
        setError(response.error || 'Failed to fetch indicator');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIndicator();
  }, [fetchIndicator]);

  return {
    indicator,
    loading,
    error,
    refetch: fetchIndicator
  };
}

// Hook for single indicator data
export function useIndicatorDataItem(id: string | null) {
  const [indicatorData, setIndicatorData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicatorData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getIndicatorDataById(id);
      
      if (response.success) {
        setIndicatorData(response.data);
      } else {
        setError(response.error || 'Failed to fetch indicator data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIndicatorData();
  }, [fetchIndicatorData]);

  return {
    indicatorData,
    loading,
    error,
    refetch: fetchIndicatorData
  };
}
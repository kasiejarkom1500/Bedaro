// API Client for BPS Bungo BEDARO Admin Dashboard

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  status?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface IndicatorFilters extends PaginationParams {
  category?: string;
  subcategory?: string;
  status?: 'active' | 'inactive';
}

interface IndicatorDataFilters extends PaginationParams {
  year?: number;
  status?: 'draft' | 'preliminary' | 'final';
  indicator_id?: string;
  indicator_name?: string;
  category?: string;
  subcategory?: string;
  excludeSubcategory?: string;
}

interface Indicator {
  id: string;
  code?: string;
  no: number;
  indikator: string;
  kategori: 'Statistik Ekonomi' | 'Statistik Demografi & Sosial' | 'Statistik Lingkungan Hidup & Multi-Domain';
  subcategory?: string;
  satuan: string;
  source?: string;
  methodology?: string;
  deskripsi?: string;
  is_active: boolean;
  created_by?: string;
  updated_by?: string;
  category_id?: string;
  created_at?: string;
  updated_at?: string;
  category_name?: string;
  created_by_name?: string;
  updated_by_name?: string;
  // Metadata fields
  level?: string;
  wilayah?: string;
  periode?: string;
  period_type?: 'yearly' | 'monthly' | 'quarterly';
  konsep_definisi?: string;
  metode_perhitungan?: string;
  interpretasi?: string;
}

interface IndicatorData {
  id: string;
  indicator_id: string;
  year: number;
  period_month?: number; // New field for monthly data (1-12)
  period_quarter?: number; // New field for quarterly data (1-4)
  value?: number;
  status: 'draft' | 'preliminary' | 'final';
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_by?: string;
  source_document?: string;
  revision_number: number;
  created_at?: string;
  updated_at?: string;
  indicator_name?: string;
  indicator_code?: string;
  subcategory?: string;
  kategori?: string;
  satuan?: string;
  created_by_name?: string;
  verified_by_name?: string;
  updated_by_name?: string;
}

interface CreateIndicatorRequest {
  code?: string;
  no: number;
  indikator: string;
  kategori: 'Statistik Ekonomi' | 'Statistik Demografi & Sosial' | 'Statistik Lingkungan Hidup & Multi-Domain';
  subcategory?: string;
  satuan: string;
  source?: string;
  methodology?: string;
  deskripsi?: string;
  category_id?: string;
  is_active?: boolean;
  // Metadata fields
  level?: string;
  wilayah?: string;
  periode?: string;
  period_type?: 'yearly' | 'monthly' | 'quarterly';
  konsep_definisi?: string;
  metode_perhitungan?: string;
  interpretasi?: string;
}

interface CreateIndicatorDataRequest {
  indicator_id: string;
  year?: number;
  period_month?: number;
  period_quarter?: number;
  value?: number;
  status?: 'draft' | 'preliminary' | 'final';
  notes?: string;
  source_document?: string;
}

interface DashboardStats {
  indicators: {
    total: number;
    active: number;
    inactive: number;
  };
  data: {
    total_data_points: number;
    indicators_with_data: number;
    years_covered: number;
    draft: number;
    preliminary: number;
    final: number;
    verified: number;
    earliest_year: number;
    latest_year: number;
  };
  recent_activities: Array<{
    id: string;
    action: string;
    target_type: string;
    target_id: string;
    user_name: string;
    created_at: string;
    details?: any;
  }>;
  category_breakdown: Array<{
    category: string;
    indicator_count: number;
    data_count: number;
    last_updated: string;
  }>;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    // Get token from localStorage if available
    this.refreshToken();
  }

  refreshToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Refresh token from localStorage before each request
    this.refreshToken();
    
    const url = `${this.baseURL}/api${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = data.error || `HTTP ${response.status}: ${response.statusText}`;
        const errorObj = new Error(error);
        (errorObj as any).status = response.status;
        
        return {
          success: false,
          data: null as T,
          error: error,
          status: response.status
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        data: null as T,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Dashboard API
  async getDashboardStats(category?: string): Promise<ApiResponse<{
    statistics: DashboardStats;
    user_role: string;
    accessible_categories: string[];
    current_filter: string;
  }>> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    return this.request(`/admin/dashboard${params.toString() ? `?${params}` : ''}`);
  }

  // Indicators API
  async getIndicators(filters: IndicatorFilters = {}): Promise<ApiResponse<{
    indicators: Indicator[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
    statistics: any;
    category: string;
  }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    return this.request(`/admin/indicators${params.toString() ? `?${params}` : ''}`);
  }

  async getIndicator(id: string): Promise<ApiResponse<Indicator>> {
    return this.request(`/admin/indicators/${id}`);
  }

  async createIndicator(data: CreateIndicatorRequest): Promise<ApiResponse<{ id: string; message: string }>> {
    return this.request('/admin/indicators', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIndicator(id: string, data: Partial<CreateIndicatorRequest>): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/indicators/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIndicator(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/indicators/${id}`, {
      method: 'DELETE',
    });
  }

  // Indicator Data API
  async getIndicatorData(filters: IndicatorDataFilters = {}): Promise<ApiResponse<{
    data: IndicatorData[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
    statistics: any;
    available_years: number[];
    category: string;
    filters_applied: any;
  }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });

    return this.request(`/admin/indicator-data${params.toString() ? `?${params}` : ''}`);
  }

  async getIndicatorDataById(id: string): Promise<ApiResponse<IndicatorData>> {
    return this.request(`/admin/indicator-data/${id}`);
  }

  async createIndicatorData(data: CreateIndicatorDataRequest): Promise<ApiResponse<{ id: string; message: string }>> {
    return this.request('/admin/indicator-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIndicatorData(id: string, data: Partial<CreateIndicatorDataRequest>): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/indicator-data/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIndicatorData(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/admin/indicator-data/${id}`, {
      method: 'DELETE',
    });
  }

  async verifyIndicatorData(id: string): Promise<ApiResponse<{
    message: string;
    verified_by: string;
    verified_at: string;
  }>> {
    return this.request(`/admin/indicator-data/${id}/verify`, {
      method: 'POST',
    });
  }

  // Export Data Methods
  async exportData(filters: {
    category?: string;
    indicator_id?: string;
    year_range?: { start: number; end: number };
  } = {}): Promise<Blob> {
    // Refresh token from localStorage before request
    this.refreshToken();
    
    const params = new URLSearchParams();
    
    if (filters.category) {
      params.append('category', filters.category);
    }
    if (filters.indicator_id) {
      params.append('indicator_id', filters.indicator_id);
    }
    if (filters.year_range) {
      params.append('year_start', filters.year_range.start.toString());
      params.append('year_end', filters.year_range.end.toString());
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/api/export?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
  }

  async getIndicatorsForExport(category?: string): Promise<ApiResponse<{ id: string; name: string; subcategory: string }[]>> {
    const params = new URLSearchParams();
    if (category) {
      params.append('category', category);
    }
    
    return this.request(`/indicators/export-list${params.toString() ? `?${params}` : ''}`);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;

export type {
  ApiResponse,
  Indicator,
  IndicatorData,
  CreateIndicatorRequest,
  CreateIndicatorDataRequest,
  DashboardStats,
  IndicatorFilters,
  IndicatorDataFilters,
  PaginationParams
};

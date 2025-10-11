import type { IndicatorData } from '@/lib/types'

// API functions for indicator data management
export async function getIndicatorData(params: {
  category?: string;
  indicator_id?: string;
  year?: number;
  page?: number;
  limit?: number;
}): Promise<{
  data: IndicatorData[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const token = localStorage.getItem('authToken');
  const response = await fetch(`/api/admin/indicator-data?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch indicator data');
  }

  return await response.json();
}

export async function createIndicatorData(data: {
  indicator_id: string;
  year: number;
  value: number;
  notes?: string;
}): Promise<{
  id: string;
  message: string;
}> {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/admin/indicator-data', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save indicator data');
  }

  return await response.json();
}

export async function updateIndicatorData(dataId: string, data: {
  value: number;
  notes?: string;
}): Promise<{
  message: string;
}> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`/api/admin/indicator-data?id=${dataId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update indicator data');
  }

  return await response.json();
}

export async function deleteIndicatorData(dataId: string): Promise<{
  message: string;
}> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`/api/admin/indicator-data?id=${dataId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete indicator data');
  }

  return await response.json();
}

// Bulk import functions
export async function bulkImportIndicatorData(data: Array<{
  indicator_id: string;
  year: number;
  value: number;
  notes?: string;
}>, options: {
  category?: string;
  operation?: 'upsert' | 'skip' | 'update';
}): Promise<{
  success: boolean;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}> {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/admin/bulk-import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data,
      ...options
    }),
  });

  if (!response.ok && response.status !== 207) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process bulk import');
  }

  return await response.json();
}

export async function getImportTemplate(): Promise<{
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  sample_data: any[];
}> {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/admin/bulk-import?action=template', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch import template');
  }

  return await response.json();
}

export async function getAvailableIndicators(category?: string): Promise<{
  indicators: Array<{
    id: string;
    code: string;
    indikator: string;
    kategori: string;
    satuan: string;
  }>;
}> {
  const queryParams = new URLSearchParams();
  queryParams.append('action', 'indicators');
  
  if (category) {
    queryParams.append('category', category);
  }

  const token = localStorage.getItem('authToken');
  const response = await fetch(`/api/admin/bulk-import?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch available indicators');
  }

  return await response.json();
}

// Dashboard functions
export async function getDashboardStats(category?: string): Promise<{
  category: string;
  statistics: {
    indicators: {
      total_indicators: number;
      active_indicators: number;
      inactive_indicators: number;
    };
    data: {
      total_data_points: number;
      draft_data: number;
      preliminary_data: number;
      final_data: number;
      verified_data: number;
      current_year_data: number;
    };
  };
  recent_data: Array<{
    id: string;
    indicator_name: string;
    year: number;
    value: number;
    status: string;
    updated_at: string;
    updated_by_name: string;
  }>;
  yearly_trend: Array<{
    year: number;
    data_count: number;
    verified_count: number;
  }>;
}> {
  const queryParams = new URLSearchParams();
  
  if (category) {
    queryParams.append('category', category);
  }

  const token = localStorage.getItem('authToken');
  const response = await fetch(`/api/admin/dashboard?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch dashboard statistics');
  }

  return await response.json();
}

// CSV/Excel export functions
export async function exportIndicatorData(params: {
  category?: string;
  format: 'csv' | 'excel';
  indicator_ids?: string[];
  year_range?: { start: number; end: number };
}): Promise<Blob> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        queryParams.append(key, value.join(','));
      } else if (typeof value === 'object') {
        queryParams.append(key, JSON.stringify(value));
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });

  const token = localStorage.getItem('authToken');
  const response = await fetch(`/api/admin/export?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to export data');
  }

  return await response.blob();
}

// Utility function to parse CSV file
export function parseCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            
            headers.forEach((header, index) => {
              const value = values[index];
              
              // Try to convert to appropriate types
              if (header === 'year' || header === 'value') {
                obj[header] = value && !isNaN(Number(value)) ? Number(value) : value;
              } else {
                obj[header] = value || null;
              }
            });
            
            return obj;
          });
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// API functions for indicators management
export async function getIndicators(params: {
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  indicators: any[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  statistics: any;
}> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });

  const token = localStorage.getItem('authToken');
  const response = await fetch(`/api/admin/indicators?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch indicators');
  }

  return await response.json();
}

export async function createIndicator(data: {
  name: string;
  description?: string;
  unit: string;
  category_id: string;
  is_active?: boolean;
}): Promise<{
  id: string;
  message: string;
}> {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/admin/indicators', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create indicator');
  }

  return await response.json();
}

// API functions for categories management
export async function getCategories(): Promise<{
  categories: any[];
}> {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/admin/categories', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return await response.json();
}
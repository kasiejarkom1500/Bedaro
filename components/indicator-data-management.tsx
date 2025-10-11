import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import apiClient from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Database,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  BarChart3,
  Activity,
  Sparkles,
  Eye,
  User,
  Users,
  Calendar,
  BarChart,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp
} from "lucide-react";
import { useIndicatorData, useDashboardStats } from "@/hooks/use-data-management";
import { CreateIndicatorDataRequest, IndicatorData } from "@/lib/api-client";
import { IndicatorDataForm } from "./indicator-data-form";
import { InflationDataForm } from "./inflation-data-form";

// Helper function to format numbers for display in table (2 decimal places)
const formatTableValue = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '-';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

interface IndicatorDataManagementProps {
  category: string;
  onSessionUpdate?: () => void;
}

type SortField = 'indicator_name' | 'subcategory' | 'year' | 'value' | 'status' | 'month' | 'period_month';
type SortDirection = 'asc' | 'desc';

export function IndicatorDataManagement({ category, onSessionUpdate }: IndicatorDataManagementProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [indicatorFilter, setIndicatorFilter] = useState<string | undefined>(undefined);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInflationDialogOpen, setIsInflationDialogOpen] = useState(false);
  const [inflationIndicators, setInflationIndicators] = useState<any[]>([]);
  const [allInflationData, setAllInflationData] = useState<IndicatorData[]>([]);
  const [allIndicatorsForFilter, setAllIndicatorsForFilter] = useState<string[]>([]);
  const [allSubcategoriesForFilter, setAllSubcategoriesForFilter] = useState<string[]>([]);
  const [editingData, setEditingData] = useState<IndicatorData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  
  // Inflation table specific states
  const [inflationSearch, setInflationSearch] = useState('');
  const [inflationIndicatorFilter, setInflationIndicatorFilter] = useState<string | undefined>(undefined);
  const [inflationStatusFilter, setInflationStatusFilter] = useState<string | undefined>(undefined);
  const [inflationYearFilter, setInflationYearFilter] = useState<string | undefined>(undefined);
  const [inflationSortField, setInflationSortField] = useState<SortField | null>(null);
  const [inflationSortDirection, setInflationSortDirection] = useState<SortDirection>('desc');
  const [selectedInflationData, setSelectedInflationData] = useState<Set<string>>(new Set());
  const [selectAllInflation, setSelectAllInflation] = useState(false);
  const [isBulkDeleteInflationDialogOpen, setIsBulkDeleteInflationDialogOpen] = useState(false);
  
  // Inflation pagination states
  const [inflationPage, setInflationPage] = useState(1);
  const [inflationLimit, setInflationLimit] = useState(10);
  
  // Checkbox selection states
  const [selectedData, setSelectedData] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [deletingData, setDeletingData] = useState<IndicatorData | null>(null);
  const [detailData, setDetailData] = useState<IndicatorData | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // State untuk dialog konfirmasi dan pesan sukses
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [verifyingData, setVerifyingData] = useState<IndicatorData | null>(null);

  const { 
    data: allData, 
    pagination, 
    statistics, 
    availableYears,
    loading, 
    error, 
    createIndicatorData,
    updateIndicatorData,
    deleteIndicatorData,
    verifyIndicatorData,
    refetch
  } = useIndicatorData({ 
    page, 
    limit: limit, 
    search: search || undefined,
    year: yearFilter,
    status: statusFilter as any,
    indicator_name: indicatorFilter,
    category: category,
    excludeSubcategory: "Inflasi" // Now supported by backend
  });

  // Fetch inflation indicators for the inflation form
  useEffect(() => {
    const fetchInflationIndicators = async () => {
      try {
        const response = await fetch('/api/public/indicators?category=Statistik%20Ekonomi&subcategory=Inflasi');
        if (response.ok) {
          const result = await response.json();
          setInflationIndicators(result.data.indicators || []);
        }
      } catch (error) {
        console.error('Error fetching inflation indicators:', error);
      }
    };

    if (isInflationDialogOpen) {
      fetchInflationIndicators();
    }
  }, [isInflationDialogOpen]);

  // Fetch all indicators for filter dropdown (without any pagination or search filters)
  const fetchAllIndicators = useCallback(async () => {
    try {
      console.log('DEBUG: fetchAllIndicators called for category:', category);
      
      // Get all data (including inflation) for inflation table
      const allDataResponse = await apiClient.getIndicatorData({
        category: category,
        limit: 10000,
        page: 1
      });

      console.log('DEBUG: allDataResponse:', allDataResponse.success, allDataResponse.data?.data?.length);

      // Get filtered data (excluding inflation) for main dropdown
      const filteredDataResponse = await apiClient.getIndicatorData({
        category: category,
        limit: 10000,
        page: 1,
        excludeSubcategory: "Inflasi"
      });
      
      console.log('DEBUG: filteredDataResponse:', filteredDataResponse.success, filteredDataResponse.data?.data?.length);
      
      if (allDataResponse.success && allDataResponse.data?.data) {
        const indicators = new Set<string>();
        const subcategories = new Set<string>();
        const inflationItems: IndicatorData[] = [];
        
        console.log('DEBUG: Processing allDataResponse with', allDataResponse.data.data.length, 'items');
        
        // Extract indicators from filtered data (excluding inflation)
        if (filteredDataResponse.success && filteredDataResponse.data?.data) {
          filteredDataResponse.data.data.forEach((item: any) => {
            if (item.indicator_name && item.indicator_name.trim()) {
              indicators.add(item.indicator_name.trim());
            }
            if (item.subcategory && item.subcategory.trim()) {
              subcategories.add(item.subcategory.trim());
            }
          });
        }
        
        // Extract inflation data from all data for inflation table
        allDataResponse.data.data.forEach((item: any) => {
          console.log('DEBUG: Checking item subcategory:', item.subcategory, 'full item:', item);
          if (item.subcategory === "Inflasi") {
            inflationItems.push(item);
            console.log('DEBUG: Found inflation item:', item.indicator_name);
          }
        });
        
        console.log('DEBUG: Final inflation items found:', inflationItems.length);
        
        const indicatorArray = Array.from(indicators).sort();
        const subcategoryArray = Array.from(subcategories).sort();
        
        console.log('DEBUG: Setting state - indicators:', indicatorArray.length, 'subcategories:', subcategoryArray.length, 'inflation:', inflationItems.length);
        
        // Set to state
        setAllIndicatorsForFilter(indicatorArray);
        setAllSubcategoriesForFilter(subcategoryArray);
        setAllInflationData(inflationItems);
      } else {
        console.error('Failed to fetch indicators:', allDataResponse.error);
        // Fallback: use empty array if fetch fails
        setAllIndicatorsForFilter([]);
        setAllSubcategoriesForFilter([]);
        setAllInflationData([]);
      }
    } catch (error) {
      console.error('Error fetching all indicators for filter:', error);
      // Fallback: use empty array if fetch fails
      setAllIndicatorsForFilter([]);
      setAllSubcategoriesForFilter([]);
      setAllInflationData([]);
    }
  }, [category]);

  useEffect(() => {
    // Fetch indicators when component mounts or category changes
    fetchAllIndicators();
  }, [fetchAllIndicators]);

  // Data is now properly filtered by backend
  const data = useMemo(() => {
    // allData already comes filtered from backend with excludeSubcategory support
    return allData;
  }, [allData]);

  // Separate inflation data for dedicated table with pagination
  const { paginatedInflationData, inflationPagination } = useMemo(() => {
    let filteredInflationData = [...allInflationData];
    
    console.log('allInflationData length:', allInflationData.length);
    
    // Apply search filter
    if (inflationSearch) {
      filteredInflationData = filteredInflationData.filter(item =>
        item.indicator_name?.toLowerCase().includes(inflationSearch.toLowerCase()) ||
        item.notes?.toLowerCase().includes(inflationSearch.toLowerCase())
      );
    }
    
    // Apply indicator filter
    if (inflationIndicatorFilter) {
      filteredInflationData = filteredInflationData.filter(item =>
        item.indicator_name === inflationIndicatorFilter
      );
    }
    
    // Apply status filter
    if (inflationStatusFilter) {
      filteredInflationData = filteredInflationData.filter(item =>
        item.status === inflationStatusFilter
      );
    }
    
    // Apply year filter
    if (inflationYearFilter) {
      filteredInflationData = filteredInflationData.filter(item =>
        item.year?.toString() === inflationYearFilter
      );
    }
    
    // Apply sorting logic to inflation data
    if (inflationSortField) {
      filteredInflationData = [...filteredInflationData].sort((a, b) => {
        let aValue: any = (a as any)[inflationSortField];
        let bValue: any = (b as any)[inflationSortField];
        
        // Handle month field specifically
        if (inflationSortField === 'month') {
          aValue = (a as any).period_month || (a as any).month || 0;
          bValue = (b as any).period_month || (b as any).month || 0;
        }

        // Handle different data types
        if (inflationSortField === 'year' || inflationSortField === 'value' || inflationSortField === 'month' || inflationSortField === 'period_month') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return inflationSortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return inflationSortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // Calculate pagination
    const totalItems = filteredInflationData.length;
    const totalPages = Math.ceil(totalItems / inflationLimit);
    const startIndex = (inflationPage - 1) * inflationLimit;
    const endIndex = startIndex + inflationLimit;
    const paginatedData = filteredInflationData.slice(startIndex, endIndex);

    const paginationInfo = {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: inflationPage,
      per_page: inflationLimit,
      has_next: inflationPage < totalPages,
      has_prev: inflationPage > 1
    };

    return {
      paginatedInflationData: paginatedData,
      inflationPagination: paginationInfo
    };
  }, [allInflationData, inflationSearch, inflationIndicatorFilter, inflationStatusFilter, inflationYearFilter, inflationSortField, inflationSortDirection, inflationPage, inflationLimit]);

  // Get user role for subcategory filtering
  const { userRole } = useDashboardStats(category);

  // Generate unique indicators from filtered data (already excluding inflation)
  const availableIndicators = useMemo(() => {
    // allIndicatorsForFilter now comes from filtered data (excluding inflation)
    
    // Fallback: if allIndicatorsForFilter is empty, use data from allData as backup
    if (allIndicatorsForFilter.length === 0 && allData.length > 0) {
      console.log('Using fallback indicators from allData');
      const fallbackIndicators = new Set<string>();
      allData.forEach(item => {
        if (item.indicator_name && item.indicator_name.trim()) {
          fallbackIndicators.add(item.indicator_name.trim());
        }
      });
      return Array.from(fallbackIndicators).sort();
    }
    
    // No need to filter again since allIndicatorsForFilter already excludes inflation
    return allIndicatorsForFilter;
  }, [allIndicatorsForFilter, allData]);

  // Generate unique subcategories from ALL data (not just paginated/filtered data)
  // This ensures consistent subcategory list regardless of current page or search
  const availableSubcategories = useMemo(() => {
    // Use the separately fetched subcategories that include ALL data from database
    
    // Fallback: if allSubcategoriesForFilter is empty, use data from allData as backup
    if (allSubcategoriesForFilter.length === 0 && allData.length > 0) {
      console.log('Using fallback subcategories from allData');
      const fallbackSubcategories = new Set<string>();
      allData.forEach(item => {
        if (item.subcategory && item.subcategory.trim()) {
          fallbackSubcategories.add(item.subcategory.trim());
        }
      });
      return Array.from(fallbackSubcategories).sort();
    }
    
    return allSubcategoriesForFilter;
  }, [allSubcategoriesForFilter, allData]);

  // Helper function untuk status badge
  const getStatusBadge = (status: string, isVerified: boolean) => {
    switch (status) {
      case 'draft':
        return (
          <div className="flex items-center">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600 text-sm">Draft</span>
            </div>
          </div>
        );
      case 'preliminary':
        return (
          <div className="flex items-center">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-600 text-sm">Preliminary</span>
            </div>
          </div>
        );
      case 'final':
        return (
          <div className="flex items-center">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium text-sm">Final</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600 text-sm">{status}</span>
            </div>
          </div>
        );
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleYearFilter = (value: string) => {
    setYearFilter(value === "all" ? undefined : parseInt(value));
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? undefined : value);
    setPage(1);
  };

  const handleIndicatorFilter = (value: string) => {
    setIndicatorFilter(value === "all" ? undefined : value);
    setPage(1);
  };

  const handleLimitChange = (value: string) => {
    setLimit(parseInt(value));
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-orange-600" />
      : <ArrowDown className="w-4 h-4 text-orange-600" />;
  };

  // Inflation table helper functions
  const handleInflationSort = (field: SortField) => {
    if (inflationSortField === field) {
      setInflationSortDirection(inflationSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setInflationSortField(field);
      setInflationSortDirection('asc');
    }
  };

  const getInflationSortIcon = (field: SortField) => {
    if (inflationSortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return inflationSortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-orange-600" />
      : <ArrowDown className="w-4 h-4 text-orange-600" />;
  };

  // Checkbox selection for inflation table
  const handleInflationSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedInflationData.map((item: any) => item.id));
      setSelectedInflationData(allIds);
      setSelectAllInflation(true);
    } else {
      setSelectedInflationData(new Set());
      setSelectAllInflation(false);
    }
  };

  const handleInflationSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedInflationData);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
      setSelectAllInflation(false);
    }
    setSelectedInflationData(newSelected);
    
    // Update select all state
    if (newSelected.size === paginatedInflationData.length && paginatedInflationData.length > 0) {
      setSelectAllInflation(true);
    }
  };

  // Get available inflation indicators for filter
  const availableInflationIndicators = useMemo(() => {
    const indicators = new Set<string>();
    allInflationData.forEach(item => {
      if (item.indicator_name && item.indicator_name.trim()) {
        indicators.add(item.indicator_name.trim());
      }
    });
    return Array.from(indicators).sort();
  }, [allInflationData]);

  // Get available years from inflation data
  const availableInflationYears = useMemo(() => {
    const years = new Set<number>();
    allInflationData.forEach(item => {
      if (item.year) {
        years.add(item.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allInflationData]);

  // Handler functions for inflation filters
  const handleInflationIndicatorFilter = (value: string) => {
    setInflationIndicatorFilter(value === "all" ? undefined : value);
    setInflationPage(1); // Reset to first page when filtering
  };

  const handleInflationStatusFilter = (value: string) => {
    setInflationStatusFilter(value === "all" ? undefined : value);
    setInflationPage(1); // Reset to first page when filtering
  };

  const handleInflationYearFilter = (value: string) => {
    setInflationYearFilter(value === "all" ? undefined : value);
    setInflationPage(1); // Reset to first page when filtering
  };

  // Inflation pagination handlers
  const handleInflationLimitChange = (value: string) => {
    setInflationLimit(parseInt(value));
    setInflationPage(1); // Reset to first page when changing limit
  };

  const handleInflationSearch = (value: string) => {
    setInflationSearch(value);
    setInflationPage(1); // Reset to first page when searching
  };

  // Helper function untuk menampilkan pesan sukses
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessDialog(true);
  };

  // Checkbox selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedData);
      data.forEach(item => newSelected.add(item.id));
      setSelectedData(newSelected);
    } else {
      setSelectedData(new Set());
    }
    setSelectAll(checked);
  };

  const handleSelectData = (dataId: string, checked: boolean) => {
    const newSelected = new Set(selectedData);
    if (checked) {
      newSelected.add(dataId);
    } else {
      newSelected.delete(dataId);
    }
    setSelectedData(newSelected);
    
    // Update select all state
    if (newSelected.size === data.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  };

  const clearSelection = () => {
    setSelectedData(new Set());
    setSelectAll(false);
  };

  // Bulk delete function
  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedData).map(id => deleteIndicatorData(id));
      await Promise.all(deletePromises);
      
      setIsBulkDeleteDialogOpen(false);
      clearSelection();
      onSessionUpdate?.(); // Refresh session
      showSuccess(`${selectedData.size} data berhasil dihapus!`);
    } catch (error) {
      console.error("Error bulk deleting data:", error);
    }
  };

  const handleCreateData = async (dataReq: CreateIndicatorDataRequest) => {
    try {
      await createIndicatorData(dataReq);
      setIsCreateDialogOpen(false);
      onSessionUpdate?.(); // Refresh session
      showSuccess("Data berhasil ditambahkan!");
      // Refresh all data including inflation data
      await fetchAllIndicators();
    } catch (error: any) {
      // Re-throw the error so the form can handle it
      throw error;
    }
  };

  const handleCreateInflationData = async (dataReq: any) => {
    try {
      // Convert inflation form data to standard indicator data format
      const standardData: CreateIndicatorDataRequest = {
        indicator_id: dataReq.indicator_id,
        year: dataReq.year,
        period_month: dataReq.period_month,
        value: dataReq.value,
        notes: dataReq.notes,
        status: 'draft'
      };
      
      await createIndicatorData(standardData);
      setIsInflationDialogOpen(false);
      onSessionUpdate?.(); // Refresh session
      showSuccess("Data inflasi berhasil ditambahkan!");
      // Refresh all data including inflation data
      await fetchAllIndicators();
    } catch (error: any) {
      // Re-throw the error so the form can handle it
      throw error;
    }
  };

  const handleEditData = async (dataReq: Partial<CreateIndicatorDataRequest>) => {
    if (!editingData) return;
    
    try {
      await updateIndicatorData(editingData.id, dataReq);
      setIsEditDialogOpen(false);
      setEditingData(null);
      onSessionUpdate?.(); // Refresh session
      showSuccess("Data berhasil diperbarui!");
      // Refresh all data including inflation data
      await fetchAllIndicators();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteData = async () => {
    if (!deletingData) return;
    
    try {
      await deleteIndicatorData(deletingData.id);
      setDeletingData(null);
      setShowDeleteConfirm(false);
      onSessionUpdate?.(); // Refresh session
      showSuccess("Data berhasil dihapus!");
      // Refresh all data including inflation data
      await fetchAllIndicators();
    } catch (error) {
      // Error handled by hook
    }
  };

  const confirmDelete = (item: IndicatorData) => {
    setDeletingData(item);
    setShowDeleteConfirm(true);
  };

  const confirmVerify = (item: IndicatorData) => {
    setVerifyingData(item);
    setShowVerifyConfirm(true);
  };

  const handleVerifyData = async () => {
    if (!verifyingData) return;
    
    try {
      await verifyIndicatorData(verifyingData.id);
      setVerifyingData(null);
      setShowVerifyConfirm(false);
      onSessionUpdate?.(); // Refresh session
      showSuccess(`Data "${verifyingData.indicator_name}" berhasil diverifikasi!`);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Delete selected inflation data
  const handleBulkDeleteInflation = async () => {
    if (selectedInflationData.size === 0) return;
    
    try {
      // Delete each selected item
      for (const id of selectedInflationData) {
        await deleteIndicatorData(id);
      }
      
      // Clear selection
      setSelectedInflationData(new Set());
      setSelectAllInflation(false);
      setIsBulkDeleteInflationDialogOpen(false);
      
      onSessionUpdate?.(); // Refresh session
      // Refresh data
      await fetchAllIndicators();
      refetch();
      
      showSuccess(`${selectedInflationData.size} data inflasi berhasil dihapus!`);
    } catch (error) {
      console.error('Error deleting inflation data:', error);
    }
  };

  const startEdit = (dataItem: IndicatorData) => {
    setEditingData(dataItem);
    setIsEditDialogOpen(true);
  };

  const showDetail = (dataItem: IndicatorData) => {
    setDetailData(dataItem);
    setIsDetailDialogOpen(true);
  };

  const getCategoryDisplayName = (kategori: string) => {
    switch (kategori) {
      case 'Statistik Ekonomi':
        return 'Data Ekonomi';
      case 'Statistik Demografi & Sosial':
        return 'Data Demografi & Sosial';
      case 'Statistik Lingkungan Hidup & Multi-Domain':
        return 'Data Lingkungan & Multi-Domain';
      default:
        return kategori;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Data</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Database className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{statistics.total_data_points}</div>
              <p className="text-xs text-blue-700 mt-1">
                Rentang {statistics.earliest_year} - {statistics.latest_year}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Siap Verifikasi</CardTitle>
              <div className="p-2 bg-amber-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">{statistics.preliminary_count}</div>
              <p className="text-xs text-amber-700 mt-1">
                Menunggu persetujuan
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-800">Draft</CardTitle>
              <div className="p-2 bg-slate-200 rounded-lg">
                <Clock className="h-4 w-4 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{statistics.draft_count}</div>
              <p className="text-xs text-slate-700 mt-1">Menunggu review</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Final</CardTitle>
              <div className="p-2 bg-green-200 rounded-lg">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{statistics.final_count}</div>
              <p className="text-xs text-green-700 mt-1">Data sudah final</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                Data Indikator (Tahunan)
              </CardTitle>
              <CardDescription className="text-base">
                Kelola data indikator tahunan untuk {getCategoryDisplayName(category)}. Klik header kolom untuk mengurutkan data.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Bulk Delete Button */}
              {selectedData.size > 0 && (
                <Button
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 font-medium px-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus {selectedData.size} Data
                </Button>
              )}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden p-0 z-50">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Plus className="h-5 w-5" />
                        </div>
                        Tambah Data Indikator
                      </DialogTitle>
                      <DialogDescription className="text-orange-100 mt-2">
                        Input data baru untuk indikator kategori {getCategoryDisplayName(category)}
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  
                  {/* Form Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
                    <IndicatorDataForm
                      category={category}
                      onSubmit={handleCreateData}
                      onCancel={() => setIsCreateDialogOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Bar and Filters in one row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <div className="relative flex-1 min-w-64 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-600" />
                <Input
                  placeholder="Cari data indikator, sub-kategori, atau status data indikator..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 py-2.5 border-2 border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 hover:border-orange-300 transition-all duration-200 placeholder:opacity-30 text-gray-700 rounded-lg shadow-sm"
                />
              </div>
            </div>
            
            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">Filter:</span>
                
                {/* Year Filter */}
                <Select value={yearFilter?.toString() || "all"} onValueChange={handleYearFilter}>
                  <SelectTrigger className="w-32 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {availableYears?.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>

                {/* Indicator Filter */}
                <Select value={indicatorFilter || "all"} onValueChange={handleIndicatorFilter}>
                  <SelectTrigger className="w-48 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Semua Indikator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Indikator</SelectItem>
                    {availableIndicators.map((indicator) => (
                      <SelectItem key={indicator} value={indicator}>
                        {indicator}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter || "all"} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-36 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="preliminary">Preliminary</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(search || yearFilter || indicatorFilter || statusFilter) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setYearFilter(undefined);
                      setIndicatorFilter(undefined);
                      setStatusFilter(undefined);
                      setSortField(null);
                      setSortDirection('asc');
                      setPage(1);
                    }}
                    className="bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-2 border-red-300 hover:from-red-100 hover:to-red-200 hover:border-red-400 hover:text-red-800 active:from-red-200 active:to-red-300 focus:ring-2 focus:ring-red-200 transition-all duration-200 shadow-sm font-medium px-4 py-2 rounded-lg"
                  >
                    ✕ Reset Filter
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search Results Badge */}
            {search && data.length > 0 && (
              <div className="mt-4">
                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 font-medium px-3 py-1 shadow-sm">
                  🔍 {pagination?.total_items || data.length} hasil ditemukan
                </Badge>
              </div>
            )}

            {/* Sort Info */}
            {sortField && (
              <div className="mt-4">
                <Badge variant="outline" className="bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-300 font-medium px-3 py-1 shadow-sm">
                  Diurutkan berdasarkan {
                    sortField === 'indicator_name' ? 'Indikator' :
                    sortField === 'subcategory' ? 'Sub-Kategori' :
                    sortField === 'year' ? 'Tahun' :
                    sortField === 'value' ? 'Nilai' : 'Status'
                  } ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                </Badge>
              </div>
            )}

          {/* Table */}
          {loading ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="text-gray-500">Memuat data indikator...</span>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          ) : data.length > 0 ? (
            <>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <Table>
                  <TableHeader className="bg-orange-100 border-b-2 border-orange-200">
                    <TableRow>
                      <TableHead className="w-12 font-semibold text-orange-800">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                          className="border-orange-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-orange-800">
                        <button 
                          onClick={() => handleSort('indicator_name')}
                          className="flex items-center gap-2 hover:text-orange-900 transition-colors"
                        >
                          Indikator
                          {getSortIcon('indicator_name')}
                        </button>
                      </TableHead>
                      <TableHead className="w-40 font-semibold text-orange-800">
                        <button 
                          onClick={() => handleSort('subcategory')}
                          className="flex items-center gap-2 hover:text-orange-900 transition-colors"
                        >
                          Sub-Kategori
                          {getSortIcon('subcategory')}
                        </button>
                      </TableHead>
                      <TableHead className="w-24 font-semibold text-orange-800">
                        <button 
                          onClick={() => handleSort('year')}
                          className="flex items-center gap-2 hover:text-orange-900 transition-colors"
                        >
                          Tahun
                          {getSortIcon('year')}
                        </button>
                      </TableHead>
                      <TableHead className="w-32 font-semibold text-orange-800">
                        <button 
                          onClick={() => handleSort('value')}
                          className="flex items-center gap-2 hover:text-orange-900 transition-colors"
                        >
                          Nilai
                          {getSortIcon('value')}
                        </button>
                      </TableHead>
                      <TableHead className="w-24 font-semibold text-orange-800">Satuan</TableHead>
                      <TableHead className="w-24 font-semibold text-orange-800">
                        <button 
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-2 hover:text-orange-900 transition-colors"
                        >
                          Status
                          {getSortIcon('status')}
                        </button>
                      </TableHead>
                      <TableHead className="w-32 font-semibold text-orange-800 text-center">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item, index) => (
                      <TableRow 
                        key={item.id} 
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-orange-50 transition-colors duration-200 border-b border-gray-100 ${
                          selectedData.has(item.id) ? 'bg-orange-50' : ''
                        }`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedData.has(item.id.toString())}
                            onCheckedChange={(checked) => handleSelectData(item.id.toString(), checked === true)}
                            className="border-orange-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                          />
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="font-medium text-gray-900">{item.indicator_name}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {item.subcategory ? (
                            <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {item.subcategory}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-medium text-gray-900">{item.year}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-medium text-gray-900">
                            {formatTableValue(item.value)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-medium text-gray-800">
                            {item.satuan || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {getStatusBadge(item.status, !!item.verified_by)}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {item.status === 'preliminary' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmVerify(item)}
                                title="Verifikasi data"
                                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showDetail(item)}
                              title="Lihat detail"
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(item)}
                              title="Edit data"
                              className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(item)}
                              title="Hapus data"
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t-2 border-orange-200 bg-orange-50">
                {/* Pagination info and items per page */}
                <div className="flex items-center gap-4 text-sm text-orange-700">
                  <span className="font-medium">
                    Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total_items)} dari {pagination.total_items} data
                  </span>
                  {sortField && (
                    <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-md border border-orange-200">
                      <span className="text-xs font-medium">Diurutkan:</span>
                      <span className="text-xs">
                        {sortField === 'indicator_name' ? 'Indikator' :
                         sortField === 'subcategory' ? 'Sub-Kategori' :
                         sortField === 'year' ? 'Tahun' :
                         sortField === 'value' ? 'Nilai' : 'Status'}
                      </span>
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-orange-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-orange-600" />
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Items per page:</span>
                    <Select value={limit.toString()} onValueChange={handleLimitChange}>
                      <SelectTrigger className="w-20 h-8 border-orange-200 bg-white text-orange-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Pagination controls */}
                {pagination.total_pages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-orange-300 text-orange-700 hover:bg-orange-200 hover:border-orange-400 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNumber;
                        if (pagination.total_pages <= 5) {
                          pageNumber = i + 1;
                        } else if (page <= 3) {
                          pageNumber = i + 1;
                        } else if (page >= pagination.total_pages - 2) {
                          pageNumber = pagination.total_pages - 4 + i;
                        } else {
                          pageNumber = page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={page === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                            className={page === pageNumber 
                              ? "bg-[#FF6B00] text-white hover:bg-[#E55A00] border-[#FF6B00] transition-all duration-200" 
                              : "border-orange-300 text-orange-700 hover:bg-orange-200 hover:border-orange-400 hover:text-orange-800 transition-all duration-200"
                            }
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.total_pages}
                      className="border-orange-300 text-orange-700 hover:bg-orange-200 hover:border-orange-400 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search || yearFilter || statusFilter ? 
                  "Tidak ada data yang sesuai dengan filter" : 
                  "Belum ada data indikator"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inflation Data Section - Separate Table for Monthly/Quarterly Data */}
      {(category === "Statistik Ekonomi" || userRole === 'admin_ekonomi') && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  Data Inflasi (Bulanan/Kuartalan)
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    Sub-Kategori Khusus
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Kelola data inflasi dengan periode bulanan dan kuartalan. Data ini terpisah dari indikator tahunan.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={isInflationDialogOpen} onOpenChange={setIsInflationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Data Inflasi
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Search Bar and Filters in one row - Matching Annual Table Style */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center mb-6">
              {/* Search Bar */}
              <div className="flex-1 min-w-0">
                <div className="relative flex-1 min-w-64 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-600" />
                  <Input
                    placeholder="Cari data inflasi, indikator, atau status data inflasi..."
                    value={inflationSearch}
                    onChange={(e) => handleInflationSearch(e.target.value)}
                    className="pl-12 pr-4 py-2.5 border-2 border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 hover:border-orange-300 transition-all duration-200 placeholder:opacity-30 text-gray-700 rounded-lg shadow-sm"
                  />
                </div>
              </div>
              
              {/* Filter Section */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">Filter:</span>
                  
                {/* Year Filter */}
                <Select value={inflationYearFilter || "all"} onValueChange={handleInflationYearFilter}>
                  <SelectTrigger className="w-32 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {availableInflationYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Indicator Filter */}
                <Select value={inflationIndicatorFilter || "all"} onValueChange={handleInflationIndicatorFilter}>
                  <SelectTrigger className="w-48 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Semua Indikator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Indikator</SelectItem>
                    {availableInflationIndicators.map((indicator) => (
                      <SelectItem key={indicator} value={indicator}>
                        {indicator}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={inflationStatusFilter || "all"} onValueChange={handleInflationStatusFilter}>
                  <SelectTrigger className="w-36 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="preliminary">Preliminary</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(inflationSearch || inflationYearFilter || inflationIndicatorFilter || inflationStatusFilter) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setInflationSearch("");
                      setInflationYearFilter(undefined);
                      setInflationIndicatorFilter(undefined);
                      setInflationStatusFilter(undefined);
                      setInflationSortField(null);
                      setInflationSortDirection('desc');
                      setInflationPage(1); // Reset to first page when clearing filters
                    }}
                    className="bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-2 border-red-300 hover:from-red-100 hover:to-red-200 hover:border-red-400 hover:text-red-800 active:from-red-200 active:to-red-300 focus:ring-2 focus:ring-red-200 transition-all duration-200 shadow-sm font-medium px-4 py-2 rounded-lg"
                  >
                    ✕ Reset Filter
                  </Button>
                )}
              </div>
            </div>

            {/* Bulk Delete Button - Show when items selected */}
            {selectedInflationData.size > 0 && (
              <div className="mb-4">
                <Button
                  onClick={() => setIsBulkDeleteInflationDialogOpen(true)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 font-medium px-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus {selectedInflationData.size} Data
                </Button>
              </div>
            )}
            
            {/* Search Results Badge */}
            {inflationSearch && paginatedInflationData.length > 0 && (
              <div className="mb-4">
                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 font-medium px-3 py-1 shadow-sm">
                  🔍 {inflationPagination.total_items} hasil ditemukan
                </Badge>
              </div>
            )}

            {/* Sort Info */}
            {inflationSortField && (
              <div className="mb-4">
                <Badge variant="outline" className="bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-300 font-medium px-3 py-1 shadow-sm">
                  Diurutkan berdasarkan {
                    inflationSortField === 'indicator_name' ? 'Indikator' :
                    inflationSortField === 'year' ? 'Tahun' :
                    inflationSortField === 'month' ? 'Bulan' :
                    inflationSortField === 'value' ? 'Nilai' : 'Status'
                  } ({inflationSortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                </Badge>
              </div>
            )}

            {/* Inflation Table */}
            {loading ? (
              <div className="space-y-4 p-4">
                <div className="flex items-center gap-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <span className="text-gray-500">Memuat data inflasi...</span>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                ))}
              </div>
            ) : paginatedInflationData.length > 0 ? (
              <>
                <div className="overflow-hidden border border-orange-200 rounded-lg">
                  <Table>
                  <TableHeader className="bg-orange-100 border-b-2 border-orange-200">
                    <TableRow>
                      {/* Checkbox Column */}
                      <TableHead className="w-12 text-center font-semibold text-orange-800">
                        <Checkbox
                          checked={selectAllInflation}
                          onCheckedChange={handleInflationSelectAll}
                          className="border-orange-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                        />
                      </TableHead>
                      
                      {/* Sortable Indikator Column */}
                      <TableHead className="font-semibold text-orange-800">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold text-orange-800 hover:text-orange-900 hover:bg-transparent"
                          onClick={() => handleInflationSort('indicator_name')}
                        >
                          Indikator
                          {getInflationSortIcon('indicator_name')}
                        </Button>
                      </TableHead>
                      
                      {/* Sortable Year Column */}
                      <TableHead className="w-24 font-semibold text-orange-800">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold text-orange-800 hover:text-orange-900 hover:bg-transparent"
                          onClick={() => handleInflationSort('year')}
                        >
                          Tahun
                          {getInflationSortIcon('year')}
                        </Button>
                      </TableHead>
                      
                      {/* Sortable Month Column */}
                      <TableHead className="w-32 font-semibold text-orange-800">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold text-orange-800 hover:text-orange-900 hover:bg-transparent"
                          onClick={() => handleInflationSort('month')}
                        >
                          Bulan
                          {getInflationSortIcon('month')}
                        </Button>
                      </TableHead>
                      
                      {/* Sortable Value Column */}
                      <TableHead className="w-32 font-semibold text-orange-800">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold text-orange-800 hover:text-orange-900 hover:bg-transparent"
                          onClick={() => handleInflationSort('value')}
                        >
                          Nilai
                          {getInflationSortIcon('value')}
                        </Button>
                      </TableHead>
                      
                      <TableHead className="w-24 font-semibold text-orange-800">Satuan</TableHead>
                      
                      {/* Sortable Status Column */}
                      <TableHead className="w-24 font-semibold text-orange-800">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold text-orange-800 hover:text-orange-900 hover:bg-transparent"
                          onClick={() => handleInflationSort('status')}
                        >
                          Status
                          {getInflationSortIcon('status')}
                        </Button>
                      </TableHead>
                      
                      <TableHead className="w-32 font-semibold text-orange-800 text-center">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInflationData.map((item: any, index: number) => (
                      <TableRow 
                        key={item.id} 
                        className={`${
                          index % 2 === 0 ? 'bg-white' : 'bg-orange-50'
                        } hover:bg-orange-100 transition-colors duration-200 border-b border-orange-100 ${
                          selectedInflationData.has(item.id) ? 'ring-2 ring-orange-300' : ''
                        }`}
                      >
                        {/* Checkbox Column */}
                        <TableCell className="py-4 px-6 text-center">
                          <Checkbox
                            checked={selectedInflationData.has(item.id)}
                            onCheckedChange={(checked) => handleInflationSelect(item.id, checked as boolean)}
                            className="border-orange-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                          />
                        </TableCell>
                        
                        <TableCell className="py-4 px-6">
                          <div className="font-medium text-gray-900">{item.indicator_name}</div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-medium text-gray-900">{item.year}</span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-medium text-gray-900">
                            {(item as any).period_month ? `Bulan ${(item as any).period_month}` : 
                             (item as any).period_quarter ? `Q${(item as any).period_quarter}` : 
                             (item as any).month ? `Bulan ${(item as any).month}` : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-medium text-gray-900">
                            {formatTableValue(item.value)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-medium text-gray-800">
                            {(item as any).satuan || (item as any).unit || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {getStatusBadge(item.status, !!(item as any).verified_by)}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {item.status === 'preliminary' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmVerify(item)}
                                title="Verifikasi data"
                                className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showDetail(item)}
                              title="Lihat detail"
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(item)}
                              title="Edit data"
                              className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(item)}
                              title="Hapus data"
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Inflation Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t-2 border-orange-200 bg-orange-50">
                {/* Pagination info and items per page */}
                <div className="flex items-center gap-4 text-sm text-orange-700">
                  <span className="font-medium">
                    Menampilkan {((inflationPage - 1) * inflationLimit) + 1} - {Math.min(inflationPage * inflationLimit, inflationPagination.total_items)} dari {inflationPagination.total_items} data inflasi
                  </span>
                  {inflationSortField && (
                    <div className="flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-md border border-orange-200">
                      <span className="text-xs font-medium">Diurutkan:</span>
                      <span className="text-xs">
                        {inflationSortField === 'indicator_name' ? 'Indikator' :
                         inflationSortField === 'year' ? 'Tahun' :
                         inflationSortField === 'month' ? 'Bulan' :
                         inflationSortField === 'value' ? 'Nilai' : 'Status'}
                      </span>
                      {inflationSortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-orange-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-orange-600" />
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Items per page:</span>
                    <Select value={inflationLimit.toString()} onValueChange={handleInflationLimitChange}>
                      <SelectTrigger className="w-20 h-8 border-orange-200 bg-white text-orange-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Pagination controls */}
                {inflationPagination.total_pages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInflationPage(inflationPage - 1)}
                      disabled={inflationPage === 1}
                      className="border-orange-300 text-orange-700 hover:bg-orange-200 hover:border-orange-400 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, inflationPagination.total_pages) }, (_, i) => {
                        let pageNumber;
                        if (inflationPagination.total_pages <= 5) {
                          pageNumber = i + 1;
                        } else if (inflationPage <= 3) {
                          pageNumber = i + 1;
                        } else if (inflationPage >= inflationPagination.total_pages - 2) {
                          pageNumber = inflationPagination.total_pages - 4 + i;
                        } else {
                          pageNumber = inflationPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={inflationPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInflationPage(pageNumber)}
                            className={inflationPage === pageNumber 
                              ? "bg-[#FF6B00] text-white hover:bg-[#E55A00] border-[#FF6B00] transition-all duration-200" 
                              : "border-orange-300 text-orange-700 hover:bg-orange-200 hover:border-orange-400 hover:text-orange-800 transition-all duration-200"
                            }
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInflationPage(inflationPage + 1)}
                      disabled={inflationPage === inflationPagination.total_pages}
                      className="border-orange-300 text-orange-700 hover:bg-orange-200 hover:border-orange-400 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada data inflasi</p>
                <p className="text-sm text-gray-400 mt-1">Klik tombol "Tambah Data Inflasi" untuk menambah data baru</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden p-0 z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Edit className="h-5 w-5" />
                </div>
                Edit Data Indikator
              </DialogTitle>
              <DialogDescription className="text-blue-100 mt-2">
                Perbarui data indikator yang sudah ada
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
            {editingData && (
              <IndicatorDataForm
                initialData={editingData}
                category={category}
                onSubmit={handleEditData}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingData(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Konfirmasi Hapus
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Apakah Anda yakin ingin menghapus indikator "{deletingData?.indicator_name}"? 
                Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingData(null);
                }}
                className="px-6"
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteData}
                className="px-6 bg-red-600 hover:bg-red-700 text-white"
              >
                Hapus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Pesan Sukses */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Berhasil!
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {successMessage}
              </DialogDescription>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Data berhasil diproses</span>
              </div>
            </div>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="px-8 bg-green-600 hover:bg-green-700 text-white"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>      {/* Dialog Pesan Sukses */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Berhasil!
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {successMessage}
              </DialogDescription>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Data berhasil diproses</span>
              </div>
            </div>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="px-8 bg-green-600 hover:bg-green-700 text-white"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Orange Theme */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Detail Data Indikator
              </DialogTitle>
              <DialogDescription className="text-orange-100 text-sm">
                Informasi lengkap tentang data statistik yang telah diinput
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {detailData && (
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Main Info */}
              <div className="bg-orange-50 rounded-lg p-5 mb-6 border border-orange-100">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 break-words">
                      {detailData.indicator_name}
                    </h2>
                    
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-md">
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">
                          {detailData.subcategory || 'Tanpa Sub-Kategori'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-md">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                          {detailData.year}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center sm:text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {detailData.value !== null && detailData.value !== undefined 
                        ? (typeof detailData.value === 'number' 
                           ? detailData.value.toLocaleString('id-ID') 
                           : detailData.value)
                        : '-'
                      }
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {detailData.satuan || 'Satuan'}
                    </div>
                    {getStatusBadge(detailData.status, !!detailData.verified_by)}
                  </div>
                </div>
              </div>

              {/* Riwayat Audit */}
              <div className="bg-white border border-orange-200 rounded-lg mb-6">
                <div className="p-4 border-b border-orange-100 bg-orange-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    Riwayat Audit
                  </h3>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Created */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Dibuat Oleh</p>
                      <p className="text-sm text-gray-700 truncate">{detailData.created_by_name || '-'}</p>
                      <p className="text-xs text-gray-500">
                        {detailData.created_at 
                          ? new Date(detailData.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Verified */}
                  {detailData.verified_by ? (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Diverifikasi Oleh</p>
                        <p className="text-sm text-gray-700 truncate">{detailData.verified_by_name || '-'}</p>
                        <p className="text-xs text-gray-500">
                          {detailData.verified_at 
                            ? new Date(detailData.verified_at).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Belum Diverifikasi</p>
                        <p className="text-xs text-gray-500">Menunggu proses verifikasi</p>
                      </div>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className="flex gap-3 pt-3 border-t border-orange-100">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Terakhir Diupdate</p>
                      <p className="text-xs text-gray-500">
                        {detailData.updated_at 
                          ? new Date(detailData.updated_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dokumen & Catatan - Moved Below Audit */}
              <div className="bg-white border border-orange-200 rounded-lg mb-6">
                <div className="p-4 border-b border-orange-100 bg-orange-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    Dokumen & Catatan
                  </h3>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Dokumen Sumber */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Dokumen Sumber</span>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3 h-20 overflow-y-auto">
                      <p className="text-sm text-gray-900 break-words leading-relaxed">
                        {detailData.source_document || (
                          <span className="text-gray-500 italic">Tidak ada dokumen sumber</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Catatan */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Edit className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Catatan</span>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3 h-20 overflow-y-auto">
                      <p className="text-sm text-gray-900 break-words whitespace-pre-wrap leading-relaxed">
                        {detailData.notes || (
                          <span className="text-gray-500 italic">Tidak ada catatan tambahan</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Spacer untuk footer */}
              <div className="h-5"></div>
            </div>
          )}
          
          {/* Footer */}
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-orange-200 flex justify-end shadow-lg">
            <Button 
              onClick={() => setIsDetailDialogOpen(false)}
              className="px-8 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <Dialog open={showVerifyConfirm} onOpenChange={setShowVerifyConfirm}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Konfirmasi Verifikasi
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Apakah Anda yakin ingin memverifikasi data "{verifyingData?.indicator_name}"? 
                Data yang sudah diverifikasi akan berstatus final.
              </DialogDescription>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerifyConfirm(false);
                  setVerifyingData(null);
                }}
                className="px-6"
              >
                Batal
              </Button>
              <Button
                onClick={handleVerifyData}
                className="px-6 bg-green-600 hover:bg-green-700 text-white"
              >
                Verifikasi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Konfirmasi Hapus Data
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Apakah Anda yakin ingin menghapus {selectedData.size} data yang dipilih? 
                Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteDialogOpen(false)}
                className="px-6"
              >
                Batal
              </Button>
              <Button
                onClick={handleBulkDelete}
                className="px-6 bg-red-600 hover:bg-red-700 text-white"
              >
                Hapus {selectedData.size} Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Inflation Confirmation Dialog */}
      <Dialog open={isBulkDeleteInflationDialogOpen} onOpenChange={setIsBulkDeleteInflationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Konfirmasi Hapus Data Inflasi
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Apakah Anda yakin ingin menghapus {selectedInflationData.size} data inflasi yang dipilih? 
                Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteInflationDialogOpen(false)}
                className="px-6"
              >
                Batal
              </Button>
              <Button
                onClick={handleBulkDeleteInflation}
                className="px-6 bg-red-600 hover:bg-red-700 text-white"
              >
                Hapus {selectedInflationData.size} Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inflation Data Dialog */}
      <Dialog open={isInflationDialogOpen} onOpenChange={setIsInflationDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden p-0 z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Tambah Data Inflasi
              </DialogTitle>
              <DialogDescription className="text-orange-100 mt-2">
                Input data baru untuk indikator inflasi bulanan
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
            {inflationIndicators.length > 0 ? (
              <InflationDataForm
                indicators={inflationIndicators} // Pass all available inflation indicators
                onSubmit={handleCreateInflationData}
                onCancel={() => setIsInflationDialogOpen(false)}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Memuat indikator inflasi...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
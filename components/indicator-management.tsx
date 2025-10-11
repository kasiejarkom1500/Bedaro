import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Activity,
  Clock,
  BarChart3,
  Settings2,
  Sparkles,
  Eye,
  CheckCircle
} from "lucide-react";
import { useIndicators } from "@/hooks/use-data-management";
import { CreateIndicatorRequest, Indicator } from "@/lib/api-client";
import { IndicatorForm } from "./indicator-form";

interface IndicatorManagementProps {
  category: string;
  onSessionUpdate?: () => void;
}

export function IndicatorManagement({ category, onSessionUpdate }: IndicatorManagementProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all"); // Filter subkategori
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Filter status
  const [allSubcategoriesForFilter, setAllSubcategoriesForFilter] = useState<string[]>([]); // Dynamic subcategories
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingIndicator, setViewingIndicator] = useState<Indicator | null>(null);
  const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false);
  const [metadata, setMetadata] = useState<any[]>([]);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [infoIndicator, setInfoIndicator] = useState<Indicator | null>(null);
  
  // Confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [indicatorToDelete, setIndicatorToDelete] = useState<Indicator | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [bulkStatusAction, setBulkStatusAction] = useState<'activate' | 'deactivate'>('activate');
  
  // Checkbox selection states
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Success popup states
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successTitle, setSuccessTitle] = useState("");
  const [successBadgeText, setSuccessBadgeText] = useState("");
  
  // Toast
  const { toast } = useToast();

  const { 
    indicators, 
    pagination, 
    statistics, 
    loading, 
    error, 
    createIndicator,
    updateIndicator,
    deleteIndicator,
    refetch
  } = useIndicators({ 
    page, 
    limit,
    search: search || undefined,
    category,
    subcategory: subcategoryFilter === "all" ? undefined : subcategoryFilter,
    status: statusFilter === "all" ? undefined : (statusFilter as 'active' | 'inactive')
  });

  // Fetch all subcategories for filter dropdown (similar to indicator-data-management.tsx)
  useEffect(() => {
    const fetchAllSubcategories = async () => {
      try {
        // Use apiClient to get all indicators for this category
        const response = await apiClient.getIndicators({
          category: category,
          limit: 1000,
          page: 1
        });
        
        if (response.success && response.data?.indicators) {
          const subcategories = new Set<string>();
          
          // Extract unique subcategories from all indicators
          response.data.indicators.forEach((indicator: any) => {
            if (indicator.subcategory && indicator.subcategory.trim()) {
              subcategories.add(indicator.subcategory.trim());
            }
          });
          
          // Set to state
          setAllSubcategoriesForFilter(Array.from(subcategories).sort());
        } else {
          console.error('Failed to fetch subcategories:', response.error);
          setAllSubcategoriesForFilter([]);
        }
      } catch (error) {
        console.error('Error fetching subcategories for filter:', error);
        setAllSubcategoriesForFilter([]);
      }
    };

    fetchAllSubcategories();
  }, [category]);

  // Generate available subcategories dynamically
  const availableSubcategories = useMemo(() => {
    // Fallback: if dynamic fetch failed, use current indicators data
    if (allSubcategoriesForFilter.length === 0 && indicators.length > 0) {
      const fallbackSubcategories = new Set<string>();
      indicators.forEach(indicator => {
        if (indicator.subcategory && indicator.subcategory.trim()) {
          fallbackSubcategories.add(indicator.subcategory.trim());
        }
      });
      return Array.from(fallbackSubcategories).sort();
    }
    
    return allSubcategoriesForFilter;
  }, [allSubcategoriesForFilter, indicators]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    clearSelection();
  };  const handleSubcategoryFilter = (value: string) => {
    setSubcategoryFilter(value === "all" ? "" : value);
    setPage(1); // Reset to first page when filtering
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setPage(1); // Reset to first page when filtering
  };

    const handleCreateIndicator = async (data: CreateIndicatorRequest & { level?: string; wilayah?: string; periode?: string; konsep_definisi?: string; metode_perhitungan?: string; interpretasi?: string; }) => {
    try {
      await createIndicator(data);
      setIsCreateDialogOpen(false);
      onSessionUpdate?.(); // Refresh session
      showSuccessPopup("Berhasil!", "Indikator baru berhasil dibuat dan ditambahkan ke sistem.", "Data berhasil ditambahkan");
    } catch (error) {
      console.error('Error creating indicator:', error);
      toast({
        title: "❌ Gagal!",
        description: "Terjadi kesalahan saat membuat indikator.",
        variant: "destructive",
      });
    }
  };

  const handleEditIndicator = async (data: Partial<CreateIndicatorRequest> & { level?: string; wilayah?: string; periode?: string; konsep_definisi?: string; metode_perhitungan?: string; interpretasi?: string; }) => {
    if (!editingIndicator) return;
    
    try {
      await updateIndicator(editingIndicator.id, data);
      setIsEditDialogOpen(false);
      setEditingIndicator(null);
      onSessionUpdate?.(); // Refresh session
      showSuccessPopup("Berhasil!", "Data indikator berhasil diperbarui dan disimpan.", "Perubahan berhasil disimpan");
    } catch (error) {
      console.error('Error updating indicator:', error);
      toast({
        title: "❌ Gagal!",
        description: "Terjadi kesalahan saat memperbarui data.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (indicator: Indicator) => {
    console.log('=== Starting edit for indicator ===');
    console.log('Indicator data:', indicator);
    console.log('Metadata fields:', {
      level: indicator.level,
      wilayah: indicator.wilayah,
      periode: indicator.periode,
      konsep_definisi: indicator.konsep_definisi,
      metode_perhitungan: indicator.metode_perhitungan,
      interpretasi: indicator.interpretasi
    });
    setEditingIndicator(indicator);
    setIsEditDialogOpen(true);
  };

  const viewMetadata = async (indicator: Indicator) => {
    try {
      setViewingIndicator(indicator);
      
      // Get authorization token
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No token found in localStorage');
        setMetadata([]);
        setIsMetadataDialogOpen(true);
        return;
      }
      
      // Fetch metadata from API with authorization header
      const response = await fetch(`/api/admin/indicators/${indicator.id}/metadata`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Extract data from success response wrapper
        const data = responseData.data || responseData;
        console.log('Metadata loaded:', data.metadata ? data.metadata.length : 0, 'fields');
        setMetadata(data.metadata || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to load metadata:', response.status, errorText);
        setMetadata([]);
      }
      
      setIsMetadataDialogOpen(true);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      setMetadata([]);
      setIsMetadataDialogOpen(true);
    }
  };

  const toggleIndicatorStatus = async (indicator: Indicator) => {
    if (toggleLoading === indicator.id) return; // Prevent multiple clicks
    
    try {
      setToggleLoading(indicator.id);
      await updateIndicator(indicator.id, {
        is_active: !indicator.is_active
      });
      
      const statusText = indicator.is_active ? "dinonaktifkan" : "diaktifkan";
      const message = indicator.is_active 
        ? "Indikator berhasil dinonaktifkan dan tidak akan ditampilkan di sistem."
        : "Indikator berhasil diaktifkan dan siap digunakan dalam sistem.";
      
      onSessionUpdate?.(); // Refresh session
      showSuccessPopup("Berhasil!", message, "Status berhasil diubah");
    } catch (error) {
      console.error('Error toggling indicator status:', error);
      toast({
        title: "❌ Gagal!",
        description: "Terjadi kesalahan saat mengubah status indikator.",
        variant: "destructive",
      });
    } finally {
      setToggleLoading(null);
    }
  };

  const viewIndicatorInfo = (indicator: Indicator) => {
    setInfoIndicator(indicator);
    setIsInfoDialogOpen(true);
  };

  const handleDeleteClick = (indicator: Indicator) => {
    setIndicatorToDelete(indicator);
    setIsDeleteDialogOpen(true);
  };

  // Checkbox selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedIndicators);
      indicators.forEach(indicator => newSelected.add(indicator.id));
      setSelectedIndicators(newSelected);
    } else {
      setSelectedIndicators(new Set());
    }
    setSelectAll(checked);
  };

  const handleSelectIndicator = (indicatorId: string, checked: boolean) => {
    const newSelected = new Set(selectedIndicators);
    if (checked) {
      newSelected.add(indicatorId);
    } else {
      newSelected.delete(indicatorId);
    }
    setSelectedIndicators(newSelected);
    
    // Update select all state
    if (newSelected.size === indicators.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  };

  const clearSelection = () => {
    setSelectedIndicators(new Set());
    setSelectAll(false);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedIndicators).map(id => deleteIndicator(id));
      await Promise.all(deletePromises);
      
      setIsBulkDeleteDialogOpen(false);
      clearSelection();
      onSessionUpdate?.(); // Refresh session
      showSuccessPopup(
        "Berhasil!",
        `${selectedIndicators.size} indikator berhasil dihapus.`,
        "Dihapus"
      );
      refetch();
    } catch (error) {
      console.error("Error bulk deleting indicators:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus beberapa indikator!",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async () => {
    try {
      const statusPromises = Array.from(selectedIndicators).map(id => {
        const indicator = indicators.find(ind => ind.id === id);
        if (indicator) {
          return updateIndicator(id, { 
            ...indicator, 
            is_active: bulkStatusAction === 'activate' 
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(statusPromises);
      
      setIsBulkStatusDialogOpen(false);
      clearSelection();
      onSessionUpdate?.(); // Refresh session
      showSuccessPopup(
        "Berhasil!",
        `${selectedIndicators.size} indikator berhasil ${bulkStatusAction === 'activate' ? 'diaktifkan' : 'dinonaktifkan'}.`,
        bulkStatusAction === 'activate' ? 'Diaktifkan' : 'Dinonaktifkan'
      );
      refetch();
    } catch (error) {
      console.error("Error bulk updating status:", error);
      toast({
        title: "Error",
        description: "Gagal mengubah status beberapa indikator!",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!indicatorToDelete) return;
    
    try {
      await deleteIndicator(indicatorToDelete.id);
      setIsDeleteDialogOpen(false);
      setIndicatorToDelete(null);
      showSuccessPopup("Berhasil!", "Indikator berhasil dihapus dari sistem.", "Data berhasil dihapus");
    } catch (error) {
      console.error('Error deleting indicator:', error);
      toast({
        title: "❌ Gagal!",
        description: "Terjadi kesalahan saat menghapus indikator.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setIndicatorToDelete(null);
  };

  const showSuccessPopup = (title: string, message: string, badgeText?: string) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setSuccessBadgeText(badgeText || "Perubahan berhasil disimpan");
    setIsSuccessDialogOpen(true);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Indikator</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{statistics.total_indicators}</div>
              <p className="text-xs text-blue-700 mt-1">
                {statistics.active_indicators} aktif • {statistics.inactive_indicators} non-aktif
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Area Kerja</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg">
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-900">{getCategoryDisplayName(category)}</div>
              <p className="text-xs text-orange-700 mt-1">Fokus bidang kerja Anda</p>
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings2 className="h-5 w-5 text-blue-600" />
                </div>
                Pengaturan Indikator
              </CardTitle>
              <CardDescription className="text-base">
                Kelola dan atur indikator statistik untuk {getCategoryDisplayName(category)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Bulk Actions */}
              {selectedIndicators.size > 0 && (
                <>
                  <Button
                    onClick={() => {
                      setBulkStatusAction('activate');
                      setIsBulkStatusDialogOpen(true);
                    }}
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200 font-medium px-4"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aktifkan {selectedIndicators.size}
                  </Button>
                  <Button
                    onClick={() => {
                      setBulkStatusAction('deactivate');
                      setIsBulkStatusDialogOpen(true);
                    }}
                    variant="outline"
                    className="border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 font-medium px-4"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Nonaktifkan {selectedIndicators.size}
                  </Button>
                  <Button
                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 font-medium px-4"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus {selectedIndicators.size}
                  </Button>
                </>
              )}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Indikator Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
                  <div className="p-6">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        Buat Indikator Baru
                      </DialogTitle>
                      <DialogDescription>
                        Tambahkan indikator baru untuk kategori {getCategoryDisplayName(category)}
                      </DialogDescription>
                    </DialogHeader>
                    <IndicatorForm
                      defaultCategory={category}
                      onSubmit={handleCreateIndicator}
                      onCancel={() => setIsCreateDialogOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            {/* Search Bar and Filters Row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-64 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                <Input
                  placeholder="Cari indikator, sub-kategori, atau kode indikator..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 py-2.5 border-2 border-orange-200 bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-100 hover:border-orange-300 transition-all duration-200 placeholder:text-gray-400 text-gray-700 rounded-lg shadow-sm"
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">Filter:</span>
                
                {/* Subcategory Filter */}
                <Select value={subcategoryFilter} onValueChange={handleSubcategoryFilter}>
                  <SelectTrigger className="w-48 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Semua Sub-Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sub-Kategori</SelectItem>
                    {availableSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-36 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Clear Filters */}
                {(subcategoryFilter !== "all" || statusFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSubcategoryFilter("all");
                      setStatusFilter("all");
                    }}
                    className="bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-2 border-red-300 hover:from-red-100 hover:to-red-200 hover:border-red-400 hover:text-red-800 active:from-red-200 active:to-red-300 focus:ring-2 focus:ring-red-200 transition-all duration-200 shadow-sm font-medium px-4 py-2 rounded-lg"
                  >
                    ✕ Reset Filter
                  </Button>
                )}
              </div>
              
              {/* Search Results Badge */}
              {search && (
                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 font-medium px-3 py-1 ml-auto shadow-sm">
                  🔍 {indicators.length} hasil ditemukan
                </Badge>
              )}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-500">Memuat data indikator...</span>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : indicators.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <Table>
                <TableHeader className="bg-orange-100 border-b-2 border-orange-200">
                  <TableRow>
                    <TableHead className="w-12 font-semibold text-orange-800">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        disabled={indicators.length === 0}
                        className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                    </TableHead>
                    <TableHead className="w-32 font-semibold text-orange-800">Kode Indikator</TableHead>
                    <TableHead className="font-semibold text-orange-800">Indikator</TableHead>
                    <TableHead className="w-40 font-semibold text-orange-800">Sub-Kategori</TableHead>
                    <TableHead className="w-32 font-semibold text-orange-800">Satuan</TableHead>
                    <TableHead className="w-24 font-semibold text-orange-800">Status</TableHead>
                    <TableHead className="w-32 font-semibold text-orange-800">Metadata</TableHead>
                    <TableHead className="w-32 font-semibold text-orange-800">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicators.map((indicator) => (
                    <TableRow 
                      key={indicator.id}
                      className={`${
                        !indicator.is_active 
                          ? 'bg-gray-50 opacity-75 hover:bg-orange-50 hover:opacity-90' 
                          : 'hover:bg-orange-50'
                      } transition-colors duration-200 border-b border-gray-100`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIndicators.has(indicator.id)}
                          onCheckedChange={(checked) => handleSelectIndicator(indicator.id, !!checked)}
                          className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </TableCell>
                      <TableCell>
                        {indicator.code ? (
                          <Badge variant="outline" className="font-medium">
                            {indicator.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {indicator.indikator}
                        </div>
                      </TableCell>
                      <TableCell>
                        {indicator.subcategory ? (
                          <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {indicator.subcategory}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-800">
                          {indicator.satuan}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={indicator.is_active}
                            onCheckedChange={() => toggleIndicatorStatus(indicator)}
                            disabled={toggleLoading === indicator.id}
                            className="data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-gray-300 disabled:opacity-50"
                          />
                          <span className={`text-sm font-medium ${
                            indicator.is_active 
                              ? 'text-green-600' 
                              : 'text-red-500'
                          } ${toggleLoading === indicator.id ? 'opacity-50' : ''}`}>
                            {toggleLoading === indicator.id ? 'Loading...' : (indicator.is_active ? "Aktif" : "Non-aktif")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => viewMetadata(indicator)}
                          title="Lihat Metadata Lengkap"
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 border border-blue-200 hover:border-blue-300 transition-all"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Dokumen
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewIndicatorInfo(indicator)}
                            title="Lihat Info Dasar"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(indicator)}
                            title="Edit Indikator"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(indicator)}
                            title="Hapus Indikator"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.total_items > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t-2 border-orange-200 bg-orange-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-orange-700">
                      <span className="font-medium">
                        Menampilkan {((page - 1) * pagination.items_per_page) + 1} - {Math.min(page * pagination.items_per_page, pagination.total_items)} dari {pagination.total_items} indikator
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-orange-700">Items per page:</span>
                      <Select value={limit.toString()} onValueChange={(value) => handleLimitChange(parseInt(value))}>
                        <SelectTrigger className="w-20 h-8 border-orange-300 text-orange-700">
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
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {search ? "Tidak Ada Hasil Pencarian" : "Belum Ada Indikator"}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    {search 
                      ? `Tidak ditemukan indikator yang sesuai dengan "${search}". Coba kata kunci lain.`
                      : `Belum ada indikator untuk kategori ${getCategoryDisplayName(category)}. Mulai dengan membuat indikator pertama Anda.`
                    }
                  </p>
                </div>
                {!search && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Indikator Pertama
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Indikator
              </DialogTitle>
              <DialogDescription>
                Perbarui informasi indikator
              </DialogDescription>
            </DialogHeader>
            {editingIndicator && (
              <IndicatorForm
                initialData={editingIndicator}
                defaultCategory={category}
                onSubmit={handleEditIndicator}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingIndicator(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Metadata Dialog */}
      <Dialog open={isMetadataDialogOpen} onOpenChange={setIsMetadataDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Metadata
                </DialogTitle>
                {viewingIndicator && (
                  <p className="text-sm text-gray-600 mt-1">
                    Metadata dari indikator: {viewingIndicator.indikator}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {metadata.length > 0 ? (
              <div className="space-y-4">
                {metadata.map((item, index) => {
                  // Special handling for longer content fields that should be collapsible
                  const isLongContent = ['konsep & definisi', 'metode perhitungan', 'interpretasi'].includes(item.field_name.toLowerCase());
                  
                  return (
                    <div 
                      key={index} 
                      className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500"
                    >
                      {item.field_value ? (
                        isLongContent ? (
                          // Collapsible fields for long content
                          <details className="group">
                            <summary className="cursor-pointer [&::-webkit-details-marker]:hidden" style={{listStyle: 'none'}}>
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-orange-600 text-sm uppercase tracking-wide">
                                  {item.field_name}
                                </h4>
                                <svg className="w-4 h-4 text-orange-500 group-open:rotate-180 transition-transform duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </summary>
                            <div className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {item.field_value}
                            </div>
                          </details>
                        ) : (
                          // Simple fields for short content
                          <div>
                            <h4 className="font-semibold text-orange-600 text-sm uppercase tracking-wide mb-2">
                              {item.field_name}
                            </h4>
                            <div className="text-gray-800 font-medium">
                              {item.field_value}
                            </div>
                          </div>
                        )
                      ) : (
                        // Empty state
                        <div>
                          <h4 className="font-semibold text-orange-600 text-sm uppercase tracking-wide mb-2">
                            {item.field_name}
                          </h4>
                          <div className="text-gray-400 italic">
                            Tidak ada data tersedia
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-orange-50 rounded-lg border-2 border-dashed border-orange-300">
                <FileText className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-orange-600 mb-2">
                  Metadata Belum Tersedia
                </h3>
                <p className="text-orange-500 max-w-md mx-auto">
                  Belum ada metadata yang tersedia untuk indikator ini. 
                  Metadata akan ditampilkan setelah indikator dibuat dengan informasi lengkap.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-6 border-t border-orange-200 mt-6">
            <Button 
              variant="outline" 
              className="px-6 py-2 bg-white hover:bg-orange-50 border-orange-300 text-orange-700 hover:text-orange-800 font-medium transition-colors"
              onClick={() => {
                setIsMetadataDialogOpen(false);
                setViewingIndicator(null);
                setMetadata([]);
              }}
            >
              <span className="mr-2">✕</span>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Info Dasar Indikator</DialogTitle>
            <DialogDescription>
              Informasi dasar dan metadata singkat indikator
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {infoIndicator && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Kategori</label>
                    <p className="text-sm text-gray-900 mt-1">{infoIndicator.kategori}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Kode Indikator</label>
                    <p className="text-sm text-gray-900 mt-1">{infoIndicator.code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Sub-Kategori</label>
                    <p className="text-sm text-gray-900 mt-1">{infoIndicator.subcategory || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Dibuat oleh</label>
                    <p className="text-sm text-gray-900 mt-1">{infoIndicator.created_by_name || infoIndicator.created_by || '-'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Indikator</label>
                    <p className="text-sm text-gray-900 mt-1">{infoIndicator.indikator}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ditambahkan pada</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {infoIndicator.created_at 
                        ? new Date(infoIndicator.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">diperbarui pada</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {infoIndicator.updated_at 
                        ? new Date(infoIndicator.updated_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Diperbarui oleh</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {infoIndicator.updated_by_name || 
                       infoIndicator.updated_by || 
                       (infoIndicator.created_by_name ? `${infoIndicator.created_by_name} (pembuat)` : 'Belum diperbarui')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsInfoDialogOpen(false);
                setInfoIndicator(null);
              }}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <span>Konfirmasi Hapus</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus indikator{" "}
              <span className="font-semibold text-gray-900">
                "{indicatorToDelete?.indikator}"
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={handleDeleteCancel}
              className="mr-2"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {successTitle}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {successMessage}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 text-sm font-medium">
                  {successBadgeText}
                </span>
              </div>
            </div>
            <Button 
              onClick={() => setIsSuccessDialogOpen(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-700">
              Konfirmasi Hapus Banyak Indikator
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Apakah Anda yakin ingin menghapus {selectedIndicators.size} indikator yang dipilih? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Indikator yang akan dihapus:
              </div>
              <ul className="space-y-1">
                {Array.from(selectedIndicators).map(indicatorId => {
                  const indicator = indicators.find(ind => ind.id === indicatorId)
                  return indicator ? (
                    <li key={indicatorId} className="text-sm text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      {indicator.indikator}
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsBulkDeleteDialogOpen(false)}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Batal
            </Button>
            <Button 
              onClick={handleBulkDelete} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus {selectedIndicators.size} Indikator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Change Confirmation Dialog */}
      <Dialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-orange-700">
              Konfirmasi Ubah Status
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Apakah Anda yakin ingin {bulkStatusAction === 'activate' ? 'mengaktifkan' : 'menonaktifkan'} {selectedIndicators.size} indikator yang dipilih?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Indikator yang akan diubah statusnya:
              </div>
              <ul className="space-y-1">
                {Array.from(selectedIndicators).map(indicatorId => {
                  const indicator = indicators.find(ind => ind.id === indicatorId)
                  return indicator ? (
                    <li key={indicatorId} className="text-sm text-gray-600 flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${bulkStatusAction === 'activate' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                      {indicator.indikator}
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsBulkStatusDialogOpen(false)}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Batal
            </Button>
            <Button 
              onClick={handleBulkStatusChange} 
              className={`text-white ${bulkStatusAction === 'activate' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
            >
              {bulkStatusAction === 'activate' ? 'Aktifkan' : 'Nonaktifkan'} {selectedIndicators.size} Indikator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
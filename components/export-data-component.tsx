import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"
import apiClient from "@/lib/api-client"

interface ExportDataComponentProps {
  category: string
  title?: string
  description?: string
  onAlert?: (type: "success" | "error", message: string) => void
}

export function ExportDataComponent({ 
  category, 
  title = "Export Data", 
  description = "Download data dalam format Excel (.xlsx)",
  onAlert 
}: ExportDataComponentProps) {
  const [selectedExportType, setSelectedExportType] = useState("")
  const [selectedIndicator, setSelectedIndicator] = useState("")
  const [indicators, setIndicators] = useState<{ id: string; name: string; subcategory: string; data_count?: number }[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Load indicators when component mounts
  useEffect(() => {
    loadIndicators()
  }, [category])

  const showAlert = (type: "success" | "error", message: string) => {
    if (onAlert) {
      onAlert(type, message)
    } else {
      setAlert({ type, message })
      setTimeout(() => setAlert(null), 4000)
    }
  }

  const loadIndicators = async () => {
    try {
      setIsLoadingIndicators(true)
      setIndicators([]) // Reset to empty array first
      
      console.log('Loading indicators for category:', category)
      console.log('Current authToken:', localStorage.getItem('authToken'))
      
      const response = await apiClient.getIndicatorsForExport(category)
      console.log('Full API response object:', response)
      console.log('Response success:', response?.success)
      console.log('Response data:', response?.data)
      console.log('Response error:', response?.error)
      
      if (response && response.success && response.data) {
        // Ensure data is always an array
        const indicatorData = Array.isArray(response.data) ? response.data : []
        console.log('Parsed indicator data:', indicatorData)
        console.log('Number of indicators:', indicatorData.length)
        setIndicators(indicatorData)
        
        if (indicatorData.length === 0) {
          console.log('No indicators found, showing error message')
          showAlert("error", "Tidak ada indikator dengan data yang tersedia untuk kategori ini")
        } else {
          console.log('Successfully loaded indicators:', indicatorData.length)
        }
      } else {
        console.error('API response failed or invalid structure:', response)
        setIndicators([]) // Set empty array as fallback
        showAlert("error", response?.error || "Gagal memuat daftar indikator")
      }
    } catch (error) {
      console.error('Error loading indicators:', error)
      setIndicators([]) // Set empty array as fallback
      showAlert("error", "Gagal memuat daftar indikator: " + (error as Error).message)
    } finally {
      setIsLoadingIndicators(false)
    }
  }

  const handleExport = async () => {
    if (!selectedExportType) {
      showAlert("error", "Pilih jenis data yang akan diekspor")
      return
    }

    try {
      setIsExporting(true)
      
      const filters: any = {
        category: category
      }

      // Jika pilih indikator spesifik
      if (selectedExportType === "specific" && selectedIndicator) {
        filters.indicator_id = selectedIndicator
      }

      const blob = await apiClient.exportData(filters)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const categoryShort = category
        .replace('Statistik ', '')
        .replace(' & ', '_')
        .replace(' ', '_')
        .toLowerCase()
      
      // Get indicator name for filename
      const getIndicatorName = (indicatorId: string) => {
        const indicator = indicators.find(ind => ind.id === indicatorId)
        return indicator ? indicator.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'indikator'
      }
      
      const fileName = selectedExportType === "all" 
        ? `Export_Semua_Data_${categoryShort}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `Export_${getIndicatorName(selectedIndicator)}_${new Date().toISOString().split('T')[0]}.xlsx`
      
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      showAlert("success", `Data berhasil diekspor sebagai ${fileName}`)
      setSelectedExportType("")
      setSelectedIndicator("")
      
    } catch (error) {
      showAlert("error", "Gagal mengekspor data. Silakan coba lagi.")
    } finally {
      setIsExporting(false)
    }
  }

  const getCategoryDisplayName = (kategori: string) => {
    switch (kategori) {
      case 'Statistik Ekonomi':
        return 'Ekonomi'
      case 'Statistik Demografi & Sosial':
        return 'Demografi & Sosial'
      case 'Statistik Lingkungan Hidup & Multi-Domain':
        return 'Lingkungan & Multi-Domain'
      default:
        return kategori
    }
  }

  return (
    <>
      {/* Alert */}
      {alert && !onAlert && (
        <Alert
          variant={alert.type === "error" ? "destructive" : "default"}
          className={`mb-6 border-0 shadow-lg ${
            alert.type === "success"
              ? "bg-green-50 text-green-800 border-l-4 border-l-green-500"
              : "bg-red-50 text-red-800 border-l-4 border-l-red-500"
          }`}
        >
          <AlertDescription className="font-medium">{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-lg text-white relative overflow-hidden px-8 py-6">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-amber-600/20"></div>
          <div className="relative z-10">
            <CardTitle className="flex items-center gap-4 text-white text-xl font-bold">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              {title}
            </CardTitle>
            <CardDescription className="text-orange-100 mt-3 text-base pl-1">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8 bg-white">

          {/* Export Type Selection */}
          <div className="space-y-4">
            <Label htmlFor="export-type" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Pilih Jenis Data untuk Export
            </Label>
            <Select value={selectedExportType} onValueChange={setSelectedExportType}>
              <SelectTrigger className="border-2 border-orange-200 hover:border-orange-300 focus:border-orange-500 focus:ring-orange-500 h-14 bg-white shadow-sm transition-all duration-200 px-4">
                <SelectValue placeholder="Pilih jenis data yang akan diekspor" className="px-2">
                  {selectedExportType && (
                    <div className="flex items-center gap-3">
                      {selectedExportType === "all" ? (
                        <>
                          <div className="p-1.5 bg-orange-100 rounded-md">
                            <Download className="w-3 h-3 text-orange-600" />
                          </div>
                          <span className="font-medium text-gray-800">
                            Export Semua Data {getCategoryDisplayName(category)}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="p-1.5 bg-amber-100 rounded-md">
                            <FileSpreadsheet className="w-3 h-3 text-amber-600" />
                          </div>
                          <span className="font-medium text-gray-800">
                            Export Indikator Spesifik
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-orange-200">
                <SelectItem value="all" className="hover:bg-orange-50 focus:bg-orange-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-orange-100 rounded-md">
                      <Download className="w-3 h-3 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">Export Semua Data {getCategoryDisplayName(category)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Unduh seluruh data dalam kategori ini</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="specific" className="hover:bg-orange-50 focus:bg-orange-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-amber-100 rounded-md">
                      <FileSpreadsheet className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">Export Indikator Spesifik</div>
                      <div className="text-xs text-gray-500 mt-0.5">Pilih indikator tertentu untuk diunduh</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specific Indicator Selection */}
          {selectedExportType === "specific" && (
            <div className="space-y-5 bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-xl border-2 border-dashed border-orange-300">
              <Label htmlFor="indicator-select" className="text-base font-semibold text-gray-800 flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Pilih Indikator Spesifik
              </Label>
              {isLoadingIndicators ? (
                <div className="flex items-center gap-4 p-5 border-2 border-orange-200 rounded-xl bg-gradient-to-r from-orange-100 to-amber-100">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                  <div>
                    <span className="text-sm font-medium text-orange-800">Memuat daftar indikator...</span>
                    <p className="text-xs text-orange-600 mt-1">Mohon tunggu sebentar</p>
                  </div>
                </div>
              ) : (
                <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
                  <SelectTrigger className="border-2 border-orange-200 hover:border-orange-300 focus:border-orange-500 focus:ring-orange-500 h-14 bg-white shadow-sm transition-all duration-200 px-4">
                    <SelectValue placeholder="Pilih indikator yang akan diekspor" className="px-2">
                      {selectedIndicator && indicators.find(ind => ind.id === selectedIndicator) && (
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-orange-100 rounded-md">
                            <FileSpreadsheet className="w-3 h-3 text-orange-600" />
                          </div>
                          <span className="font-medium text-gray-800">
                            {indicators.find(ind => ind.id === selectedIndicator)?.name}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 border-orange-200">
                    {Array.isArray(indicators) && indicators.length > 0 ? (
                      indicators.map((indicator) => (
                        <SelectItem key={indicator.id} value={indicator.id} className="hover:bg-orange-50 focus:bg-orange-50 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-orange-100 rounded-md">
                              <FileSpreadsheet className="w-3 h-3 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate">{indicator.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {indicator.subcategory} • {indicator.data_count || 0} data
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">❌ Tidak ada indikator tersedia</span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Export Button */}
          <div className="space-y-4">
            <Button
              onClick={handleExport}
              disabled={!selectedExportType || (selectedExportType === "specific" && !selectedIndicator) || isExporting}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {isExporting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <div>
                    <span className="block">Mengekspor Data...</span>
                    <span className="text-xs opacity-80">Mohon tunggu sebentar</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block">Export Data ke Excel</span>
                    <span className="text-xs opacity-90">
                      {selectedExportType === "all" 
                        ? `Semua data ${getCategoryDisplayName(category)}`
                        : selectedExportType === "specific" && selectedIndicator
                        ? `${indicators.find(ind => ind.id === selectedIndicator)?.name || 'Indikator terpilih'}`
                        : "Pilih jenis export terlebih dahulu"
                      }
                    </span>
                  </div>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
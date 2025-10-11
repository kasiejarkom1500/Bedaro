"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, BarChart3, Calendar, Home, TrendingUp, TrendingDown, Minus, LineChart, Table, Info, Database, ChevronDown, Filter, Download, ChevronLeft, ChevronRight, List, Grid } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface IndicatorDetailPageProps {
  indicatorId?: string
  indicator?: {
    id?: string
    title?: string
    category?: string
    icon?: any
    sourcePage?: string
  }
  onBack: () => void
}

interface IndicatorDetailData {
  id: string
  indikator: string
  deskripsi: string
  satuan: string
  kategori: string
  subcategory: string
  lastUpdated: string
  metadata: {
    level?: string
    wilayah?: string
    periode?: string
    konsep_definisi?: string
    metode_perhitungan?: string
    interpretasi?: string
    sumber_data?: string
  }
  data: Array<{
    year: number
    month?: number  // Add month field for monthly data
    value: number
    status: string
    changePercent?: number | null
    changeValue?: number | null
    period_label?: string  // Add period label for display (e.g., "Jan 2024")
  }>
  statistics: {
    latestValue: number | null
    latestYear: number | null
    previousValue: number | null
    previousYear: number | null
    changePercent: number | null
    changeDirection: 'increase' | 'decrease' | 'stable' | null
    lastUpdated: string | null
    totalDataPoints: number
    earliestYear: number | null
    averageValue: number | null
    maxValue: number | null
    minValue: number | null
    dataRange: number | null
  }
}

export function IndicatorDetailPage({ indicatorId, indicator, onBack }: IndicatorDetailPageProps) {
  const [data, setData] = useState<IndicatorDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conceptOpen, setConceptOpen] = useState(false)
  const [methodOpen, setMethodOpen] = useState(false)
  const [interpretationOpen, setInterpretationOpen] = useState(false)
  const [startYear, setStartYear] = useState("2020")
  const [endYear, setEndYear] = useState("2024")
  const [showAll, setShowAll] = useState(true)
  const [showChanges, setShowChanges] = useState(false)
  const [compareIndicators, setCompareIndicators] = useState<string[]>([])
  const [availableIndicators, setAvailableIndicators] = useState<IndicatorDetailData[]>([])
  const [comparisonData, setComparisonData] = useState<{[key: string]: IndicatorDetailData}>({})
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [viewMode, setViewMode] = useState<'scroll' | 'pagination'>('scroll')

  // Use indicatorId if provided, otherwise fall back to legacy indicator.id
  const currentIndicatorId = indicatorId || indicator?.id

  // Fetch available indicators for comparison
  useEffect(() => {
    const fetchAvailableIndicators = async () => {
      if (!data?.kategori) return
      
      try {
        const response = await fetch(`/api/public/indicators?category=${encodeURIComponent(data.kategori)}&includeData=true`)
        if (response.ok) {
          const result = await response.json()
          // Filter out current indicator from comparison options
          const filtered = result.data.indicators.filter((ind: IndicatorDetailData) => ind.id !== currentIndicatorId)
          setAvailableIndicators(filtered)
        }
      } catch (error) {
        console.error('Error fetching available indicators:', error)
      }
    }

    if (data?.kategori) {
      fetchAvailableIndicators()
    }
  }, [data?.kategori, currentIndicatorId])

  // Fetch comparison data when indicators are selected
  useEffect(() => {
    const fetchComparisonData = async () => {
      const newComparisonData: {[key: string]: IndicatorDetailData} = {}
      
      for (const indicatorId of compareIndicators) {
        if (!comparisonData[indicatorId]) {
          try {
            const response = await fetch(`/api/public/indicators/${indicatorId}`)
            if (response.ok) {
              const result = await response.json()
              newComparisonData[indicatorId] = result.data
            }
          } catch (error) {
            console.error(`Error fetching comparison data for ${indicatorId}:`, error)
          }
        }
      }
      
      if (Object.keys(newComparisonData).length > 0) {
        setComparisonData(prev => ({ ...prev, ...newComparisonData }))
      }
    }

    if (compareIndicators.length > 0) {
      fetchComparisonData()
    }
  }, [compareIndicators, comparisonData])

  // Filter data based on year range and showAll setting
  const getFilteredData = (indicatorData: IndicatorDetailData) => {
    if (showAll) {
      return indicatorData.data
    }
    
    const start = parseInt(startYear)
    const end = parseInt(endYear)
    
    // For monthly data, include all months within the year range
    return indicatorData.data.filter(item => {
      return item.year >= start && item.year <= end
    })
  }

  // Handle comparison indicator selection
  const handleComparisonChange = (value: string) => {
    if (value && !compareIndicators.includes(value)) {
      setCompareIndicators(prev => [...prev, value])
    }
  }

  // Remove comparison indicator
  const removeComparisonIndicator = (indicatorId: string) => {
    setCompareIndicators(prev => prev.filter(id => id !== indicatorId))
    setComparisonData(prev => {
      const newData = { ...prev }
      delete newData[indicatorId]
      return newData
    })
  }

  // Download Excel function
  const downloadExcel = async () => {
    if (!data) return
    
    setIsDownloading(true)
    try {
      const workbook = XLSX.utils.book_new()
      
      // Use the same data preparation logic as the table
      const excelData = preparedTableData.map((row, index) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        // Create ordered object to ensure consistent column order
        const rowData: any = {
          'Indikator': row.indicator,
          'Periode': row.period,
          'Tahun': row.year
        }
        
        // Add month column if we have monthly data (after Tahun, before Nilai)
        if (hasMonthlyData) {
          rowData['Bulan'] = row.month ? monthNames[row.month - 1] : '-'
        }
        
        // Add remaining columns
        rowData['Nilai'] = formatNumber(row.value)
        rowData['Satuan'] = row.satuan
        
        // Only add change percentage if showChanges is enabled
        if (showChanges) {
          rowData['Perubahan (%)'] = row.changePercent !== null && row.changePercent !== undefined ? 
                                    formatPercentage(row.changePercent, 2) : '-'
        }
        
        return rowData
      })
      
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      
      // Auto-size columns
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      const columnWidths: any[] = []
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          const cell = worksheet[cellAddress]
          if (cell && cell.v) {
            const cellLength = cell.v.toString().length
            if (cellLength > maxWidth) {
              maxWidth = cellLength
            }
          }
        }
        columnWidths.push({ wch: Math.min(maxWidth + 2, 50) })
      }
      worksheet['!cols'] = columnWidths
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Indikator')
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      const fileName = `${data.indikator.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      saveAs(blob, fileName)
      
      // Show success message
      setDownloadSuccess(true)
      setTimeout(() => {
        setDownloadSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error downloading Excel:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    const fetchIndicatorDetail = async () => {
      if (!currentIndicatorId) {
        setError('No indicator ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/public/indicators/${currentIndicatorId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch indicator data')
        }
        
        const result = await response.json()
        setData(result.data)
        
        // Set default year range based on actual data
        if (result.data && result.data.data && result.data.data.length > 0) {
          const years = result.data.data.map((item: any) => item.year).sort((a: number, b: number) => a - b)
          const minYear = years[0]
          const maxYear = years[years.length - 1]
          setStartYear(minYear.toString())
          setEndYear(maxYear.toString())
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchIndicatorDetail()
  }, [currentIndicatorId])

  // Fetch comparison data when compareIndicators changes
  useEffect(() => {
    const fetchComparisonData = async () => {
      const newComparisonData: {[key: string]: IndicatorDetailData} = {}
      
      for (const indicatorId of compareIndicators) {
        try {
          const response = await fetch(`/api/public/indicators/${indicatorId}`)
          if (response.ok) {
            const result = await response.json()
            newComparisonData[indicatorId] = result.data
          }
        } catch (error) {
          console.error(`Error fetching comparison data for ${indicatorId}:`, error)
        }
      }
      
      setComparisonData(newComparisonData)
    }

    if (compareIndicators.length > 0) {
      fetchComparisonData()
    } else {
      setComparisonData({})
    }
  }, [compareIndicators])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.multi-select-dropdown')) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [dropdownOpen])

  // Prepare chart data with comparison and change data
  const preparedChartData = useMemo(() => {
    if (!data) return []
    
    const mainData = getFilteredData(data)
    
    // Check if this is inflation/monthly data - either by having month field or by indicator name
    const isInflationIndicator = data.indikator?.toLowerCase().includes('inflasi') || 
                                data.indikator?.toLowerCase().includes('inflation') ||
                                data.indikator?.toLowerCase().includes('yoy') ||
                                data.subcategory?.toLowerCase().includes('inflasi')
    
    const hasMonthField = mainData.some(item => item.month !== undefined && item.month !== null)
    
    // Check if we have multiple data points for the same year (indicating monthly data)
    const yearCounts = mainData.reduce((acc, item) => {
      acc[item.year] = (acc[item.year] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    const hasMultiplePerYear = Object.values(yearCounts).some(count => count > 1)
    
    if (isInflationIndicator || hasMonthField || hasMultiplePerYear) {
      // For monthly/inflation data, create month-based periods
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des']
      
      const chartData = mainData.map((item, index) => {
        // If we have month field, use it; otherwise assign months based on data order within year
        let month = item.month
        if (!month && hasMultiplePerYear) {
          // Find which month this item should be based on its position within the year
          const sameYearItems = mainData.filter(d => d.year === item.year)
          const indexInYear = sameYearItems.indexOf(item)
          month = indexInYear + 1
        }
        
        return {
          year: item.year,
          month: month,
          period: month ? `${monthNames[month - 1]} ${item.year}` : `${item.year}`,
          [data.indikator]: typeof item.value === 'string' ? parseFloat(item.value) : item.value,
          ...(showChanges && item.changePercent !== null && {
            [`${data.indikator}_change`]: typeof item.changePercent === 'string' ? parseFloat(item.changePercent) : item.changePercent
          })
        }
      }).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return (a.month || 0) - (b.month || 0)
      })
      
      return chartData
    } else {
      // For yearly data, use the original logic
      const allYears = new Set(mainData.map(item => item.year))
      
      // Add years from comparison data
      compareIndicators.forEach(compId => {
        const compData = comparisonData[compId]
        if (compData) {
          getFilteredData(compData).forEach(item => allYears.add(item.year))
        }
      })
      
      const sortedYears = Array.from(allYears).sort()
      
      const chartData = sortedYears.map(year => {
        const chartPoint: any = { year, period: year.toString() }
        
        // Main indicator data
        const mainPoint = mainData.find(item => item.year === year)
        if (mainPoint) {
          chartPoint[data.indikator] = typeof mainPoint.value === 'string' ? parseFloat(mainPoint.value) : mainPoint.value
          if (showChanges && mainPoint.changePercent !== null) {
            chartPoint[`${data.indikator}_change`] = typeof mainPoint.changePercent === 'string' ? parseFloat(mainPoint.changePercent) : mainPoint.changePercent
          }
        }
        
        // Comparison indicators data
        compareIndicators.forEach(compId => {
          const compData = comparisonData[compId]
          if (compData) {
            const compPoint = getFilteredData(compData).find(item => item.year === year)
            if (compPoint) {
              chartPoint[compData.indikator] = typeof compPoint.value === 'string' ? parseFloat(compPoint.value) : compPoint.value
              if (showChanges && compPoint.changePercent !== null) {
                chartPoint[`${compData.indikator}_change`] = typeof compPoint.changePercent === 'string' ? parseFloat(compPoint.changePercent) : compPoint.changePercent
              }
            }
          }
        })
        
        return chartPoint
      })
      
      return chartData
    }
  }, [data, compareIndicators, comparisonData, showChanges, showAll, startYear, endYear])

  // Prepare table data
  const preparedTableData = useMemo(() => {
    if (!data) return []
    
    const allData: any[] = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Check if this is inflation/monthly data - same logic as chart
    const mainData = getFilteredData(data)
    const isInflationIndicator = data.indikator?.toLowerCase().includes('inflasi') || 
                                data.indikator?.toLowerCase().includes('inflation') ||
                                data.indikator?.toLowerCase().includes('yoy') ||
                                data.subcategory?.toLowerCase().includes('inflasi')
    
    const hasMonthField = mainData.some(item => item.month !== undefined && item.month !== null)
    
    // Check if we have multiple data points for the same year (indicating monthly data)
    const yearCounts = mainData.reduce((acc, item) => {
      acc[item.year] = (acc[item.year] || 0) + 1
      return acc
    }, {} as Record<number, number>)
    const hasMultiplePerYear = Object.values(yearCounts).some(count => count > 1)
    
    const isMonthlyData = isInflationIndicator || hasMonthField || hasMultiplePerYear
    
    // Main indicator data
    const sortedMainData = getFilteredData(data).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return (a.month || 0) - (b.month || 0)
    })
    
    sortedMainData.forEach((item, index) => {
      // For monthly data, assign month based on data order if not present
      let monthValue = item.month
      
      // If it's monthly data and no month is provided, assign month based on index within year
      if (isMonthlyData && !monthValue) {
        const sameYearItems = sortedMainData.filter(d => d.year === item.year)
        const indexInYear = sameYearItems.indexOf(item)
        monthValue = (indexInYear % 12) + 1 // Cycle through months 1-12
      }
      
      allData.push({
        indicator: data.indikator,
        year: item.year,
        month: monthValue,
        period: monthValue ? `${monthNames[monthValue - 1]} ${item.year}` : `${item.year}`,
        value: item.value,
        changePercent: item.changePercent,
        satuan: data.satuan,
        isMonthlyData: isMonthlyData
      })
    })
    
    // Comparison indicators data
    compareIndicators.forEach(compId => {
      const compData = comparisonData[compId]
      if (compData) {
        const compMainData = getFilteredData(compData)
        const compIsInflationIndicator = compData.indikator?.toLowerCase().includes('inflasi') || 
                                        compData.indikator?.toLowerCase().includes('inflation') ||
                                        compData.indikator?.toLowerCase().includes('yoy') ||
                                        compData.subcategory?.toLowerCase().includes('inflasi')
        
        const compHasMonthField = compMainData.some(item => item.month !== undefined && item.month !== null)
        
        const compYearCounts = compMainData.reduce((acc, item) => {
          acc[item.year] = (acc[item.year] || 0) + 1
          return acc
        }, {} as Record<number, number>)
        const compHasMultiplePerYear = Object.values(compYearCounts).some(count => count > 1)
        
        const compIsMonthlyData = compIsInflationIndicator || compHasMonthField || compHasMultiplePerYear
        
        const sortedCompData = getFilteredData(compData).sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year
          return (a.month || 0) - (b.month || 0)
        })
        
        sortedCompData.forEach((item, index) => {
          // For monthly data, assign month based on data order if not present
          let monthValue = item.month
          
          // If it's monthly data and no month is provided, assign month based on index within year
          if (compIsMonthlyData && !monthValue) {
            const sameYearItems = sortedCompData.filter(d => d.year === item.year)
            const indexInYear = sameYearItems.indexOf(item)
            monthValue = (indexInYear % 12) + 1 // Cycle through months 1-12
          }
          
          allData.push({
            indicator: compData.indikator,
            year: item.year,
            month: monthValue,
            period: monthValue ? `${monthNames[monthValue - 1]} ${item.year}` : `${item.year}`,
            value: item.value,
            changePercent: item.changePercent,
            satuan: compData.satuan,
            isMonthlyData: compIsMonthlyData
          })
        })
      }
    })
    
    // Sort by year, then month, then indicator
    return allData.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      if (a.month !== b.month) return (b.month || 0) - (a.month || 0)
      return a.indicator.localeCompare(b.indicator)
    })
  }, [data, compareIndicators, comparisonData, showAll, startYear, endYear])

  // Check if we have monthly data (for showing month column)
  const hasMonthlyData = useMemo(() => {
    // Check if any row indicates monthly data
    const hasMonthData = preparedTableData.some(row => row.month !== null && row.month !== undefined)
    const hasMonthlyFlag = preparedTableData.some(row => row.isMonthlyData)
    
    // Debug specific to monthly data detection
    if (data?.indikator?.toLowerCase().includes('inflasi')) {
      console.log('=== INFLASI DATA CHECK ===')
      console.log('Has month data:', hasMonthData)
      console.log('Has monthly flag:', hasMonthlyFlag)
      console.log('Sample row:', preparedTableData[0])
    }
    
    return hasMonthData || hasMonthlyFlag
  }, [preparedTableData, data])

  // Pagination logic
  const totalItems = preparedTableData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTableData = preparedTableData.slice(startIndex, endIndex)

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [preparedTableData.length, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  // Generate colors for different indicators
  const getIndicatorColor = (index: number) => {
    const colors = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    return colors[index % colors.length]
  }

  const getChangeColorByIndex = (index: number) => {
    const colors = ['#f97316', '#6366f1', '#14b8a6', '#eab308', '#f87171', '#a855f7', '#0891b2']
    return colors[index % colors.length]
  }

  // Function for statistics change direction styling
  const getChangeColor = (direction: string | null) => {
    if (direction === 'increase') return 'text-green-600'
    if (direction === 'decrease') return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-orange-200 rounded-lg w-1/3"></div>
              <div className="h-64 bg-orange-200 rounded-xl"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-96 bg-orange-200 rounded-xl"></div>
                <div className="lg:col-span-2 h-96 bg-orange-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 mb-4">{error || 'Indikator tidak ditemukan'}</p>
                <Button onClick={onBack} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return 'N/A'
    
    // Use Indonesian number format: "." for thousands, "," for decimal, 2 decimal places
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const formatPercentage = (num: number | null, decimals: number = 2) => {
    if (num === null || num === undefined) return 'N/A'
    
    // Use Indonesian number format for percentage with specified decimal places
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
    
    return `${num > 0 ? '+' : ''}${formatted}%`
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString))
  }

  const getChangeIcon = (direction: string | null) => {
    switch (direction) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getSourcePageName = (sourcePage?: string) => {
    switch (sourcePage) {
      case "home":
        return "Beranda"
      case "demografi":
        return "Demografi & Sosial"
      case "ekonomi":
        return "Ekonomi"
      case "lingkungan":
        return "Lingkungan & Multi-Domain"
      case "literasi":
        return "Literasi Statistik"
      default:
        return "Demografi & Sosial"
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-3 text-sm">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-2 h-auto text-orange-600 hover:text-orange-700 hover:bg-orange-100 flex items-center gap-2 rounded-lg"
          >
            <Home className="w-4 h-4" />
            {getSourcePageName(indicator?.sourcePage)}
          </Button>
          <span className="text-orange-300">/</span>
          <span className="text-orange-500 font-medium">{data.subcategory || data.kategori}</span>
          <span className="text-orange-300">/</span>
          <span className="text-orange-800 font-semibold">{data.indikator}</span>
        </nav>

        {/* Header Section with Background Image and Gradient - No Icon */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url(/images/ekonomi-bg.jpg)",
            }}
          ></div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/90 via-orange-600/95 to-amber-600/90"></div>
          
          {/* Content */}
          <div className="relative z-10 p-6 text-white">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full transform -translate-y-1/2"></div>
            
            <div className="relative z-20">
              <Button
                variant="ghost"
                onClick={onBack}
                className="flex items-center gap-2 text-white hover:text-white hover:bg-white/20 mb-4 p-2 rounded-lg backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke {getSourcePageName(indicator?.sourcePage)}
              </Button>

              {/* Header Content */}
              <div className="space-y-4">
                <Badge className="bg-white/30 text-white border-white/40 px-3 py-1 backdrop-blur-sm">
                  {data.subcategory || data.kategori}
                </Badge>
                <h1 className="text-2xl font-bold leading-tight drop-shadow-sm">{data.indikator}</h1>
                <p className="text-white/95 leading-relaxed max-w-2xl drop-shadow-sm">
                  {data.deskripsi || `${data.indikator} merupakan salah satu indikator penting dalam kategori ${data.subcategory || data.kategori} untuk Kabupaten Bungo.`}
                </p>
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm drop-shadow-sm">Terakhir diperbarui: {formatDate(data.lastUpdated)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Moved to Left */}
          <div className="lg:col-span-1 space-y-6">
            {/* Key Metrics */}
            <Card className="border-2 shadow-lg bg-white border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-700 text-lg">Nilai Terkini</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <div className="text-3xl font-bold text-orange-600">
                    {formatNumber(data.statistics.latestValue)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{data.satuan}</div>
                  {data.statistics.changePercent !== null && (
                    <div className={`text-lg font-semibold mt-2 flex items-center justify-center gap-1 ${getChangeColor(data.statistics.changeDirection)}`}>
                      {getChangeIcon(data.statistics.changeDirection)}
                      <span>
                        {formatPercentage(data.statistics.changePercent, 1)}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">vs periode sebelumnya</div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="border-2 shadow-lg bg-white border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-orange-600" />
                  </div>
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">Level</label>
                    <p className="text-sm font-semibold text-orange-800">{data.metadata.level || 'Kabupaten'}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">Wilayah</label>
                    <p className="text-sm font-semibold text-orange-800">{data.metadata.wilayah || 'Kabupaten Bungo'}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">Periode</label>
                    <p className="text-sm font-semibold text-orange-800">{data.metadata.periode || 'Tahunan'}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">Satuan</label>
                    <p className="text-sm font-semibold text-orange-800">{data.satuan}</p>
                  </div>
                </div>

                {/* Expandable Sections */}
                <div className="space-y-3">
                  {data.metadata.konsep_definisi && (
                    <Collapsible open={conceptOpen} onOpenChange={setConceptOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-orange-50 rounded-lg transition-colors">
                        <span className="font-medium text-orange-700">Konsep & Definisi</span>
                        <ChevronDown className={`w-4 h-4 text-orange-600 transition-transform ${conceptOpen ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 text-sm text-gray-600 leading-relaxed bg-orange-50/50 rounded-lg mt-2">
                        {data.metadata.konsep_definisi}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {data.metadata.metode_perhitungan && (
                    <Collapsible open={methodOpen} onOpenChange={setMethodOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-orange-50 rounded-lg transition-colors">
                        <span className="font-medium text-orange-700">Metode Perhitungan</span>
                        <ChevronDown className={`w-4 h-4 text-orange-600 transition-transform ${methodOpen ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 text-sm text-gray-600 leading-relaxed bg-orange-50/50 rounded-lg mt-2">
                        {data.metadata.metode_perhitungan}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {data.metadata.interpretasi && (
                    <Collapsible open={interpretationOpen} onOpenChange={setInterpretationOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-orange-50 rounded-lg transition-colors">
                        <span className="font-medium text-orange-700">Interpretasi</span>
                        <ChevronDown className={`w-4 h-4 text-orange-600 transition-transform ${interpretationOpen ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 text-sm text-gray-600 leading-relaxed bg-orange-50/50 rounded-lg mt-2">
                        {data.metadata.interpretasi}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter Section */}
            <Card className="border-2 shadow-lg bg-white border-orange-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-orange-700">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Filter className="w-4 h-4 text-orange-600" />
                  </div>
                  Filter & Pengaturan Data
                </CardTitle>
                <p className="text-sm text-gray-600">Menampilkan {data.data.length} dari {data.statistics.totalDataPoints} data tersedia</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Year Range Selector */}
                <div className="space-y-3">
                  <label className={`text-sm font-medium ${showAll ? 'text-gray-400' : 'text-gray-700'}`}>Rentang Tahun</label>
                  <div className={`flex items-center gap-3 p-4 border rounded-xl transition-all ${
                    showAll 
                      ? 'border-gray-200 bg-gray-50/50 opacity-50' 
                      : 'border-orange-200 bg-orange-50/50'
                  }`}>
                    <Input
                      type="number"
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                      placeholder="Tahun mulai"
                      min="2000"
                      max="2030"
                      disabled={showAll}
                      className={`flex-1 border-0 shadow-sm transition-all ${
                        showAll 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white focus-visible:ring-orange-500'
                      }`}
                    />
                    <span className={`font-medium transition-all ${showAll ? 'text-gray-400' : 'text-orange-500'}`}>→</span>
                    <Input
                      type="number"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      placeholder="Tahun akhir"
                      min="2000"
                      max="2030"
                      disabled={showAll}
                      className={`flex-1 border-0 shadow-sm transition-all ${
                        showAll 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white focus-visible:ring-orange-500'
                      }`}
                    />
                    <Calendar className={`w-5 h-5 transition-all ${showAll ? 'text-gray-400' : 'text-orange-500'}`} />
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 border border-orange-200 rounded-lg bg-orange-50/30">
                    <Checkbox 
                      id="show-all" 
                      checked={showAll} 
                      onCheckedChange={(checked) => setShowAll(checked === true)}
                      className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                    />
                    <label htmlFor="show-all" className="text-sm font-medium text-gray-700">
                      Tampilkan Semua Data
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border border-orange-200 rounded-lg bg-orange-50/30">
                    <Checkbox 
                      id="show-changes" 
                      checked={showChanges} 
                      onCheckedChange={(checked) => setShowChanges(checked === true)}
                      className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                    />
                    <label htmlFor="show-changes" className="text-sm font-medium text-gray-700">
                      Tampilkan Perubahan
                    </label>
                  </div>
                </div>

                {/* Compare and Download */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Bandingkan Data</label>
                  <div className="space-y-3">
                    {availableIndicators.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm text-gray-600">Pilih indikator untuk perbandingan:</label>
                        
                        {/* Multi-Select Dropdown */}
                        <div className="relative multi-select-dropdown">
                          <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 border border-orange-200 rounded-md bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <span className="text-sm text-gray-700">
                              {compareIndicators.length === 0 
                                ? "Pilih indikator untuk dibandingkan..." 
                                : `${compareIndicators.length} indikator dipilih`
                              }
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {dropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {availableIndicators
                                .filter(ind => ind.id !== currentIndicatorId)
                                .map((indicator) => {
                                  const isSelected = compareIndicators.includes(indicator.id)
                                  return (
                                    <div
                                      key={indicator.id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setCompareIndicators(compareIndicators.filter(id => id !== indicator.id))
                                        } else {
                                          setCompareIndicators([...compareIndicators, indicator.id])
                                        }
                                      }}
                                      className="flex items-center gap-3 px-3 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                        isSelected 
                                          ? 'bg-orange-600 border-orange-600' 
                                          : 'border-gray-300'
                                      }`}>
                                        {isSelected && (
                                          <span className="text-white text-xs">✓</span>
                                        )}
                                      </div>
                                      <span className="text-sm flex-1 text-gray-700">{indicator.indikator}</span>
                                    </div>
                                  )
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Selected comparison indicators */}
                    {compareIndicators.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 flex items-center justify-between">
                          <span>Indikator yang dipilih ({compareIndicators.length}):</span>
                          {compareIndicators.length > 3 && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              Menampilkan {compareIndicators.length} indikator
                            </span>
                          )}
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {compareIndicators.map((compId) => {
                            const indicator = availableIndicators.find(ind => ind.id === compId)
                            return (
                              <div key={compId} className="flex items-center justify-between bg-orange-50 p-2 rounded text-sm">
                                <span className="flex-1 truncate pr-2">{indicator?.indikator || 'Loading...'}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 flex-shrink-0"
                                  onClick={() => setCompareIndicators(compareIndicators.filter(id => id !== compId))}
                                >
                                  ×
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 w-full"
                      onClick={downloadExcel}
                      disabled={isDownloading}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isDownloading ? 'Mengunduh...' : 'Download Excel'}
                    </Button>
                    
                    {/* Success Message */}
                    {downloadSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-sm font-medium">Excel berhasil diunduh!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Visualization */}
            <Card className="border-2 shadow-lg bg-white border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-orange-600" />
                  </div>
                  Visualisasi Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="grafik" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-orange-100">
                    <TabsTrigger 
                      value="grafik" 
                      className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                    >
                      <LineChart className="w-4 h-4" />
                      Grafik Tren
                    </TabsTrigger>
                    <TabsTrigger 
                      value="tabel" 
                      className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                    >
                      <Table className="w-4 h-4" />
                      Tabel Data
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="grafik" className="mt-6">
                    <div className="h-80 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={preparedChartData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="period" 
                            stroke="#6b7280"
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval={data && (data.indikator?.toLowerCase().includes('inflasi') || data.indikator?.toLowerCase().includes('inflation')) ? 0 : 'preserveStartEnd'}
                          />
                          <YAxis 
                            yAxisId="left"
                            stroke="#6b7280"
                            fontSize={12}
                            width={80}
                            tickFormatter={(value) => formatNumber(value)}
                          />
                          {showChanges && (
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              stroke="#f97316"
                              fontSize={12}
                              width={80}
                              tickFormatter={(value) => {
                                // Format percentage values with Indonesian format (no + sign for axis)
                                const formatted = new Intl.NumberFormat('id-ID', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                }).format(value)
                                return `${formatted}%`
                              }}
                            />
                          )}
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                            labelFormatter={(label) => {
                              // Check if this is inflation/monthly data
                              const isInflationIndicator = data && (data.indikator?.toLowerCase().includes('inflasi') || 
                                                                   data.indikator?.toLowerCase().includes('inflation') ||
                                                                   data.indikator?.toLowerCase().includes('yoy'))
                              return isInflationIndicator ? `Periode ${label}` : `Tahun ${label}`
                            }}
                            formatter={(value: any, name: string) => {
                              // Format the value using Indonesian number format with 2 decimal places
                              let numValue: number
                              
                              if (typeof value === 'number') {
                                numValue = value
                              } else if (typeof value === 'string') {
                                numValue = parseFloat(value)
                              } else {
                                return [value, name]
                              }
                              
                              // Only format if it's a valid number
                              if (!isNaN(numValue)) {
                                const formatted = formatNumber(numValue)
                                return [formatted, name]
                              }
                              
                              return [value, name]
                            }}
                          />
                          <Legend />
                          
                          {/* Main indicator line */}
                          {data && (
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey={data.indikator}
                              stroke={getIndicatorColor(0)}
                              strokeWidth={3}
                              dot={{ fill: getIndicatorColor(0), strokeWidth: 2, r: 5 }}
                              activeDot={{ r: 7, stroke: getIndicatorColor(0), strokeWidth: 2 }}
                            />
                          )}
                          
                          {/* Comparison indicators */}
                          {compareIndicators.map((compId, index) => {
                            const compData = comparisonData[compId]
                            if (!compData) return null
                            
                            return (
                              <Line
                                key={compId}
                                yAxisId="left"
                                type="monotone"
                                dataKey={compData.indikator}
                                stroke={getIndicatorColor(index + 1)}
                                strokeWidth={2}
                                dot={{ fill: getIndicatorColor(index + 1), strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: getIndicatorColor(index + 1), strokeWidth: 2 }}
                              />
                            )
                          })}
                          
                          {/* Change lines (if enabled) */}
                          {showChanges && data && (
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey={`${data.indikator}_change`}
                              stroke={getChangeColorByIndex(0)}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={{ fill: getChangeColorByIndex(0), strokeWidth: 2, r: 3 }}
                              name={`${data.indikator} (% Change)`}
                            />
                          )}
                          
                          {showChanges && compareIndicators.map((compId, index) => {
                            const compData = comparisonData[compId]
                            if (!compData) return null
                            
                            return (
                              <Line
                                key={`${compId}_change`}
                                yAxisId="right"
                                type="monotone"
                                dataKey={`${compData.indikator}_change`}
                                stroke={getChangeColorByIndex(index + 1)}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: getChangeColorByIndex(index + 1), strokeWidth: 2, r: 3 }}
                                name={`${compData.indikator} (% Change)`}
                              />
                            )
                          })}
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tabel" className="mt-6">
                    {/* Table view mode controls */}
                    <div className="flex justify-between items-center mb-4 p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Mode Tampilan:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewMode('scroll')}
                            className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors ${
                              viewMode === 'scroll' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-white text-gray-600 hover:bg-orange-100'
                            }`}
                          >
                            <List className="w-4 h-4" />
                            Scroll
                          </button>
                          <button
                            onClick={() => setViewMode('pagination')}
                            className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors ${
                              viewMode === 'pagination' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-white text-gray-600 hover:bg-orange-100'
                            }`}
                          >
                            <Grid className="w-4 h-4" />
                            Pagination
                          </button>
                        </div>
                      </div>
                      
                      {viewMode === 'pagination' && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Tampilkan:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                            className="px-2 py-1 border border-orange-200 rounded-md text-gray-700 bg-white"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                          <span className="text-gray-600">data per halaman</span>
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-orange-200">
                      {/* Table wrapper - conditional scroll based on view mode */}
                      <div className={viewMode === 'scroll' ? "max-h-96 overflow-y-auto" : ""}>
                        <table className="w-full bg-white">
                          <thead className={`bg-orange-50 ${viewMode === 'scroll' ? 'sticky top-0 z-10' : ''}`}>
                            <tr>
                              <th className="text-left p-4 font-semibold text-orange-700">Indikator</th>
                              <th className="text-left p-4 font-semibold text-orange-700">Periode</th>
                              {/* Add separate month column for inflation/monthly data */}
                              {hasMonthlyData && (
                                <th className="text-left p-4 font-semibold text-orange-700">Bulan</th>
                              )}
                              <th className="text-right p-4 font-semibold text-orange-700">Nilai</th>
                              <th className="text-right p-4 font-semibold text-orange-700">Satuan</th>
                              {showChanges && (
                                <th className="text-right p-4 font-semibold text-orange-700">Perubahan (%)</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {(viewMode === 'pagination' ? paginatedTableData : preparedTableData).map((row, index) => (
                              <tr key={`${row.indicator}-${row.year}-${row.month || 0}`} className="border-b border-orange-100 hover:bg-orange-50/50">
                                <td className="p-4 font-medium text-gray-700">{row.indicator}</td>
                                <td className="p-4 font-medium">{row.year}</td>
                                {/* Show month column only if there's monthly data */}
                                {hasMonthlyData && (
                                  <td className="p-4 font-medium">
                                    {row.month ? 
                                      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][row.month - 1] : 
                                      '-'
                                    }
                                  </td>
                                )}
                                <td className="text-right p-4 font-mono">{formatNumber(row.value)}</td>
                                <td className="text-right p-4 text-gray-600">{row.satuan}</td>
                                {showChanges && (
                                  <td className="text-right p-4">
                                    {row.changePercent !== null && row.changePercent !== undefined ? (
                                      <span className={`flex items-center justify-end gap-1 font-medium ${
                                        row.changePercent > 0 ? 'text-green-600' : 
                                        row.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                                      }`}>
                                        {row.changePercent > 0 ? (
                                          <TrendingUp className="w-3 h-3" />
                                        ) : row.changePercent < 0 ? (
                                          <TrendingDown className="w-3 h-3" />
                                        ) : (
                                          <Minus className="w-3 h-3" />
                                        )}
                                        {formatPercentage(row.changePercent, 1)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Table info footer */}
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 border-t border-orange-200 flex justify-between items-center">
                        <div>
                          {viewMode === 'pagination' ? (
                            <>Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} data</>
                          ) : (
                            <>Total: {preparedTableData.length} data
                            {preparedTableData.length > 10 && (
                              <span className="ml-2 text-orange-600">• Scroll untuk melihat lebih banyak data</span>
                            )}</>
                          )}
                        </div>
                        
                        {/* Pagination controls */}
                        {viewMode === 'pagination' && totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="p-1 rounded-md border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-100"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-8 h-8 text-xs rounded-md border ${
                                      currentPage === pageNum
                                        ? 'bg-orange-500 text-white border-orange-500'
                                        : 'bg-white text-gray-600 border-orange-200 hover:bg-orange-100'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="p-1 rounded-md border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-100"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

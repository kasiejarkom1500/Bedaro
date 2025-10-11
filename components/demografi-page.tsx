"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, Search } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"

interface IndicatorData {
  id: string
  code: string
  no: number
  indikator: string
  deskripsi: string
  satuan: string
  kategori: string
  subcategory: string
  updated_at: string
  metadata?: {
    level: string
    wilayah: string
    periode: string
    konsep_definisi: string
    metode_perhitungan: string
    interpretasi: string
  }
  data: any[]
  statistics?: {
    latestValue: number | null
    latestYear: number | null
    previousValue: number | null
    previousYear: number | null
    changePercent: number | null
    lastUpdated: string | null
    totalDataPoints: number
  }
}

interface GroupedIndicators {
  [category: string]: IndicatorData[]
}

interface DemografiPageProps {
  onIndicatorClick: (indicator: IndicatorData) => void
}

export function DemografiPage({ onIndicatorClick }: DemografiPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [indicators, setIndicators] = useState<IndicatorData[]>([])
  const [groupedIndicators, setGroupedIndicators] = useState<GroupedIndicators>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch indicators on component mount
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/public/indicators?category=Statistik%20Demografi%20%26%20Sosial&includeData=true')
        
        if (!response.ok) {
          throw new Error('Failed to fetch indicators')
        }
        
        const result = await response.json()
        setIndicators(result.data.indicators)
        setGroupedIndicators(result.data.grouped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchIndicators()
  }, [])

  // Get subcategories from indicators for filter
  const subcategories = [...new Set(indicators.map(indicator => indicator.subcategory).filter(Boolean))]

  const filteredIndicators = indicators.filter((indicator) => {
    const matchesSearch =
      indicator.indikator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (indicator.subcategory || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || indicator.subcategory === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categoryIcons = {
    Kependudukan: "/icons/kependudukan-icon.png",
    Ketenagakerjaan: "/icons/ketenagakerjaan-icon.png",
    Kemiskinan: "/icons/kemiskinan-icon.png",
  }

  const categoryIllustrations = {
    Kependudukan: "/images/kependudukan-illustration.png",
    Ketenagakerjaan: "/images/ketenagakerjaan-illustration.png",
    Kemiskinan: "/images/kemiskinan-illustration.png",
  }

  const categoryColors = {
    Kependudukan: {
      gradient: "from-orange-400 to-orange-500",
      bg: "bg-gradient-to-br from-orange-50 to-amber-50",
      border: "border-orange-200/50",
      text: "text-orange-700",
      accent: "bg-orange-100/60",
      card: "hover:border-orange-300",
    },
    Ketenagakerjaan: {
      gradient: "from-amber-400 to-orange-500",
      bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
      border: "border-amber-200/50",
      text: "text-amber-700",
      accent: "bg-amber-100/60",
      card: "hover:border-amber-300",
    },
    Kemiskinan: {
      gradient: "from-red-400 to-orange-500",
      bg: "bg-gradient-to-br from-red-50 to-pink-50",
      border: "border-red-200/50",
      text: "text-red-700",
      accent: "bg-red-100/60",
      card: "hover:border-red-300",
    },
  }

  // Default colors for unknown categories
  const defaultColors = {
    gradient: "from-orange-400 to-orange-500",
    bg: "bg-gradient-to-br from-orange-50 to-amber-50",
    border: "border-orange-200/50",
    text: "text-orange-700",
    accent: "bg-orange-100/60",
    card: "hover:border-orange-300",
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-orange-200 rounded-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-orange-200 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border-2 border-red-200/40 max-w-md mx-auto">
              <div className="bg-red-100/60 p-5 rounded-xl w-fit mx-auto mb-5">
                <Search className="w-16 h-16 text-red-400 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">Error Loading Data</h3>
              <p className="text-gray-500 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Compact Rounded Header Section */}
      <div className="container mx-auto px-6 pt-6 pb-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/demografi-bg.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/90 via-orange-700/95 to-amber-700/95 rounded-3xl"></div>

          {/* Compact Header Content */}
          <div className="relative z-10 px-8 py-12 lg:py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                Statistik Demografi
                <span className="block text-orange-50 text-2xl md:text-3xl lg:text-4xl mt-1 drop-shadow-md">
                  Kabupaten Bungo
                </span>
              </h1>

              <p className="text-base md:text-lg text-white/95 max-w-3xl mx-auto leading-relaxed font-light drop-shadow-sm">
                Eksplorasi data komprehensif kependudukan, ketenagakerjaan, dan indikator sosial ekonomi yang
                mencerminkan dinamika pembangunan masyarakat Kabupaten Bungo
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-4 text-white/90 text-sm drop-shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/80 rounded-full drop-shadow-sm"></div>
                  <span>{indicators.length} Indikator</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/80 rounded-full drop-shadow-sm"></div>
                  <span>{subcategories.length} Kategori</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Clean Background */}
      <div className="container mx-auto px-6 pb-12">
        {/* Search and Filter Section */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-200/40 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5 z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Cari indikator demografi berdasarkan nama atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-5 py-3 border-orange-200/50 focus:border-orange-400 focus:ring-orange-400/50 rounded-xl text-base bg-white/70 backdrop-blur-sm"
                />
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <span className="text-gray-700 font-medium whitespace-nowrap">Filter:</span>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-56 border-orange-200/50 focus:border-orange-400 focus:ring-orange-400/50 rounded-xl bg-white/70 backdrop-blur-sm py-3">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-orange-200/50 bg-white/95 backdrop-blur-sm">
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory || ''}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="max-w-7xl mx-auto">
          {subcategories.map((subcategory) => {
            const categoryIndicators = filteredIndicators.filter((item) => item.subcategory === subcategory)
            const iconSrc = categoryIcons[subcategory as keyof typeof categoryIcons]
            const illustrationSrc = categoryIllustrations[subcategory as keyof typeof categoryIllustrations]
            const colors = categoryColors[subcategory as keyof typeof categoryColors] || defaultColors

            if (categoryIndicators.length === 0) return null

            return (
              <section key={subcategory} className="mb-16">
                {/* Category Header */}
                <div
                  className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 mb-8 shadow-sm backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`${colors.accent} p-3 rounded-xl shadow-sm`}>
                      <Image
                        src={iconSrc || "/placeholder.svg"}
                        alt={`${subcategory} icon`}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <div>
                      <h2 className={`text-2xl lg:text-3xl font-bold ${colors.text} mb-1`}>{subcategory}</h2>
                      <p className="text-gray-600">{categoryIndicators.length} indikator statistik tersedia</p>
                    </div>
                  </div>
                </div>

                {/* Cards Grid - Pure Orange Cards Only */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categoryIndicators.map((indicator, index) => {
                    return (
                      <div
                        key={indicator.id}
                        className="group hover:shadow-xl transition-all duration-300 cursor-pointer rounded-3xl overflow-hidden hover:-translate-y-1 hover:scale-[1.02]"
                        onClick={() => onIndicatorClick(indicator)}
                      >
                        {/* Pure Orange Card - No White Sections */}
                        <div
                          className={`bg-gradient-to-r ${colors.gradient} p-8 text-white relative overflow-hidden h-[260px] flex flex-col justify-between`}
                        >
                          {/* Top Section - Category Badge */}
                          <div className="relative z-10">
                            <div className="inline-flex items-center px-4 py-2 bg-white/25 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                              {subcategory}
                            </div>
                          </div>

                          {/* Middle Section - Title positioned at center-left */}
                          <div className="relative z-10 flex-1 flex items-center justify-between">
                            <div className="flex-1 pr-6">
                              <h3 className="text-2xl font-bold leading-tight text-white max-w-[180px]">
                                {indicator.indikator}
                              </h3>
                            </div>

                            {/* Large Illustration positioned at absolute bottom right */}
                            {illustrationSrc && (
                              <div className="absolute bottom-0 right-0 z-10">
                                <div className="w-48 h-36">
                                  <Image
                                    src={illustrationSrc || "/placeholder.svg"}
                                    alt={`${indicator.indikator} illustration`}
                                    width={192}
                                    height={144}
                                    className="w-full h-full object-contain drop-shadow-lg"
                                    style={{
                                      transform: "translateY(10px)", // Push illustration slightly below card bottom
                                    }}
                                    quality={95}
                                    priority={subcategory === "Kependudukan"}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bottom Section - Button */}
                          <div className="relative z-20">
                            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/90 text-orange-600 hover:bg-white hover:text-orange-700 font-semibold text-sm transition-all duration-300 rounded-full shadow-lg group-hover:gap-3 backdrop-blur-sm">
                              <span>Lihat Data</span>
                              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </button>
                          </div>

                          {/* Background decorative elements */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {/* No Results State */}
        {filteredIndicators.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border-2 border-orange-200/40 max-w-md mx-auto">
              <div className="bg-orange-100/60 p-5 rounded-xl w-fit mx-auto mb-5">
                <Search className="w-16 h-16 text-orange-400 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">Tidak Ada Hasil Ditemukan</h3>
              <p className="text-gray-500 leading-relaxed">
                Maaf, tidak ada indikator yang sesuai dengan pencarian "
                <span className="font-semibold text-orange-600">{searchQuery}</span>".
                <br />
                Silakan coba kata kunci yang berbeda.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BarChart3, Leaf, FileText, Database, PieChart, Activity, MapPin, Loader2 } from "lucide-react"
import { useHomeStats } from "@/hooks/use-home-stats"

type HomePageProps = {
  onTabChange?: (tab: string) => void
}

export function HomePage({ onTabChange }: HomePageProps) {
  const { stats, loading, error, formatValue } = useHomeStats();

  // Dynamic stats data using real data from API
  const statsData = [
    { 
      value: loading ? "..." : formatValue(stats.jumlahPenduduk, 'number'),
      label: "Jumlah Penduduk", 
      color: "blue" 
    },
    { 
      value: loading ? "..." : formatValue(stats.pertumbuhanEkonomi, 'percentage'),
      label: "Pertumbuhan Ekonomi", 
      color: "orange" 
    },
    { 
      value: loading ? "..." : formatValue(stats.tingkatKemiskinan, 'percentage'),
      label: "Tingkat Kemiskinan", 
      color: "red" 
    },
    { 
      value: loading ? "..." : formatValue(stats.tingkatPengangguran, 'percentage'),
      label: "Tingkat Pengangguran Terbuka", 
      color: "yellow" 
    },
    { 
      value: loading ? "..." : formatValue(stats.ipmKabupaten, 'index'),
      label: "IPM Kabupaten", 
      color: "purple" 
    },
    { 
      value: loading ? "..." : formatValue(stats.inflasiBulanTerakhir, 'percentage'),
      label: "Inflasi Bulan Terakhir", 
      color: "teal" 
    },
  ];

  const features = [
    {
      number: "1",
      title: "Pantau Data Strategis",
      description:
        "Mengakses data penting tentang sosial, ekonomi, dan infrastruktur untuk mendukung keputusan pembangunan",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      number: "2",
      title: "Analisis Sosial Masyarakat",
      description: "Memahami kondisi sosial, ketenagakerjaan, dan kesejahteraan warga Kabupaten Bungo",
      bgColor: "bg-orange-100",
      textColor: "text-orange-500",
    },
    {
      number: "3",
      title: "Indeks Kinerja Daerah",
      description: "Menilai capaian pembangunan melalui indikator kinerja, RPJMD, dan SDGs.",
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
  ]

  const availableData = [
    {
      icon: Database,
      title: "Data Demografi dan Sosial",
      description: "Informasi lengkap kependudukan, pendidikan, kesehatan, dan ketenagakerjaan di Kabupaten Bungo.",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: PieChart,
      title: "Analisis Ekonomi Regional",
      description:
        "Data PDRB, inflasi, perdagangan, dan indikator ekonomi makro yang mendukung perencanaan pembangunan ekonomi daerah.",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Activity,
      title: "Indikator Pembangunan",
      description:
        "Berbagai indeks dan indikator pembangunan berkelanjutan termasuk lingkungan hidup dan pembangunan manusia.",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
  ]

  const categories = [
    {
      icon: Users,
      title: "Statistik Demografi dan Sosial",
      description:
        "Menyajikan data kependudukan, pendidikan, kesehatan, ketenagakerjaan, dan indikator sosial lainnya yang mencerminkan kondisi masyarakat Kabupaten Bungo.",
      color: "blue",
      tab: "demografi",
    },
    {
      icon: BarChart3,
      title: "Statistik Ekonomi",
      description:
        "Menampilkan data ekonomi makro seperti PDRB, inflasi, nilai tukar, perdagangan, dan indikator ekonomi yang mendukung analisis perekonomian daerah.",
      color: "orange",
      tab: "ekonomi",
    },
    {
      icon: Leaf,
      title: "Statistik Lingkungan Hidup & Multi-Domain",
      description:
        "Menyediakan data lingkungan hidup, indeks pembangunan manusia, dan indikator lintas sektor yang mendukung pembangunan berkelanjutan.",
      color: "green",
      tab: "lingkungan",
    },
  ]

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, any> = {
      blue: {
        bg: "bg-blue-50",
        hoverBg: "group-hover:bg-blue-600",
        icon: "text-blue-600",
        hoverIcon: "group-hover:text-white",
        border: "border-blue-200",
        hoverBorder: "hover:border-blue-300",
        text: "text-blue-600",
        hoverText: "hover:bg-blue-50",
        gradient: "from-blue-50 to-blue-100",
        borderGradient: "border-blue-200",
      },
      orange: {
        bg: "bg-orange-50",
        hoverBg: "group-hover:bg-orange-500",
        icon: "text-orange-500",
        hoverIcon: "group-hover:text-white",
        border: "border-orange-200",
        hoverBorder: "hover:border-orange-300",
        text: "text-orange-500",
        hoverText: "hover:bg-orange-50",
        gradient: "from-orange-50 to-orange-100",
        borderGradient: "border-orange-200",
      },
      green: {
        bg: "bg-green-50",
        hoverBg: "group-hover:bg-green-600",
        icon: "text-green-600",
        hoverIcon: "group-hover:text-white",
        border: "border-green-200",
        hoverBorder: "hover:border-green-300",
        text: "text-green-600",
        hoverText: "hover:bg-green-50",
        gradient: "from-green-50 to-green-100",
        borderGradient: "border-green-200",
      },
      teal: {
        gradient: "from-teal-50 to-teal-100",
        borderGradient: "border-teal-200",
        text: "text-teal-600",
        textSecondary: "text-teal-700",
      },
      purple: {
        gradient: "from-purple-50 to-purple-100",
        borderGradient: "border-purple-200",
        text: "text-purple-600",
        textSecondary: "text-purple-700",
      },
      red: {
        gradient: "from-red-50 to-red-100",
        borderGradient: "border-red-200",
        text: "text-red-600",
        textSecondary: "text-red-700",
      },
      yellow: {
        gradient: "from-yellow-50 to-yellow-100",
        borderGradient: "border-yellow-200",
        text: "text-yellow-600",
        textSecondary: "text-yellow-700",
      },
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="relative bg-gradient-to-r from-gray-800/90 via-gray-700/90 to-gray-800/90 rounded-2xl overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/taman-tamponek-bungo.jpg')",
                }}
              />
              <div className="absolute inset-0 bg-black/60" />

              <div className="relative z-10 px-8 py-16 md:px-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                  Bedah Data dan Ragam Informasi Kabupaten Bungo
                </h1>
                <p className="text-xl text-white mb-8 max-w-4xl mx-auto leading-relaxed drop-shadow-md">
                  Menyediakan data dan informasi komprehensif guna memperkuat perencanaan serta keputusan strategis di
                  Kabupaten Bungo
                </p>
                <div className="flex items-center justify-center gap-2 text-white">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">Kabupaten Bungo, Provinsi Jambi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Statistics & Features Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50/50 to-blue-50/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Main Statistic */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-baseline gap-2 mb-6">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <span className="text-4xl font-bold text-gray-400">Memuat data...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-7xl md:text-8xl font-bold text-gray-900">
                      {stats.jumlahPenduduk && !isNaN(stats.jumlahPenduduk) ? Math.floor(stats.jumlahPenduduk / 1000) : '365'}
                    </span>
                    <span className="text-4xl md:text-5xl font-bold text-primary">K</span>
                  </>
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-4">Penduduk Kabupaten Bungo</h2>
              <div className="flex items-center gap-3 justify-center lg:justify-start text-gray-700">
                <BarChart3 className="w-6 h-6" />
                <span className="text-lg">Data mendukung perencanaan pembangunan daerah</span>
              </div>
              {error && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <p>⚠️ Error mengambil data: {error}</p>
                  <p className="text-xs mt-1">Menampilkan data fallback</p>
                </div>
              )}
            </div>

            {/* Right: Features */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center lg:text-left">Apa yang bisa kita lakukan?</h2>
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}
                    >
                      <span className={`${feature.textColor} font-bold text-lg`}>{feature.number}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Data Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Visual */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-100 rounded-full opacity-60" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-100 rounded-full opacity-60" />
              <div className="relative bg-gradient-to-br from-orange-50 to-blue-50 rounded-3xl p-8 border border-orange-100">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <img
                  src="/Homepage-Bedaro.jpeg"
                  alt="Data Analysis"
                  className="w-full h-72 object-cover rounded-2xl"
                />
              </div>
            </div>

            {/* Right: Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">Apa saja yang tersedia?</h2>
              <div className="space-y-8">
                {availableData.map((item, index) => (
                  <div key={index} className="flex gap-6">
                    <div
                      className={`w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}
                    >
                      <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">Kategori Statistik</h2>
            <p className="text-xl max-w-4xl mx-auto text-gray-700 leading-relaxed">
              Jelajahi berbagai kategori data statistik yang tersedia untuk mendukung analisis dan pengambilan keputusan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category, index) => {
              const colors = getColorClasses(category.color)
              return (
                <Card
                  key={index}
                  className="border-2 border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white group flex flex-col hover:-translate-y-1"
                >
                  <CardHeader className="pb-6">
                    <div
                      className={`w-18 h-18 ${colors.bg} rounded-3xl flex items-center justify-center mb-6 ${colors.hoverBg} transition-colors`}
                    >
                      <category.icon className={`w-9 h-9 ${colors.icon} ${colors.hoverIcon} transition-colors`} />
                    </div>
                    <CardTitle className="text-xl text-gray-900 leading-tight">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-0">
                    <CardDescription className="text-base leading-relaxed text-gray-700 mb-8 flex-1">
                      {category.description}
                    </CardDescription>
                    <Button
                      variant="outline"
                      className={`w-full ${colors.border} ${colors.text} ${colors.hoverText} ${colors.hoverBorder} bg-transparent font-medium`}
                      onClick={() => onTabChange?.(category.tab)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Lihat Data
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Statistik Singkat Kabupaten Bungo</h3>
            <p className="text-xl text-gray-700">Data terkini yang mencerminkan kondisi terkini daerah</p>
            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mengambil data terbaru dari database...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {statsData.map((stat, index) => {
              const colors = getColorClasses(stat.color)
              return (
                <div
                  key={index}
                  className={`text-center p-8 bg-gradient-to-br ${colors.gradient} rounded-3xl border-2 ${colors.borderGradient} hover:scale-105 transition-transform duration-200 ${loading ? 'animate-pulse' : ''}`}
                >
                  <div className={`text-3xl md:text-4xl font-bold ${colors.text} mb-3`}>
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div
                    className={`text-xs md:text-sm font-medium ${colors.textSecondary || colors.text} leading-tight`}
                  >
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, GraduationCap, Heart, Building, BarChart3, TrendingUp, Globe, BookOpen } from "lucide-react"

const statisticsData = [
  {
    category: "Statistik Demografi & Sosial",
    color: "bg-blue-600", // BPS Blue
    items: [
      {
        title: "Jumlah Penduduk",
        icon: Users,
      },
      {
        title: "Koefisien Gini",
        icon: BarChart3,
      },
      {
        title: "Penduduk Miskin",
        icon: Users,
      },
      {
        title: "Tingkat Pengangguran Terbuka (TPT)",
        icon: GraduationCap,
      },
      {
        title: "Rata-rata Lama Sekolah (RLS)",
        icon: GraduationCap,
      },
      {
        title: "Tingkat Partisipasi Angkatan Kerja (TPAK)",
        icon: Users,
      },
      {
        title: "Tingkat Pengangguran Terbuka (TPT)",
        icon: TrendingUp,
      },
      {
        title: "Garis Kemiskinan",
        icon: BarChart3,
      },
      {
        title: "Jumlah Penduduk Miskin",
        icon: Users,
      },
      {
        title: "Tingkat Kemiskinan (P0)",
        icon: BarChart3,
      },
      {
        title: "Indeks Kedalaman Kemiskinan (P1)",
        icon: BarChart3,
      },
      {
        title: "Indeks Keparahan Kemiskinan (P2)",
        icon: BarChart3,
      },
    ],
  },
  {
    category: "Statistik Ekonomi",
    color: "bg-orange-500", // BPS Orange
    items: [
      {
        title: "PDRB ADHB",
        icon: DollarSign,
      },
      {
        title: "PDRB ADHK",
        icon: DollarSign,
      },
      {
        title: "Pertumbuhan Ekonomi",
        icon: TrendingUp,
      },
      {
        title: "PDRB per Kapita per Tahun ADHB",
        icon: DollarSign,
      },
      {
        title: "PDRB per Kapita per Tahun ADHK",
        icon: DollarSign,
      },
      {
        title: "Pertumbuhan PDRB perkapita ADHK",
        icon: TrendingUp,
      },
      {
        title: "Pertumbuhan PDRB perkapita ADHK",
        icon: TrendingUp,
      },
      {
        title: "Inflasi (tahun Kalender)",
        icon: BarChart3,
      },
      {
        title: "Nilai Tukar Usaha Pertanian (NTUP)",
        icon: Building,
      },
      {
        title: "Inflasi (bulan ke bulan)",
        icon: BarChart3,
      },
      {
        title: "Inflasi (ke ke tahun)",
        icon: BarChart3,
      },
      {
        title: "Neraca Perdagangan Barang",
        icon: Globe,
      },
      {
        title: "Nilai Tukar Petani (NTP)",
        icon: Building,
      },
      {
        title: "Tingkat Penghuni Kamar (TPK)",
        icon: BarChart3,
      },
      {
        title: "Nilai Ekspor",
        icon: Globe,
      },
      {
        title: "Pertumbuhan Ekonomi (c-to-c)",
        icon: TrendingUp,
      },
    ],
  },
  {
    category: "Statistik Lingkungan Hidup & Multi-Domain",
    color: "bg-green-600", // BPS Green
    items: [
      {
        title: "IPM SP2020LF",
        icon: Heart,
      },
      {
        title: "UHH SP2010",
        icon: Heart,
      },
      {
        title: "UHH SP2020LF",
        icon: Heart,
      },
      {
        title: "HLS",
        icon: GraduationCap,
      },
      {
        title: "RLS",
        icon: GraduationCap,
      },
      {
        title: "Pengeluaran Perkapita Pertahun SP2010",
        icon: DollarSign,
      },
      {
        title: "Indeks Pemberdayaan Gender (IDG)",
        icon: Users,
      },
      {
        title: "IPG",
        icon: Users,
      },
      {
        title: "IPG SP2020LF",
        icon: Users,
      },
      {
        title: "Indeks Ketimpangan Gender",
        icon: Users,
      },
    ],
  },
]

export function StatisticsGrid() {
  return (
    <div className="space-y-8">
      {statisticsData.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className={`${section.color} text-white px-4 py-2 text-sm font-medium`}>
              {section.category}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon

              return (
                <Card
                  key={itemIndex}
                  className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-l-4 border-l-blue-600"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${section.color} bg-opacity-10`}>
                        <Icon className={`w-6 h-6 ${section.color.replace("bg-", "text-")}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm font-semibold text-foreground leading-tight text-pretty">
                          {item.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 pb-4">
                    <div className="text-xs text-muted-foreground">Klik untuk melihat detail indikator</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      <div className="space-y-4 mt-12">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-gray-900 text-white px-4 py-2 text-sm font-medium">
            Pojok Literasi Statistik
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Memahami Data Demografi dan Sosial
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Panduan lengkap untuk memahami dan menginterpretasi data kependudukan, kemiskinan, dan indikator sosial
                lainnya.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">Analisis Indikator Ekonomi</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pelajari cara membaca dan menganalisis data PDRB, inflasi, dan indikator ekonomi makro lainnya.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Statistik Lingkungan dan Pembangunan
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Memahami Indeks Pembangunan Manusia (IPM) dan indikator lingkungan hidup untuk pembangunan
                berkelanjutan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center pt-8">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
          Export Data
        </Button>
      </div>
    </div>
  )
}

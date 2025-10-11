"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Search,
  HelpCircle,
  ArrowLeft,
  MessageCircle,
  Phone,
  Mail,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState, useEffect } from "react"

// Flatten all questions from all categories
const allQuestions = [
  // Statistik Demografi & Sosial
  {
    id: "ipm",
    question: "Apa itu Indeks Pembangunan Manusia (IPM)?",
    answer:
      "IPM adalah indikator komposit yang mengukur pencapaian pembangunan manusia dalam tiga dimensi: umur panjang dan hidup sehat (Angka Harapan Hidup), pengetahuan (Harapan Lama Sekolah dan Rata-rata Lama Sekolah), dan standar hidup layak (pengeluaran per kapita yang disesuaikan). Nilai IPM berkisar 0-100, semakin tinggi semakin baik.",
  },
  {
    id: "kemiskinan",
    question: "Bagaimana cara menginterpretasi data kemiskinan?",
    answer:
      "Data kemiskinan menunjukkan persentase penduduk yang pengeluaran per kapitanya di bawah garis kemiskinan. Garis kemiskinan dihitung berdasarkan kebutuhan minimum makanan (2.100 kalori per hari) dan non-makanan. Selain persentase, perhatikan juga jumlah absolut penduduk miskin dan kedalaman kemiskinan.",
  },
  {
    id: "tpt",
    question: "Apa itu Tingkat Pengangguran Terbuka (TPT)?",
    answer:
      "TPT adalah persentase angkatan kerja yang sedang mencari pekerjaan atau mempersiapkan usaha. Angkatan kerja adalah penduduk usia kerja (15+ tahun) yang bekerja atau mencari kerja. TPT yang rendah menunjukkan kondisi ketenagakerjaan yang baik, namun perlu diperhatikan juga kualitas pekerjaan dan tingkat partisipasi angkatan kerja.",
  },
  {
    id: "gpi",
    question: "Bagaimana cara membaca data Gender Parity Index (GPI)?",
    answer:
      "GPI mengukur kesetaraan gender dengan membagi angka partisipasi perempuan dengan laki-laki. Nilai GPI = 1 menunjukkan kesetaraan sempurna, < 1 menunjukkan disparitas merugikan perempuan, > 1 menunjukkan disparitas merugikan laki-laki. GPI biasanya digunakan untuk mengukur kesetaraan dalam pendidikan dan ketenagakerjaan.",
  },
  {
    id: "sakernas",
    question: "Apa itu Survei Angkatan Kerja Nasional (SAKERNAS)?",
    answer:
      "SAKERNAS adalah survei yang dilakukan BPS untuk mengumpulkan data ketenagakerjaan di Indonesia. Survei ini menjadi sumber data utama untuk menghitung indikator ketenagakerjaan seperti Tingkat Pengangguran Terbuka (TPT) dan Tingkat Partisipasi Angkatan Kerja (TPAK). Data SAKERNAS digunakan untuk perencanaan program ketenagakerjaan dan evaluasi kebijakan pasar kerja.",
  },
  // Statistik Ekonomi
  {
    id: "pdrb",
    question: "Apa itu PDRB dan bagaimana cara menghitungnya?",
    answer:
      "PDRB (Produk Domestik Regional Bruto) adalah nilai tambah bruto seluruh barang dan jasa yang dihasilkan dalam suatu wilayah dalam periode tertentu. PDRB dihitung dengan tiga pendekatan: produksi (jumlah nilai tambah sektor ekonomi), pengeluaran (konsumsi + investasi + ekspor - impor), dan pendapatan (upah + keuntungan + sewa + bunga).",
  },
  {
    id: "inflasi",
    question: "Mengapa inflasi di Kabupaten Bungo berbeda dengan inflasi nasional?",
    answer:
      "Inflasi daerah dapat berbeda dengan nasional karena perbedaan pola konsumsi masyarakat, struktur ekonomi lokal, kondisi geografis, dan faktor-faktor spesifik daerah seperti gangguan distribusi, cuaca, atau kebijakan lokal. Setiap daerah memiliki keranjang belanja yang disesuaikan dengan karakteristik konsumsi masyarakat setempat.",
  },
  {
    id: "pertumbuhan-ekonomi",
    question: "Bagaimana cara membaca data pertumbuhan ekonomi?",
    answer:
      "Pertumbuhan ekonomi menunjukkan persentase perubahan PDRB dari periode sebelumnya. Pertumbuhan positif menandakan ekonomi berkembang, sedangkan negatif menandakan kontraksi. Perlu diperhatikan juga pertumbuhan per sektor untuk memahami sumber pertumbuhan dan stabilitas ekonomi daerah.",
  },
  {
    id: "harga-berlaku-konstan",
    question: "Apa perbedaan PDRB atas dasar harga berlaku dan harga konstan?",
    answer:
      "PDRB atas dasar harga berlaku menggunakan harga pada tahun berjalan, mencerminkan nilai nominal. PDRB atas dasar harga konstan menggunakan harga tahun dasar tertentu, menghilangkan pengaruh inflasi sehingga menunjukkan pertumbuhan riil ekonomi. Untuk analisis pertumbuhan, lebih tepat menggunakan harga konstan.",
  },
  {
    id: "ihk",
    question: "Bagaimana cara mengukur tingkat inflasi daerah?",
    answer:
      "Inflasi daerah diukur melalui Indeks Harga Konsumen (IHK) yang mencakup berbagai kelompok pengeluaran rumah tangga seperti makanan, perumahan, sandang, kesehatan, pendidikan, dan transportasi. IHK dihitung berdasarkan survei harga barang dan jasa yang dikonsumsi masyarakat secara rutin di pasar-pasar tradisional dan modern.",
  },
  // Statistik Lingkungan & Multi-Domain
  {
    id: "indikator-lingkungan",
    question: "Apa saja indikator lingkungan yang dipantau BPS?",
    answer:
      "BPS memantau berbagai indikator lingkungan seperti tutupan lahan, kualitas air, emisi gas rumah kaca, pengelolaan sampah, dan keanekaragaman hayati. Data ini dikumpulkan melalui survei khusus, citra satelit, dan kerjasama dengan instansi terkait untuk mendukung pembangunan berkelanjutan.",
  },
  {
    id: "sdgs",
    question: "Bagaimana cara mengukur keberlanjutan pembangunan?",
    answer:
      "Keberlanjutan pembangunan diukur melalui indikator SDGs (Sustainable Development Goals) yang mencakup aspek ekonomi, sosial, dan lingkungan. BPS menyediakan data untuk memantau 17 tujuan SDGs, termasuk kemiskinan, pendidikan, kesehatan, energi bersih, dan pelestarian lingkungan.",
  },
  {
    id: "iklh",
    question: "Apa itu Indeks Kualitas Lingkungan Hidup?",
    answer:
      "Indeks Kualitas Lingkungan Hidup (IKLH) adalah indikator komposit yang mengukur kondisi lingkungan berdasarkan kualitas air, udara, dan tutupan lahan. IKLH berkisar 0-100, semakin tinggi menunjukkan kualitas lingkungan yang semakin baik. Indeks ini membantu evaluasi kebijakan lingkungan dan perencanaan pembangunan berkelanjutan.",
  },
  {
    id: "data-lingkungan",
    question: "Bagaimana data lingkungan digunakan dalam perencanaan pembangunan?",
    answer:
      "Data lingkungan digunakan untuk analisis dampak lingkungan, perencanaan tata ruang, evaluasi kebijakan lingkungan, dan monitoring pencapaian target pembangunan berkelanjutan. Data ini membantu pemerintah dalam mengambil keputusan yang mempertimbangkan aspek kelestarian lingkungan.",
  },
  {
    id: "idg",
    question: "Apa itu Indeks Pemberdayaan Gender (IDG)?",
    answer:
      "IDG adalah indikator yang mengukur pemberdayaan perempuan dalam berbagai bidang seperti partisipasi politik, ekonomi, dan pengambilan keputusan. IDG dihitung berdasarkan tiga dimensi: partisipasi politik, partisipasi ekonomi, dan kontrol atas sumber daya ekonomi. Semakin tinggi nilai IDG, semakin baik tingkat pemberdayaan gender.",
  },
  // Metodologi & Umum
  {
    id: "bps-bungo",
    question: "Apa itu BPS Kabupaten Bungo?",
    answer:
      "Badan Pusat Statistik (BPS) Kabupaten Bungo adalah instansi pemerintah yang bertugas melaksanakan kegiatan statistik di wilayah Kabupaten Bungo, Provinsi Jambi. BPS berperan dalam pengumpulan, pengolahan, analisis, dan penyebarluasan data statistik untuk mendukung perencanaan pembangunan daerah.",
  },
  {
    id: "akses-data",
    question: "Bagaimana cara mengakses data statistik Kabupaten Bungo?",
    answer:
      "Data statistik Kabupaten Bungo dapat diakses melalui website resmi BPS Kabupaten Bungo, publikasi cetak, atau dengan mengunjungi kantor BPS secara langsung. Sebagian besar data tersedia secara gratis dan dapat diunduh dalam berbagai format.",
  },
  {
    id: "update-data",
    question: "Seberapa sering data statistik diperbarui?",
    answer:
      "Frekuensi pembaruan data bervariasi tergantung jenis statistik. Data bulanan seperti inflasi diperbarui setiap bulan, data tahunan seperti PDRB diperbarui setiap tahun, sedangkan data sensus diperbarui setiap 10 tahun. Informasi jadwal rilis dapat dilihat di kalender rilis statistik.",
  },
  {
    id: "data-penelitian",
    question: "Apakah data BPS dapat digunakan untuk penelitian?",
    answer:
      "Ya, data BPS dapat digunakan untuk keperluan penelitian akademik, bisnis, dan kebijakan. Pengguna diharapkan mencantumkan sumber data dengan benar dan menggunakan data sesuai dengan ketentuan yang berlaku.",
  },
  {
    id: "sampling",
    question: "Apa itu sampling dan mengapa penting dalam survei?",
    answer:
      "Sampling adalah teknik pemilihan sebagian populasi untuk mewakili keseluruhan populasi. Sampling penting karena tidak mungkin mendata seluruh populasi (kecuali sensus). Dengan sampling yang tepat, hasil survei dapat digeneralisasi ke populasi dengan tingkat kepercayaan tertentu dan margin of error yang dapat dihitung.",
  },
  {
    id: "kualitas-data",
    question: "Bagaimana BPS memastikan kualitas data?",
    answer:
      "BPS memastikan kualitas data melalui berbagai tahap: pelatihan petugas, uji coba instrumen, supervisi lapangan, validasi data, dan evaluasi pasca survei. Setiap data yang dirilis telah melalui proses quality assurance dan quality control yang ketat sesuai standar internasional.",
  },
]

interface FaqPageProps {
  onTabChange?: (tab: string) => void
}

export function FaqPage({ onTabChange }: FaqPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [publishedFAQs, setPublishedFAQs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 5 // Show 5 FAQs per page
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    fullName: "",
    question: "",
  })

  // Load published FAQs from API
  const loadPublishedFAQs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/faqs/published')
      if (response.ok) {
        const data = await response.json()
        setPublishedFAQs(data.faqs || [])
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
      // Fallback to static data if API fails
      setPublishedFAQs(allQuestions)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPublishedFAQs()
  }, [])

  const filteredQuestions = publishedFAQs.filter((q) => {
    if (!searchQuery) return true
    return (
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    document.getElementById("faq-content")?.scrollIntoView({ behavior: "smooth" })
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/faqs/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: formData.email,
          userPhone: formData.phone,
          userFullName: formData.fullName,
          question: formData.question,
        }),
      })

      if (!response.ok) {
        throw new Error('Gagal mengirim pertanyaan')
      }

      setSubmitSuccess(true)
      setFormData({ email: "", phone: "", fullName: "", question: "" })

      setTimeout(() => {
        setShowQuestionForm(false)
        setSubmitSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error submitting question:", error)
      alert('Gagal mengirim pertanyaan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Question Form Modal Overlay */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl border-2 border-orange-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {submitSuccess ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-3">Pertanyaan Berhasil Dikirim!</h3>
                <p className="text-green-600 text-lg">Terima kasih. Kami akan merespons pertanyaan Anda segera.</p>
              </div>
            ) : (
              <>
                {/* Form Header */}
                <div className="p-8 pb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-orange-800">Kirim Pertanyaan Anda</h2>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setShowQuestionForm(false)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 p-2 rounded-lg"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email and Phone Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-base font-medium text-orange-800 mb-3">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="email@example.com"
                          className="w-full px-4 py-4 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-orange-800 mb-3">
                          No. HP <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="08xxxxxxxxxxx"
                          className="w-full px-4 py-4 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-base"
                        />
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-base font-medium text-orange-800 mb-3">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                        className="w-full px-4 py-4 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-base"
                      />
                    </div>

                    {/* Question */}
                    <div>
                      <label className="block text-base font-medium text-orange-800 mb-3">
                        Pertanyaan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={formData.question}
                        onChange={(e) => handleInputChange("question", e.target.value)}
                        placeholder="Tuliskan pertanyaan Anda di sini..."
                        className="w-full px-4 py-4 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white text-base"
                      />
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                        {isSubmitting ? "Mengirim..." : "Kirim Pertanyaan"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowQuestionForm(false)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 px-6 py-4 rounded-xl font-medium text-base"
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="container mx-auto px-6 pt-6 pb-6">
        <div className="relative overflow-hidden rounded-3xl shadow-xl bg-orange-600">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/15 rounded-full translate-y-8 -translate-x-8"></div>

          <div className="relative z-10 px-8 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30">
                  <HelpCircle className="w-8 h-8 text-white" />
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                Frequently Asked Questions
                <span className="block text-white text-xl md:text-2xl lg:text-3xl mt-1">Statistik Kabupaten Bungo</span>
              </h1>

              <p className="text-sm md:text-base text-white max-w-2xl mx-auto leading-relaxed font-light mb-6">
                Temukan jawaban atas pertanyaan umum seputar data statistik, metodologi, dan interpretasi data BPS
                Kabupaten Bungo
              </p>

              <div className="flex items-center justify-center gap-4 text-white text-sm mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>{publishedFAQs.length} Pertanyaan</span>
                </div>
              </div>

              <Button
                onClick={() => onTabChange?.("literasi")}
                className="bg-white/30 border border-white/50 text-white hover:bg-white/40 hover:border-white/70 backdrop-blur-sm transition-all duration-300 rounded-xl px-5 py-2.5 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Literasi Statistik
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-200/40 p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5 z-10 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari pertanyaan atau topik..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-12 pr-5 py-3 border-orange-200/50 focus:border-orange-400 focus:ring-orange-400/50 rounded-xl text-base bg-white/70 backdrop-blur-sm"
              />
            </div>
            {searchQuery && (
              <div className="mt-3 text-sm text-orange-600">
                Menampilkan {filteredQuestions.length} dari {publishedFAQs.length} pertanyaan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQ Content - Paginated List */}
      <div className="container mx-auto px-6 pb-12" id="faq-content">
        <div className="max-w-4xl mx-auto">
          {filteredQuestions.length > 0 && (
            <div className="mb-4 text-center">
              <p className="text-orange-600 text-sm">
                Halaman {currentPage} dari {totalPages} • Menampilkan {startIndex + 1}-
                {Math.min(endIndex, filteredQuestions.length)} dari {filteredQuestions.length} pertanyaan
              </p>
            </div>
          )}

          <Card className="overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {currentQuestions.map((faq, index) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border-b border-orange-100 last:border-b-0">
                    <AccordionTrigger className="px-6 py-4 text-left hover:bg-orange-50/70 transition-all duration-200 group">
                      <span className="font-medium text-orange-800 text-pretty pr-4 group-hover:text-orange-900 text-base">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="text-gray-700 leading-relaxed text-pretty bg-gradient-to-r from-orange-50/50 to-amber-50/50 p-4 rounded-lg border-l-4 border-orange-400 shadow-sm">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {filteredQuestions.length > itemsPerPage && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 p-0 ${
                      currentPage === page
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "border-orange-200 text-orange-600 hover:bg-orange-50"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* No Results State */}
          {filteredQuestions.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border-2 border-orange-200/40 max-w-md mx-auto">
                <div className="bg-orange-100/60 p-5 rounded-xl w-fit mx-auto mb-5">
                  <Search className="w-16 h-16 text-orange-400 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-3">Tidak Ada Hasil Ditemukan</h3>
                <p className="text-gray-500 leading-relaxed">
                  Maaf, tidak ada FAQ yang sesuai dengan pencarian "
                  <span className="font-semibold text-orange-600">{searchQuery}</span>".
                  <br />
                  Silakan coba kata kunci yang berbeda.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-orange-800 mb-2">Masih Ada Pertanyaan?</h3>
                <p className="text-orange-700">
                  Jika pertanyaan Anda belum terjawab, jangan ragu untuk menghubungi kami
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-4 p-4 bg-white/70 rounded-xl border border-orange-200">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600">Email</p>
                    <p className="text-orange-800 font-semibold">bps1509@bps.go.id</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/70 rounded-xl border border-orange-200">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600">Telepon</p>
                    <p className="text-orange-800 font-semibold">(0747) 21120</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <Button
                  onClick={() => setShowQuestionForm(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Kirim Pertanyaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Tag,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Send,
  MessageCircle,
  BookOpen,
  Mail,
  Phone,
  HelpCircle,
  Users,
  Info,
  TrendingUp,
  Leaf
} from "lucide-react"
import { createQuestion } from "@/lib/client-database"

// Mock UI Components with Orange Theme
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200/50 shadow-lg ${className}`}>{children}</div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`p-6 ${className}`}>{children}</div>

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`p-6 pb-3 ${className}`}>{children}</div>

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-orange-800 ${className}`}>{children}</h3>
)

const Button = ({ children, variant = "default", onClick, className = "", type = "button" as const, disabled = false }: { 
  children: React.ReactNode; 
  variant?: string; 
  onClick?: () => void; 
  className?: string; 
  type?: "button" | "submit" | "reset"; 
  disabled?: boolean 
}) => {
  // For submit buttons, onClick is not required since form handles submission
  const handleClick = type === "submit" ? undefined : onClick;
  return (
    <button
      onClick={handleClick}
      type={type}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        variant === "ghost"
          ? "hover:bg-orange-100 text-orange-600 hover:text-orange-700"
          : variant === "secondary"
          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
          : "bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      } ${className}`}
    >
      {children}
    </button>
  );
}

const Badge = ({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: string; className?: string }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
      variant === "secondary"
        ? "bg-orange-100 text-orange-700"
        : variant === "outline"
          ? "bg-white border border-orange-200 text-orange-600"
          : "bg-orange-100 text-orange-700"
    } ${className}`}
  >
    {children}
  </span>
)

interface ArticleDetailPageProps {
  article: {
    id: string
    title: string
    category: string
    description: string
    date: string
    author: string
    readTime: string
    tags: string[]
    image?: string
    content: {
      introduction: string
      sections: Array<{
        title: string
        content: string
      }>
    }
  }
  onBack: () => void
}

export function ArticleDetailPage({ article, onBack }: ArticleDetailPageProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})
  const [expandedFAQ, setExpandedFAQ] = useState<{ [key: number]: boolean }>({})
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [questionForm, setQuestionForm] = useState({
    email: "",
    phone: "",
    full_name: "",
    question: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // State for related FAQs
  const [relatedFAQs, setRelatedFAQs] = useState<any[]>([])
  const [loadingFAQs, setLoadingFAQs] = useState(true)
  const [expandedRelatedFAQ, setExpandedRelatedFAQ] = useState<{ [key: number]: boolean }>({})

  // Function to get FAQ category based on article category
  const getFAQCategory = (articleCategory: string): string => {
    switch (articleCategory.toLowerCase()) {
      case 'demografi':
      case 'demografi & sosial':
      case 'statistik demografi & sosial':
        return 'demografi'
      case 'ekonomi':
      case 'statistik ekonomi':
        return 'ekonomi'
      case 'lingkungan':
      case 'lingkungan & multi-domain':
      case 'statistik lingkungan hidup & multi-domain':
        return 'lingkungan'
      default:
        return 'umum'
    }
  }

  // Function to fetch related FAQs
  const fetchRelatedFAQs = async () => {
    try {
      setLoadingFAQs(true)
      const faqCategory = getFAQCategory(article.category)
      
      const response = await fetch(`/api/public/faqs?category=${faqCategory}&limit=5`)
      
      if (response.ok) {
        const data = await response.json()
        
        // API returns array directly, not wrapped in success/data
        if (Array.isArray(data)) {
          setRelatedFAQs(data)
        } else {
          setRelatedFAQs([])
        }
      } else {
        setRelatedFAQs([])
      }
    } catch (error) {
      console.error('Error fetching related FAQs:', error)
      setRelatedFAQs([])
    } finally {
      setLoadingFAQs(false)
    }
  }

  // Load related FAQs when component mounts
  useEffect(() => {
    fetchRelatedFAQs()
  }, [article.category])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const toggleFAQ = (index: number) => {
    setExpandedFAQ((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const toggleRelatedFAQ = (index: number) => {
    setExpandedRelatedFAQ((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Function to get category icon
  const getCategoryIcon = (category: string) => {
    const faqCategory = getFAQCategory(category)
    switch (faqCategory) {
      case 'demografi':
        return <Users className="w-5 h-5 text-blue-600" />
      case 'ekonomi':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'lingkungan':
        return <Leaf className="w-5 h-5 text-emerald-600" />
      default:
        return <HelpCircle className="w-5 h-5 text-gray-600" />
    }
  }

  // Function to get category color theme
  const getCategoryTheme = (category: string) => {
    const faqCategory = getFAQCategory(category)
    switch (faqCategory) {
      case 'demografi':
        return 'blue'
      case 'ekonomi':
        return 'green'
      case 'lingkungan':
        return 'emerald'
      default:
        return 'gray'
    }
  }

  const faqData = relatedFAQs.length > 0 ? relatedFAQs : [
    {
      question: "Cara Membaca dan Memahami Data Statistik",
      answer:
        "Untuk memahami data statistik dengan baik, perhatikan beberapa hal berikut: (1) Pahami definisi dan konsep yang digunakan dalam data tersebut, (2) Perhatikan periode waktu dan cakupan wilayah data, (3) Bandingkan dengan data periode sebelumnya untuk melihat tren, (4) Perhatikan satuan yang digunakan (persen, jutaan, indeks, dll), (5) Baca catatan metodologi untuk memahami cara pengumpulan data. Jangan lupa untuk selalu merujuk pada sumber resmi dan memahami margin of error jika ada.",
    },
    {
      question: "Peran Statistik dalam Pembangunan Daerah",
      answer:
        "Data statistik memiliki peran vital dalam pembangunan daerah sebagai: (1) Dasar perencanaan pembangunan yang berbasis evidence, (2) Alat monitoring dan evaluasi program pembangunan, (3) Indikator pencapaian target pembangunan berkelanjutan (SDGs), (4) Sumber informasi untuk menarik investasi dan kerja sama, (5) Dasar alokasi anggaran dan sumber daya. Data yang akurat membantu pemerintah daerah mengidentifikasi prioritas, mengukur kemajuan, dan mengambil keputusan yang tepat untuk kesejahteraan masyarakat.",
    },
    {
      question: "Metodologi Survei BPS: Dari Perencanaan hingga Publikasi",
      answer:
        "Proses survei BPS meliputi tahapan: (1) Perencanaan - menentukan tujuan, populasi, dan desain sampel, (2) Persiapan - menyusun instrumen, melatih petugas, dan uji coba, (3) Pengumpulan data - pelaksanaan survei lapangan dengan kontrol kualitas, (4) Pengolahan - cleaning, coding, dan tabulasi data, (5) Analisis - interpretasi hasil dan penyusunan narasi, (6) Publikasi - diseminasi hasil melalui berbagai media dan format. Setiap tahap mengikuti standar internasional dan dilakukan quality assurance untuk memastikan akurasi dan reliabilitas data.",
    },
  ];

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createQuestion({
        email: questionForm.email,
        phone: questionForm.phone,
        full_name: questionForm.full_name,
        question: questionForm.question,
        article_id: article.id,
        category: article.category,
      })

      setSubmitSuccess(true)
      setQuestionForm({ email: "", phone: "", full_name: "", question: "" })
      setTimeout(() => {
        setShowQuestionForm(false)
        setSubmitSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Error submitting question:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setQuestionForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        {/* Back Button */}
        <div className="pt-4">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Literasi
          </Button>
        </div>

        {/* Hero Section with Background */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600"></div>
          {article.image && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${article.image})` }}
            />
          )}
          
          <div className="relative z-10 p-8 text-white">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-white/25 text-white border-white/30 backdrop-blur-sm">
                  {article.category}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold leading-tight drop-shadow-sm">{article.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{article.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{article.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{article.readTime}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {article.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white border border-white/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Article Introduction */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed break-words overflow-hidden">{article.content.introduction}</p>
            </div>
          </CardContent>
        </Card>

        {/* Article Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-orange-600" />
              </div>
              Pembahasan Lengkap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {article.content.sections.map((section, index) => (
              <div key={index} className="border border-orange-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection(`section-${index}`)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-orange-50 transition-colors"
                >
                  <span className="font-medium text-orange-800">{section.title}</span>
                  {expandedSections[`section-${index}`] ? (
                    <ChevronDown className="w-5 h-5 text-orange-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-orange-600" />
                  )}
                </button>
                {expandedSections[`section-${index}`] && (
                  <div className="px-4 pb-4 text-gray-700 leading-relaxed border-t border-orange-200 bg-orange-50/30">
                    <p className="pt-4 break-words overflow-hidden">{section.content}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        {faqData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-orange-600" />
                </div>
                Frequently Asked Questions
                {relatedFAQs.length > 0 && (
                  <span className="text-sm px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                    {article.category}
                  </span>
                )}
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                {relatedFAQs.length > 0 
                  ? `Pertanyaan yang sering diajukan seputar ${article.category}`
                  : "Pertanyaan yang sering diajukan tentang statistik dan layanan BPS"
                }
              </p>
            </CardHeader>
            <CardContent>
              {loadingFAQs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <span className="ml-3 text-gray-600">Memuat FAQ...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {faqData.map((item, index) => (
                    <div key={index} className="border border-orange-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full p-4 text-left bg-orange-50/50 hover:bg-orange-100/70 transition-colors duration-200 flex items-center justify-between"
                      >
                        <h4 className="font-medium text-orange-800 pr-4">{item.question}</h4>
                        {expandedFAQ[index] ? (
                          <ChevronUp className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        )}
                      </button>

                      {expandedFAQ[index] && (
                        <div className="p-4 bg-white border-t border-orange-200">
                          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Question Submission Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-orange-600" />
              </div>
              Punya Pertanyaan Lain?
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Ajukan pertanyaan Anda dan kami akan membantu memberikan jawaban
            </p>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Masih Ada Pertanyaan?
              </h3>
              <p className="text-orange-700 text-sm mb-4">
                Jika pertanyaan Anda belum terjawab, silakan hubungi kami melalui:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border border-orange-200">
                  <Mail className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Email</p>
                    <p className="text-sm text-orange-800">bps1509@bps.go.id</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border border-orange-200">
                  <Phone className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Telepon</p>
                    <p className="text-sm text-orange-800">(0747) 21120</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-orange-300/50 pt-4">
                <p className="text-orange-700 text-sm mb-4">Atau kirimkan pertanyaan Anda langsung kepada kami:</p>

                {!showQuestionForm ? (
                  <Button
                    onClick={() => setShowQuestionForm(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Kirim Pertanyaan
                  </Button>
                ) : (
                  <Card className="mt-4 border-orange-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Kirim Pertanyaan Anda
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {submitSuccess ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-green-800 mb-2">Pertanyaan Berhasil Dikirim!</h3>
                          <p className="text-green-600">Terima kasih. Kami akan merespons pertanyaan Anda segera.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleQuestionSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-orange-800 mb-2">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                required
                                value={questionForm.email}
                                onChange={(e) => setQuestionForm({...questionForm, email: e.target.value})}
                                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                placeholder="email@example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-orange-800 mb-2">
                                No. HP <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                value={questionForm.phone}
                                onChange={(e) => setQuestionForm({...questionForm, phone: e.target.value})}
                                className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                placeholder="08xxxxxxxxxx"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-orange-800 mb-2">
                              Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={questionForm.full_name}
                              onChange={(e) => setQuestionForm({...questionForm, full_name: e.target.value})}
                              className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                              placeholder="Masukkan nama lengkap Anda"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-orange-800 mb-2">
                              Pertanyaan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              required
                              rows={4}
                              value={questionForm.question}
                              onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                              className="w-full px-4 py-3 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white"
                              placeholder="Tuliskan pertanyaan Anda di sini..."
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                              {isSubmitting ? "Mengirim..." : "Kirim Pertanyaan"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setShowQuestionForm(false)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                            >
                              Batal
                            </Button>
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ArticleDetailPage

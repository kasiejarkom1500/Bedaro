"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, User, Clock, ArrowRight, Search, HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"

// Types for database integration
interface Article {
  id: string
  title: string
  content: string
  category: 'demografi' | 'ekonomi' | 'lingkungan'
  author: string
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
  views_count: number
  sections?: Array<{
    title: string
    content: string
    order_number: number
  }>
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: 'demografi' | 'ekonomi' | 'lingkungan' | 'umum'
  status: 'pending' | 'answered' | 'published'
  is_featured: boolean
  order_number?: number
  views_count: number
  created_at: string
  updated_at: string
}

interface ProcessedArticle {
  id: string
  title: string
  description: string
  category: string
  author: string
  date: string
  readTime: string
  tags: string[]
  content: {
    introduction: string
    sections: Array<{
      title: string
      content: string
    }>
  }
}

interface LiterasiPageProps {
  onArticleClick: (article: ProcessedArticle) => void
  onTabChange?: (tab: string) => void
}

export function LiterasiPage({ onArticleClick, onTabChange }: LiterasiPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [articles, setArticles] = useState<ProcessedArticle[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFAQ, setExpandedFAQ] = useState<{ [key: string]: boolean }>({})

  // Fetch published articles and FAQs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Starting to fetch data...')
        
        // Fetch published articles from public endpoint
        const articlesResponse = await fetch('/api/public/articles')
        console.log('Articles response status:', articlesResponse.status)
        
        if (!articlesResponse.ok) {
          throw new Error(`Articles API failed with status ${articlesResponse.status}`)
        }
        
        const articlesData = await articlesResponse.json()
        console.log('Raw articles data:', articlesData)
        
        // Fetch published FAQs from public endpoint
        const faqsResponse = await fetch('/api/public/faqs?limit=6')
        console.log('FAQs response status:', faqsResponse.status)
        
        if (!faqsResponse.ok) {
          throw new Error(`FAQs API failed with status ${faqsResponse.status}`)
        }
        
        const faqsData = await faqsResponse.json()
        console.log('Raw FAQs data:', faqsData)

        // Process articles for display
        const processedArticles: ProcessedArticle[] = articlesData.map((article: Article) => ({
          id: article.id,
          title: article.title,
          description: truncateText(article.content, 180), // Use smart truncation
          category: getCategoryDisplayName(article.category),
          author: article.author,
          date: formatDate(article.published_at || article.created_at),
          readTime: estimateReadTime(article.content),
          tags: extractTags(article.category),
          content: parseArticleContent(article.content, article.sections || [])
        }))

        console.log('Processed articles:', processedArticles)
        console.log('Setting articles state with', processedArticles.length, 'articles')

        setArticles(processedArticles)
        setFaqs(faqsData || [])
        console.log('Data fetch completed successfully')
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
        console.log('Loading state set to false')
      }
    }

    fetchData()
  }, [])

  // Helper functions
  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'demografi': return 'Demografi & Sosial'
      case 'ekonomi': return 'Ekonomi'
      case 'lingkungan': return 'Lingkungan & Multi-Domain'
      default: return 'Umum & Metodologi'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(' ').length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} menit`
  }

  const extractTags = (category: string) => {
    const tagMap: { [key: string]: string[] } = {
      'demografi': ['Demografi', 'Sosial', 'Kependudukan'],
      'ekonomi': ['Ekonomi', 'PDRB', 'Inflasi', 'Kemiskinan'],
      'lingkungan': ['Lingkungan', 'Berkelanjutan', 'SDGs']
    }
    return tagMap[category] || ['Statistik', 'BPS']
  }

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text || text.length <= maxLength) return text
    
    // Find the last space before maxLength to avoid cutting words
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    
    if (lastSpaceIndex > 0) {
      return truncated.substring(0, lastSpaceIndex) + '...'
    }
    
    return truncated + '...'
  }

  const parseArticleContent = (content: string, sections: Array<{title: string, content: string, order_number: number}> = []) => {
    // If sections are provided from database, use them
    if (sections && sections.length > 0) {
      return {
        introduction: content, // Don't truncate for article detail view
        sections: sections.map(section => ({
          title: section.title,
          content: section.content
        }))
      }
    }

    // Simple parsing - in real implementation, you might want more sophisticated parsing
    const paragraphs = content.split('\n\n').filter(p => p.trim())
    const introduction = paragraphs[0] || ''
    const sectionsFromContent = paragraphs.slice(1).map((paragraph, index) => ({
      title: `Pembahasan ${index + 1}`,
      content: paragraph
    }))

    return { introduction, sections: sectionsFromContent }
  }

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }))
  }

  const categories = [...new Set(articles.map((article) => article.category))]

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      article.author.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const publishedFAQs = faqs.slice(0, 6) // FAQs already filtered as published from API

  const getCategoryBackground = (category: string) => {
    switch (category) {
      case "Demografi & Sosial":
        return "/images/demografi-bg.jpg"
      case "Ekonomi":
        return "/images/ekonomi-bg.jpg"
      case "Lingkungan & Multi-Domain":
        return "/images/lingkungan-bg.jpg"
      case "Umum & Metodologi":
        return "/images/metodologi-bg.jpg"
      default:
        return "/images/literasi-bg.jpg"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Demografi & Sosial":
        return "/icons/demografi-icon.png"
      case "Ekonomi":
        return "/icons/ekonomi-icon.png"
      case "Lingkungan & Multi-Domain":
        return "/icons/lingkungan-icon.png"
      case "Umum & Metodologi":
        return "/icons/metodologi-icon.png"
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 pt-6 pb-8">
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          <div
            className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600"
            style={{
              backgroundImage: "url(/images/literasi-bg.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/85 via-orange-600/90 to-amber-600/95 rounded-3xl"></div>

          <div className="relative z-10 px-8 py-12 lg:py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Yuk Kepoin Statistik
              </h1>

              <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
                Memahami statistik itu mudah, Yuk sama-sama Belajar
              </p>

              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onTabChange?.("faq")}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300 rounded-xl px-6 py-3"
                >
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Lihat FAQ
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span>{loading ? "Memuat..." : `${articles.length} Artikel`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span>{categories.length} Kategori</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span>{publishedFAQs.length} FAQ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-12">
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-200/40 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5 z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Cari artikel literasi statistik berdasarkan judul, kategori, atau tag..."
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
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border-2 border-orange-200/40 max-w-md mx-auto">
              <div className="bg-orange-100/60 p-5 rounded-xl w-fit mx-auto mb-5">
                <BookOpen className="w-16 h-16 text-orange-400 mx-auto animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">Memuat Artikel...</h3>
              <p className="text-gray-500">Mengambil artikel terbaru dari database</p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-w-7xl mx-auto">
              {categories.map((category) => {
                const categoryArticles = filteredArticles.filter((article) => article.category === category)

                if (categoryArticles.length === 0) return null

                const categoryIcon = getCategoryIcon(category)

                return (
                  <section key={category} className="mb-16">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200/50 rounded-2xl p-6 mb-8 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-5">
                        <div className="bg-orange-100/60 p-3 rounded-xl shadow-sm">
                          {categoryIcon ? (
                            <Image
                              src={categoryIcon || "/placeholder.svg"}
                              alt={`${category} icon`}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <BookOpen className="w-8 h-8 text-orange-700" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-bold text-orange-700 mb-1">{category}</h2>
                          <p className="text-gray-600">{categoryArticles.length} artikel tersedia</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {categoryArticles.map((article, index) => (
                        <Card
                          key={article.id}
                          className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden group rounded-2xl border-0 h-[320px] flex flex-col"
                          onClick={() => onArticleClick(article)}
                        >
                          <div
                            className="absolute inset-0 opacity-5 group-hover:opacity-15 transition-opacity"
                            style={{
                              backgroundImage: `url(${getCategoryBackground(article.category)})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          ></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/10"></div>

                          <CardHeader className="relative z-10 pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="text-lg leading-tight text-pretty group-hover:text-orange-600 transition-colors line-clamp-2">
                                {article.title}
                              </CardTitle>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="secondary" className="shrink-0 bg-orange-100 text-orange-700">
                                  {article.category}
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </CardHeader>

                          {/* Content Preview Area - Fixed Height */}
                          <div className="relative z-10 px-6 flex-1 overflow-hidden">
                            <div className="space-y-3 h-full flex flex-col">
                              {/* Article Preview Content */}
                              <div className="flex-1 overflow-hidden">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {article.description || 'Baca artikel lengkap untuk mengetahui lebih lanjut tentang topik ini...'}
                                </p>
                              </div>
                              
                              {/* Tags Row */}
                              <div className="flex flex-wrap gap-2 py-2">
                                {article.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <Badge
                                    key={tagIndex}
                                    variant="outline"
                                    className="text-xs border-orange-200 text-orange-600"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {article.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
                                    +{article.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Fixed Bottom Section - Metadata */}
                          <CardContent className="relative z-10 pt-0 pb-6 mt-auto">
                            <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-orange-100 pt-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span className="truncate max-w-[80px]">{article.author}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{article.date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-orange-600 font-medium">
                                <Clock className="w-4 h-4" />
                                <span>{article.readTime}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>

          </>
        )}

        {!loading && filteredArticles.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border-2 border-orange-200/40 max-w-md mx-auto">
              <div className="bg-orange-100/60 p-5 rounded-xl w-fit mx-auto mb-5">
                <Search className="w-16 h-16 text-orange-400 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">Tidak Ada Hasil Ditemukan</h3>
              <p className="text-gray-500 leading-relaxed">
                Maaf, tidak ada artikel yang sesuai dengan pencarian "
                <span className="font-semibold text-orange-600">{searchQuery}</span>".
                <br />
                Silakan coba kata kunci yang berbeda.
              </p>
            </div>
          </div>
        )}

        {!loading && articles.length === 0 && !searchQuery && (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border-2 border-orange-200/40 max-w-md mx-auto">
              <div className="bg-orange-100/60 p-5 rounded-xl w-fit mx-auto mb-5">
                <BookOpen className="w-16 h-16 text-orange-400 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-3">Belum Ada Artikel</h3>
              <p className="text-gray-500 leading-relaxed">
                Belum ada artikel yang dipublikasikan. Silakan cek kembali nanti.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  HelpCircle,
  Search,
  MessageCircle,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Filter,
  User,
  Mail,
  Phone,
  ArrowUpCircle,
  Plus,
  Info,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  status: 'pending' | 'answered' | 'published'
  user_email: string
  user_phone: string
  user_full_name: string
  answered_by: string | null
  answered_by_name: string | null
  answered_at: string | null
  created_at: string
  updated_at: string
  is_featured: boolean
  is_active: boolean
}

interface FAQManagementProps {
  currentUser: any
  onSessionUpdate?: () => void
}

export function FAQManagement({ currentUser, onSessionUpdate }: FAQManagementProps) {
  const [faqs, setFAQs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<{
    total_items: number
    total_pages: number
    current_page: number
    items_per_page: number
  } | null>(null)

  // Statistics state
  const [statistics, setStatistics] = useState<{
    all: number
    pending: number
    answered: number
    published: number
  }>({ all: 0, pending: 0, answered: 0, published: 0 })
  
  // Answer dialog state
  const [answerDialog, setAnswerDialog] = useState({
    isOpen: false,
    faq: null as FAQ | null,
    answer: "",
    category: "umum" as "demografi" | "ekonomi" | "lingkungan" | "umum"
  })

  // Add new question dialog state
  const [addQuestionDialog, setAddQuestionDialog] = useState({
    isOpen: false,
    question: "",
    answer: "",
    category: "umum" as "demografi" | "ekonomi" | "lingkungan" | "umum",
    isSubmitting: false
  })

  // User info dialog state
  const [userInfoDialog, setUserInfoDialog] = useState({
    isOpen: false,
    faq: null as FAQ | null
  })

  // Answer detail dialog state
  const [answerDetailDialog, setAnswerDetailDialog] = useState({
    isOpen: false,
    faq: null as FAQ | null
  })

  // Edit dialog state
  const [editDialog, setEditDialog] = useState({
    isOpen: false,
    faq: null as FAQ | null
  })

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Konfirmasi",
    type: "danger" as "danger" | "warning" | "info"
  })

  // Success dialog state
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    message: ""
  })

  // Load FAQs from API
  const loadFAQs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token) return

      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const response = await fetch(`/api/admin/faqs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFAQs(data.faqs || [])
        setPagination(data.pagination || null)
        setStatistics(data.statistics || { all: 0, pending: 0, answered: 0, published: 0 })
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFAQs()
  }, [statusFilter, searchQuery, page, limit])

  // Pagination handlers
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1) // Reset to first page when searching
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1) // Reset to first page when filtering
  }

  // Answer FAQ
  const handleAnswerFAQ = () => {
    if (!answerDialog.faq || !answerDialog.answer.trim()) return

    const isEditing = answerDialog.faq.status !== 'pending'
    const action = isEditing ? 'mengupdate jawaban' : 'menjawab pertanyaan'
    const actionPast = isEditing ? 'diupdate' : 'dijawab'

    setConfirmationDialog({
      isOpen: true,
      title: `Konfirmasi ${isEditing ? 'Update Jawaban' : 'Jawab Pertanyaan'}`,
      message: `Apakah Anda yakin ingin ${action} ini?\n\nPertanyaan: "${answerDialog.faq.question}"`,
      confirmText: isEditing ? "Update Jawaban" : "Simpan Jawaban",
      type: "info",
      onConfirm: async () => {
        try {
          if (!answerDialog.faq) return
          
          const token = localStorage.getItem('authToken')
          const response = await fetch(`/api/admin/faqs/${answerDialog.faq.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              answer: answerDialog.answer,
              category: answerDialog.category
            })
          })

          if (response.ok) {
            setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
            setAnswerDialog({ isOpen: false, faq: null, answer: "", category: "umum" })
            setSuccessDialog({
              isOpen: true,
              message: `Pertanyaan berhasil ${actionPast} dan disimpan!`
            })
            loadFAQs()
            onSessionUpdate?.() // Refresh session
          }
        } catch (error) {
          console.error('Error answering FAQ:', error)
          alert('Gagal menjawab pertanyaan')
        }
      }
    })
  }

  // Add new question by admin
  const handleAddQuestion = () => {
    if (!addQuestionDialog.question.trim() || !addQuestionDialog.answer.trim()) {
      alert('Pertanyaan dan jawaban harus diisi!')
      return
    }

    setConfirmationDialog({
      isOpen: true,
      title: "Konfirmasi Tambah FAQ",
      message: `Apakah Anda yakin ingin menambahkan FAQ ini?\n\nPertanyaan: "${addQuestionDialog.question}"\n\nFAQ akan langsung dipublikasikan.`,
      confirmText: "Tambah FAQ",
      type: "info",
      onConfirm: async () => {
        try {
          setAddQuestionDialog(prev => ({ ...prev, isSubmitting: true }))
          const token = localStorage.getItem('authToken')
          
          console.log('Sending request to add FAQ...', {
            question: addQuestionDialog.question,
            answer: addQuestionDialog.answer,
            category: addQuestionDialog.category
          })
          
          const response = await fetch('/api/admin/faqs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              question: addQuestionDialog.question,
              answer: addQuestionDialog.answer,
              category: addQuestionDialog.category,
              user_email: 'admin@bps-bungo.id',
              user_phone: '-',
              user_full_name: 'Admin BPS Bungo',
              status: 'published' // Admin-created questions are automatically published
            })
          })

          console.log('Response status:', response.status)
          console.log('Response headers:', response.headers)
          
          if (response.ok) {
            const responseData = await response.json()
            console.log('Success response:', responseData)
            
            setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
            setAddQuestionDialog({ 
              isOpen: false, 
              question: "", 
              answer: "", 
              category: "umum", 
              isSubmitting: false 
            })
            setSuccessDialog({
              isOpen: true,
              message: "FAQ berhasil ditambahkan dan dipublikasikan!"
            })
            loadFAQs()
            onSessionUpdate?.() // Refresh session
          } else {
            const errorData = await response.text()
            console.error('Error response:', errorData)
            throw new Error(`HTTP ${response.status}: ${errorData}`)
          }
        } catch (error) {
          console.error('Error adding question:', error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          alert(`Gagal menambahkan pertanyaan: ${errorMessage}`)
        } finally {
          setAddQuestionDialog(prev => ({ ...prev, isSubmitting: false }))
        }
      }
    })
  }

  // Publish FAQ
  const handlePublishFAQ = (faq: FAQ, publish: boolean) => {
    const action = publish ? 'mempublikasikan' : 'menyembunyikan'
    const actionPast = publish ? 'dipublikasikan' : 'disembunyikan'
    
    setConfirmationDialog({
      isOpen: true,
      title: `Konfirmasi ${publish ? 'Publikasi' : 'Sembunyikan'}`,
      message: `Apakah Anda yakin ingin ${action} FAQ ini?\n\n"${faq.question}"`,
      confirmText: publish ? "Publikasikan" : "Sembunyikan",
      type: publish ? "info" : "warning",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('authToken')
          const response = await fetch(`/api/admin/faqs/${faq.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              status: publish ? 'published' : 'answered',
              is_featured: publish
            })
          })

          if (response.ok) {
            setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
            setSuccessDialog({
              isOpen: true,
              message: `FAQ berhasil ${actionPast} dan dapat dilihat oleh publik!`
            })
            loadFAQs()
            onSessionUpdate?.() // Refresh session
          }
        } catch (error) {
          console.error('Error publishing FAQ:', error)
          alert('Gagal mengupdate status FAQ')
        }
      }
    })
  }

  // Delete FAQ
  const handleDeleteFAQ = (faq: FAQ) => {
    setConfirmationDialog({
      isOpen: true,
      title: "Konfirmasi Hapus",
      message: `Apakah Anda yakin ingin menghapus pertanyaan dari ${faq.user_full_name}?\n\nFAQ yang dihapus tidak dapat dikembalikan.`,
      confirmText: "Hapus FAQ",
      type: "danger",
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('authToken')
          const response = await fetch(`/api/admin/faqs/${faq.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            setConfirmationDialog(prev => ({ ...prev, isOpen: false }))
            setSuccessDialog({
              isOpen: true,
              message: "FAQ berhasil dihapus dan dipindahkan ke tempat sampah!"
            })
            loadFAQs()
            onSessionUpdate?.() // Refresh session
          }
        } catch (error) {
          console.error('Error deleting FAQ:', error)
          alert('Gagal menghapus FAQ')
        }
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>
      case 'answered':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Dijawab</Badge>
      case 'published':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Eye className="w-3 h-3 mr-1" />Dipublikasi</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Statistics dari server
  const statusCounts = statistics

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
              <Input
                placeholder="Cari pertanyaan, nama, atau email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="placeholder:opacity-30 pl-11 pr-4 py-4 bg-white border-2 border-orange-100 focus:border-orange-400 focus:ring-orange-400 hover:border-orange-300 rounded-lg shadow-sm transition-all duration-200"
              />
            </div>
            
            {/* Status Filter Dropdown */}
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-48 bg-white border-2 border-orange-100 focus:border-orange-400 hover:border-orange-300">
                <Filter className="w-4 h-4 mr-2 text-orange-500" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua ({statusCounts.all})</SelectItem>
                <SelectItem value="pending">Menunggu ({statusCounts.pending})</SelectItem>
                <SelectItem value="answered">Dijawab ({statusCounts.answered})</SelectItem>
                <SelectItem value="published">Dipublikasi ({statusCounts.published})</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filter Button */}
            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSearch("")
                  handleStatusFilterChange("all")
                }}
                className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-colors duration-200 px-4 py-2 rounded-lg"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Add Question Button */}
          <Button
            onClick={() => setAddQuestionDialog(prev => ({ ...prev, isOpen: true }))}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-lg font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Pertanyaan FAQ
          </Button>
        </div>

        {/* Status Summary Info */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-700">{statusCounts.pending} Menunggu Jawaban</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-gray-700">{statusCounts.answered} Terjawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-700">{statusCounts.published} Dipublikasi</span>
              </div>
            </div>
            <div className="text-sm text-orange-700 font-medium">
              Total: {statusCounts.all} FAQ
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Table */}
      <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200 p-4">
          <h3 className="text-lg font-semibold text-orange-800 mb-1">
            Daftar Pertanyaan ({pagination?.total_items || 0})
          </h3>
        </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Memuat Data FAQ</h3>
              <p className="text-gray-600">Sedang mengambil data pertanyaan dan jawaban...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-4 bg-orange-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <HelpCircle className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                {searchQuery ? "Tidak ada FAQ yang sesuai" : "Belum Ada Pertanyaan"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `Tidak ditemukan FAQ yang sesuai dengan pencarian "${searchQuery}"`
                  : "Belum ada pertanyaan dari pengunjung. Anda dapat membuat pertanyaan FAQ sendiri."}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setAddQuestionDialog(prev => ({ ...prev, isOpen: true }))}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Buat FAQ Pertama
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-orange-50 border-b-2 border-orange-200">
                <TableRow className="hover:bg-orange-50">
                  <TableHead className="py-4 px-6 font-semibold text-orange-800 w-48">Penanya</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-orange-800">Pertanyaan</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-orange-800">Jawaban</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-orange-800 w-40">Kategori</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-orange-800 w-32">Status</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-orange-800 w-40">Tanggal Dijawab</TableHead>
                  <TableHead className="py-4 px-6 font-semibold text-orange-800 w-40">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow 
                    key={faq.id}
                    className="hover:bg-orange-50 transition-colors duration-200 border-b border-gray-100"
                  >
                    {/* Kolom Penanya */}
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {faq.user_full_name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserInfoDialog({ isOpen: true, faq })}
                          className="p-1 w-6 h-6 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full"
                          title="Lihat info lengkap penanya"
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Kolom Pertanyaan */}
                    <TableCell className="py-4 px-6">
                      <div className="font-medium text-gray-900 leading-relaxed">
                        {faq.question}
                      </div>
                    </TableCell>

                    {/* Kolom Jawaban */}
                    <TableCell className="py-4 px-6">
                      {faq.answer ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAnswerDetailDialog({ isOpen: true, faq })}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Jawaban
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Belum dijawab</span>
                      )}
                    </TableCell>

                    {/* Kolom Kategori */}
                    <TableCell className="py-4 px-6">
                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                        {faq.category}
                      </Badge>
                    </TableCell>

                    {/* Kolom Status */}
                    <TableCell className="py-4 px-6">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${
                          faq.status === 'published' 
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : faq.status === 'answered' 
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        {faq.status === 'published' ? 'Dipublikasikan' : 
                         faq.status === 'answered' ? 'Dijawab' : 'Menunggu'}
                      </Badge>
                    </TableCell>

                    {/* Kolom Tanggal Dijawab */}
                    <TableCell className="py-4 px-6">
                      <div className="text-sm text-gray-600">
                        {faq.answered_at ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {new Date(faq.answered_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(faq.answered_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} WIB
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Belum dijawab</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Kolom Aksi */}
                    <TableCell className="py-4 px-6">
                      <div className="flex justify-center gap-1">
                        {faq.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAnswerDialog({
                              isOpen: true,
                              faq,
                              answer: faq.answer || "",
                              category: faq.category as any
                            })}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200"
                            title="Jawab pertanyaan"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {faq.status === 'answered' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAnswerDialog({
                                isOpen: true,
                                faq,
                                answer: faq.answer || "",
                                category: faq.category as any
                              })}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200"
                              title="Edit jawaban"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublishFAQ(faq, true)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 border border-green-200 hover:border-green-300 rounded-lg transition-all duration-200"
                              title="Publikasikan FAQ"
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        {faq.status === 'published' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublishFAQ(faq, false)}
                            className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 border border-yellow-200 hover:border-yellow-300 rounded-lg transition-all duration-200"
                            title="Sembunyikan dari publik"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFAQ(faq)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition-all duration-200"
                          title="Hapus FAQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.total_items > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t-2 border-orange-200 bg-orange-50">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-orange-700">
                  <span className="font-medium">
                    Menampilkan {((page - 1) * pagination.items_per_page) + 1} - {Math.min(page * pagination.items_per_page, pagination.total_items)} dari {pagination.total_items} FAQ
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

      {/* Answer Dialog */}
      <Dialog open={answerDialog.isOpen} onOpenChange={(open) => 
        setAnswerDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-800">
              <MessageCircle className="w-5 h-5" />
              {answerDialog.faq?.status === 'pending' ? 'Jawab Pertanyaan' : 'Edit Jawaban'}
            </DialogTitle>
            <DialogDescription>
              Dari: {answerDialog.faq?.user_full_name} ({answerDialog.faq?.user_email})
            </DialogDescription>
          </DialogHeader>
          
          {answerDialog.faq && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                <h4 className="font-medium text-orange-800 mb-2">Pertanyaan:</h4>
                <p className="text-gray-700">{answerDialog.faq.question}</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Kategori
                </label>
                <Select
                  value={answerDialog.category}
                  onValueChange={(value: any) => setAnswerDialog(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demografi">Statistik Demografi & Sosial</SelectItem>
                    <SelectItem value="ekonomi">Statistik Ekonomi</SelectItem>
                    <SelectItem value="lingkungan">Statistik Lingkungan & Multidomain</SelectItem>
                    <SelectItem value="umum">Umum & Metodologi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Jawaban
                </label>
                <Textarea
                  value={answerDialog.answer}
                  onChange={(e) => setAnswerDialog(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Tulis jawaban yang lengkap dan informatif..."
                  className="placeholder:opacity-30 min-h-[200px]"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAnswerFAQ}
                  disabled={!answerDialog.answer.trim()}
                  className="bg-orange-600 hover:bg-red-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {answerDialog.faq.status === 'pending' ? 'Simpan Jawaban' : 'Update Jawaban'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAnswerDialog({ isOpen: false, faq: null, answer: "", category: "umum" })}
                  className="bg-white hover:bg-red-600 hover:text-white hover:border-red-300 transition-colors"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Question Dialog */}
      <Dialog open={addQuestionDialog.isOpen} onOpenChange={(open) => 
        setAddQuestionDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Plus className="w-5 h-5" />
              Tambah Pertanyaan FAQ Baru
            </DialogTitle>
            <DialogDescription>
              Buat pertanyaan FAQ baru yang akan langsung dipublikasikan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Kategori
              </label>
              <Select
                value={addQuestionDialog.category}
                onValueChange={(value: any) => setAddQuestionDialog(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demografi">Statistik Demografi & Sosial</SelectItem>
                  <SelectItem value="ekonomi">Statistik Ekonomi</SelectItem>
                  <SelectItem value="lingkungan">Statistik Lingkungan & Multidomain</SelectItem>
                  <SelectItem value="umum">Umum & Metodologi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pertanyaan <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={addQuestionDialog.question}
                onChange={(e) => setAddQuestionDialog(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Tulis pertanyaan yang jelas dan spesifik..."
                className="placeholder:opacity-30 min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Jawaban <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={addQuestionDialog.answer}
                onChange={(e) => setAddQuestionDialog(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Tulis jawaban yang lengkap dan informatif..."
                className="placeholder:opacity-30 min-h-[200px]"
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Pertanyaan yang dibuat oleh admin akan langsung dipublikasikan dan ditampilkan di halaman FAQ publik.
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddQuestion}
                disabled={!addQuestionDialog.question.trim() || !addQuestionDialog.answer.trim() || addQuestionDialog.isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {addQuestionDialog.isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Simpan & Publikasikan
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddQuestionDialog({ 
                  isOpen: false, 
                  question: "", 
                  answer: "", 
                  category: "umum", 
                  isSubmitting: false 
                })}
                disabled={addQuestionDialog.isSubmitting}
                className="bg-white hover:bg-red-600 hover:text-white hover:border-red-300 transition-colors"
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Info Dialog */}
      <Dialog open={userInfoDialog.isOpen} onOpenChange={() => setUserInfoDialog({ isOpen: false, faq: null })}>
        <DialogContent className="max-w-md border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Informasi Penanya
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Detail lengkap pengirim pertanyaan FAQ
            </DialogDescription>
          </DialogHeader>
          
          {userInfoDialog.faq && (
            <div className="space-y-4">
              {/* User Details */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 text-sm">Data Penanya</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Nama Lengkap</p>
                      <p className="text-blue-900 font-semibold">{userInfoDialog.faq.user_full_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Email</p>
                      <p className="text-blue-900 font-medium">{userInfoDialog.faq.user_email}</p>
                    </div>
                  </div>
                  
                  {userInfoDialog.faq.user_phone && userInfoDialog.faq.user_phone !== '-' && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Nomor Telepon</p>
                        <p className="text-blue-900 font-medium">{userInfoDialog.faq.user_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing Info */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-3 text-sm">Waktu Pertanyaan</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-600 font-medium">Dikirim pada</p>
                      <p className="text-amber-900 font-semibold">
                        {new Date(userInfoDialog.faq.created_at).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-amber-800 text-sm">
                        Pukul {new Date(userInfoDialog.faq.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} WIB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Preview */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Preview Pertanyaan</h3>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    "{userInfoDialog.faq.question}"
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
            <Button 
              onClick={() => setUserInfoDialog({ isOpen: false, faq: null })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Answer Detail Dialog */}
      <Dialog open={answerDetailDialog.isOpen} onOpenChange={(open) => setAnswerDetailDialog({ isOpen: open, faq: null })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Detail Jawaban FAQ
            </DialogTitle>
          </DialogHeader>
          
          {answerDetailDialog.faq && (
            <div className="space-y-6">
              {/* Question Section */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Pertanyaan
                </h3>
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-gray-800 leading-relaxed">
                    {answerDetailDialog.faq.question}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-700">
                  <User className="w-3 h-3" />
                  <span>Ditanyakan oleh: {answerDetailDialog.faq.user_full_name}</span>
                  <span className="text-blue-500">•</span>
                  <span>{new Date(answerDetailDialog.faq.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              {/* Answer Section */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Jawaban
                </h3>
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {answerDetailDialog.faq.answer}
                  </p>
                </div>
                {answerDetailDialog.faq.answered_by_name && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
                    <User className="w-3 h-3" />
                    <span>Dijawab oleh: {answerDetailDialog.faq.answered_by_name}</span>
                    {answerDetailDialog.faq.answered_at && (
                      <>
                        <span className="text-green-500">•</span>
                        <span>{new Date(answerDetailDialog.faq.answered_at).toLocaleDateString('id-ID')}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Category & Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Kategori:</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                    {answerDetailDialog.faq.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <Badge
                    variant="outline"
                    className={`${
                      answerDetailDialog.faq.status === 'published' 
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : answerDetailDialog.faq.status === 'answered' 
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                  >
                    {answerDetailDialog.faq.status === 'published' ? 'Dipublikasikan' : 
                     answerDetailDialog.faq.status === 'answered' ? 'Dijawab' : 'Menunggu'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
            <Button 
              onClick={() => setAnswerDetailDialog({ isOpen: false, faq: null })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmationDialog.isOpen} onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {confirmationDialog.type === 'danger' && <Trash2 className="w-5 h-5 text-red-600" />}
              {confirmationDialog.type === 'warning' && <Eye className="w-5 h-5 text-yellow-600" />}
              {confirmationDialog.type === 'info' && <MessageCircle className="w-5 h-5 text-blue-600" />}
              {confirmationDialog.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {confirmationDialog.message}
            </p>
            
            {confirmationDialog.type === 'danger' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">
                  ⚠️ Perubahan yang dihapus tidak dapat dikembalikan.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline"
              onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
              className="px-6 py-2"
            >
              Batal
            </Button>
            <Button 
              onClick={confirmationDialog.onConfirm}
              className={`px-6 py-2 text-white font-medium ${
                confirmationDialog.type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : confirmationDialog.type === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmationDialog.confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog.isOpen} onOpenChange={(open) => setSuccessDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Berhasil!</h3>
            <p className="text-gray-700 leading-relaxed">
              {successDialog.message}
            </p>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Perubahan berhasil disimpan
              </p>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => setSuccessDialog({ isOpen: false, message: "" })}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 font-medium"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
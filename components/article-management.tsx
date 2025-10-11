"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { SimpleToast, useSimpleToast } from "@/components/simple-toast"
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Save, 
  X, 
  Search, 
  CheckSquare,
  Globe,
  Archive,
  Check,
  Info
} from "lucide-react"

interface Article {
  id: string
  title: string
  content: string
  category: string
  author_id: string
  author_name?: string
  author: string
  duration: string
  tags: string[]
  sections: ArticleSection[]
  is_published: boolean
  is_featured: boolean
  views_count: number
  created_at: string
  updated_at: string
  published_at: string | null
}

interface ArticleSection {
  id: string
  title: string
  content: string
  order: number
}

interface ConfirmDialogState {
  isOpen: boolean
  type: 'delete' | 'bulk_delete' | null
  articleId: string | null
  articleTitle: string
}

interface SuccessDialogState {
  isOpen: boolean
  type: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | null
  message: string
}

interface ArticleDetailState {
  isOpen: boolean
  article: ArticleDetail | null
}

interface ArticleDetail {
  id: string
  title: string
  created_at: string
  updated_at: string
  published_at: string | null
  is_published: boolean
  created_by_name: string | null
  created_by_username: string | null
  updated_by_name: string | null
  updated_by_username: string | null
  published_by_name: string | null
  published_by_username: string | null
}

interface ArticleManagementProps {
  currentUser: any
  searchQuery?: string
  onSessionUpdate?: () => void
}

export function ArticleManagement({ currentUser, searchQuery = "", onSessionUpdate }: ArticleManagementProps) {
  const { toast } = useToast()
  const { toast: simpleToast, showToast, hideToast } = useSimpleToast()
  const getCategoryFromRole = (userRole: string) => {
    switch (userRole) {
      case 'admin_demografi':
        return 'demografi'
      case 'admin_ekonomi':
        return 'ekonomi'
      case 'admin_lingkungan':
        return 'lingkungan'
      default:
        return 'demografi'
    }
  }

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [searchArticles, setSearchArticles] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    type: null,
    articleId: null,
    articleTitle: ""
  })
  
  const [successDialog, setSuccessDialog] = useState<SuccessDialogState>({
    isOpen: false,
    type: null,
    message: ""
  })

  const [detailDialog, setDetailDialog] = useState<ArticleDetailState>({
    isOpen: false,
    article: null
  })

  const [validationDialog, setValidationDialog] = useState({
    isOpen: false,
    errors: [] as string[]
  })

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
    duration: "",
    tags: "",
    category: "demografi" as Article["category"], // Will be updated when currentUser is available
    sections: [] as ArticleSection[],
    is_published: false,
  })

  // Form validation errors state
  const [formErrors, setFormErrors] = useState({
    title: "",
    content: "",
    author: "",
    duration: "",
    tags: "",
  })

  // Track if form has been modified
  const [isFormDirty, setIsFormDirty] = useState(false)

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (!isFormDirty) return false
    return formData.title.trim() || formData.content.trim() || formData.author.trim() || 
           formData.duration.trim() || formData.tags.trim() || 
           (formData.sections && formData.sections.length > 0)
  }

  useEffect(() => {
    if (currentUser) {
      loadData()
      // Update form category based on user role
      setFormData(prev => ({
        ...prev,
        category: getCategoryFromRole(currentUser.role)
      }))
    }
  }, [currentUser])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        return
      }

      const response = await fetch('/api/articles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setArticles(Array.isArray(data.articles) ? data.articles : [])
      } else {
        console.error('Response not ok:', response.statusText)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setArticles([])
      showAlert("error", "Gagal memuat data!")
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 3000)
  }

  const showSuccessDialog = (type: SuccessDialogState['type'], message: string) => {
    setSuccessDialog({
      isOpen: true,
      type,
      message
    })
  }

  const closeSuccessDialog = () => {
    setSuccessDialog({
      isOpen: false,
      type: null,
      message: ""
    })
  }

  const showDeleteConfirm = (articleId: string, articleTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      articleId,
      articleTitle
    })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      type: null,
      articleId: null,
      articleTitle: ""
    })
  }

  const formatDetailDate = (dateString: string | null) => {
    if (!dateString) return "-"
    
    const date = new Date(dateString)
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day} ${month} ${year}, ${hours}:${minutes}`
  }

  const handleViewDetails = async (articleId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/articles/${articleId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { data } = await response.json()
        setDetailDialog({
          isOpen: true,
          article: data
        })
      } else {
        showAlert("error", "Gagal memuat detail artikel!")
      }
    } catch (error) {
      console.error("Error fetching article details:", error)
      showAlert("error", "Gagal memuat detail artikel!")
    }
  }

  const closeDetailDialog = () => {
    setDetailDialog({
      isOpen: false,
      article: null
    })
  }

  // Validation function
  const validateForm = () => {
    const errors = {
      title: "",
      content: "",
      author: "",
      duration: "",
      tags: "",
    }

    const validationErrors: string[] = []
    let isValid = true

    // Validate title
    if (!formData.title.trim()) {
      errors.title = "Judul artikel wajib diisi"
      validationErrors.push("Silakan pilih indikator yang akan diinput datanya")
      isValid = false
    } else if (formData.title.trim().length < 5) {
      errors.title = "Judul artikel minimal 5 karakter"
      validationErrors.push("Silakan masukkan tahun data yang valid")
      isValid = false
    } else if (formData.title.trim().length > 200) {
      errors.title = "Judul artikel maksimal 200 karakter"
      validationErrors.push("Silakan masukkan nilai data yang valid")
      isValid = false
    }

    // Validate content
    if (!formData.content.trim()) {
      errors.content = "Konten artikel wajib diisi"
      validationErrors.push("Silakan pilih status data (Draft/Final)")
      isValid = false
    } else if (formData.content.trim().length < 50) {
      errors.content = "Konten artikel minimal 50 karakter"
      validationErrors.push("Konten artikel minimal 50 karakter")
      isValid = false
    }

    // Validate author
    if (!formData.author.trim()) {
      errors.author = "Nama penulis wajib diisi"
      validationErrors.push("Nama penulis wajib diisi")
      isValid = false
    } else if (formData.author.trim().length < 2) {
      errors.author = "Nama penulis minimal 2 karakter"
      validationErrors.push("Nama penulis minimal 2 karakter")
      isValid = false
    }

    // Validate duration
    if (!formData.duration.trim()) {
      errors.duration = "Durasi baca wajib diisi"
      validationErrors.push("Durasi baca wajib diisi")
      isValid = false
    } else if (!/^\d+\s*(menit|jam)$/i.test(formData.duration.trim())) {
      errors.duration = "Format durasi tidak valid (contoh: 5 menit atau 1 jam)"
      validationErrors.push("Format durasi tidak valid (contoh: 5 menit atau 1 jam)")
      isValid = false
    }

    // Validate tags
    if (!formData.tags.trim()) {
      errors.tags = "Minimal satu tag wajib diisi"
      validationErrors.push("Minimal satu tag wajib diisi")
      isValid = false
    } else {
      const tags = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
      if (tags.length === 0) {
        errors.tags = "Minimal satu tag wajib diisi"
        validationErrors.push("Minimal satu tag wajib diisi")
        isValid = false
      } else if (tags.some(tag => tag.length < 2)) {
        errors.tags = "Setiap tag minimal 2 karakter"
        validationErrors.push("Setiap tag minimal 2 karakter")
        isValid = false
      }
    }

    // Validate sections if any exists
    if (formData.sections && formData.sections.length > 0) {
      const incompleteSections = formData.sections.filter(section => 
        !section.title?.trim() || !section.content?.trim()
      )
      if (incompleteSections.length > 0) {
        validationErrors.push("Semua bagian artikel harus memiliki judul dan konten yang lengkap")
        isValid = false
      }
    }

    setFormErrors(errors)
    
    // Show validation dialog if there are errors
    if (!isValid && validationErrors.length > 0) {
      setValidationDialog({
        isOpen: true,
        errors: validationErrors
      })
    }
    
    return isValid
  }

  // Clear specific field error when user starts typing
  const clearFieldError = (fieldName: keyof typeof formErrors) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: "" }))
    }
  }

  // Real-time validation for specific fields
  const validateFieldRealTime = (fieldName: keyof typeof formErrors, value: string) => {
    const errors = { ...formErrors }
    
    switch (fieldName) {
      case "title":
        if (!value.trim()) {
          errors.title = "Judul artikel wajib diisi"
        } else if (value.trim().length < 5) {
          errors.title = "Judul artikel minimal 5 karakter"
        } else if (value.trim().length > 200) {
          errors.title = "Judul artikel maksimal 200 karakter"
        } else {
          errors.title = ""
        }
        break
      
      case "content":
        if (!value.trim()) {
          errors.content = "Konten artikel wajib diisi"
        } else if (value.trim().length < 50) {
          errors.content = "Konten artikel minimal 50 karakter"
        } else {
          errors.content = ""
        }
        break
      
      case "author":
        if (!value.trim()) {
          errors.author = "Nama penulis wajib diisi"
        } else if (value.trim().length < 2) {
          errors.author = "Nama penulis minimal 2 karakter"
        } else {
          errors.author = ""
        }
        break
      
      case "duration":
        if (!value.trim()) {
          errors.duration = "Durasi baca wajib diisi"
        } else if (!/^\d+\s*(menit|jam)$/i.test(value.trim())) {
          errors.duration = "Format durasi tidak valid (contoh: 5 menit atau 1 jam)"
        } else {
          errors.duration = ""
        }
        break
      
      case "tags":
        if (!value.trim()) {
          errors.tags = "Minimal satu tag wajib diisi"
        } else {
          const tags = value.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
          if (tags.length === 0) {
            errors.tags = "Minimal satu tag wajib diisi"
          } else if (tags.some(tag => tag.length < 2)) {
            errors.tags = "Setiap tag minimal 2 karakter"
          } else {
            errors.tags = ""
          }
        }
        break
    }
    
    setFormErrors(errors)
  }

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    const isFormValid = validateForm()
    
    if (!isFormValid) {
      // Validation dialog will be shown by validateForm function
      return
    }

    if (!currentUser) {
      showAlert("error", "Pengguna tidak valid!")
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const articleCategory = getCategoryFromRole(currentUser.role)

      // Double check - make sure category matches role
      const validRoleCategories: { [key: string]: string } = {
        'admin_demografi': 'demografi',
        'admin_ekonomi': 'ekonomi', 
        'admin_lingkungan': 'lingkungan'
      }

      if (validRoleCategories[currentUser.role] !== articleCategory) {
        showAlert("error", `Error: Role ${currentUser.role} tidak cocok dengan kategori ${articleCategory}!`)
        return
      }

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          author: formData.author || currentUser.full_name || currentUser.name || "Admin",
          duration: formData.duration || "5 menit",
          tags,
          sections: formData.sections || [],
          category: articleCategory,
          is_published: formData.is_published,
        })
      })

      if (response.ok) {
        setIsEditorOpen(false)
        resetForm()
        loadData()
        onSessionUpdate?.() // Refresh session
        showSuccessDialog("create", "Artikel berhasil dibuat dan disimpan!")
        toast({
          title: "Artikel Berhasil Dibuat",
          description: "Artikel Anda telah berhasil disimpan!",
        })
      } else {
        throw new Error('Failed to create article')
      }
    } catch (error) {
      console.error("Error creating article:", error)
      showAlert("error", "Gagal membuat artikel!")
    }
  }

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submission
    if (!validateForm()) {
      // Validation dialog will be shown by validateForm function
      return
    }

    if (!editingArticle) {
      showAlert("error", "Artikel yang akan diedit tidak ditemukan!")
      return
    }

    if (!currentUser) {
      showAlert("error", "Pengguna tidak valid!")
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const articleCategory = getCategoryFromRole(currentUser.role)
      
      const response = await fetch(`/api/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          author: formData.author || currentUser.full_name || currentUser.name || "Admin",
          duration: formData.duration || "5 menit",
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
          sections: formData.sections || [],
          category: articleCategory,
          is_published: formData.is_published,
        })
      })

      if (response.ok) {
        setIsEditorOpen(false)
        setEditingArticle(null)
        resetForm()
        loadData()
        onSessionUpdate?.() // Refresh session
        showSuccessDialog("update", "Artikel berhasil diperbarui dan disimpan!")
      } else {
        throw new Error('Failed to update article')
      }
    } catch (error) {
      console.error("Error updating article:", error)
      showAlert("error", "Gagal memperbarui artikel!")
    }
  }

  const handleDeleteArticle = async (articleId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        closeConfirmDialog()
        loadData()
        onSessionUpdate?.() // Refresh session
        showSuccessDialog("delete", "Artikel berhasil dihapus dan dipindahkan ke tempat sampah!")
      }
    } catch (error) {
      console.error("Error deleting article:", error)
      showAlert("error", "Gagal menghapus artikel!")
    }
  }

  // Multi-select functions
  const handleSelectArticle = (articleId: string) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    )
  }

  const handleSelectAllArticles = () => {
    setSelectedArticles(
      selectedArticles.length === paginatedArticles.length 
        ? [] 
        : paginatedArticles.map(article => article.id)
    )
  }

  const handleBulkDelete = () => {
    if (selectedArticles.length === 0) return
    
    setConfirmDialog({
      isOpen: true,
      type: 'bulk_delete',
      articleId: null,
      articleTitle: `${selectedArticles.length} artikel`
    })
  }

  const executeBulkDelete = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      // Delete articles one by one
      for (const articleId of selectedArticles) {
        await fetch(`/api/articles/${articleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }

      closeConfirmDialog()
      setSelectedArticles([])
      loadData()
      onSessionUpdate?.() // Refresh session
      showSuccessDialog("delete", `${selectedArticles.length} artikel berhasil dihapus!`)
    } catch (error) {
      console.error("Error bulk deleting articles:", error)
      showAlert("error", "Gagal menghapus beberapa artikel!")
    }
  }

  const handleTogglePublish = async (articleId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('authToken')
      
      // Get current article data first
      const getResponse = await fetch(`/api/articles/${articleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!getResponse.ok) {
        throw new Error('Failed to get article data')
      }

      const { data: articleData } = await getResponse.json()
      
      // Update with toggled publish status
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...articleData,
          is_published: !currentStatus
        })
      })

      if (response.ok) {
        const newStatus = !currentStatus
        loadData()
        onSessionUpdate?.() // Refresh session
        if (newStatus) {
          showSuccessDialog("publish", "Artikel berhasil dipublikasikan dan dapat dilihat publik!")
        } else {
          showSuccessDialog("unpublish", "Artikel berhasil disembunyikan dari publik!")
        }
      } else {
        throw new Error('Failed to update article')
      }
    } catch (error) {
      console.error("Error toggling publish status:", error)
      showAlert("error", "Gagal mengubah status publikasi!")
    }
  }

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article)
    setFormData({
      title: article.title || "",
      content: article.content || "",
      author: article.author || "",
      duration: article.duration || "",
      tags: Array.isArray(article.tags) ? article.tags.join(", ") : "",
      category: getCategoryFromRole(currentUser.role),
      sections: Array.isArray(article.sections) ? article.sections : [],
      is_published: Boolean(article.is_published),
    })
    setIsEditorOpen(true)
  }

  const handleNewArticle = () => {
    setEditingArticle(null)
    resetForm()
    setIsEditorOpen(true)
  }

  const addSection = () => {
    const currentSections = formData.sections || []
    const newSection: ArticleSection = {
      id: `section${currentSections.length + 1}`,
      title: "",
      content: "",
      order: currentSections.length + 1,
    }
    setFormData((prev) => ({
      ...prev,
      sections: [...currentSections, newSection],
    }))
    setIsFormDirty(true)
  }

  const updateSection = (index: number, field: keyof ArticleSection, value: string) => {
    const currentSections = formData.sections || []
    setFormData((prev) => ({
      ...prev,
      sections: currentSections.map((section, i) => (i === index ? { ...section, [field]: value } : section)),
    }))
    setIsFormDirty(true)
  }

  const removeSection = (index: number) => {
    const currentSections = formData.sections || []
    setFormData((prev) => ({
      ...prev,
      sections: currentSections.filter((_, i) => i !== index),
    }))
    setIsFormDirty(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      author: "",
      duration: "",
      tags: "",
      category: getCategoryFromRole(currentUser?.role || "admin_demografi"),
      sections: [],
      is_published: false,
    })
    // Clear form errors when resetting
    setFormErrors({
      title: "",
      content: "",
      author: "",
      duration: "",
      tags: "",
    })
    // Reset dirty state
    setIsFormDirty(false)
  }

  // Handle form input changes and mark as dirty
  const handleFormInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsFormDirty(true)
    
    // Real-time validation for form fields
    if (field in formErrors) {
      validateFieldRealTime(field as keyof typeof formErrors, value as string)
    }
  }

  // Handle dialog close with unsaved changes check
  const handleDialogClose = () => {
    if (hasUnsavedChanges()) {
      const confirmClose = window.confirm(
        "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin menutup form ini? Semua perubahan akan hilang."
      )
      if (!confirmClose) return
    }
    
    setIsEditorOpen(false)
    setEditingArticle(null)
    resetForm()
  }

  const getCategoryDisplayName = (category: Article["category"]) => {
    switch (category) {
      case "demografi":
        return "Statistik Demografi & Sosial"
      case "ekonomi":
        return "Statistik Ekonomi"
      case "lingkungan":
        return "Statistik Lingkungan & Multidomain"
      default:
        return "Umum"
    }
  }

  const getCategoryColor = (category: Article["category"]) => {
    switch (category) {
      case "demografi":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "ekonomi":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "lingkungan":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Tanggal tidak tersedia"
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Tanggal tidak valid"
    }
  }

  // Safe filtering with null checks
  const filteredArticles = Array.isArray(articles)
    ? articles.filter((article) => {
        if (!article) return false

        const title = article.title || ""
        const author = article.author || ""
        const content = article.content || ""
        const tags = Array.isArray(article.tags) ? article.tags : []

        const searchTerm = searchArticles.toLowerCase()

        // Search filter
        const matchesSearch = (
          title.toLowerCase().includes(searchTerm) ||
          author.toLowerCase().includes(searchTerm) ||
          content.toLowerCase().includes(searchTerm) ||
          tags.some((tag) => (tag || "").toLowerCase().includes(searchTerm))
        )

        // Status filter
        const matchesStatus = statusFilter === "all" || 
          (statusFilter === "published" && article.is_published) ||
          (statusFilter === "draft" && !article.is_published)

        return matchesSearch && matchesStatus
      })
    : []

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchArticles, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedArticles([]) // Clear selection when changing page
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
    setSelectedArticles([]) // Clear selection
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data pengguna...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simple Toast Component */}
      <SimpleToast 
        message={simpleToast.message}
        type={simpleToast.type}
        isVisible={simpleToast.isVisible}
        onClose={hideToast}
      />

      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"}>
          <AlertDescription className="flex items-center gap-2">
            {alert.type === "success" && <CheckSquare className="w-4 h-4 text-green-600" />}
            {alert.type === "error" && <X className="w-4 h-4 text-red-600" />}
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Search, Filter and Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
            <Input
              placeholder="Cari artikel berdasarkan judul, penulis, atau konten..."
              value={searchArticles}
              onChange={(e) => setSearchArticles(e.target.value)}
              className="placeholder:opacity-30 pl-11 pr-4 py-4 bg-white border-2 border-orange-100 focus:border-orange-400 focus:ring-orange-400 hover:border-orange-300 rounded-lg shadow-sm transition-all duration-200"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: "all" | "published" | "draft") => setStatusFilter(value)}>
            <SelectTrigger className="w-48 bg-white border-2 border-orange-100 focus:border-orange-400 hover:border-orange-300">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filter Button */}
          {(searchArticles || statusFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchArticles("")
                setStatusFilter("all")
              }}
              className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-colors duration-200 px-4 py-2 rounded-lg"
            >
              <X className="w-4 h-4 mr-2" />
              Reset Filter
            </Button>
          )}

          {searchArticles && (
            <Button
              variant="ghost"
            size="sm"
            onClick={() => setSearchArticles("")}
            className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors duration-200 px-4 py-2 rounded-lg"
          >
            <X className="w-4 h-4 mr-2" />
            Hapus Filter
          </Button>
        )}
        <Button 
          onClick={handleNewArticle}
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-lg font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Buat Artikel Baru
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-orange-800 font-medium">
              {selectedArticles.length} artikel terpilih
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedArticles([])}
                className="border-orange-300 text-orange-700 hover:bg-red-100"
              >
                Batal Pilih
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Terpilih
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Articles Table */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="p-4 bg-orange-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <FileText className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">
              {searchArticles ? "Tidak ada artikel yang sesuai" : "Belum Ada Artikel"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchArticles
                ? `Tidak ditemukan artikel yang sesuai dengan pencarian "${searchArticles}"`
                : "Mulai buat artikel pertama Anda untuk berbagi informasi dan analisis data."}
            </p>
            {!searchArticles && (
              <Button 
                onClick={handleNewArticle}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Buat Artikel Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-orange-100 border-b-2 border-orange-200">
                  <TableRow className="hover:bg-orange-100">
                    <TableHead className="w-20 py-4 pl-6 pr-6 font-semibold text-orange-800 sticky left-0 z-10 bg-orange-100 border-r border-orange-200">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={selectedArticles.length === paginatedArticles.length && paginatedArticles.length > 0}
                          onCheckedChange={handleSelectAllArticles}
                          className="border-orange-400 data-[state=checked]:bg-orange-500"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="py-4 px-6 font-semibold text-orange-800">Judul</TableHead>
                    <TableHead className="w-40 py-4 px-6 font-semibold text-orange-800">Kategori</TableHead>
                    <TableHead className="w-32 py-4 px-6 font-semibold text-orange-800">Penulis</TableHead>
                    <TableHead className="w-32 py-4 px-6 font-semibold text-orange-800">Tags</TableHead>
                    <TableHead className="w-24 py-4 px-6 font-semibold text-orange-800">Status</TableHead>
                    <TableHead className="w-32 py-4 px-6 font-semibold text-orange-800">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedArticles.map((article) => {
                    const articleSections = Array.isArray(article.sections) ? article.sections : []
                    const articleTags = Array.isArray(article.tags) ? article.tags : []

                    return (
                      <TableRow 
                        key={article.id}
                        className={`${
                          !article.is_published 
                            ? 'bg-gray-50 opacity-75 hover:bg-orange-50 hover:opacity-90' 
                            : 'hover:bg-orange-50'
                        } transition-colors duration-200 border-b border-gray-100 ${
                          selectedArticles.includes(article.id) ? 'bg-orange-50' : ''
                        }`}
                      >
                        <TableCell className={`w-20 py-4 pl-6 pr-6 sticky left-0 z-10 border-r border-gray-200 ${
                          selectedArticles.includes(article.id) ? 'bg-orange-50' : 
                          !article.is_published ? 'bg-gray-50' : 'bg-white'
                        }`}>
                          <div className="flex justify-center">
                            <Checkbox
                              checked={selectedArticles.includes(article.id)}
                              onCheckedChange={() => handleSelectArticle(article.id)}
                              className="border-orange-400 data-[state=checked]:bg-orange-500"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div>
                            <div className={`font-medium ${!article.is_published ? 'text-gray-600' : 'text-gray-900'}`}>
                              {article.title || "Tanpa Judul"}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {article.duration || "5 menit"} • {articleSections.length} bagian
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge variant="outline" className={getCategoryColor(article.category)}>
                            {getCategoryDisplayName(article.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="font-medium text-gray-900">
                            {article.author || "Penulis Tidak Diketahui"}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex gap-1 flex-wrap">
                            {articleTags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors">
                                {tag || ""}
                              </Badge>
                            ))}
                            {articleTags.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                +{articleTags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={article.is_published ? "default" : "secondary"}
                              className={article.is_published 
                                ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                              }
                            >
                              {article.is_published ? "Dipublikasi" : "Draft"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePublish(article.id, article.is_published)}
                              className={`h-8 w-8 p-0 rounded-lg transition-all duration-200 ${article.is_published 
                                ? "text-orange-600 hover:text-orange-700 hover:bg-orange-100 border border-orange-200 hover:border-orange-300" 
                                : "text-green-600 hover:text-green-700 hover:bg-green-100 border border-green-200 hover:border-green-300"
                              }`}
                              title={article.is_published ? "Arsipkan artikel (sembunyikan dari publik)" : "Publikasikan artikel untuk umum"}
                            >
                              {article.is_published ? <Archive className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewDetails(article.id)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200"
                              title="Lihat detail artikel"
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditArticle(article)}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100 border border-orange-200 hover:border-orange-300 rounded-lg transition-all duration-200"
                              title="Edit artikel"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showDeleteConfirm(article.id, article.title)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition-all duration-200"
                              title="Hapus artikel"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                
                {/* Table Footer with Pagination */}
                {filteredArticles.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-orange-600 font-medium">
                              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredArticles.length)} dari {filteredArticles.length} artikel
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>Items per page:</span>
                              <select 
                                value={itemsPerPage} 
                                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                className="border border-orange-200 rounded px-2 py-1 text-sm focus:border-orange-400 focus:outline-none bg-white"
                              >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                              </select>
                            </div>
                          </div>
                          
                          {totalPages > 1 && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 px-3 py-1 h-8"
                              >
                                Previous
                              </Button>
                              
                              {/* Page Numbers */}
                              <div className="flex space-x-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                                    <Button
                                      key={pageNum}
                                      variant={currentPage === pageNum ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handlePageChange(pageNum)}
                                      className={`w-8 h-8 p-0 text-sm ${
                                        currentPage === pageNum
                                          ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                                          : "border-orange-300 text-orange-700 hover:bg-orange-50"
                                      }`}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 px-3 py-1 h-8"
                              >
                                Next
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
        )}
      </div>

      {/* Article Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-orange-100 pb-6 mb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {editingArticle ? "Edit Artikel" : "Buat Artikel Baru"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {editingArticle
                ? "Perbarui konten artikel Anda"
                : "Buat artikel baru untuk kategori statistik yang dipilih"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Judul Artikel <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormInputChange("title", e.target.value)}
                  placeholder="Masukkan judul artikel"
                  className={`placeholder:opacity-30 border-2 focus:border-orange-400 focus:ring-orange-400 hover:border-gray-300 transition-colors ${
                    formErrors.title ? "border-red-300 focus:border-red-400" : "border-gray-200"
                  }`}
                />
                <div className="flex justify-between items-center">
                  {formErrors.title && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="w-4 h-4 text-red-500">⚠</span>
                      {formErrors.title}
                    </p>
                  )}
                  <p className={`text-xs ml-auto ${
                    formData.title.length > 200 ? "text-red-500" : 
                    formData.title.length > 180 ? "text-yellow-600" : "text-gray-500"
                  }`}>
                    {formData.title.length}/200 karakter
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="author" className="text-sm font-medium text-gray-700">
                  Penulis <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => handleFormInputChange("author", e.target.value)}
                  placeholder="Tim BPS Bungo"
                  className={`placeholder:opacity-30 border-2 focus:border-orange-400 focus:ring-orange-400 hover:border-gray-300 transition-colors ${
                    formErrors.author ? "border-red-300 focus:border-red-400" : "border-gray-200"
                  }`}
                />
                {formErrors.author && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4 text-red-500">⚠</span>
                    {formErrors.author}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                  Durasi Baca <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleFormInputChange("duration", e.target.value)}
                  placeholder="5 menit"
                  className={`placeholder:opacity-30 border-2 focus:border-orange-400 focus:ring-orange-400 hover:border-gray-300 transition-colors ${
                    formErrors.duration ? "border-red-300 focus:border-red-400" : "border-gray-200"
                  }`}
                />
                {formErrors.duration && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4 text-red-500">⚠</span>
                    {formErrors.duration}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
                  Tags (pisahkan dengan koma) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleFormInputChange("tags", e.target.value)}
                  placeholder="IPM, Pembangunan, Sosial"
                  className={`placeholder:opacity-30 border-2 focus:border-orange-400 focus:ring-orange-400 hover:border-gray-300 transition-colors ${
                    formErrors.tags ? "border-red-300 focus:border-red-400" : "border-gray-200"
                  }`}
                />
                <div className="flex justify-between items-center">
                  {formErrors.tags && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span className="w-4 h-4 text-red-500">⚠</span>
                      {formErrors.tags}
                    </p>
                  )}
                  <p className="text-xs ml-auto text-gray-500">
                    {formData.tags ? formData.tags.split(",").filter(tag => tag.trim().length > 0).length : 0} tag(s)
                  </p>
                </div>
                {/* Tags Preview */}
                {formData.tags && formData.tags.trim() && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.split(",").map((tag, index) => 
                      tag.trim() && (
                        <Badge key={index} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          {tag.trim()}
                        </Badge>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                Konten Utama Artikel <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleFormInputChange("content", e.target.value)}
                placeholder="Tulis konten utama artikel Anda di sini..."
                className={`placeholder:opacity-30 min-h-[150px] border-2 focus:border-orange-400 focus:ring-orange-400 hover:border-gray-300 transition-colors ${
                  formErrors.content ? "border-red-300 focus:border-red-400" : "border-gray-200"
                }`}
              />
              <div className="flex justify-between items-center">
                {formErrors.content && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-4 h-4 text-red-500">⚠</span>
                    {formErrors.content}
                  </p>
                )}
                <p className={`text-xs ml-auto ${
                  formData.content.length < 50 && formData.content.length > 0 ? "text-yellow-600" : "text-gray-500"
                }`}>
                  {formData.content.length} karakter {formData.content.length < 50 ? "(minimal 50)" : ""}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Pembahasan Lengkap (Bagian-bagian)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addSection}
                  className="border-orange-300 text-black-700 hover:bg-orange-500 hover:border-orange-400 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Bagian
                </Button>
              </div>

              {(formData.sections || []).map((section, index) => (
                <Card key={section.id} className="border-orange-100">
                  <CardHeader className="pb-3 bg-orange-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-orange-800">
                        Bagian {index + 1}
                        <span className="text-xs text-gray-600 ml-2">(Opsional - jika ditambahkan, wajib diisi lengkap)</span>
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <Input
                      value={section.title || ""}
                      onChange={(e) => updateSection(index, "title", e.target.value)}
                      placeholder="Masukkan judul bagian ini (contoh: Pendahuluan, Metodologi, Kesimpulan)"
                      className="placeholder:opacity-30 border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-400 hover:border-gray-300 transition-colors"
                    />
                    <Textarea
                      value={section.content || ""}
                      onChange={(e) => updateSection(index, "content", e.target.value)}
                      placeholder="Tulis konten untuk bagian ini secara detail..."
                      className="placeholder:opacity-30 min-h-[100px] border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-400 hover:border-gray-300 transition-colors"
                    />
                  </CardContent>
                </Card>
              ))}
              
              {formData.sections && formData.sections.length > 0 && (
                <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="flex items-center gap-2">
                    <span className="text-amber-600">💡</span>
                    <span className="font-medium">Tips:</span>
                  </p>
                  <p className="mt-1">
                    Jika Anda menambahkan bagian artikel, pastikan setiap bagian memiliki judul dan konten yang lengkap sebelum menyimpan.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Checkbox
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => 
                  handleFormInputChange("is_published", Boolean(checked))
                }
                className="border-orange-400 data-[state=checked]:bg-orange-500"
              />
              <Label htmlFor="is_published" className="text-sm font-medium text-orange-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Publikasikan artikel sekarang
              </Label>
            </div>

            <DialogFooter className="border-t border-orange-100 pt-6 mt-8 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
                className="border-gray-300 text-gray-700 hover:bg-red-100 hover:border-red-500 hover:text-red-800 px-6 py-3 rounded-lg transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button 
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingArticle 
                  ? (formData.is_published ? "Perbarui & Publikasikan" : "Simpan Perubahan")
                  : (formData.is_published ? "Publikasikan Artikel" : "Simpan Draft")
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={() => closeConfirmDialog()}>
        <DialogContent className="max-w-md border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-3">
              Apakah Anda yakin ingin menghapus artikel "{confirmDialog.articleTitle}"?
              <br />
              <span className="text-sm text-red-600 mt-2 block font-medium">
                Artikel yang dihapus tidak dapat dikembalikan.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={closeConfirmDialog}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-red-50 py-3 rounded-lg transition-all duration-200"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog.type === 'bulk_delete') {
                  executeBulkDelete()
                } else if (confirmDialog.articleId) {
                  handleDeleteArticle(confirmDialog.articleId)
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {confirmDialog.type === 'bulk_delete' ? 'Hapus Artikel Terpilih' : 'Hapus Artikel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog.isOpen} onOpenChange={() => closeSuccessDialog()}>
        <DialogContent className="max-w-md border-0 shadow-2xl rounded-2xl">
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-3">
              Berhasil!
            </DialogTitle>
            <DialogDescription className="text-gray-600 mb-6 text-lg">
              {successDialog.message}
            </DialogDescription>
            <div className="flex items-center justify-center text-sm text-green-600 bg-green-50 rounded-xl py-3 px-4 mb-8 border border-green-200">
              <Check className="w-4 h-4 mr-2" />
              Perubahan berhasil disimpan
            </div>
            <Button 
              onClick={closeSuccessDialog}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Article Detail Dialog */}
      <Dialog open={detailDialog.isOpen} onOpenChange={() => closeDetailDialog()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="border-b border-orange-100 pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Detail Artikel
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Informasi lengkap tentang artikel dan riwayat perubahannya
            </DialogDescription>
          </DialogHeader>
          
          {detailDialog.article && (
            <div className="space-y-6 mt-6">
              {/* Article Basic Info */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <h3 className="font-bold text-orange-900 mb-4 text-lg">Informasi Artikel</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-semibold text-orange-700">Judul:</span>
                    <p className="text-orange-900 mt-1 font-medium">{detailDialog.article.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-orange-700">Status:</span>
                    <Badge 
                      variant={detailDialog.article.is_published ? "default" : "secondary"}
                      className="ml-3 px-3 py-1"
                    >
                      {detailDialog.article.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Creation Info */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-4 text-lg">Informasi Pembuatan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-blue-700">Dibuat oleh:</span>
                    <p className="text-blue-900 mt-1 font-medium">
                      {detailDialog.article.created_by_name || detailDialog.article.created_by_username || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-blue-700">Dibuat pada:</span>
                    <p className="text-blue-900 mt-1 font-medium">
                      {formatDetailDate(detailDialog.article.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Update Info */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-4 text-lg">Informasi Update</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-amber-700">Diupdate oleh:</span>
                    <p className="text-amber-900 mt-1 font-medium">
                      {detailDialog.article.updated_by_name || detailDialog.article.updated_by_username || "Belum ada update"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-amber-700">Terakhir diupdate:</span>
                    <p className="text-amber-900 mt-1 font-medium">
                      {formatDetailDate(detailDialog.article.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Publication Info */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <h3 className="font-bold text-green-900 mb-4 text-lg">Informasi Publikasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-green-700">Dipublish oleh:</span>
                    <p className="text-green-900 mt-1 font-medium">
                      {detailDialog.article.published_by_name || detailDialog.article.published_by_username || "Belum dipublish"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-green-700">Dipublish pada:</span>
                    <p className="text-green-900 mt-1 font-medium">
                      {detailDialog.article.published_at ? formatDetailDate(detailDialog.article.published_at) : "Belum dipublish"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-8 pt-6 border-t border-orange-100">
            <Button 
              onClick={closeDetailDialog}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Error Dialog */}
      <Dialog open={validationDialog.isOpen} onOpenChange={() => setValidationDialog({ isOpen: false, errors: [] })}>
        <DialogContent className="max-w-md border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-red-700">
              Data Belum Lengkap
            </DialogTitle>
            <DialogDescription className="text-red-600 mt-3 font-medium">
              Beberapa field wajib masih kosong
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            <p className="text-gray-700 mb-4">Mohon lengkapi data berikut sebelum menyimpan:</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="space-y-2">
                {validationDialog.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2 text-red-700">
                    <span className="text-red-500 font-bold mt-0.5">{index + 1}</span>
                    <span className="text-sm">{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex justify-center mt-6">
            <Button
              onClick={() => setValidationDialog({ isOpen: false, errors: [] })}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Saya Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
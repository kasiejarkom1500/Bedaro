"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Shield, Users, Search, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react"
import { type User as UserType } from "@/lib/types"
import { getAllUsers, createUser, updateUser, deleteUser } from "@/lib/client-auth"

interface UserManagementProps {
  currentUser: UserType
  onProfileClick?: () => void
  onUserUpdate?: () => void
}

export function UserManagement({ currentUser, onProfileClick, onUserUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<UserType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null)
  const [popup, setPopup] = useState<{ 
    isOpen: boolean; 
    type: "success" | "error"; 
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    details: ""
  })
  
  // Checkbox selection states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginatedUsers, setPaginatedUsers] = useState<UserType[]>([])
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "" as UserType["role"] | "",
    password: "",
    confirmPassword: "",
  })

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  useEffect(() => {
    paginateUsers()
  }, [filteredUsers, currentPage, itemsPerPage])

  // Update select all state based on current page selections
  useEffect(() => {
    const selectableUsers = paginatedUsers.filter(user => canDeleteUser(user))
    if (selectableUsers.length === 0) {
      setSelectAll(false)
    } else {
      const allSelected = selectableUsers.every(user => selectedUsers.has(user.id))
      setSelectAll(allSelected)
    }
  }, [paginatedUsers, selectedUsers, currentUser.id])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      showPopup("error", "Gagal!", "Gagal memuat data pengguna!", "Terjadi kesalahan saat mengambil data. Silakan refresh halaman")
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          (user.full_name || user.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }

  const paginateUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginated = filteredUsers.slice(startIndex, endIndex)
    setPaginatedUsers(paginated)
    setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage))
  }

  // Checkbox selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableUsers = paginatedUsers.filter(user => canDeleteUser(user))
      const newSelected = new Set(selectedUsers)
      selectableUsers.forEach(user => newSelected.add(user.id))
      setSelectedUsers(newSelected)
    } else {
      const newSelected = new Set(selectedUsers)
      paginatedUsers.forEach(user => newSelected.delete(user.id))
      setSelectedUsers(newSelected)
    }
    setSelectAll(checked)
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const clearSelection = () => {
    setSelectedUsers(new Set())
    setSelectAll(false)
  }

  const showPopup = (type: "success" | "error", title: string, message: string, details?: string) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      details
    })
  }

  const closePopup = () => {
    setPopup(prev => ({ ...prev, isOpen: false }))
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setRoleFilter("all")
    clearSelection()
  }

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      role: "",
      password: "",
      confirmPassword: "",
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
    setShowEditPassword(false)
    setShowEditConfirmPassword(false)
  }

  // Fungsi validasi password security
  const validatePassword = (password: string, email: string, name: string) => {
    const errors = []

    // 1. Minimal 8 karakter
    if (password.length < 8) {
      errors.push("minimal 8 karakter")
    }

    // 2. Mengandung huruf besar (A-Z)
    if (!/[A-Z]/.test(password)) {
      errors.push("mengandung huruf besar (A-Z)")
    }

    // 3. Mengandung huruf kecil (a-z)
    if (!/[a-z]/.test(password)) {
      errors.push("mengandung huruf kecil (a-z)")
    }

    // 4. Mengandung karakter spesial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
      errors.push("mengandung karakter spesial (!@#$%^&* dll)")
    }

    // 5. Tidak boleh sama dengan username/email
    const emailUsername = email.split('@')[0].toLowerCase()
    if (password.toLowerCase() === emailUsername || password.toLowerCase() === email.toLowerCase()) {
      errors.push("tidak boleh sama dengan username atau email")
    }

    // 6. Tidak boleh sama dengan nama
    if (password.toLowerCase() === name.toLowerCase()) {
      errors.push("tidak boleh sama dengan nama pengguna")
    }

    // 7. Tidak boleh berisi spasi
    if (/\s/.test(password)) {
      errors.push("tidak boleh berisi spasi")
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        message: `Password harus: ${errors.join(", ")}`
      }
    }

    return {
      isValid: true,
      message: "Password memenuhi syarat keamanan"
    }
  }

  const handleCreateUser = async () => {
    try {
      // Validasi form
      if (!formData.name.trim()) {
        showPopup("error", "Kesalahan!", "Nama lengkap harus diisi!", "Silakan masukkan nama lengkap pengguna")
        return
      }
      if (!formData.email.trim()) {
        showPopup("error", "Kesalahan!", "Email harus diisi!", "Silakan masukkan alamat email yang valid")
        return
      }
      if (!formData.role) {
        showPopup("error", "Kesalahan!", "Role harus dipilih!", "Silakan pilih role untuk pengguna")
        return
      }
      if (!formData.password) {
        showPopup("error", "Kesalahan!", "Password harus diisi!", "Silakan masukkan password untuk pengguna")
        return
      }

      // Validasi email domain BPS
      if (!formData.email.toLowerCase().endsWith('@bps.go.id')) {
        showPopup("error", "Kesalahan!", "Email harus menggunakan domain @bps.go.id!", "Hanya email resmi BPS yang diperbolehkan")
        return
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        showPopup("error", "Kesalahan!", "Format email tidak valid!", "Silakan masukkan alamat email dengan format yang benar")
        return
      }

      // Validasi email duplikat
      const isDuplicateEmail = users.some(user => user.email.toLowerCase() === formData.email.toLowerCase())
      if (isDuplicateEmail) {
        showPopup("error", "Kesalahan!", "Email sudah terdaftar!", "Email ini sudah digunakan oleh pengguna lain. Silakan gunakan email yang berbeda")
        return
      }

      // Validasi password security
      const passwordValidation = validatePassword(formData.password, formData.email, formData.name)
      if (!passwordValidation.isValid) {
        showPopup("error", "Kesalahan!", "Password tidak memenuhi syarat keamanan!", passwordValidation.message)
        return
      }

      if (!formData.confirmPassword) {
        showPopup("error", "Kesalahan!", "Konfirmasi password harus diisi!", "Silakan konfirmasi password yang telah dimasukkan")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        showPopup("error", "Kesalahan!", "Password dan konfirmasi password tidak cocok!", "Pastikan kedua password yang dimasukkan sama")
        return
      }

      await createUser({
        email: formData.email,
        full_name: formData.name,
        role: formData.role as UserType["role"],
        password: formData.password,
      })
      await loadUsers()
      setIsAddDialogOpen(false)
      resetForm()
      showPopup("success", "Berhasil!", "Pengguna berhasil ditambahkan!", "Data pengguna baru telah disimpan ke dalam sistem")
    } catch (error) {
      console.error("Error creating user:", error)
      showPopup("error", "Gagal!", "Gagal menambahkan pengguna!", "Silakan periksa koneksi internet dan coba lagi")
    }
  }

  const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.full_name || user.name || "",
      role: user.role,
      password: "",
      confirmPassword: "",
    })
    // Reset password visibility states for edit form
    setShowEditPassword(false)
    setShowEditConfirmPassword(false)
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    // Validation
    if (!formData.email || !formData.name) {
      showPopup("error", "Kesalahan!", "Email dan nama lengkap harus diisi!", "Pastikan semua field wajib telah diisi")
      return
    }

    if (!formData.role) {
      showPopup("error", "Kesalahan!", "Role harus dipilih!", "Silakan pilih role untuk pengguna")
      return
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showPopup("error", "Kesalahan!", "Format email tidak valid!", "Silakan masukkan alamat email dengan format yang benar")
      return
    }

    // Validasi email domain BPS
    if (!formData.email.toLowerCase().endsWith('@bps.go.id')) {
      showPopup("error", "Kesalahan!", "Email harus menggunakan domain @bps.go.id!", "Hanya email resmi BPS yang diperbolehkan")
      return
    }

    // Validasi email duplikat (kecuali email user yang sedang diedit)
    const isDuplicateEmail = users.some(user => 
      user.email.toLowerCase() === formData.email.toLowerCase() && user.id !== editingUser.id
    )
    if (isDuplicateEmail) {
      showPopup("error", "Kesalahan!", "Email sudah terdaftar!", "Email ini sudah digunakan oleh pengguna lain. Silakan gunakan email yang berbeda")
      return
    }

    // Jika password diisi, validasi password dan konfirmasi
    if (formData.password && formData.password.trim() !== '') {
      // Validasi password security
      const passwordValidation = validatePassword(formData.password, formData.email, formData.name)
      if (!passwordValidation.isValid) {
        showPopup("error", "Kesalahan!", "Password tidak memenuhi syarat keamanan!", passwordValidation.message)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        showPopup("error", "Kesalahan!", "Password dan konfirmasi password tidak cocok!", "Pastikan kedua password yang dimasukkan sama")
        return
      }
    }

    try {
      const updateData: any = {
        email: formData.email.trim(),
        full_name: formData.name.trim(),
        role: formData.role as UserType["role"],
      }

      // Only include password if it's provided and not empty
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password.trim()
      }

      console.log('Updating user with data:', updateData) // Debug log

      const updatedUser = await updateUser(editingUser.id, updateData)
      
      // If the updated user is the current logged-in user, update session
      if (currentUser && editingUser.id === currentUser.id) {
        // Update localStorage with new user data
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
        // Call parent callback to refresh currentUser state
        if (onUserUpdate) {
          onUserUpdate()
        }
      }
      
      await loadUsers()
      setIsEditDialogOpen(false)
      setEditingUser(null)
      resetForm()
      showPopup("success", "Berhasil!", "Pengguna berhasil diperbarui!", "Data pengguna telah berhasil diubah")
    } catch (error) {
      console.error("Error updating user:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui pengguna!"
      showPopup("error", "Gagal!", "Gagal memperbarui pengguna!", errorMessage)
    }
  }

  const handleConfirmDeleteUser = (user: UserType) => {
    setDeletingUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    try {
      await deleteUser(deletingUser.id)
      await loadUsers()
      setIsDeleteDialogOpen(false)
      setDeletingUser(null)
      clearSelection()
      showPopup("success", "Berhasil!", "Pengguna berhasil dihapus!", "Data pengguna telah dihapus dari sistem")
    } catch (error) {
      console.error("Error deleting user:", error)
      showPopup("error", "Gagal!", "Gagal menghapus pengguna!", "Silakan coba lagi atau hubungi administrator")
    }
  }

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedUsers).map(userId => deleteUser(userId))
      await Promise.all(deletePromises)
      await loadUsers()
      setIsBulkDeleteDialogOpen(false)
      clearSelection()
      showPopup("success", "Berhasil!", `${selectedUsers.size} pengguna berhasil dihapus!`, "Semua pengguna yang dipilih telah dihapus dari sistem")
    } catch (error) {
      console.error("Error bulk deleting users:", error)
      showPopup("error", "Gagal!", "Gagal menghapus beberapa pengguna!", "Terjadi kesalahan saat menghapus pengguna. Silakan coba lagi")
    }
  }

  const canDeleteUser = (user: UserType) => {
    return user.id !== currentUser.id && currentUser.role === "superadmin"
  }

  const getRoleBadgeClass = (role: UserType["role"]) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
      case "admin_demografi":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
      case "admin_ekonomi":
        return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
      case "admin_lingkungan":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
    }
  }

  const getRoleDisplayName = (role: UserType["role"]) => {
    switch (role) {
      case "superadmin":
        return "Super Administrator"
      case "admin_demografi":
        return "Admin Demografi"
      case "admin_ekonomi":
        return "Admin Ekonomi"
      case "admin_lingkungan":
        return "Admin Lingkungan"
      default:
        return role
    }
  }

  if (currentUser.role !== "superadmin") {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-6">
        <Card className="w-full max-w-md border border-red-200 bg-red-50">
          <CardHeader className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-semibold text-red-700 mb-2">
              Akses Ditolak
            </CardTitle>
            <CardDescription className="text-red-600">
              Anda tidak memiliki izin untuk mengakses halaman manajemen pengguna. Fitur ini hanya tersedia untuk Super Administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Popup Modal */}
      <Dialog open={popup.isOpen} onOpenChange={closePopup}>
        <DialogContent className="max-w-md mx-auto p-0 bg-white rounded-xl shadow-2xl border-0">
          {/* Close button */}
          <button 
            onClick={closePopup}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
              {popup.type === "success" ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {popup.type === "success" ? "Berhasil!" : "Error!"}
            </h2>

            {/* Message */}
            <p className="text-gray-600 mb-4 leading-relaxed">
              {popup.message}
            </p>

            {/* Status indicator for success */}
            {popup.type === "success" && (
              <div className="mb-6">
                <div className="inline-flex items-center bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-sm font-medium">Perubahan berhasil disimpan</span>
                </div>
              </div>
            )}

            {/* OK Button */}
            <Button 
              onClick={closePopup}
              className={`px-12 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                popup.type === "success" 
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl" 
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content Card with Indicator Management Style */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-orange-800 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Kelola dan atur user dan hak akses untuk Manajemen Users
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {selectedUsers.size > 0 && (
                <Button
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 font-medium px-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus {selectedUsers.size} User
                </Button>
              )}
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="mt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Search */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-4 h-4" />
                  <Input
                    placeholder="Cari nama atau email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">Filter:</span>
                
                {/* Role Filter */}
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48 border-2 border-orange-200 bg-white hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 text-gray-700 rounded-lg shadow-sm">
                    <SelectValue placeholder="Semua Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="superadmin">Super Administrator</SelectItem>
                    <SelectItem value="admin_demografi">Admin Demografi</SelectItem>
                    <SelectItem value="admin_ekonomi">Admin Ekonomi</SelectItem>
                    <SelectItem value="admin_lingkungan">Admin Lingkungan</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Clear Filters */}
                {(searchTerm || roleFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-2 border-red-300 hover:from-red-100 hover:to-red-200 hover:border-red-400 hover:text-red-800 active:from-red-200 active:to-red-300 focus:ring-2 focus:ring-red-200 transition-all duration-200 shadow-sm font-medium px-4 py-2 rounded-lg"
                  >
                    ✕ Reset Filter
                  </Button>
                )}
              </div>
              
              {/* Search Results Badge */}
              {searchTerm && (
                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 font-medium px-3 py-1 ml-auto shadow-sm">
                  🔍 {filteredUsers.length} hasil ditemukan
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table */}
          {loading ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="text-gray-500">Memuat data pengguna...</span>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : paginatedUsers.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <Table>
                <TableHeader className="bg-orange-100 border-b-2 border-orange-200">
                  <TableRow>
                    <TableHead className="w-12 font-semibold text-orange-800">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        disabled={paginatedUsers.filter(user => canDeleteUser(user)).length === 0}
                        className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-orange-800">NAMA</TableHead>
                    <TableHead className="font-semibold text-orange-800">EMAIL</TableHead>
                    <TableHead className="w-40 font-semibold text-orange-800">ROLE</TableHead>
                    <TableHead className="w-32 font-semibold text-orange-800">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className="hover:bg-orange-50 transition-colors duration-200 border-b border-gray-100"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                          disabled={!canDeleteUser(user)}
                          className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {user.full_name || user.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">
                          {user.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`font-medium transition-all duration-200 ${getRoleBadgeClass(user.role)}`}
                        >
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canDeleteUser(user) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirmDeleteUser(user)}
                              title="Hapus User"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="w-12 h-12 text-orange-400" />
                </div>
                <div className="text-xl font-semibold text-gray-600">
                  {searchTerm || roleFilter !== "all"
                    ? "Tidak ada data yang sesuai dengan filter"
                    : "Tidak ada data pengguna"
                  }
                </div>
                <div className="text-gray-500 max-w-md">
                  {searchTerm || roleFilter !== "all"
                    ? "Coba ubah filter atau kata kunci pencarian untuk menemukan data yang Anda cari."
                    : "Belum ada pengguna yang terdaftar. Tambahkan pengguna baru untuk memulai."
                  }
                </div>
                {(!searchTerm && roleFilter === "all") && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah User Pertama
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-orange-200 bg-orange-50/30 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-orange-700 font-medium">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} pengguna
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Items per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-orange-700 font-medium">Items per page:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
                      <SelectTrigger className="w-20 h-8 border-orange-200 focus:border-orange-400 focus:ring-orange-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pagination controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={
                              currentPage === pageNum
                                ? "bg-orange-600 hover:bg-orange-700 text-white"
                                : "border-orange-200 text-orange-700 hover:bg-orange-100"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Tambah Pengguna Baru
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Buat akun pengguna baru dan tentukan role aksesnya
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Masukkan email dengan domain @bps.go.id"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
              {formData.email && !formData.email.toLowerCase().endsWith('@bps.go.id') && (
                <p className="text-sm text-red-600">Email harus menggunakan domain @bps.go.id</p>
              )}
              {formData.email && formData.email.toLowerCase().endsWith('@bps.go.id') && (
                <p className="text-sm text-green-600">✓ Email domain valid</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserType["role"] })}>
                <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_demografi">Admin Demografi</SelectItem>
                  <SelectItem value="admin_ekonomi">Admin Ekonomi</SelectItem>
                  <SelectItem value="admin_lingkungan">Admin Lingkungan</SelectItem>
                  <SelectItem value="superadmin">Super Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Masukkan password"
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {/* Password Requirements */}
              {formData.password && (
                <div className="text-xs space-y-1 mt-2">
                  <p className="font-medium text-gray-700">Syarat Password:</p>
                  <div className="grid grid-cols-1 gap-1">
                    <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                      {formData.password.length >= 8 ? '✓' : '✗'} Minimal 8 karakter
                    </div>
                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                      {/[A-Z]/.test(formData.password) ? '✓' : '✗'} Huruf besar (A-Z)
                    </div>
                    <div className={`flex items-center gap-1 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                      {/[a-z]/.test(formData.password) ? '✓' : '✗'} Huruf kecil (a-z)
                    </div>
                    <div className={`flex items-center gap-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password) ? '✓' : '✗'} Karakter spesial (!@#$%^&*)
                    </div>
                    <div className={`flex items-center gap-1 ${!/\s/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                      {!/\s/.test(formData.password) ? '✓' : '✗'} Tidak berisi spasi
                    </div>
                    <div className={`flex items-center gap-1 ${formData.email && formData.password.toLowerCase() !== formData.email.split('@')[0].toLowerCase() && formData.password.toLowerCase() !== formData.email.toLowerCase() && formData.password.toLowerCase() !== formData.name.toLowerCase() ? 'text-green-600' : 'text-red-500'}`}>
                      {formData.email && formData.password.toLowerCase() !== formData.email.split('@')[0].toLowerCase() && formData.password.toLowerCase() !== formData.email.toLowerCase() && formData.password.toLowerCase() !== formData.name.toLowerCase() ? '✓' : '✗'} Tidak sama dengan email/nama
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Konfirmasi password"
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600">Password tidak cocok</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
              className="border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
            >
              Batal
            </Button>
            <Button 
              onClick={handleCreateUser} 
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={
                !formData.name.trim() || 
                !formData.email.trim() || 
                !formData.role || 
                !formData.password ||
                !formData.confirmPassword ||
                formData.password !== formData.confirmPassword ||
                !formData.email.toLowerCase().endsWith('@bps.go.id') ||
                !validatePassword(formData.password, formData.email, formData.name).isValid
              }
            >
              Tambah Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Edit Pengguna
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Perbarui informasi pengguna
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Masukkan email"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserType["role"] })}>
                <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_demografi">Admin Demografi</SelectItem>
                  <SelectItem value="admin_ekonomi">Admin Ekonomi</SelectItem>
                  <SelectItem value="admin_lingkungan">Admin Lingkungan</SelectItem>
                  <SelectItem value="superadmin">Super Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Password Baru (Kosongkan jika tidak ingin mengubah)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showEditPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Masukkan password baru"
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showEditPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {formData.password && (
              <div className="grid gap-2">
                <Label htmlFor="edit-confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="edit-confirmPassword"
                    type={showEditConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Konfirmasi password baru"
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showEditConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-red-600">Password tidak cocok</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingUser(null)
                resetForm()
              }}
              className="border-red-300 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
            >
              Batal
            </Button>
            <Button 
              onClick={handleUpdateUser} 
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={
                !formData.name.trim() || 
                !formData.email.trim() || 
                !formData.role ||
                !formData.email.toLowerCase().endsWith('@bps.go.id') ||
                (!!formData.password && formData.password !== formData.confirmPassword) ||
                (!!formData.password && !validatePassword(formData.password, formData.email, formData.name).isValid)
              }
            >
              Perbarui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-700">
              Konfirmasi Hapus Pengguna
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Apakah Anda yakin ingin menghapus pengguna <strong>{deletingUser?.full_name || deletingUser?.name}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletingUser(null)
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Batal
            </Button>
            <Button 
              onClick={handleDeleteUser} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-700">
              Konfirmasi Hapus Banyak Pengguna
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Apakah Anda yakin ingin menghapus {selectedUsers.size} pengguna yang dipilih? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Pengguna yang akan dihapus:
              </div>
              <ul className="space-y-1">
                {Array.from(selectedUsers).map(userId => {
                  const user = users.find(u => u.id === userId)
                  return user ? (
                    <li key={userId} className="text-sm text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      {user.full_name || user.name} ({user.email})
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBulkDeleteDialogOpen(false)
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Batal
            </Button>
            <Button 
              onClick={handleBulkDelete} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus {selectedUsers.size} Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
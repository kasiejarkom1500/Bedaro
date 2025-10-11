"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Shield, AlertCircle, CheckCircle, Edit, Save, X, Eye, EyeOff, Loader2 } from "lucide-react"
import type { User as UserType } from "@/lib/types"
import { useProfile } from "@/hooks/use-profile"
import { changePassword } from "@/lib/client-auth"

interface AdminProfilePageProps {
  currentUser?: UserType
  onBackClick?: () => void
}

export default function AdminProfilePage({ currentUser, onBackClick }: AdminProfilePageProps) {
  const { profile, loading: profileLoading, error: profileError, updateProfile: updateUserProfile, refetchProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  
  // Always prioritize profile from database over prop
  const user = profile || currentUser
  
  const [editForm, setEditForm] = useState({
    name: user?.full_name || user?.name || "",
    email: user?.email || ""
  })
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: ""
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.full_name || user.name || "",
        email: user.email || ""
      })
    }
  }, [user])

  // Show alert for 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [alert])

  const validateField = (field: keyof typeof fieldErrors, value: string) => {
    const errors = { ...fieldErrors }
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          errors.name = "Nama harus diisi"
        } else if (value.trim().length < 2) {
          errors.name = "Nama minimal 2 karakter"
        } else {
          errors.name = ""
        }
        break
        
      case 'email':
        if (!value.trim()) {
          errors.email = "Email harus diisi"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Format email tidak valid"
        } else {
          errors.email = ""
        }
        break
    }
    
    setFieldErrors(errors)
    return errors[field] === ""
  }

  const validateAllFields = () => {
    const isNameValid = validateField('name', editForm.name)
    const isEmailValid = validateField('email', editForm.email)
    return isNameValid && isEmailValid
  }

  const handleSave = async () => {
    if (!user) return

    // Validasi semua field
    if (!validateAllFields()) {
      setAlert({
        type: "error",
        message: "Mohon perbaiki kesalahan pada form sebelum menyimpan"
      })
      return
    }

    setLoading(true)
    try {
      const updateData = {
        email: editForm.email,
        full_name: editForm.name,
        name: editForm.name
      }

      const result = await updateUserProfile(updateData)
      
      if (result.success) {
        setAlert({
          type: "success", 
          message: "Profil berhasil diperbarui!"
        })
        setIsEditing(false)
        // Refresh profile data to ensure UI shows latest data
        await refetchProfile()
      } else {
        throw new Error(result.error || 'Update failed')
      }
      
    } catch (error) {
      console.error("Error updating profile:", error)
      setAlert({
        type: "error",
        message: "Gagal memperbarui profil. Silakan coba lagi."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setEditForm({
        name: user.full_name || user.name || "",
        email: user.email || ""
      })
    }
    setFieldErrors({
      name: "",
      email: ""
    })
    setIsEditing(false)
  }

  const handlePasswordChange = async () => {
    // Reset errors
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })

    // Validation
    let hasErrors = false

    if (!passwordForm.currentPassword) {
      setPasswordErrors(prev => ({ ...prev, currentPassword: "Password lama harus diisi" }))
      hasErrors = true
    }

    if (!passwordForm.newPassword) {
      setPasswordErrors(prev => ({ ...prev, newPassword: "Password baru harus diisi" }))
      hasErrors = true
    } else if (passwordForm.newPassword.length < 6) {
      setPasswordErrors(prev => ({ ...prev, newPassword: "Password baru minimal 6 karakter" }))
      hasErrors = true
    }

    if (!passwordForm.confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: "Konfirmasi password harus diisi" }))
      hasErrors = true
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors(prev => ({ ...prev, confirmPassword: "Konfirmasi password tidak cocok" }))
      hasErrors = true
    }

    if (hasErrors) return

    setPasswordLoading(true)
    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      
      if (result.success) {
        setAlert({
          type: "success",
          message: result.message || "Password berhasil diubah!"
        })
        // Reset form
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      } else {
        setAlert({
          type: "error",
          message: result.error || "Gagal mengubah password"
        })
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setAlert({
        type: "error",
        message: "Terjadi kesalahan saat mengubah password"
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Super Administrator"
      case "admin_demografi":
        return "Admin Demografi & Sosial"
      case "admin_ekonomi":
        return "Admin Ekonomi"
      case "admin_lingkungan":
        return "Admin Lingkungan & Multi-Domain"
      default:
        return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "admin_demografi":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "admin_ekonomi":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "admin_lingkungan":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      window.history.back()
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </CardTitle>
            <CardDescription>Memuat profil pengguna dari database</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{profileError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>No User Data</CardTitle>
            <CardDescription>Data pengguna tidak ditemukan</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Admin</h1>
                <p className="text-sm text-gray-600">Kelola informasi profil Anda</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleBackClick}>
              Kembali
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert */}
        {alert && (
          <div className="mb-6">
            <Alert 
              variant={alert.type === "error" ? "destructive" : "default"}
              className="border rounded-lg"
            >
              {alert.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription className="font-medium">
                {alert.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name || user.name}`} />
                    <AvatarFallback className="text-lg">
                      {(user.full_name || user.name || "User")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{user.full_name || user.name || "User"}</h3>
                  <Badge className={`mb-4 ${getRoleBadgeColor(user.role)}`}>{getRoleDisplayName(user.role)}</Badge>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Mail className="h-4 w-4 mr-2" />
                    {user.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList>
                <TabsTrigger value="profile">Informasi Profil</TabsTrigger>
                <TabsTrigger value="security">Keamanan</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Informasi Personal</CardTitle>
                        <CardDescription>Kelola informasi profil dan kontak Anda</CardDescription>
                      </div>
                      {!isEditing ? (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profil
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancel}
                            disabled={loading}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Batal
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-[#FF6B00] hover:bg-[#E66000]"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? "Menyimpan..." : "Simpan"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Nama Lengkap</Label>
                        {isEditing ? (
                          <div>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) => {
                                setEditForm({ ...editForm, name: e.target.value })
                                validateField('name', e.target.value)
                              }}
                              className={`mt-1 ${
                                fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                              }`}
                              placeholder="Masukkan nama lengkap"
                            />
                            {fieldErrors.name && (
                              <p className="text-sm text-red-600 mt-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {fieldErrors.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">{user.full_name || user.name || "-"}</div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        {isEditing ? (
                          <div>
                            <Input
                              id="email"
                              type="email"
                              value={editForm.email}
                              onChange={(e) => {
                                setEditForm({ ...editForm, email: e.target.value })
                                validateField('email', e.target.value)
                              }}
                              className={`mt-1 ${
                                fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                              }`}
                              placeholder="Masukkan email"
                            />
                            {fieldErrors.email && (
                              <p className="text-sm text-red-600 mt-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {fieldErrors.email}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <div className="mt-1">
                          <Badge className={getRoleBadgeColor(user.role)}>{getRoleDisplayName(user.role)}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Keamanan Akun</CardTitle>
                    <CardDescription>Kelola pengaturan keamanan akun Anda</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="current-password">Password Saat Ini</Label>
                      <div className="relative">
                        <Input 
                          id="current-password" 
                          type={showCurrentPassword ? "text" : "password"} 
                          placeholder="Masukkan password saat ini"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className={`pr-10 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="new-password">Password Baru</Label>
                      <div className="relative">
                        <Input 
                          id="new-password" 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="Masukkan password baru (minimal 6 karakter)"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className={`pr-10 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                      <div className="relative">
                        <Input 
                          id="confirm-password" 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Konfirmasi password baru"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={`pr-10 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
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
                      {passwordErrors.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                      className="w-full sm:w-auto"
                    >
                      {passwordLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      {passwordLoading ? "Mengubah Password..." : "Update Password"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

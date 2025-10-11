"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User as UserIcon,
  BarChart3,
  PenTool,
  X,
  Download,
  Users,
  FileText,
  HelpCircle,
} from "lucide-react"
import type { User } from "@/lib/types"
import { ArticleEditor } from "@/components/article-editor"
import { ArticleManagement } from "./article-management"
import { FAQManagement } from "./faq-management"
import ArticleStatsCards from "./article-stats-cards"
import FAQStatsCards from "./faq-stats-cards"
import { DataManagementDashboard } from "@/components/data-management-dashboard"
import { ExportDataComponent } from "@/components/export-data-component"

interface AdminDemografiPageProps {
  currentUser?: User  // Made optional for backward compatibility
  onProfileClick?: () => void
  onLogoutClick?: () => void
  adminActiveTab?: string
  onAdminTabChange?: (tab: string) => void
  dataManagementTab?: string
  onDataManagementTabChange?: (tab: string) => void
  contentManagementTab?: string
  onContentManagementTabChange?: (tab: string) => void
  onSessionUpdate?: () => void
}

export default function AdminDemografiPage({ 
  currentUser, 
  onProfileClick, 
  onLogoutClick,
  adminActiveTab = "data",
  onAdminTabChange,
  dataManagementTab = "overview",
  onDataManagementTabChange,
  contentManagementTab = "dashboard",
  onContentManagementTabChange,
  onSessionUpdate
}: AdminDemografiPageProps) {
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Debug logging
  console.log('AdminDemografiPage props:', { 
    adminActiveTab, 
    dataManagementTab, 
    contentManagementTab,
    hasCurrentUser: !!currentUser 
  });

  const category = "Statistik Demografi & Sosial"

  // Validation: ensure only admin_demografi can access this page
  if (currentUser && currentUser.role !== 'admin_demografi') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-md mx-auto mt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Error: Halaman ini hanya untuk Admin Demografi. 
              Role Anda: {currentUser.role}. 
              Silakan logout dan login dengan akun yang benar.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick()
    }
  }

  const handleLogoutClick = async () => {
    if (onLogoutClick) {
      onLogoutClick()
    }
  }

  // Temporary: Allow access for admin demografi - to be fixed later  
  if (false) {  // Disabled permission check temporarily
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <Card className="w-96 shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Akses Ditolak</CardTitle>
            <CardDescription className="text-gray-600">
              Anda tidak memiliki akses ke halaman ini. Silakan login dengan akun admin demografi.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Improved Header */}
      <div className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Demografi & Sosial</h1>
                <p className="text-sm text-gray-600">
                  Kelola data statistik demografi dan sosial Kabupaten Bungo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-orange-100 text-orange-800 px-3 py-1.5 font-medium border-0">
                {currentUser?.name || currentUser?.full_name || "Admin Demografi"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProfileClick}
                className="border-orange-200 text-orange-700 hover:bg-orange-500 hover:border-orange-300 transition-all duration-200"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Profil
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutClick}
                className="border-red-400 text-red-700 hover:bg-red-700 hover:border-red-700 bg-red-50 transition-all duration-200"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Alert */}
        {alert && (
          <Alert
            variant={alert.type === "error" ? "destructive" : "default"}
            className={`mb-6 border-0 shadow-lg ${
              alert.type === "success"
                ? "bg-green-50 text-green-800 border-l-4 border-l-green-500"
                : "bg-red-50 text-red-800 border-l-4 border-l-red-500"
            }`}
          >
            <AlertDescription className="font-medium">{alert.message}</AlertDescription>
          </Alert>
        )}

        <Tabs value={adminActiveTab} onValueChange={onAdminTabChange} className="space-y-6">
          <TabsList className="bg-white border border-orange-200 p-1 shadow-sm rounded-lg">
            <TabsTrigger
              value="data"
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 font-medium rounded-md"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Kelola Data
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 font-medium rounded-md"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </TabsTrigger>
            <TabsTrigger
              value="articles"
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 font-medium rounded-md"
            >
              <PenTool className="w-4 h-4 mr-2" />
              Kelola Artikel & FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-6">
            <DataManagementDashboard 
              category="Statistik Demografi & Sosial" 
              userRole="admin_demografi"
              activeTab={dataManagementTab}
              onTabChange={onDataManagementTabChange}
              onSessionUpdate={onSessionUpdate}
            />
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <ExportDataComponent 
              category={category}
              title="Export Data Demografi & Sosial"
              description="Pilih jenis export yang Anda inginkan. Anda dapat mengunduh semua data dalam kategori ini atau memilih indikator tertentu."
              onAlert={showAlert}
            />
          </TabsContent>

          <TabsContent value="articles" className="space-y-6">
            {/* Header Pusat Pengelolaan Konten */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-6 text-white mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <PenTool className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Pusat Pengelolaan Konten</h1>
                  </div>
                  <p className="text-white/90">Kelola artikel dan FAQ untuk platform BPS Bungo</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Data Demografi & Sosial
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Admin Konten
                  </Badge>
                </div>
              </div>
            </div>

            {/* Sub-menu Tab Style - Lebih Minimalis */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  contentManagementTab === 'dashboard' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-600 hover:text-orange-600'
                }`}
                onClick={() => onContentManagementTabChange?.('dashboard')}
              >
                <PenTool className="w-4 h-4" />
                Dashboard Konten
              </button>
              
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  contentManagementTab === 'articles' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-600 hover:text-orange-600'
                }`}
                onClick={() => onContentManagementTabChange?.('articles')}
              >
                <FileText className="w-4 h-4" />
                Kelola Artikel
              </button>
              
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  contentManagementTab === 'faqs' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-600 hover:text-orange-600'
                }`}
                onClick={() => onContentManagementTabChange?.('faqs')}
              >
                <HelpCircle className="w-4 h-4" />
                Manajemen FAQ
              </button>
            </div>

            {/* Content berdasarkan pilihan */}
            {contentManagementTab === 'dashboard' && currentUser && (
              <ArticleEditor currentUser={currentUser} searchQuery="" />
            )}
            
            {contentManagementTab === 'articles' && currentUser && (
              <div className="space-y-6">
                <ArticleStatsCards currentUser={currentUser} />
                <ArticleManagement currentUser={currentUser} onSessionUpdate={onSessionUpdate} />
              </div>
            )}
            
            {contentManagementTab === 'faqs' && currentUser && (
              <div className="space-y-6">
                <FAQStatsCards currentUser={currentUser} />
                <FAQManagement currentUser={currentUser} onSessionUpdate={onSessionUpdate} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
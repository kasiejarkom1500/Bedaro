"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, TrendingUp, FileText, User, Database, PenTool } from "lucide-react"
import { EditableDataTable } from "@/components/editable-data-table"
import { ArticleEditor } from "@/components/article-editor"
import { UserManagement } from "@/components/user-management"
import type { IndicatorWithData, User as UserType } from "@/lib/types"
import { getIndicatorsByCategory, getCurrentUser } from "@/lib/client-database"

interface AdminDashboardProps {
  onProfileClick: () => void
  adminRole: string
}

export function AdminDashboard({ onProfileClick, adminRole }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState("overview")
  const [indicators, setIndicators] = useState<IndicatorWithData[]>([])
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const roleCategories = {
    "admin-demografi": "Statistik Demografi & Sosial",
    "admin-ekonomi": "Statistik Ekonomi",
    "admin-lingkungan": "Statistik Lingkungan Hidup & Multi-Domain",
  }

  const category = roleCategories[adminRole as keyof typeof roleCategories]

  useEffect(() => {
    loadData()
    loadCurrentUser()
  }, [category])

  const loadData = async () => {
    if (!category) return

    try {
      setLoading(true)
      const data = await getIndicatorsByCategory(category)
      setIndicators(data)
    } catch (error) {
      console.error("Error loading data:", error)
      showAlert("error", "Gagal memuat data!")
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.error("Error loading current user:", error)
    }
  }

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 3000)
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin-demografi":
        return "Admin Demografi & Sosial"
      case "admin-ekonomi":
        return "Admin Ekonomi"
      case "admin-lingkungan":
        return "Admin Lingkungan Hidup & Multi-Domain"
      default:
        return "Administrator"
    }
  }

  const getLatestDataCount = () => {
    const currentYear = new Date().getFullYear()
    return indicators.filter((indicator) => indicator.data?.some((data) => data.year === currentYear)).length
  }

  const getTotalDataPoints = () => {
    return indicators.reduce((total, indicator) => total + (indicator.data?.length || 0), 0)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#555555]">Total Indikator</p>
                <p className="text-2xl font-bold text-[#333333]">{indicators.length}</p>
              </div>
              <FileText className="w-8 h-8 text-[#FF6B00]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#555555]">Total Data Points</p>
                <p className="text-2xl font-bold text-[#333333]">{getTotalDataPoints()}</p>
              </div>
              <Database className="w-8 h-8 text-[#FF6B00]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#555555]">Data Tahun Ini</p>
                <p className="text-2xl font-bold text-[#333333]">{getLatestDataCount()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#FF6B00]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#555555]">Kategori</p>
                <p className="text-2xl font-bold text-[#333333]">1</p>
              </div>
              <BarChart3 className="w-8 h-8 text-[#FF6B00]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#333333]">Indikator Terbaru</CardTitle>
          <CardDescription className="text-[#555555]">
            Indikator yang memiliki data terbaru dalam kategori {category}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {indicators
              .filter((indicator) => indicator.data && indicator.data.length > 0)
              .sort((a, b) => {
                const aLatest = Math.max(...(a.data?.map((d) => d.year) || [0]))
                const bLatest = Math.max(...(b.data?.map((d) => d.year) || [0]))
                return bLatest - aLatest
              })
              .slice(0, 5)
              .map((indicator) => {
                const latestYear = Math.max(...(indicator.data?.map((d) => d.year) || [0]))
                const latestData = indicator.data?.find((d) => d.year === latestYear)

                return (
                  <div key={indicator.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <h4 className="font-medium text-[#333333]">{indicator.indikator}</h4>
                      <p className="text-sm text-[#555555]">
                        {latestData?.value?.toLocaleString("id-ID")} {indicator.satuan}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20">
                      {latestYear}
                    </Badge>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

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
      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Admin Dashboard</h1>
          <p className="text-[#555555]">{getRoleDisplayName(adminRole)} - Kelola data statistik Kabupaten Bungo</p>
        </div>
        <Button
          variant="outline"
          onClick={onProfileClick}
          className="border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white bg-transparent"
        >
          <User className="w-4 h-4 mr-2" />
          Profil Admin
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeSection === "overview" ? "default" : "outline"}
          onClick={() => setActiveSection("overview")}
          className={
            activeSection === "overview"
              ? "bg-[#FF6B00] hover:bg-[#E66000] text-white"
              : "border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
          }
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeSection === "data" ? "default" : "outline"}
          onClick={() => setActiveSection("data")}
          className={
            activeSection === "data"
              ? "bg-[#FF6B00] hover:bg-[#E66000] text-white"
              : "border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
          }
        >
          <FileText className="w-4 h-4 mr-2" />
          Kelola Data
        </Button>
        <Button
          variant={activeSection === "articles" ? "default" : "outline"}
          onClick={() => setActiveSection("articles")}
          className={
            activeSection === "articles"
              ? "bg-[#FF6B00] hover:bg-[#E66000] text-white"
              : "border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
          }
        >
          <PenTool className="w-4 h-4 mr-2" />
          Kelola Artikel
        </Button>
        {(adminRole === "superadmin" || currentUser?.role === "superadmin") && (
          <Button
            variant={activeSection === "users" ? "default" : "outline"}
            onClick={() => setActiveSection("users")}
            className={
              activeSection === "users"
                ? "bg-[#FF6B00] hover:bg-[#E66000] text-white"
                : "border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
            }
          >
            <User className="w-4 h-4 mr-2" />
            Manajemen Users
          </Button>
        )}
      </div>

      {activeSection === "overview" ? (
        renderOverview()
      ) : activeSection === "data" ? (
        <EditableDataTable indicators={indicators} category={category || ""} onDataUpdate={loadData} />
      ) : activeSection === "articles" && currentUser ? (
        <ArticleEditor currentUser={currentUser} />
      ) : activeSection === "users" && currentUser && (adminRole === "superadmin" || currentUser?.role === "superadmin") ? (
        <UserManagement currentUser={currentUser} onProfileClick={onProfileClick} />
      ) : null}
    </div>
  )
}

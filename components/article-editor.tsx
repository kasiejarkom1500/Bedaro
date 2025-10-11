"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  HelpCircle,
  CheckSquare,
  X,
  PenTool,
  Users,
  MessageCircle,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { FAQManagement } from "@/components/faq-management"
import { ArticleManagement } from "@/components/article-management"
import type { User } from "@/lib/types"

interface ArticleEditorProps {
  currentUser: User | null
  searchQuery?: string
}

export function ArticleEditor({ currentUser, searchQuery = "" }: ArticleEditorProps) {
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState("articles") // Default ke articles karena sudah ready
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalFAQs: 0,
    pendingFAQs: 0,
    publishedFAQs: 0
  })

  useEffect(() => {
    if (currentUser) {
      loadStats()
    }
  }, [currentUser])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      // Load articles stats
      const articlesResponse = await fetch('/api/articles', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // Load FAQs stats
      const faqsResponse = await fetch('/api/admin/faqs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (articlesResponse.ok && faqsResponse.ok) {
        const articlesData = await articlesResponse.json()
        const faqsData = await faqsResponse.json()
        
        const articles = articlesData.articles || []
        const faqs = faqsData.faqs || []
        
        setStats({
          totalArticles: articles.length,
          publishedArticles: articles.filter((a: any) => a.is_published).length,
          draftArticles: articles.filter((a: any) => !a.is_published).length,
          totalFAQs: faqs.length,
          pendingFAQs: faqs.filter((f: any) => f.status === 'pending').length,
          publishedFAQs: faqs.filter((f: any) => f.status === 'published').length
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Akses ditolak. Silakan login sebagai admin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert 
          variant={alert.type === "error" ? "destructive" : "default"}
          className={alert.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}
        >
          <AlertDescription className="flex items-center gap-2">
            {alert.type === "success" && <CheckSquare className="w-4 h-4 text-green-600" />}
            {alert.type === "error" && <X className="w-4 h-4 text-red-600" />}
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards - Simple tanpa Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-orange-100 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-orange-200 text-orange-800 border-orange-300 px-2 py-1 text-xs">
                Total
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-orange-700">Total Artikel</h3>
              <div className="text-3xl font-bold text-orange-900">{stats.totalArticles}</div>
              <p className="text-xs text-orange-600">
                {stats.publishedArticles} dipublikasikan • {stats.draftArticles} draft
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-100 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-200 text-green-800 border-green-300 px-2 py-1 text-xs">
                Live
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-green-700">Artikel Dipublikasi</h3>
              <div className="text-3xl font-bold text-green-900">{stats.publishedArticles}</div>
              <p className="text-xs text-green-600">
                {stats.totalArticles > 0 ? Math.round((stats.publishedArticles / stats.totalArticles) * 100) : 0}% dari total artikel
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-200 text-purple-800 border-purple-300 px-2 py-1 text-xs">
                FAQ
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-purple-700">Total FAQ</h3>
              <div className="text-3xl font-bold text-purple-900">{stats.totalFAQs}</div>
              <p className="text-xs text-purple-600">
                {stats.publishedFAQs} dipublikasi • {stats.pendingFAQs} menunggu
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-100 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500 rounded-xl shadow-sm">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <Badge variant="secondary" className="bg-amber-200 text-amber-800 border-amber-300 px-2 py-1 text-xs">
                Pending
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-amber-700">FAQ Menunggu</h3>
              <div className="text-3xl font-bold text-amber-900">{stats.pendingFAQs}</div>
              <p className="text-xs text-amber-600">
                Perlu review dan jawaban
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Information - Simple Layout tanpa Card Header */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Overview Konten</h2>
          <p className="text-gray-600">Pantau performa konten dan aktivitas terbaru secara real-time</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Ringkasan Artikel
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Artikel Tersimpan</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {stats.totalArticles} artikel
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Artikel yang Dipublikasi</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {stats.publishedArticles} artikel
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Draft Artikel</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {stats.draftArticles} draft
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              Ringkasan FAQ
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Pertanyaan</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {stats.totalFAQs} FAQ
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">FAQ Dipublikasi</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {stats.publishedFAQs} FAQ
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Menunggu Review</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {stats.pendingFAQs} FAQ
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
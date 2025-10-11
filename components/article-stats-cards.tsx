"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye } from "lucide-react"

interface ArticleStatsCardsProps {
  currentUser: {
    id: string
    name?: string
    email: string
    role: string
  }
}

export default function ArticleStatsCards({ currentUser }: ArticleStatsCardsProps) {
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    loading: true
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/articles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const articles = data.articles || []
          
          // Filter berdasarkan role - kategori yang sebenarnya di database adalah "lingkungan"
          let filteredArticles = articles
          if (currentUser.role === 'admin_lingkungan') {
            const possibleCategories = [
              'lingkungan',
              'Lingkungan', 
              'Statistik Lingkungan & Multidomain',
              'Statistik Lingkungan & Multi-Domain', 
              'Statistik Lingkungan Hidup & Multi-Domain'
            ]
            
            filteredArticles = articles.filter((article: any) => {
              return possibleCategories.some(cat => 
                article.category === cat || 
                article.category?.toLowerCase() === cat.toLowerCase()
              )
            })
          } else if (currentUser.role === 'admin_ekonomi') {
            filteredArticles = articles.filter((article: any) => 
              article.category?.toLowerCase().includes('ekonomi')
            )
          } else if (currentUser.role === 'admin_demografi') {
            filteredArticles = articles.filter((article: any) => 
              article.category?.toLowerCase().includes('demografi') || 
              article.category?.toLowerCase().includes('sosial')
            )
          }

          const publishedArticles = filteredArticles.filter((article: any) => {
            // Field yang benar adalah is_published dengan nilai 1
            return article.is_published === 1 || article.is_published === true
          })
          
          setStats({
            totalArticles: filteredArticles.length,
            publishedArticles: publishedArticles.length,
            loading: false
          })
        } else {
          setStats({
            totalArticles: 0,
            publishedArticles: 0,
            loading: false
          })
        }
      } catch (error) {
        console.error('Error fetching article stats:', error)
        setStats({
          totalArticles: 0,
          publishedArticles: 0,
          loading: false
        })
      }
    }

    fetchStats()
  }, [currentUser?.role])

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Artikel</p>
              <p className="text-3xl font-bold text-blue-700">{stats.totalArticles}</p>
              <p className="text-xs text-blue-500 mt-1">Semua artikel dalam sistem</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Artikel Dipublikasikan</p>
              <p className="text-3xl font-bold text-green-700">{stats.publishedArticles}</p>
              <p className="text-xs text-green-500 mt-1">Artikel yang dapat dilihat publik</p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
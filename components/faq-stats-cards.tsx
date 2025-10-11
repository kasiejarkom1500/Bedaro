"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, Clock } from "lucide-react"

interface FAQStatsCardsProps {
  currentUser: {
    id: string
    name?: string
    email: string
    role: string
  }
}

export default function FAQStatsCards({ currentUser }: FAQStatsCardsProps) {
  const [stats, setStats] = useState({
    totalFAQs: 0,
    pendingFAQs: 0,
    loading: true
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/admin/faqs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const faqs = data.faqs || []
          
          // Tidak perlu filtering berdasarkan role, semua admin bisa kelola semua FAQ
          const totalFAQs = faqs.length
          const pendingFAQs = faqs.filter((faq: any) => faq.status === 'pending').length
          
          setStats({
            totalFAQs,
            pendingFAQs,
            loading: false
          })
        } else {
          setStats({
            totalFAQs: 0,
            pendingFAQs: 0,
            loading: false
          })
        }
      } catch (error) {
        console.error('Error fetching FAQ stats:', error)
        setStats({
          totalFAQs: 0,
          pendingFAQs: 0,
          loading: false
        })
      }
    }

    fetchStats()
  }, [currentUser])

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
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Total FAQ</p>
              <p className="text-3xl font-bold text-purple-700">{stats.totalFAQs}</p>
              <p className="text-xs text-purple-500 mt-1">Semua FAQ dalam sistem</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">FAQ Menunggu</p>
              <p className="text-3xl font-bold text-orange-700">{stats.pendingFAQs}</p>
              <p className="text-xs text-orange-500 mt-1">FAQ yang menunggu review</p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { HomePage } from "@/components/home-page"
import { DemografiPage } from "@/components/demografi-page"
import { EkonomiPage } from "@/components/ekonomi-page"
import { LingkunganPage } from "@/components/lingkungan-page"
import { LiterasiPage } from "@/components/literasi-page"
import { FaqPage } from "@/components/faq-page"
import { IndicatorDetailPage } from "@/components/indicator-detail-page"
import { ArticleDetailPage } from "@/components/article-detail-page"
import { LoginPage } from "@/components/login-page"
import AdminDemografiPage from "@/components/admin-demografi-page"
import AdminEkonomiPage from "@/components/admin-ekonomi-page"
import AdminLingkunganPage from "@/components/admin-lingkungan-page"
import AdminProfilePage from "@/components/admin-profile-page"
import { UserManagement } from "@/components/user-management"
import { Footer } from "@/components/footer"
import { login, checkSession, logout } from "@/lib/client-auth"
import type { User, Indicator } from "@/lib/types"

// Extended indicator type for navigation (matches IndicatorDetailPage expectations)
type SelectedIndicator = {
  title: string
  category: string
  icon: any
  sourcePage?: string
}

// ProcessedArticle interface for article handling
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

export default function MainPage() {
  // Initialize with safe default values first
  const [activeTab, setActiveTab] = useState("home")
  const [selectedIndicator, setSelectedIndicator] = useState<SelectedIndicator | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<ProcessedArticle | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showAdminDemografi, setShowAdminDemografi] = useState(false)
  const [showAdminEkonomi, setShowAdminEkonomi] = useState(false)
  const [showAdminLingkungan, setShowAdminLingkungan] = useState(false)
  const [showAdminProfile, setShowAdminProfile] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Additional state for detailed persistence
  const [adminActiveTab, setAdminActiveTab] = useState<string>("data") // kelola data, export data, kelola artikel & faq
  const [dataManagementTab, setDataManagementTab] = useState<string>("overview") // ringkasan, atur indikator, input data
  const [contentManagementTab, setContentManagementTab] = useState<string>("dashboard") // dashboard konten, kelola artikel, manajemen faq

  useEffect(() => {
    // Set hydrated to true and restore state from localStorage
    setIsHydrated(true)
    
    try {
      // Check and restore user session
      const user = checkSession()
      if (user) {
        setCurrentUser(user)
        setIsLoggedIn(true)
        
        // Restore application state based on user role and last active state
        const lastActiveState = localStorage.getItem('lastActiveState')
        const lastActiveTab = localStorage.getItem('lastActiveTab')
        const detailedState = localStorage.getItem('detailedAppState')
        
        // Restore detailed state if available
        if (detailedState) {
          const state = JSON.parse(detailedState)
          
          // Restore selected indicator/article
          if (state.selectedIndicator) {
            setSelectedIndicator(state.selectedIndicator)
          }
          if (state.selectedArticle) {
            setSelectedArticle(state.selectedArticle)
          }
          
          // Restore admin tabs
          if (state.adminActiveTab) {
            setAdminActiveTab(state.adminActiveTab)
          }
          if (state.dataManagementTab) {
            setDataManagementTab(state.dataManagementTab)
          }
          if (state.contentManagementTab) {
            setContentManagementTab(state.contentManagementTab)
          }
        }
        
        if (lastActiveState) {
          const state = JSON.parse(lastActiveState)
          
          // Restore admin pages state
          if (state.showAdminDemografi && user.role === 'admin_demografi') {
            setShowAdminDemografi(true)
          } else if (state.showAdminEkonomi && user.role === 'admin_ekonomi') {
            setShowAdminEkonomi(true)
          } else if (state.showAdminLingkungan && user.role === 'admin_lingkungan') {
            setShowAdminLingkungan(true)
          } else if (state.showAdminProfile) {
            setShowAdminProfile(true)
          } else if (state.showUserManagement && user.role === 'superadmin') {
            setShowUserManagement(true)
          }
        } else {
          // Default admin page based on role if no saved state
          console.log('Setting default admin page for role:', user.role)
          if (user.role === 'admin_demografi') {
            setShowAdminDemografi(true)
            setAdminActiveTab("data")
            setDataManagementTab("overview")
          } else if (user.role === 'admin_ekonomi') {
            setShowAdminEkonomi(true)
            setAdminActiveTab("data")
            setDataManagementTab("overview")
          } else if (user.role === 'admin_lingkungan') {
            setShowAdminLingkungan(true)
            setAdminActiveTab("data")
            setDataManagementTab("overview")
          } else if (user.role === 'superadmin') {
            setShowUserManagement(true)
          }
        }
        
        // Restore active tab for non-admin pages
        if (lastActiveTab && !lastActiveState) {
          setActiveTab(lastActiveTab)
        }
      } else {
        // No session, restore public page state
        const lastActiveTab = localStorage.getItem('lastActiveTab')
        const detailedState = localStorage.getItem('detailedAppState')
        
        if (lastActiveTab) {
          setActiveTab(lastActiveTab)
        }
        
        // Restore selected indicator/article for public pages
        if (detailedState) {
          const state = JSON.parse(detailedState)
          if (state.selectedIndicator) {
            setSelectedIndicator(state.selectedIndicator)
          }
          if (state.selectedArticle) {
            setSelectedArticle(state.selectedArticle)
          }
        }
      }
    } catch (error) {
      console.error("Session and state restore error:", error)
    }

    // Handle direct FAQ URL access
    if (window.location.pathname === "/faq") {
      setActiveTab("faq")
    }
  }, [])

  // Helper function to save detailed app state
  const saveDetailedState = () => {
    try {
      const detailedState = {
        selectedIndicator,
        selectedArticle,
        adminActiveTab,
        dataManagementTab,
        contentManagementTab,
        timestamp: Date.now()
      }
      localStorage.setItem('detailedAppState', JSON.stringify(detailedState))
    } catch (error) {
      console.error("Error saving detailed state:", error)
    }
  }

  // Auto-save detailed state whenever relevant state changes
  useEffect(() => {
    if (isHydrated) {
      saveDetailedState()
    }
  }, [selectedIndicator, selectedArticle, adminActiveTab, dataManagementTab, contentManagementTab, isHydrated])

  useEffect(() => {
    if (activeTab === "faq") {
      window.history.pushState({}, "", "/faq")
    } else if (activeTab === "home") {
      window.history.pushState({}, "", "/")
    }
  }, [activeTab])

  const checkCurrentSession = () => {
    try {
      const user = checkSession()
      if (user) {
        setCurrentUser(user)
        setIsLoggedIn(true)
      }
    } catch (error) {
      console.error("Session check error:", error)
    }
  }

  const handleTabChange = (tab: string) => {
    setSelectedIndicator(null)
    setSelectedArticle(null)

    setActiveTab(tab)
    
    // Save active tab to localStorage for refresh persistence
    localStorage.setItem('lastActiveTab', tab)

    window.scrollTo({ top: 0, behavior: "smooth" })

    if (showAdminDemografi || showAdminEkonomi || showAdminLingkungan || showAdminProfile || showUserManagement) {
      setShowAdminDemografi(false)
      setShowAdminEkonomi(false)
      setShowAdminLingkungan(false)
      setShowAdminProfile(false)
      setShowUserManagement(false)
      
      // Clear admin state from localStorage
      localStorage.removeItem('lastActiveState')
    }
  }

  const handleArticleClick = (article: ProcessedArticle) => {
    setSelectedArticle(article)
  }

  const handleIndicatorBack = () => {
    const sourcePage = selectedIndicator?.sourcePage || "home"
    setSelectedIndicator(null)
    setActiveTab(sourcePage)
  }

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
    setShowLogin(false)

    // Clear any previous public tab state
    localStorage.removeItem('lastActiveTab')

    if (user.role === "superadmin") {
      setShowUserManagement(true)
      // Save admin state for refresh persistence
      localStorage.setItem('lastActiveState', JSON.stringify({
        showUserManagement: true
      }))
    } else if (user.role === "admin_demografi") {
      setShowAdminDemografi(true)
      setAdminActiveTab("data")
      setDataManagementTab("overview")
      localStorage.setItem('lastActiveState', JSON.stringify({
        showAdminDemografi: true
      }))
      localStorage.setItem('detailedAppState', JSON.stringify({
        adminActiveTab: "data",
        dataManagementTab: "overview"
      }))
    } else if (user.role === "admin_ekonomi") {
      setShowAdminEkonomi(true)
      setAdminActiveTab("data")
      setDataManagementTab("overview")
      localStorage.setItem('lastActiveState', JSON.stringify({
        showAdminEkonomi: true
      }))
      localStorage.setItem('detailedAppState', JSON.stringify({
        adminActiveTab: "data",
        dataManagementTab: "overview"
      }))
    } else if (user.role === "admin_lingkungan") {
      setShowAdminLingkungan(true)
      setAdminActiveTab("data")
      setDataManagementTab("overview")
      localStorage.setItem('lastActiveState', JSON.stringify({
        showAdminLingkungan: true
      }))
      localStorage.setItem('detailedAppState', JSON.stringify({
        adminActiveTab: "data",
        dataManagementTab: "overview"
      }))
    } else {
      setActiveTab("home")
      localStorage.setItem('lastActiveTab', 'home')
    }
  }

  const handleLogout = async () => {
    try {
      logout()
      localStorage.removeItem('authToken')
      localStorage.removeItem('currentUser')
      // Clear state persistence
      localStorage.removeItem('lastActiveState')
      localStorage.removeItem('lastActiveTab')
      localStorage.removeItem('detailedAppState')

      setIsLoggedIn(false)
      setCurrentUser(null)
      setActiveTab("home")
      setShowAdminDemografi(false)
      setShowAdminEkonomi(false)
      setShowAdminLingkungan(false)
      setShowAdminProfile(false)
      setShowUserManagement(false)
      setSelectedIndicator(null)
      setSelectedArticle(null)
      // Reset admin tabs to default
      setAdminActiveTab("dashboard")
      setDataManagementTab("ringkasan")
      setContentManagementTab("dashboard")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleIndicatorClick = (indicator: any) => {
    setSelectedIndicator({
      ...indicator,
      sourcePage: activeTab,
    })
  }

  const handleArticleBack = () => {
    setSelectedArticle(null)
    setActiveTab("literasi")
  }

  const renderContent = () => {
    if (selectedIndicator) {
      return <IndicatorDetailPage indicator={selectedIndicator} onBack={handleIndicatorBack} />
    }

    if (selectedArticle) {
      return <ArticleDetailPage article={selectedArticle} onBack={handleArticleBack} />
    }

    switch (activeTab) {
      case "home":
        return <HomePage onTabChange={handleTabChange} />
      case "demografi":
        return <DemografiPage onIndicatorClick={handleIndicatorClick} />
      case "ekonomi":
        return <EkonomiPage onIndicatorClick={handleIndicatorClick} />
      case "lingkungan":
        return <LingkunganPage onIndicatorClick={handleIndicatorClick} />
      case "literasi":
        return <LiterasiPage onArticleClick={handleArticleClick} onTabChange={handleTabChange} />
      case "faq":
        return <FaqPage onTabChange={handleTabChange} />
      default:
        return <HomePage onTabChange={handleTabChange} />
    }
  }

  // Prevent hydration mismatch by not rendering admin content until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (showLogin) {
    return <LoginPage onLogin={handleLogin} onBack={() => setShowLogin(false)} />
  }

  if (showAdminProfile && isLoggedIn && currentUser) {
    const handleProfileBack = () => {
      setShowAdminProfile(false)
      // kembalikan ke dashboard sesuai role
      if (currentUser.role === "admin_demografi") {
        setShowAdminDemografi(true)
      } else if (currentUser.role === "admin_ekonomi") {
        setShowAdminEkonomi(true)
      } else if (currentUser.role === "admin_lingkungan") {
        setShowAdminLingkungan(true)
      } else if (currentUser.role === "superadmin") {
        setShowUserManagement(true)
      }
    }

    return <AdminProfilePage currentUser={currentUser} onBackClick={handleProfileBack} />
  }

  if (showAdminDemografi && isLoggedIn && currentUser) {
    return (
      <AdminDemografiPage
        currentUser={currentUser}
        onProfileClick={() => {
          console.log("[v0] Profile click handler called, setting showAdminProfile to true")
          setShowAdminDemografi(false)
          setShowAdminProfile(true)
        }}
        onLogoutClick={handleLogout}
        adminActiveTab={adminActiveTab}
        onAdminTabChange={setAdminActiveTab}
        dataManagementTab={dataManagementTab}
        onDataManagementTabChange={setDataManagementTab}
        contentManagementTab={contentManagementTab}
        onContentManagementTabChange={setContentManagementTab}
        onSessionUpdate={checkCurrentSession}
      />
    )
  }

  if (showAdminEkonomi && isLoggedIn && currentUser) {
    return (
      <AdminEkonomiPage
        currentUser={currentUser}
        onProfileClick={() => {
          setShowAdminEkonomi(false)
          setShowAdminProfile(true)
        }}
        onLogoutClick={handleLogout}
        adminActiveTab={adminActiveTab}
        onAdminTabChange={setAdminActiveTab}
        dataManagementTab={dataManagementTab}
        onDataManagementTabChange={setDataManagementTab}
        contentManagementTab={contentManagementTab}
        onContentManagementTabChange={setContentManagementTab}
        onSessionUpdate={checkCurrentSession}
      />
    )
  }

  if (showAdminLingkungan && isLoggedIn && currentUser) {
    return (
      <AdminLingkunganPage
        currentUser={currentUser}
        onProfileClick={() => {
          setShowAdminLingkungan(false)
          setShowAdminProfile(true)
        }}
        onLogoutClick={handleLogout}
        adminActiveTab={adminActiveTab}
        onAdminTabChange={setAdminActiveTab}
        dataManagementTab={dataManagementTab}
        onDataManagementTabChange={setDataManagementTab}
        contentManagementTab={contentManagementTab}
        onContentManagementTabChange={setContentManagementTab}
        onSessionUpdate={checkCurrentSession}
      />
    )
  }

  if (showUserManagement && isLoggedIn && currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          activeTab="admin"
          onTabChange={handleTabChange}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setShowLogin(true)}
          onLogoutClick={handleLogout}
          onProfileClick={() => setShowAdminProfile(true)}
          adminName={currentUser.full_name || currentUser.name || currentUser.email}
        />
        <main className="container mx-auto px-4 py-8">
          <UserManagement 
            currentUser={currentUser} 
            onProfileClick={() => setShowAdminProfile(true)}
            onUserUpdate={checkCurrentSession}
          />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {activeTab !== "faq" && (
        <Header
          activeTab={selectedIndicator ? selectedIndicator.sourcePage || activeTab : activeTab}
          onTabChange={handleTabChange}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setShowLogin(true)}
          onLogoutClick={handleLogout}
          onProfileClick={() => setShowAdminProfile(true)}
          adminName={currentUser?.full_name || currentUser?.name || currentUser?.email || ""}
        />
      )}
      <main className={activeTab === "faq" ? "" : "container mx-auto px-4 py-8 bg-background"}>{renderContent()}</main>
      {activeTab !== "faq" && <Footer />}
    </div>
  )
}

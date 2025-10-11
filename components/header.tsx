"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Leaf, BookOpen, Menu, X, Home, User, LogOut } from "lucide-react"
import Image from "next/image"

const navigationItems = [
  {
    id: "home",
    title: "Home",
    shortTitle: "Home",
    icon: Home,
    accentColor: "text-orange-600",
    hoverColor: "hover:text-orange-600",
    bgGradient: "from-orange-500 to-orange-600",
  },
  {
    id: "demografi",
    title: "Statistik Demografi dan Sosial",
    shortTitle: "Demografi & Sosial",
    icon: Users,
    accentColor: "text-orange-600",
    hoverColor: "hover:text-orange-600",
    bgGradient: "from-orange-500 to-orange-600",
  },
  {
    id: "ekonomi",
    title: "Statistik Ekonomi",
    shortTitle: "Ekonomi",
    icon: BarChart3,
    accentColor: "text-orange-600",
    hoverColor: "hover:text-orange-600",
    bgGradient: "from-orange-500 to-orange-600",
  },
  {
    id: "lingkungan",
    title: "Statistik Lingkungan Hidup & Multi-Domain",
    shortTitle: "Lingkungan & Multi-Domain",
    icon: Leaf,
    accentColor: "text-orange-600",
    hoverColor: "hover:text-orange-600",
    bgGradient: "from-orange-500 to-orange-600",
  },
  {
    id: "literasi",
    title: "Pojok Literasi Statistik",
    shortTitle: "Yuk Kepoin Statistik",
    icon: BookOpen,
    accentColor: "text-orange-600",
    hoverColor: "hover:text-orange-600",
    bgGradient: "from-orange-500 to-orange-600",
  },
]

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isLoggedIn?: boolean
  onLoginClick?: () => void
  onLogoutClick?: () => void
  onProfileClick?: () => void
  adminName?: string
}

export function Header({
  activeTab,
  onTabChange,
  isLoggedIn = false,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  adminName,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const isAdminPage = activeTab === "admin"
  const activeItem = navigationItems.find((item) => item.id === activeTab)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`bg-white backdrop-blur-lg border-b sticky top-0 z-50 transition-all duration-300 rounded-b-3xl shadow-sm ${
          isScrolled ? "shadow-lg border-gray-200" : "border-orange-100"
        }`}
      >
        {/* Top accent line */}
        <div
          className={`h-1 bg-gradient-to-r ${activeItem?.bgGradient || "from-orange-500 to-orange-600"} transition-all duration-500`}
        />

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Enhanced Logo and Brand */}
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onTabChange("home")}>
              <div className="relative">
                <div className="relative w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center border border-orange-200 group-hover:border-orange-300 transition-all duration-300 group-hover:scale-105">
                  <Image
                    src="/logo-bungo.png"
                    alt="Logo Kabupaten Bungo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-orange-700 transition-all duration-300 drop-shadow-sm">
                  BEDARO
                </h1>
                <p className="text-sm text-gray-700 group-hover:text-orange-700 transition-colors drop-shadow-sm">
                  BPS Kabupaten Bungo
                </p>
              </div>
            </div>

            {/* Enhanced Desktop Navigation */}
            {!isAdminPage && (
              <nav className="hidden lg:flex items-center bg-gray-50 backdrop-blur-sm rounded-full px-2 py-2 border border-gray-200 shadow-sm">
                {navigationItems.map((item) => {
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      className={`relative px-6 py-3 text-sm font-medium transition-all duration-300 rounded-full ${
                        isActive
                          ? `text-white shadow-lg bg-orange-600 hover:bg-orange-700 transform scale-105`
                          : `text-gray-800 hover:text-orange-800 hover:bg-orange-50 hover:shadow-sm`
                      }`}
                      onClick={() => onTabChange(item.id)}
                    >
                      <span className="relative z-10">{item.shortTitle}</span>
                    </button>
                  )
                })}
              </nav>
            )}

            {/* Enhanced User Actions */}
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <div 
                    className="hidden lg:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all duration-200"
                    onClick={onProfileClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onProfileClick?.()
                      }
                    }}
                  >
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{adminName}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogoutClick}
                    className="border-gray-300 text-gray-800 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300 bg-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={onLoginClick}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-medium"
                >
                  Login Admin
                </Button>
              )}

              {/* Enhanced Mobile Menu Button */}
              {!isAdminPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMobileMenuOpen(!mobileMenuOpen)
                  }}
                >
                  <div className="relative w-6 h-6">
                    <Menu
                      className={`absolute w-5 h-5 text-gray-700 transition-all duration-300 ${
                        mobileMenuOpen ? "opacity-0 rotate-180" : "opacity-100 rotate-0"
                      }`}
                    />
                    <X
                      className={`absolute w-5 h-5 text-gray-700 transition-all duration-300 ${
                        mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
                      }`}
                    />
                  </div>
                </Button>
              )}
            </div>
          </div>

          {/* Enhanced Mobile Navigation */}
          {!isAdminPage && (
            <div
              className={`lg:hidden transition-all duration-300 overflow-hidden ${
                mobileMenuOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
              }`}
            >
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col gap-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id
                    return (
                      <div
                        key={item.id}
                        className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                          isActive ? "shadow-lg" : "hover:shadow-md"
                        }`}
                      >
                        {isActive && <div className="absolute inset-0 bg-orange-600" />}
                        <button
                          className={`relative w-full h-14 px-6 flex items-center gap-4 text-left transition-all duration-300 ${
                            isActive ? "text-white" : `text-gray-800 hover:bg-orange-50 hover:text-orange-800`
                          }`}
                          onClick={() => {
                            onTabChange(item.id)
                            setMobileMenuOpen(false)
                          }}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isActive ? "bg-white/20 backdrop-blur-sm" : "bg-orange-100"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-orange-700"}`} />
                          </div>
                          <span className="font-medium">{item.title}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  )
}

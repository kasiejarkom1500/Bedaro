"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, ArrowLeft, Shield, User, LogOut, AlertTriangle } from "lucide-react"
import { login } from "@/lib/client-auth"
import apiClient from "@/lib/api-client"
import type { User as UserType } from "@/lib/types"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

interface LoginPageProps {
  onLogin: (user: UserType) => void
  onBack: () => void
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [existingSession, setExistingSession] = useState<{
    role: string;
    email: string;
  } | null>(null)

  useEffect(() => {
    // Check for existing session on page load
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is not expired
        if (payload.exp * 1000 > Date.now()) {
          setExistingSession({
            role: payload.role,
            email: payload.email
          });
        } else {
          // Token expired, clean up
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        // Invalid token, clean up
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }
    }
  };

  const handleExistingSessionLogout = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setExistingSession(null);
      
      toast({
        title: 'Logged out successfully',
        description: 'You can now login with a different admin account.',
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force cleanup even if API fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setExistingSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueSession = () => {
    // Get user data from localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        console.log('Continue session with user:', user);
        
        // Call onLogin to trigger proper navigation
        onLogin(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        
        // Fallback: create user object from existingSession
        if (existingSession) {
          const user = {
            email: existingSession.email,
            role: existingSession.role as "superadmin" | "admin_demografi" | "admin_ekonomi" | "admin_lingkungan" | "viewer",
            id: '',
            name: existingSession.email.split('@')[0],
            full_name: existingSession.email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          console.log('Fallback user object:', user);
          onLogin(user);
        }
      }
    } else {
      // Create user object from existingSession if localStorage is empty
      if (existingSession) {
        const user = {
          email: existingSession.email,
          role: existingSession.role as "superadmin" | "admin_demografi" | "admin_ekonomi" | "admin_lingkungan" | "viewer",
          id: '',
          name: existingSession.email.split('@')[0],
          full_name: existingSession.email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('Created user from session:', user);
        onLogin(user);
      }
    }
  };

  const getDashboardForRole = (role: string) => {
    switch (role) {
      case 'admin_demografi':
        return '/admin/demografi';
      case 'admin_ekonomi':
        return '/admin/ekonomi';
      case 'admin_lingkungan':
        return '/admin/lingkungan';
      default:
        return '/';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin_demografi':
        return 'Admin Demografi';
      case 'admin_ekonomi':
        return 'Admin Ekonomi';
      case 'admin_lingkungan':
        return 'Admin Lingkungan';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin_demografi':
        return 'bg-blue-500';
      case 'admin_ekonomi':
        return 'bg-green-500';
      case 'admin_lingkungan':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login({ email, password })

      if (!result.success) {
        setError(result.error || "Login gagal")
        return
      }

      if (result.user && result.token) {
        // Store token in localStorage
        localStorage.setItem("authToken", result.token)
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        
        // Set token in API client
        apiClient.setToken(result.token)
        
        onLogin(result.user)
      }
    } catch (error: any) {
      setError("Terjadi kesalahan saat login. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  // If existing session detected, show session management UI
  if (existingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="text-orange-700 hover:text-orange-800 hover:bg-orange-200/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </div>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                Active Session Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Session Info */}
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{existingSession.email}</p>
                      <Badge className={`${getRoleBadgeColor(existingSession.role)} text-white mt-1`}>
                        {getRoleDisplayName(existingSession.role)}
                      </Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Warning Message */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You are already logged in as {getRoleDisplayName(existingSession.role)}. 
                  To prevent conflicts, only one admin can be active per browser.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={handleContinueSession}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  disabled={isLoading}
                >
                  Continue with {getRoleDisplayName(existingSession.role)}
                </Button>
                
                <Button 
                  onClick={handleExistingSessionLogout}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoading ? 'Logging out...' : 'Logout & Switch Admin'}
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-600 text-center">
                To use a different admin account, logout first then login again.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button - Positioned at top */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="text-orange-700 hover:text-orange-800 hover:bg-orange-200/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>

        {/* Main Login Card */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            {/* Logo and Brand */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-2 shadow-lg">
                <Image
                  src="/logo-bungo.png"
                  alt="Logo Bungo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">BEDARO</h1>
                <p className="text-sm text-orange-600 font-medium">BPS Kabupaten Bungo</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-xl text-gray-900">Admin Login</CardTitle>
            </div>
            <CardDescription className="text-gray-600">
              Masuk ke panel admin untuk mengelola data statistik
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@bungo.go.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg transition-colors placeholder:opacity-30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg pr-11 transition-colors placeholder:opacity-30"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-orange-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </div>
                ) : (
                  "Masuk ke Admin Panel"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import type { User } from '@/lib/types'
import apiClient from '@/lib/api-client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  token?: string
  error?: string
}

// Client-side login function
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const result = await response.json()

    if (result.success && result.user && result.token) {
      // Store token and user in localStorage
      localStorage.setItem('authToken', result.token)
      localStorage.setItem('currentUser', JSON.stringify(result.user))
    }

    return result
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Terjadi kesalahan saat login'
    }
  }
}

// Check current session
export function checkSession(): User | null {
  try {
    if (typeof window === 'undefined') return null // Server-side check
    
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('currentUser')
    
    if (!token || !user) {
      return null
    }
    
    // Set token in API client if found
    apiClient.setToken(token)
    
    const userData = JSON.parse(user)
    return userData
  } catch (error) {
    console.error('Error checking session:', error)
    return null
  }
}

// Logout function
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    
    // Clear token from API client
    apiClient.setToken('')
  }
}

// Force clear all auth data (useful for debugging)
export function clearAuthData(): void {
  logout();
  // Also clear any other potential auth keys
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

// Get user functions for API calls
// Get current user profile
export async function getCurrentProfile(): Promise<User | null> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return null

    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    return result.user
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      return { success: false, error: 'Token tidak ditemukan' }
    }

    const response = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || 'Gagal mengubah password' }
    }

    return { success: true, message: result.message }
  } catch (error) {
    console.error('Error changing password:', error)
    return { success: false, error: 'Terjadi kesalahan saat mengubah password' }
  }
}

export async function updateProfile(profileData: {
  email?: string
  full_name?: string
  name?: string
}): Promise<User | null> {
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    })
    if (!response.ok) {
      throw new Error('Failed to update profile')
    }
    const result = await response.json()
    
    // Update localStorage with new user data
    if (result.user) {
      localStorage.setItem('currentUser', JSON.stringify(result.user))
    }
    
    return result.user
  } catch (error) {
    console.error('Error updating profile:', error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function createUser(userData: {
  email: string
  password: string
  name?: string
  full_name?: string
  role: User['role']
  department?: string
}): Promise<User> {
  const token = localStorage.getItem('authToken')
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    throw new Error('Failed to create user')
  }

  return await response.json()
}

export async function updateUser(id: string, userData: {
  email?: string
  name?: string
  full_name?: string
  role?: User['role']
  department?: string
  password?: string
}): Promise<User> {
  const token = localStorage.getItem('authToken')
  const response = await fetch('/api/users', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...userData }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update user')
  }

  return await response.json()
}

export async function deleteUser(id: string): Promise<void> {
  const token = localStorage.getItem('authToken')
  const response = await fetch('/api/users', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  })

  if (!response.ok) {
    throw new Error('Failed to delete user')
  }
}
import { useState, useEffect } from 'react'
import { getCurrentProfile, updateProfile } from '@/lib/client-auth'
import type { User } from '@/lib/types'

export function useProfile() {
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const profileData = await getCurrentProfile()
      setProfile(profileData)
    } catch (err) {
      setError('Failed to fetch profile')
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (data: {
    email?: string
    full_name?: string
    name?: string
  }) => {
    try {
      setError(null)
      
      const updatedProfile = await updateProfile(data)
      if (updatedProfile) {
        setProfile(updatedProfile)
        return { success: true, user: updatedProfile }
      } else {
        throw new Error('Update failed')
      }
    } catch (err) {
      const errorMessage = 'Failed to update profile'
      setError(errorMessage)
      console.error('Profile update error:', err)
      return { success: false, error: errorMessage }
    }
  }

  useEffect(() => {
    // Only fetch if we have a token
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  return {
    profile,
    loading,
    error,
    updateProfile: updateUserProfile,
    refetchProfile: fetchProfile
  }
}
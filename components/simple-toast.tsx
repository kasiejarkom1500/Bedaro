"use client"

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface SimpleToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
}

export function SimpleToast({ message, type, isVisible, onClose }: SimpleToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type]

  const bgColorInline = {
    success: '#10b981',
    error: '#ef4444', 
    info: '#3b82f6'
  }[type]

  return (
    <div 
      className={`fixed top-4 right-4 z-[99999] ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg max-w-md flex items-center justify-between transition-all duration-300 ease-in-out transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 99999,
        backgroundColor: bgColorInline,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        maxWidth: '28rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <div className="font-semibold">
          {type === 'error' ? '❌ Error' : type === 'success' ? '✅ Success' : 'ℹ️ Info'}
        </div>
        <div className="text-sm mt-1">{message}</div>
      </div>
      <button 
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook untuk menggunakan toast
export function useSimpleToast() {
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'info',
    isVisible: false
  })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log("🍞 SimpleToast showing:", message, type)
    setToast({
      message,
      type,
      isVisible: true
    })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  return {
    toast,
    showToast,
    hideToast
  }
}
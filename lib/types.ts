export interface User {
  id: string
  email: string
  full_name?: string
  name?: string // Compatibility with frontend mock
  role: "superadmin" | "admin_demografi" | "admin_ekonomi" | "admin_lingkungan" | "viewer"
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Indicator {
  id: string
  code?: string
  no?: number
  indikator: string
  name?: string // For compatibility
  kategori: 'Statistik Ekonomi' | 'Statistik Demografi & Sosial' | 'Statistik Lingkungan Hidup & Multi-Domain'
  subcategory?: string
  satuan: string
  unit?: string // For compatibility
  source?: string
  methodology?: string
  deskripsi?: string
  description?: string // For compatibility
  is_active: boolean
  period_type: 'yearly' | 'monthly' | 'quarterly' // New field for period type
  created_by?: string
  updated_by?: string
  category_id?: string
  created_at: string
  updated_at: string
  category_name?: string
  created_by_name?: string
  updated_by_name?: string
  category?: Category // When joined
  // Metadata fields for compatibility
  level?: string
  wilayah?: string
  periode?: string
  konsep_definisi?: string
  metode_perhitungan?: string
  interpretasi?: string
}

export interface IndicatorData {
  id: string
  indicator_id: string
  year: number
  period_month?: number // New field for monthly data (1-12)
  period_quarter?: number // New field for quarterly data (1-4)
  value: number
  notes?: string
  status: 'draft' | 'preliminary' | 'final'
  created_by: string
  created_at: string
  updated_at: string
  verified_by?: string
  verified_at?: string
  // Joined fields from indicator table
  indicator_name?: string
  subcategory?: string
  satuan?: string
  // Audit fields
  created_by_name?: string
  updated_by_name?: string
  verified_by_name?: string
  source_document?: string
  indicator?: Indicator // When joined
}

export interface IndicatorWithData extends Indicator {
  data: IndicatorData[]
}

export interface IndicatorMetadata {
  id?: string
  indicator_id?: string
  level?: string
  wilayah?: string
  periode?: string
  konsep_definisi?: string
  metode_perhitungan?: string
  interpretasi?: string
  created_at?: string
  updated_at?: string
}

export interface DataAuditLog {
  id: string
  indicator_data_id: string
  action: "create" | "update" | "delete"
  old_value?: number
  new_value?: number
  changed_by: string
  changed_at: string
}

export interface Article {
  id: string
  title: string
  content: string
  image?: string
  author: string
  duration: string
  tags: string[] // JSON array in database, parsed as string array
  sections: ArticleSection[] // Joined from article_sections table
  category: "demografi" | "ekonomi" | "lingkungan"
  author_id?: string
  is_published?: boolean // From database
  published_at: string
  views_count?: number // From database
  created_at: string
  updated_at: string
}

export interface ArticleSection {
  id: string
  title: string
  content: string
  order: number // Maps to order_number in database
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category: "demografi" | "ekonomi" | "lingkungan" | "umum"
  author_id?: string
  is_featured?: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  email: string
  phone: string
  full_name: string
  question: string
  article_id?: string
  category: "demografi" | "ekonomi" | "lingkungan" | "umum"
  status: "pending" | "answered" | "closed"
  answer?: string
  answered_by?: string
  answered_at?: string
  created_at: string
  updated_at: string
}

export interface ExcelImportData {
  [key: string]: any
}

// Period-related types
export type PeriodType = 'yearly' | 'monthly' | 'quarterly'

export interface PeriodFilter {
  type: PeriodType
  year?: number
  month?: number
  quarter?: number
}

// Helper types for forms
export interface InflationDataForm {
  indicator_id: string
  year: number
  period_month?: number  // Optional - bisa undefined
  period_quarter?: number  // Optional untuk quarterly indicators
  value: number
  notes?: string
}

export interface StandardDataForm {
  indicator_id: string
  year: number
  value: number
  notes?: string
}

// Utility functions (can be moved to separate utils file later)
export const formatPeriod = (year: number, month?: number, quarter?: number): string => {
  if (month) {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${monthNames[month - 1]} ${year}`
  }
  if (quarter) {
    return `Q${quarter} ${year}`
  }
  return year.toString()
}

export const isInflationIndicator = (indicator?: Indicator): boolean => {
  if (!indicator) return false
  return Boolean(
    indicator.indikator?.toLowerCase().includes('inflasi') || 
    indicator.name?.toLowerCase().includes('inflasi') ||
    indicator.indikator?.toLowerCase().includes('inflation') ||
    indicator.name?.toLowerCase().includes('inflation')
  )
}

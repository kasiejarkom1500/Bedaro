"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, TrendingUp, Save, X, AlertTriangle, FileText, Database, Info, CheckCircle2 } from "lucide-react"
import { SimpleToast, useSimpleToast } from "@/components/simple-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import type { Indicator, InflationDataForm } from "@/lib/types"

interface InflationDataFormProps {
  indicators: Indicator[]
  initialData?: InflationDataForm & { source_document?: string }
  onSubmit: (data: InflationDataForm & { source_document?: string }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function InflationDataForm({ 
  indicators, 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: InflationDataFormProps) {
  const [formData, setFormData] = useState<InflationDataForm & { source_document?: string }>({
    indicator_id: initialData?.indicator_id || '',
    year: initialData?.year || new Date().getFullYear(),
    period_month: initialData?.period_month || new Date().getMonth() + 1,
    value: initialData?.value || 0,
    notes: initialData?.notes || '',
    source_document: initialData?.source_document || ''
  })

  const [errors, setErrors] = useState<string[]>([])
  const { toast, showToast, hideToast } = useSimpleToast()
  
  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Get selected indicator details
  const selectedIndicator = indicators.find(ind => ind.id === formData.indicator_id)

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const validateForm = (): string[] => {
    const newErrors: string[] = []
    
    if (!formData.indicator_id || formData.indicator_id.trim() === '') {
      newErrors.push('Indikator inflasi wajib dipilih')
    }
    
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      newErrors.push('Tahun harus antara 2000 - 2100')
    }
    
    if (!formData.period_month || formData.period_month < 1 || formData.period_month > 12) {
      newErrors.push('Bulan harus dipilih (1-12)')
    }
    
    if (formData.value === null || formData.value === undefined || formData.value === 0) {
      newErrors.push('Nilai inflasi harus diisi dan tidak boleh 0')
    }
    
    if (typeof formData.value === 'number' && (formData.value < -100 || formData.value > 1000)) {
      newErrors.push('Nilai inflasi harus antara -100% hingga 1000%')
    }

    // Additional validation for notes length
    if (formData.notes && formData.notes.length > 500) {
      newErrors.push('Catatan tidak boleh lebih dari 500 karakter')
    }

    // Additional validation for source document length
    if (formData.source_document && formData.source_document.length > 200) {
      newErrors.push('Sumber dokumen tidak boleh lebih dari 200 karakter')
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setShowErrorModal(true) // Show error modal instead of toast
      return
    }

    setErrors([])
    try {
      await onSubmit(formData)
      setShowSuccessModal(true) // Show success modal
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data'
      setErrors([errorMessage])
      setShowErrorModal(true) // Show error modal for submission errors
    }
  }

  const updateField = (field: keyof (InflationDataForm & { source_document?: string }), value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors and hide modals when user starts typing
    if (errors.length > 0) {
      setErrors([])
      hideToast() // Hide any existing error toast
      setShowErrorModal(false) // Hide error modal
    }

    // Real-time validation for specific fields
    if (field === 'value' && value !== null && value !== undefined) {
      if (typeof value === 'number' && (value < -100 || value > 1000)) {
        showToast('⚠️ Nilai inflasi harus antara -100% hingga 1000%', 'error')
      }
    }

    if (field === 'notes' && value && value.length > 500) {
      showToast('📝 Catatan tidak boleh lebih dari 500 karakter', 'error')
    }

    if (field === 'source_document' && value && value.length > 200) {
      showToast('📄 Sumber dokumen tidak boleh lebih dari 200 karakter', 'error')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <SimpleToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      
      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Data Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Database className="h-5 w-5 text-orange-600" />
              </div>
              Data Utama
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Indicator Selection */}
            <div className="space-y-3">
              <Label htmlFor="indicator" className="text-sm font-semibold text-gray-700">
                Indikator Inflasi
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.indicator_id}
                onValueChange={(value) => updateField('indicator_id', value)}
              >
                <SelectTrigger className={`h-20 ${!formData.indicator_id && errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-orange-400 hover:border-gray-300'}`}>
                  <SelectValue placeholder="Pilih indikator inflasi yang akan diinput..." className="placeholder:opacity-30">
                    {selectedIndicator ? selectedIndicator.indikator : "Pilih indikator inflasi yang akan diinput..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {indicators.map((indicator) => (
                    <SelectItem key={indicator.id} value={indicator.id} className="py-4">
                      <div className="w-full">
                        <div className="font-medium text-gray-900 text-sm leading-tight">
                          {indicator.code ? `${indicator.code} - ` : ''}{indicator.indikator}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {indicator.kategori} • {indicator.satuan}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.indicator_id && errors.length > 0 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-6 h-6" />
                  Silakan pilih indikator inflasi
                </p>
              )}
            </div>

            <Separator />

            {/* Period Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="year" className="text-sm font-semibold text-gray-700">
                  Tahun
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => updateField('year', parseInt(e.target.value) || 0)}
                    placeholder="2024"
                    className={`pl-10 w-full h-11 text-center font-medium placeholder:opacity-30 ${!formData.year && errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-orange-400 hover:border-gray-300'}`}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="month" className="text-sm font-semibold text-gray-700">
                  Bulan
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.period_month?.toString() || ''}
                  onValueChange={(value) => updateField('period_month', parseInt(value))}
                >
                  <SelectTrigger className={`h-11 ${!formData.period_month && errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-orange-400 hover:border-gray-300'}`}>
                    <SelectValue placeholder="Pilih bulan..." className="placeholder:opacity-30" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{month}</span>
                          <span className="text-gray-500">({(index + 1).toString().padStart(2, '0')})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Value Input */}
            <div className="space-y-3">
              <Label htmlFor="value" className="text-sm font-semibold text-gray-700">
                Nilai Inflasi ({selectedIndicator?.satuan || 'Persen'})
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value || ''}
                  onChange={(e) => updateField('value', parseFloat(e.target.value) || 0)}
                  placeholder="masukkan nilai inflasi..."
                  className={`pl-5 pr-3 h-12 text-left font-medium placeholder:opacity-30 ${!formData.value && errors.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-orange-400 hover:border-gray-300'}`}
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Gunakan nilai negatif untuk deflasi (contoh: -1.25 untuk deflasi 1.25%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              Informasi Tambahan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Source Document */}
            <div className="space-y-3">
              <Label htmlFor="source_document" className="text-sm font-semibold text-gray-700">
                Dokumen Sumber
              </Label>
              <Input
                id="source_document"
                value={formData.source_document || ''}
                onChange={(e) => updateField('source_document', e.target.value)}
                placeholder="Contoh: BPS_Inflasi_Oktober_2024.pdf"
                className="h-11 border-gray-200 focus:border-blue-400 hover:border-gray-300 placeholder:opacity-30"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Nama file atau referensi dokumen sumber data
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                Catatan
              </Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Tambahkan catatan, keterangan khusus, atau informasi penting lainnya..."
                rows={4}
                className="border-gray-200 focus:border-blue-400 hover:border-gray-300 resize-none placeholder:opacity-30"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Informasi tambahan yang relevan dengan data inflasi ini
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none h-11 px-8 border-red-700 hover:bg-red-500 hover:text-white text-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 h-11 px-8 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Menyimpan...' : 'Simpan Data Inflasi'}
          </Button>
        </div>
      </form>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md">
          <div className="text-center p-4">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 mb-2">
                Data Belum Lengkap
              </DialogTitle>
              <DialogDescription className="text-gray-600 mb-4">
                Beberapa field wajib masih kosong
              </DialogDescription>
            </DialogHeader>
            
            <div className="text-left bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-3">Mohon lengkapi data berikut sebelum menyimpan:</p>
              <ol className="text-sm text-red-700 space-y-2">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-red-200 text-red-800 rounded-full flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span>{error.replace(/^[❌📅📆💹⚠️📝📄]\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </div>

            <DialogFooter>
              <Button 
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Saya Mengerti
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <div className="text-center p-4">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-600 mb-2">
                Data Berhasil Disimpan
              </DialogTitle>
              <DialogDescription className="text-gray-600 mb-4">
                Data inflasi telah berhasil ditambahkan ke sistem
              </DialogDescription>
            </DialogHeader>
            
            <div className="text-left bg-green-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Indikator:</span>
                  <span>{selectedIndicator?.indikator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Periode:</span>
                  <span>{monthNames[formData.period_month - 1]} {formData.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Nilai:</span>
                  <span className="font-semibold text-green-700">{formData.value}%</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={() => {
                  setShowSuccessModal(false)
                  onCancel() // Close the form and return to main page
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Kembali ke Daftar Data
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
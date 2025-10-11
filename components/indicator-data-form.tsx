import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreateIndicatorDataRequest, IndicatorData } from "@/lib/api-client";
import { useIndicators } from "@/hooks/use-data-management";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Calendar, Database } from "lucide-react";

// Helper functions for Indonesian number formatting
const formatNumberForDisplay = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20 // Allow up to 20 decimal places
  }).format(num);
};

const parseIndonesianNumber = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined;
  
  // Remove thousand separators (dots) and replace comma with dot for decimal
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleanValue);
  
  return isNaN(num) ? undefined : num;
};

interface IndicatorDataFormProps {
  initialData?: IndicatorData;
  category: string;
  onSubmit: (data: CreateIndicatorDataRequest) => Promise<void>;
  onCancel: () => void;
}

export function IndicatorDataForm({ initialData, category, onSubmit, onCancel }: IndicatorDataFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [showValidation, setShowValidation] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [duplicateError, setDuplicateError] = useState<string>('');
  const [displayValue, setDisplayValue] = useState<string>(''); // For formatted display
  const [formData, setFormData] = useState<CreateIndicatorDataRequest>({
    indicator_id: initialData?.indicator_id || '',
    year: initialData?.year || undefined,
    value: initialData?.value || undefined,
    status: initialData?.status || undefined,
    notes: initialData?.notes || '',
    source_document: initialData?.source_document || ''
  });

  // Initialize display value when component mounts or initialData changes
  useEffect(() => {
    if (initialData?.value !== undefined) {
      setDisplayValue(formatNumberForDisplay(initialData.value));
    }
  }, [initialData]);

  // Get available indicators for the category
  const { indicators: allIndicators } = useIndicators({ category, limit: 100 });
  
  // Filter out inflation indicators (exclude monthly/inflation-related indicators)
  // This ensures the annual data form only shows annual indicators, not monthly inflation indicators
  const indicators = allIndicators?.filter(indicator => {
    const code = indicator.code?.toLowerCase() || '';
    const name = indicator.indikator?.toLowerCase() || '';
    const subcategory = indicator.subcategory?.toLowerCase() || '';
    
    // Exclude indicators that are clearly inflation-related
    const inflationKeywords = [
      'inflasi', 'yoy', 'year-on-year', 'mom', 'month-on-month',
      'inflation', 'qtq', 'quarter-on-quarter'
    ];
    
    return !inflationKeywords.some(keyword => 
      code.includes(keyword) || 
      name.includes(keyword) || 
      subcategory.includes(keyword)
    );
  }) || [];

  const validateForm = () => {
    const errors: string[] = [];
    
    // Validasi Indikator
    if (!formData.indicator_id || formData.indicator_id.trim() === '') {
      errors.push('Silakan pilih indikator yang akan diinput datanya');
    }
    
    // Validasi Tahun  
    if (!formData.year || isNaN(Number(formData.year))) {
      errors.push('Silakan masukkan tahun data yang valid');
    }
    
    // Validasi Nilai
    if (!formData.value || isNaN(Number(formData.value))) {
      errors.push('Silakan masukkan nilai data yang valid');
    }
    
    // Validasi Status
    if (!formData.status || formData.status.trim() === '') {
      errors.push('Silakan pilih status data (Draft/Final)');
    }
    
    return errors;
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aktifkan tampilan validasi setelah user mencoba submit
    setShowValidation(true);
    
    // Validasi form
    const errors = validateForm();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowErrorDialog(true);
      return;
    }
    
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error: any) {
      // Check if it's a duplicate error (409)
      if (error?.status === 409 || error?.message?.includes('already exists')) {
        setDuplicateError(error.message || `Data untuk tahun ${formData.year} sudah ada pada indikator ini`);
        setShowDuplicateDialog(true);
      } else {
        // Other errors handled by parent component
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CreateIndicatorDataRequest, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Parse and update actual value for database
    const numericValue = parseIndonesianNumber(inputValue);
    updateField('value', numericValue);
  };

  const handleValueBlur = () => {
    // Format the display value when user leaves the field
    if (formData.value !== undefined) {
      setDisplayValue(formatNumberForDisplay(formData.value));
    }
  };

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 21 }, 
    (_, i) => currentYear - 10 + i
  ).reverse();

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Data Section */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            Data Wajib
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Indikator */}
            <div className="space-y-3 min-w-0">
              <Label htmlFor="indicator_id" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Indikator 
                <span className="text-red-500 text-xs">*wajib</span>
              </Label>
              <Select
                value={formData.indicator_id}
                onValueChange={(value) => updateField('indicator_id', value)}
              >
                <SelectTrigger className={`h-11 w-full min-w-0 relative z-10 ${showValidation && !formData.indicator_id ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-300 focus:border-orange-400'}`}>
                  <SelectValue placeholder="Pilih indikator..." className="text-gray-500 truncate block overflow-hidden placeholder:opacity-30" />
                </SelectTrigger>
                <SelectContent className="max-h-60 z-[100] bg-white border border-gray-200 shadow-lg w-full">
                  {indicators.map((indicator) => (
                    <SelectItem key={indicator.id} value={indicator.id} className="py-3 cursor-pointer hover:bg-gray-50">
                      <div className="w-full max-w-full overflow-hidden">
                        <div className="font-medium text-gray-900 text-sm leading-tight truncate">
                          {indicator.code ? `${indicator.code} - ` : ''}{indicator.indikator}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showValidation && !formData.indicator_id && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  Silakan pilih indikator
                </p>
              )}
            </div>

            {/* Tahun */}
            <div className="space-y-3 min-w-0">
              <Label htmlFor="year" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Tahun 
                <span className="text-red-500 text-xs">*wajib</span>
              </Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2100"
                placeholder="Contoh: 2024"
                value={formData.year || ''}
                onChange={(e) => updateField('year', e.target.value ? parseInt(e.target.value) : undefined)}
                className={`h-11 w-full placeholder:opacity-30 ${showValidation && !formData.year ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-300 focus:border-orange-400'}`}
                list="year-suggestions"
              />
              <datalist id="year-suggestions">
                {yearOptions.map((year) => (
                  <option key={year} value={year} />
                ))}
              </datalist>
              {showValidation && !formData.year && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  Silakan masukkan tahun
                </p>
              )}
            </div>

            {/* Nilai */}
            <div className="space-y-3 min-w-0">
              <Label htmlFor="value" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Nilai 
                <span className="text-red-500 text-xs">*wajib</span>
              </Label>
              <Input
                id="value"
                type="text"
                placeholder="Contoh: 1.234.567,89"
                value={displayValue}
                onChange={handleValueChange}
                onBlur={handleValueBlur}
                className={`h-11 w-full placeholder:opacity-30 ${showValidation && (!formData.value && formData.value !== 0) ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-300 focus:border-orange-400'}`}
              />
              <p className="text-xs text-gray-500">
                Gunakan titik (.) untuk pemisah ribuan dan koma (,) untuk desimal
              </p>
              {showValidation && (!formData.value && formData.value !== 0) && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  Silakan masukkan nilai data
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-3 min-w-0">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Status 
                <span className="text-red-500 text-xs">*wajib</span>
              </Label>
              <Select
                value={formData.status || ''}
                onValueChange={(value) => updateField('status', value)}
              >
                <SelectTrigger className={`h-11 w-full min-w-0 relative z-10 ${showValidation && !formData.status ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-300 focus:border-orange-400'}`}>
                  <SelectValue placeholder="Pilih status..." className="text-gray-700 text-left">
                    {formData.status === 'draft' && 'Draft'}
                    {formData.status === 'preliminary' && 'Preliminary'}
                    {formData.status === 'final' && 'Final'}
                    {!formData.status && <span className="text-gray-500 opacity-30">Pilih status...</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white border border-gray-200 shadow-lg w-full">
                  <SelectItem value="draft" className="py-3 cursor-pointer hover:bg-gray-50">
                    <div className="w-full max-w-full overflow-hidden text-left">
                      <div className="font-medium text-gray-900">Draft</div>
                      <div className="text-xs text-gray-500 mt-1">Data masih dalam tahap pengembangan</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="preliminary" className="py-3 cursor-pointer hover:bg-gray-50">
                    <div className="w-full max-w-full overflow-hidden text-left">
                      <div className="font-medium text-gray-900">Preliminary</div>
                      <div className="text-xs text-gray-500 mt-1">Data sementara, belum final</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="final" className="py-3 cursor-pointer hover:bg-gray-50">
                    <div className="w-full max-w-full overflow-hidden text-left">
                      <div className="font-medium text-gray-900">Final</div>
                      <div className="text-xs text-gray-500 mt-1">Data sudah final dan siap dipublikasi</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {showValidation && !formData.status && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  Silakan pilih status
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Informasi Tambahan
          </h3>
          
          <div className="space-y-6">
            {/* Dokumen Sumber */}
            <div className="space-y-3">
              <Label htmlFor="source_document" className="text-sm font-medium text-gray-700">
                Dokumen Sumber
              </Label>
              <Input
                id="source_document"
                placeholder="Contoh: BPS_2024_Survey_Hasil.pdf"
                value={formData.source_document}
                onChange={(e) => updateField('source_document', e.target.value)}
                className="h-11 border-gray-300 focus:border-blue-400 placeholder:opacity-30"
              />
              <p className="text-xs text-gray-500">
                Nama file atau referensi dokumen sumber data
              </p>
            </div>

            {/* Catatan */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Catatan
              </Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan atau keterangan khusus untuk data ini..."
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                className="border-gray-300 focus:border-blue-400 resize-none placeholder:opacity-30"
              />
              <p className="text-xs text-gray-500">
                Catatan atau penjelasan tambahan terkait data ini
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="px-8 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </div>
            ) : (
              initialData ? 'Perbarui Data' : 'Simpan Data'
            )}
          </Button>
        </div>
      </form>

      {/* Enhanced Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={() => setShowErrorDialog(false)}
          ></div>
          
          {/* Dialog Content */}
          <div className="relative z-[10000] w-full max-w-lg bg-white rounded-xl border shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">!</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Data Belum Lengkap</h3>
                  <p className="text-red-100 text-sm mt-1">
                    Beberapa field wajib masih kosong
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Mohon lengkapi data berikut sebelum menyimpan:
              </p>
              
              {/* Error List */}
              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400 mb-6">
                <ul className="space-y-3">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-600 font-medium text-xs">{index + 1}</span>
                      </div>
                      <span className="text-red-700 leading-relaxed">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowErrorDialog(false)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Saya Mengerti
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Data Confirmation Dialog */}
      {showDuplicateDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300"
            onClick={() => setShowDuplicateDialog(false)}
          ></div>
          
          {/* Dialog Content */}
          <div className="relative z-[10000] w-full max-w-lg bg-white rounded-xl border shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Data Duplikasi Terdeteksi</h3>
                  <p className="text-amber-100 text-sm mt-1">
                    Data untuk tahun ini sudah ada
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-400 mb-6">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium text-sm mb-2">
                      Data Sudah Tersedia
                    </p>
                    <p className="text-amber-700 text-sm leading-relaxed">
                      {duplicateError}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-medium text-sm mb-2">
                      Saran Tindakan
                    </p>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Pilih tahun yang berbeda untuk data baru</li>
                      <li>• Edit/update data yang sudah ada untuk tahun {formData.year}</li>
                      <li>• Periksa kembali data existing di tabel</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowDuplicateDialog(false)}
                  className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Pilih Tahun Lain
                </Button>
                <Button 
                  onClick={() => {
                    setShowDuplicateDialog(false);
                    onCancel(); // Close form and return to list to find existing data
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Lihat Data Existing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
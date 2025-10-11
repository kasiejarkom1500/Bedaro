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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, FileText, Settings } from "lucide-react";
import { CreateIndicatorRequest, Indicator } from "@/lib/api-client";

interface IndicatorMetadata {
  level?: string;
  wilayah?: string;
  periode?: string;
  konsep_definisi?: string;
  metode_perhitungan?: string;
  interpretasi?: string;
}

interface IndicatorFormProps {
  initialData?: Indicator & Partial<IndicatorMetadata>;
  defaultCategory: string;
  onSubmit: (data: CreateIndicatorRequest & Partial<IndicatorMetadata>) => Promise<void>;
  onCancel: () => void;
}

export function IndicatorForm({ initialData, defaultCategory, onSubmit, onCancel }: IndicatorFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Step 1: Data Inti Indikator
  const [indicatorData, setIndicatorData] = useState<CreateIndicatorRequest>({
    code: initialData?.code || '',
    no: 1,
    indikator: initialData?.indikator || '',
    kategori: (initialData?.kategori || defaultCategory) as any,
    subcategory: initialData?.subcategory || '',
    satuan: initialData?.satuan || '',
    source: initialData?.source || '',
    methodology: initialData?.methodology || '',
    deskripsi: initialData?.deskripsi || '',
    category_id: initialData?.category_id || ''
  });

  // Step 2: Metadata Indikator
  const [metadataData, setMetadataData] = useState<Partial<IndicatorMetadata>>({
    level: initialData?.level || 'Kabupaten',
    wilayah: initialData?.wilayah || 'Kabupaten Bungo',
    periode: initialData?.periode || 'Tahunan',
    konsep_definisi: initialData?.konsep_definisi || '',
    metode_perhitungan: initialData?.metode_perhitungan || '',
    interpretasi: initialData?.interpretasi || ''
  });

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setIndicatorData({
        code: initialData.code || '',
        no: 1,
        indikator: initialData.indikator || '',
        kategori: (initialData.kategori || defaultCategory) as any,
        subcategory: initialData.subcategory || '',
        satuan: initialData.satuan || '',
        source: initialData.source || '',
        methodology: initialData.methodology || '',
        deskripsi: initialData.deskripsi || '',
        category_id: initialData.category_id || ''
      });

      setMetadataData({
        level: initialData.level || 'Kabupaten',
        wilayah: initialData.wilayah || 'Kabupaten Bungo',
        periode: initialData.periode || 'Tahunan',
        konsep_definisi: initialData.konsep_definisi || '',
        metode_perhitungan: initialData.metode_perhitungan || '',
        interpretasi: initialData.interpretasi || ''
      });

      setCurrentStep(1);
      setTouchedFields({});
    } else {
      setIndicatorData({
        code: '',
        no: 1,
        indikator: '',
        kategori: defaultCategory as any,
        subcategory: '',
        satuan: '',
        source: '',
        methodology: '',
        deskripsi: '',
        category_id: ''
      });
      setMetadataData({
        level: 'Kabupaten',
        wilayah: 'Kabupaten Bungo',
        periode: 'Tahunan',
        konsep_definisi: '',
        metode_perhitungan: '',
        interpretasi: ''
      });
      setCurrentStep(1);
      setTouchedFields({});
    }
  }, [initialData, defaultCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentStep !== 2) {
      return false;
    }
    
    if (!indicatorData.code || !indicatorData.indikator || !indicatorData.satuan || !indicatorData.kategori || !indicatorData.subcategory || !indicatorData.deskripsi) {
      return false;
    }

    try {
      setLoading(true);
      await onSubmit({ ...indicatorData, ...metadataData });
    } catch (error) {
      // Error handled by parent component
    } finally {
      setLoading(false);
    }
  };

  const updateIndicatorField = (field: keyof CreateIndicatorRequest, value: string | number) => {
    setIndicatorData(prev => ({
      ...prev,
      [field]: value
    }));
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const updateMetadataField = (field: keyof IndicatorMetadata, value: string) => {
    setMetadataData(prev => ({
      ...prev,
      [field]: value
    }));
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const getSubcategoryOptions = (kategori: string) => {
    switch (kategori) {
      case 'Statistik Demografi & Sosial':
        return ['Kependudukan', 'Ketenagakerjaan', 'Kemiskinan'];
      case 'Statistik Ekonomi':
        return ['PDRB', 'PDRB PerKapita', 'Inflasi'];
      case 'Statistik Lingkungan Hidup & Multi-Domain':
        return ['Indeks Pembangunan', 'Gender'];
      default:
        return [];
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (currentStep === 1) {
      const requiredFields = ['code', 'indikator', 'kategori', 'subcategory', 'satuan', 'deskripsi'];
      const newTouchedFields = { ...touchedFields };
      requiredFields.forEach(field => {
        newTouchedFields[field] = true;
      });
      setTouchedFields(newTouchedFields);
      
      if (!indicatorData.code || !indicatorData.indikator || !indicatorData.satuan || !indicatorData.kategori || !indicatorData.subcategory || !indicatorData.deskripsi) {
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const isStep1Valid = indicatorData.code && indicatorData.indikator && indicatorData.satuan && indicatorData.kategori && indicatorData.subcategory && indicatorData.deskripsi;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Progress */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            currentStep === 1 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 1 ? 'bg-orange-600 text-white' : 'bg-gray-400 text-white'
            }`}>
              1
            </div>
            <span className="text-sm font-semibold">Data Inti</span>
          </div>
          <div className="w-12 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            currentStep === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 2 ? 'bg-orange-600 text-white' : 'bg-gray-400 text-white'
            }`}>
              2
            </div>
            <span className="text-sm font-semibold">Metadata</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Step 1: Data Inti Indikator */}
        {currentStep === 1 && (
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                Data Inti Indikator
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Masukkan informasi dasar terkait indikator yang akan dibuat.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kode Indikator */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="code" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Kode Indikator 
                    <span className="text-red-500 text-xs">*wajib</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="Contoh: EKO001"
                    value={indicatorData.code}
                    onChange={(e) => updateIndicatorField('code', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, code: true }))}
                    className={`h-12 w-full placeholder:opacity-30 transition-all ${
                      touchedFields.code && !indicatorData.code 
                        ? 'border-red-300 bg-red-50 focus:border-red-400' 
                        : 'border-gray-300 focus:border-orange-400 hover:border-orange-300'
                    }`}
                  />
                  {touchedFields.code && !indicatorData.code && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      Kode indikator wajib diisi
                    </p>
                  )}
                </div>

                {/* Nama Indikator */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="indikator" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Nama Indikator 
                    <span className="text-red-500 text-xs">*wajib</span>
                  </Label>
                  <Input
                    id="indikator"
                    placeholder="Masukkan nama indikator"
                    value={indicatorData.indikator}
                    onChange={(e) => updateIndicatorField('indikator', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, indikator: true }))}
                    className={`h-12 w-full placeholder:opacity-30 transition-all ${
                      touchedFields.indikator && !indicatorData.indikator 
                        ? 'border-red-300 bg-red-50 focus:border-red-400' 
                        : 'border-gray-300 focus:border-orange-400 hover:border-orange-300'
                    }`}
                  />
                  {touchedFields.indikator && !indicatorData.indikator && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      Nama indikator wajib diisi
                    </p>
                  )}
                </div>

                {/* Kategori */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="kategori" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Kategori 
                    <span className="text-red-500 text-xs">*wajib</span>
                  </Label>
                  <Select
                    value={indicatorData.kategori}
                    onValueChange={(value) => updateIndicatorField('kategori', value)}
                  >
                    <SelectTrigger className={`h-12 w-full min-w-0 transition-all ${
                      touchedFields.kategori && !indicatorData.kategori 
                        ? 'border-red-300 bg-red-50 focus:border-red-400' 
                        : 'border-gray-300 focus:border-orange-400 hover:border-orange-300'
                    }`}>
                      <SelectValue placeholder="Pilih kategori..." className="text-gray-500 placeholder:opacity-30" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[100] bg-white border border-gray-200 shadow-xl">
                      <SelectItem value="Statistik Demografi & Sosial" className="py-3 cursor-pointer hover:bg-gray-50">
                        Statistik Demografi & Sosial
                      </SelectItem>
                      <SelectItem value="Statistik Ekonomi" className="py-3 cursor-pointer hover:bg-gray-50">
                        Statistik Ekonomi
                      </SelectItem>
                      <SelectItem value="Statistik Lingkungan Hidup & Multi-Domain" className="py-3 cursor-pointer hover:bg-gray-50">
                        Statistik Lingkungan Hidup & Multi-Domain
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {touchedFields.kategori && !indicatorData.kategori && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      Kategori wajib dipilih
                    </p>
                  )}
                </div>

                {/* Sub Kategori */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="subcategory" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Sub Kategori 
                    <span className="text-red-500 text-xs">*wajib</span>
                  </Label>
                  <Select
                    value={indicatorData.subcategory}
                    onValueChange={(value) => updateIndicatorField('subcategory', value)}
                  >
                    <SelectTrigger className={`h-12 w-full min-w-0 transition-all ${
                      touchedFields.subcategory && !indicatorData.subcategory 
                        ? 'border-red-300 bg-red-50 focus:border-red-400' 
                        : 'border-gray-300 focus:border-orange-400 hover:border-orange-300'
                    }`}>
                      <SelectValue placeholder="Pilih sub kategori..." className="text-gray-500 placeholder:opacity-30" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 z-[100] bg-white border border-gray-200 shadow-xl">
                      {getSubcategoryOptions(indicatorData.kategori).map((subcat) => (
                        <SelectItem key={subcat} value={subcat} className="py-3 cursor-pointer hover:bg-gray-50">
                          {subcat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touchedFields.subcategory && !indicatorData.subcategory && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      Sub kategori wajib dipilih
                    </p>
                  )}
                </div>

                {/* Satuan */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="satuan" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Satuan 
                    <span className="text-red-500 text-xs">*wajib</span>
                  </Label>
                  <Input
                    id="satuan"
                    placeholder="Contoh: Persen, Rupiah, Jiwa"
                    value={indicatorData.satuan}
                    onChange={(e) => updateIndicatorField('satuan', e.target.value)}
                    onBlur={() => setTouchedFields(prev => ({ ...prev, satuan: true }))}
                    className={`h-12 w-full placeholder:opacity-30 transition-all ${
                      touchedFields.satuan && !indicatorData.satuan 
                        ? 'border-red-300 bg-red-50 focus:border-red-400' 
                        : 'border-gray-300 focus:border-orange-400 hover:border-orange-300'
                    }`}
                  />
                  {touchedFields.satuan && !indicatorData.satuan && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      Satuan wajib diisi
                    </p>
                  )}
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-3">
                <Label htmlFor="deskripsi" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  Deskripsi 
                  <span className="text-red-500 text-xs">*wajib</span>
                </Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Deskripsi singkat tentang indikator ini"
                  value={indicatorData.deskripsi}
                  onChange={(e) => updateIndicatorField('deskripsi', e.target.value)}
                  onBlur={() => setTouchedFields(prev => ({ ...prev, deskripsi: true }))}
                  rows={4}
                  className={`w-full placeholder:opacity-30 resize-none transition-all ${
                    touchedFields.deskripsi && !indicatorData.deskripsi 
                      ? 'border-red-300 bg-red-50 focus:border-red-400' 
                      : 'border-gray-300 focus:border-orange-400 hover:border-orange-300'
                  }`}
                />
                {touchedFields.deskripsi && !indicatorData.deskripsi && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    Deskripsi wajib diisi
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Metadata */}
        {currentStep === 2 && (
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                Metadata Indikator
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Informasi tambahan untuk melengkapi data indikator.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Level */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="level" className="text-sm font-semibold text-gray-700">
                    Level
                  </Label>
                  <Select
                    value={metadataData.level || 'Kabupaten'}
                    onValueChange={(value) => updateMetadataField('level', value)}
                  >
                    <SelectTrigger className="h-12 w-full min-w-0 border-gray-300 focus:border-orange-400 hover:border-orange-300">
                      <SelectValue placeholder="Pilih level..." />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-white border border-gray-200 shadow-xl">
                      <SelectItem value="Nasional" className="py-3 cursor-pointer hover:bg-gray-50">Nasional</SelectItem>
                      <SelectItem value="Provinsi" className="py-3 cursor-pointer hover:bg-gray-50">Provinsi</SelectItem>
                      <SelectItem value="Kabupaten" className="py-3 cursor-pointer hover:bg-gray-50">Kabupaten</SelectItem>
                      <SelectItem value="Kecamatan" className="py-3 cursor-pointer hover:bg-gray-50">Kecamatan</SelectItem>
                      <SelectItem value="Desa" className="py-3 cursor-pointer hover:bg-gray-50">Desa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Wilayah */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="wilayah" className="text-sm font-semibold text-gray-700">
                    Wilayah
                  </Label>
                  <Input
                    id="wilayah"
                    placeholder="Contoh: Kabupaten Bungo"
                    value={metadataData.wilayah || ''}
                    onChange={(e) => updateMetadataField('wilayah', e.target.value)}
                    className="h-12 w-full placeholder:opacity-30 border-gray-300 focus:border-orange-400 hover:border-orange-300"
                  />
                </div>

                {/* Periode */}
                <div className="space-y-3 min-w-0">
                  <Label htmlFor="periode" className="text-sm font-semibold text-gray-700">
                    Periode
                  </Label>
                  <Input
                    id="periode"
                    placeholder="Contoh: Tahunan, Bulanan, dll"
                    value={metadataData.periode || ''}
                    onChange={(e) => updateMetadataField('periode', e.target.value)}
                    className="h-12 w-full placeholder:opacity-30 border-gray-300 focus:border-orange-400 hover:border-orange-300"
                  />
                </div>
              </div>

              {/* Konsep & Definisi */}
              <div className="space-y-3">
                <Label htmlFor="konsep_definisi" className="text-sm font-semibold text-gray-700">
                  Konsep & Definisi
                </Label>
                <Textarea
                  id="konsep_definisi"
                  placeholder="Penjelasan konsep dan definisi indikator"
                  value={metadataData.konsep_definisi || ''}
                  onChange={(e) => updateMetadataField('konsep_definisi', e.target.value)}
                  rows={3}
                  className="w-full placeholder:opacity-30 resize-none border-gray-300 focus:border-orange-400 hover:border-orange-300"
                />
              </div>

              {/* Metode Perhitungan */}
              <div className="space-y-3">
                <Label htmlFor="metode_perhitungan" className="text-sm font-semibold text-gray-700">
                  Metode Perhitungan
                </Label>
                <Textarea
                  id="metode_perhitungan"
                  placeholder="Cara perhitungan indikator ini"
                  value={metadataData.metode_perhitungan || ''}
                  onChange={(e) => updateMetadataField('metode_perhitungan', e.target.value)}
                  rows={3}
                  className="w-full placeholder:opacity-30 resize-none border-gray-300 focus:border-orange-400 hover:border-orange-300"
                />
              </div>

              {/* Interpretasi */}
              <div className="space-y-3">
                <Label htmlFor="interpretasi" className="text-sm font-semibold text-gray-700">
                  Interpretasi
                </Label>
                <Textarea
                  id="interpretasi"
                  placeholder="Cara membaca dan memahami hasil indikator"
                  value={metadataData.interpretasi || ''}
                  onChange={(e) => updateMetadataField('interpretasi', e.target.value)}
                  rows={3}
                  className="w-full placeholder:opacity-30 resize-none border-gray-300 focus:border-orange-400 hover:border-orange-300"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Button>
            
            {currentStep === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
                className="px-6 py-2.5 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Sebelumnya
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {currentStep === 1 && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStep1Valid || loading}
                className="px-8 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 2 && (
              <Button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </div>
                ) : (
                  initialData ? 'Perbarui' : 'Simpan'
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
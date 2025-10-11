import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"

interface SimpleExportProps {
  category: string
  title?: string
  description?: string
  onAlert?: (type: "success" | "error", message: string) => void
}

export function SimpleExportComponent({ 
  category, 
  title = "Export Data", 
  description = "Download data dalam format Excel (.xlsx)",
  onAlert 
}: SimpleExportProps) {
  const [selectedExportType, setSelectedExportType] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!selectedExportType) {
      onAlert?.("error", "Pilih jenis data yang akan diekspor")
      return
    }

    try {
      setIsExporting(true)
      
      // For now, just show success without actual export
      // This is a simplified version for testing
      setTimeout(() => {
        onAlert?.("success", "Export berhasil (testing mode)")
        setIsExporting(false)
        setSelectedExportType("")
      }, 2000)
      
    } catch (error) {
      onAlert?.("error", "Gagal mengekspor data")
      setIsExporting(false)
    }
  }

  return (
    <Card className="border-0 shadow-md border border-orange-100">
      <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <FileSpreadsheet className="w-5 h-5" />
          {title} (Simplified)
        </CardTitle>
        <CardDescription className="text-orange-700">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Export Type Selection */}
        <div>
          <Label htmlFor="export-type" className="text-sm font-medium text-gray-700 mb-3 block">
            Pilih Jenis Data untuk Export
          </Label>
          <Select value={selectedExportType} onValueChange={setSelectedExportType}>
            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 h-12">
              <SelectValue placeholder="Pilih jenis data yang akan diekspor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2 py-1">
                  <Download className="w-4 h-4 text-orange-600" />
                  <span>Export Semua Data (Testing)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={!selectedExportType || isExporting}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed h-12 text-base font-medium"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Test Export (Simplified)
            </>
          )}
        </Button>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">
            🧪 Mode Testing: Component sederhana tanpa API call
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Gunakan ini jika ada masalah dengan component utama.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
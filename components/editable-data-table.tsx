"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Upload, Download, X, Check, Edit } from "lucide-react"
import type { IndicatorWithData } from "@/lib/types"
import { updateIndicatorData } from "@/lib/client-database"
import * as XLSX from "xlsx"

interface EditableDataTableProps {
  indicators: IndicatorWithData[]
  category: string
  onDataUpdate: () => void
}

interface EditingCell {
  indicatorId: string
  year: number
}

export function EditableDataTable({ indicators, category, onDataUpdate }: EditableDataTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState("")
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get all available years from the data
  useEffect(() => {
    const years = new Set<number>()
    indicators.forEach((indicator) => {
      indicator.data?.forEach((data) => {
        years.add(data.year)
      })
    })
    // Add current year and next few years for new data entry
    const currentYear = new Date().getFullYear()
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.add(i)
    }
    setAvailableYears(Array.from(years).sort())
  }, [indicators])

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleCellEdit = (indicatorId: string, year: number, currentValue?: number) => {
    setEditingCell({ indicatorId, year })
    setEditValue(currentValue?.toString() || "")
  }

  const handleSaveCell = async () => {
    if (!editingCell) return

    try {
      const numericValue = editValue === "" ? 0 : Number.parseFloat(editValue)
      await updateIndicatorData(editingCell.indicatorId, editingCell.year.toString(), numericValue)

      setEditingCell(null)
      setEditValue("")
      onDataUpdate()
      showAlert("success", "Data berhasil disimpan!")
    } catch (error) {
      console.error("Error saving data:", error)
      showAlert("error", "Gagal menyimpan data!")
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const addNewYear = () => {
    if (availableYears && availableYears.length > 0) {
      const newYear = Math.max(...availableYears) + 1
      setAvailableYears((prev) => [...prev, newYear].sort())
    } else {
      // If no years available, start with current year
      const currentYear = new Date().getFullYear()
      setAvailableYears([currentYear])
    }
  }

  const getCellValue = (indicator: IndicatorWithData, year: number): number | undefined => {
    return indicator.data?.find((d) => d.year === year)?.value
  }

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        // Process Excel data - expecting format similar to the spreadsheet
        // First row should contain years, first column should contain indicator names
        if (jsonData.length < 2) {
          showAlert("error", "Format Excel tidak valid!")
          return
        }

        const years = jsonData[0].slice(3) as number[] // Skip first 3 columns (No, Indikator, Kategori, Satuan)
        const processedData: { indicatorName: string; yearData: { year: number; value: number }[] }[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (row.length < 4) continue

          const indicatorName = row[1] as string
          if (!indicatorName) continue

          const yearData: { year: number; value: number }[] = []
          for (let j = 0; j < years.length; j++) {
            const year = years[j]
            const value = row[j + 4] // Skip first 4 columns
            if (year && value !== undefined && value !== null && value !== "") {
              yearData.push({ year: Number.parseInt(year.toString()), value: Number.parseFloat(value.toString()) })
            }
          }

          processedData.push({ indicatorName, yearData })
        }

        // Here you would typically save this data to the database
        console.log("Processed Excel data:", processedData)
        showAlert("success", `Berhasil memproses ${processedData.length} indikator dari Excel!`)
        setIsImportDialogOpen(false)
        onDataUpdate()
      } catch (error) {
        console.error("Error processing Excel file:", error)
        showAlert("error", "Gagal memproses file Excel!")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const exportToExcel = () => {
    const exportData = indicators.map((indicator, index) => {
      const row = {
        No: index + 1,
        Indikator: indicator.name,
        Kategori: indicator.category?.name || category,
        Satuan: indicator.unit,
      } as Record<string, any>

      (availableYears || []).forEach((year: number) => {
        const value = getCellValue(indicator, year)
        row[year.toString()] = value || ""
      })

      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, category)
    XLSX.writeFile(workbook, `${category}_${new Date().getFullYear()}.xlsx`)

    showAlert("success", "Data berhasil diekspor ke Excel!")
  }

  return (
    <div className="space-y-4">
      {alert && (
        <Alert variant={alert.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#333333]">Data {category}</CardTitle>
              <CardDescription className="text-[#555555]">
                Klik pada sel untuk mengedit data. Gunakan tombol + untuk menambah tahun baru.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={addNewYear}
                className="border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tahun
              </Button>
              <Button
                variant="outline"
                onClick={exportToExcel}
                className="border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Excel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-[#333333]">Import Data dari Excel</DialogTitle>
                    <DialogDescription className="text-[#555555]">
                      Upload file Excel dengan format: No, Indikator, Kategori, Satuan, [Tahun1], [Tahun2], ...
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelImport}
                      className="w-full p-2 border border-[#FF6B00]/30 rounded focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                    />
                    <div className="text-sm text-[#555555]">
                      <p>Format yang didukung: .xlsx, .xls</p>
                      <p>Pastikan struktur file sesuai dengan template yang digunakan.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsImportDialogOpen(false)}
                      className="border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
                    >
                      Batal
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#FF6B00]/20">
                  <TableHead className="w-12 text-[#333333] font-semibold">No</TableHead>
                  <TableHead className="min-w-[200px] text-[#333333] font-semibold">Indikator</TableHead>
                  <TableHead className="w-32 text-[#333333] font-semibold">Satuan</TableHead>
                  {(availableYears || []).map((year) => (
                    <TableHead key={year} className="w-24 text-center text-[#333333] font-semibold">
                      {year}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicators.map((indicator, index) => (
                  <TableRow key={indicator.id} className="border-b border-[#FF6B00]/10 hover:bg-[#FF6B00]/5">
                    <TableCell className="font-medium text-[#333333]">{index + 1}</TableCell>
                    <TableCell className="font-medium text-[#333333]">{indicator.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#FF6B00] text-[#FF6B00]">
                        {indicator.unit}
                      </Badge>
                    </TableCell>
                    {(availableYears || []).map((year) => {
                      const currentValue = getCellValue(indicator, year)
                      const isEditing = editingCell?.indicatorId === indicator.id && editingCell?.year === year

                      return (
                        <TableCell key={year} className="text-center p-1">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-20 h-8 text-center border-[#FF6B00]/30 focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                                type="number"
                                step="any"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveCell()
                                  if (e.key === "Escape") handleCancelEdit()
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveCell}
                                className="h-8 w-8 p-0 text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 p-0 text-[#555555] hover:bg-gray-100"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="min-h-[32px] flex items-center justify-center cursor-pointer hover:bg-[#FF6B00]/10 rounded px-2 group"
                              onClick={() => handleCellEdit(indicator.id, year, currentValue)}
                            >
                              {currentValue !== undefined ? (
                                <span className="text-[#333333]">{currentValue.toLocaleString("id-ID")}</span>
                              ) : (
                                <span className="text-[#555555]">-</span>
                              )}
                              <Edit className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 text-[#FF6B00]" />
                            </div>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

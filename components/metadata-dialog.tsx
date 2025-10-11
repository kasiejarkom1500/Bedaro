"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { IndicatorMetadata } from "@/lib/types"

interface MetadataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metadata?: IndicatorMetadata | null
  onSave: (metadata: Partial<IndicatorMetadata>) => void
  indicatorName: string
  readOnly?: boolean
}

export function MetadataDialog({
  open,
  onOpenChange,
  metadata,
  onSave,
  indicatorName,
  readOnly = false,
}: MetadataDialogProps) {
  const [formData, setFormData] = useState({
    level: "",
    wilayah: "",
    periode: "",
    konsep_definisi: "",
    metode_perhitungan: "",
    interpretasi: "",
  })

  const [expandedSections, setExpandedSections] = useState({
    konsep: false,
    metode: false,
    interpretasi: false,
  })

  useEffect(() => {
    if (metadata) {
      setFormData({
        level: metadata.level || "",
        wilayah: metadata.wilayah || "",
        periode: metadata.periode || "",
        konsep_definisi: metadata.konsep_definisi || "",
        metode_perhitungan: metadata.metode_perhitungan || "",
        interpretasi: metadata.interpretasi || "",
      })
    } else {
      // Set default values for new metadata
      setFormData({
        level: "Kabupaten",
        wilayah: "Kabupaten Bungo",
        periode: "Tahunan",
        konsep_definisi: "",
        metode_perhitungan: "",
        interpretasi: "",
      })
    }
  }, [metadata, open])

  const handleSave = () => {
    onSave(formData)
    onOpenChange(false)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{readOnly ? "Lihat Metadata Indikator" : "Metadata Indikator"}</DialogTitle>
          <DialogDescription>
            {readOnly ? "Melihat metadata untuk indikator" : "Kelola metadata untuk indikator"}: {indicatorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Metadata */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                placeholder="Kabupaten"
                disabled={readOnly}
              />
            </div>

            <div>
              <Label htmlFor="wilayah">Wilayah</Label>
              <Input
                id="wilayah"
                value={formData.wilayah}
                onChange={(e) => setFormData({ ...formData, wilayah: e.target.value })}
                placeholder="Kabupaten Bungo"
                disabled={readOnly}
              />
            </div>

            <div>
              <Label htmlFor="periode">Periode</Label>
              <Input
                id="periode"
                value={formData.periode}
                onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                placeholder="Tahunan"
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-4">
            <Collapsible open={expandedSections.konsep} onOpenChange={() => toggleSection("konsep")}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-medium">Konsep & Definisi</span>
                {expandedSections.konsep ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <Textarea
                  value={formData.konsep_definisi}
                  onChange={(e) => setFormData({ ...formData, konsep_definisi: e.target.value })}
                  placeholder="Masukkan konsep dan definisi indikator..."
                  rows={4}
                  disabled={readOnly}
                />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={expandedSections.metode} onOpenChange={() => toggleSection("metode")}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-medium">Metode Perhitungan</span>
                {expandedSections.metode ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <Textarea
                  value={formData.metode_perhitungan}
                  onChange={(e) => setFormData({ ...formData, metode_perhitungan: e.target.value })}
                  placeholder="Masukkan metode perhitungan indikator..."
                  rows={4}
                  disabled={readOnly}
                />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={expandedSections.interpretasi} onOpenChange={() => toggleSection("interpretasi")}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-medium">Interpretasi</span>
                {expandedSections.interpretasi ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <Textarea
                  value={formData.interpretasi}
                  onChange={(e) => setFormData({ ...formData, interpretasi: e.target.value })}
                  placeholder="Masukkan interpretasi indikator..."
                  rows={4}
                  disabled={readOnly}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? "Tutup" : "Batal"}
            </Button>
            {!readOnly && <Button onClick={handleSave}>Simpan Metadata</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

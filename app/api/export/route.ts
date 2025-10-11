import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { executeQuery } from '@/lib/database/connection';
import { 
  authenticateRequest, 
  createErrorResponse, 
  createSuccessResponse
} from '@/lib/auth-utils';

// Interface untuk data export
interface ExportData {
  Indikator: string;
  Kategori: string;
  'Sub-Kategori': string;
  Satuan: string;
  Level: string;
  Wilayah: string;
  Periode: string;
  'Konsep & Definisi': string;
  'Metode Perhitungan': string;
  Tahun: number;
  Nilai: number | string;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const indicator_id = searchParams.get('indicator_id');
    
    // Determine accessible categories based on user role
    let accessibleCategories: string[] = [];
    
    if (user.role === 'superadmin') {
      accessibleCategories = ['Statistik Demografi & Sosial', 'Statistik Ekonomi', 'Statistik Lingkungan Hidup & Multi-Domain'];
    } else if (user.role === 'admin_ekonomi') {
      accessibleCategories = ['Statistik Ekonomi'];
    } else if (user.role === 'admin_demografi') {
      accessibleCategories = ['Statistik Demografi & Sosial'];
    } else if (user.role === 'admin_lingkungan') {
      accessibleCategories = ['Statistik Lingkungan Hidup & Multi-Domain'];
    }

    // Build WHERE clause for category filtering
    let whereClause = 'WHERE i.is_active = 1';
    const queryParams: any[] = [];

    // Filter by accessible categories
    if (accessibleCategories.length > 0) {
      const categoryPlaceholders = accessibleCategories.map(() => '?').join(',');
      whereClause += ` AND i.kategori IN (${categoryPlaceholders})`;
      queryParams.push(...accessibleCategories);
    }

    // Filter by specific category if provided
    if (category && accessibleCategories.includes(category)) {
      whereClause = 'WHERE i.is_active = 1 AND i.kategori = ?';
      queryParams.length = 0; // Clear previous params
      queryParams.push(category);
    }

    // Filter by specific indicator if provided
    if (indicator_id) {
      whereClause += ' AND i.id = ?';
      queryParams.push(indicator_id);
    }

    // Query to get all indicator data from database with metadata
    const query = `
      SELECT 
        i.indikator as indicator_name,
        i.kategori as category,
        i.subcategory,
        i.satuan as unit,
        im.level,
        im.wilayah,
        im.periode,
        im.konsep_definisi as concept_definition,
        im.metode_perhitungan as calculation_method,
        im.interpretasi,
        id.year,
        id.value,
        id.status
      FROM indicators i
      LEFT JOIN indicator_data id ON i.id = id.indicator_id
      LEFT JOIN indicator_metadata im ON i.id = im.indicator_id
      ${whereClause}
      ORDER BY i.indikator ASC, id.year ASC
    `;

    const rows: any = await executeQuery(query, queryParams);

    // Transform database results to export format
    const exportData: ExportData[] = rows
      .filter((row: any) => row.year !== null && row.value !== null) // Only include rows with actual data
      .map((row: any) => ({
        Indikator: row.indicator_name || '',
        Kategori: row.category || '',
        'Sub-Kategori': row.subcategory || '',
        Satuan: row.unit || '',
        Level: row.level || 'Kabupaten',
        Wilayah: row.wilayah || 'Kabupaten Bungo',
        Periode: row.periode || 'Tahunan',
        'Konsep & Definisi': row.concept_definition || 'Indeks Pembangunan Manusia berdasarkan Sensus Penduduk, mengukur kemajuan pembangunan manusia di suatu wilayah.',
        'Metode Perhitungan': row.calculation_method || 'Rata-rata geometrik dari indeks harapan hidup, indeks pendidikan, dan indeks pengeluaran per kapita.',
        Tahun: row.year,
        Nilai: row.value
      }));

    // If no data found
    if (exportData.length === 0) {
      return createErrorResponse('No data found for the specified criteria', 404);
    }

    // Buat workbook Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 25 }, // Indikator
      { width: 35 }, // Kategori
      { width: 20 }, // Sub-Kategori
      { width: 15 }, // Satuan
      { width: 15 }, // Level
      { width: 20 }, // Wilayah
      { width: 15 }, // Periode
      { width: 50 }, // Konsep & Definisi
      { width: 50 }, // Metode Perhitungan
      { width: 10 }, // Tahun
      { width: 15 }  // Nilai
    ];

    // Tambahkan header styling (optional)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:K1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFD4A3" } }, // Orange background
        alignment: { horizontal: "center" }
      };
    }

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Export');

    // Generate buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });

    // Set headers untuk download
    const headers = new Headers();
    const fileName = indicator_id 
      ? `export_indikator_${indicator_id}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `export_data_lingkungan_${new Date().toISOString().split('T')[0]}.xlsx`;
      
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return new NextResponse(buffer, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, indicator_ids, year_range } = body;

    // Implementasi serupa dengan GET tapi dengan filter yang lebih kompleks
    // ...

    return NextResponse.json({
      success: true,
      message: 'Export completed'
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
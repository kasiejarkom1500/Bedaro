import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // Test query to see structure of both tables
    const testQuery = `
      SELECT 
        id.id,
        id.indicator_id,
        id.year,
        id.value,
        id.status,
        i.indikator,
        i.subcategory,
        i.satuan,
        i.kategori
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      WHERE i.kategori = 'Statistik Lingkungan Hidup & Multi-Domain'
      LIMIT 3
    `;
    
    const result = await executeQuery(testQuery);
    console.log('Updated table structure test:', result);

    return NextResponse.json({
      success: true,
      message: 'Table structure updated successfully',
      sample_data: result,
      columns_returned: [
        'Indikator (indicator_name)',
        'Sub Kategori (subcategory)', 
        'Tahun (year)',
        'Nilai (value)',
        'Satuan (satuan)',
        'Status (status)'
      ]
    });

  } catch (error) {
    console.error('Test table structure error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
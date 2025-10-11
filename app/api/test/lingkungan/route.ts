import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // Test specific query for admin_lingkungan category
    const categoryQuery = `
      SELECT 
        COUNT(*) as total_data_points,
        COUNT(DISTINCT id.indicator_id) as indicators_with_data,
        COUNT(DISTINCT id.year) as years_covered,
        MIN(id.year) as earliest_year,
        MAX(id.year) as latest_year,
        SUM(CASE WHEN id.status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN id.status = 'preliminary' THEN 1 ELSE 0 END) as preliminary_count,
        SUM(CASE WHEN id.status = 'final' THEN 1 ELSE 0 END) as final_count,
        SUM(CASE WHEN id.verified_by IS NOT NULL THEN 1 ELSE 0 END) as verified_count
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      WHERE i.kategori = 'Statistik Lingkungan Hidup & Multi-Domain'
    `;
    
    const categoryStats = await executeQuery(categoryQuery);
    console.log('Category stats:', categoryStats);

    // Get sample data for this category
    const sampleQuery = `
      SELECT id.*, i.indikator, i.kategori 
      FROM indicator_data id 
      JOIN indicators i ON id.indicator_id = i.id 
      WHERE i.kategori = 'Statistik Lingkungan Hidup & Multi-Domain'
      LIMIT 5
    `;
    
    const sampleData = await executeQuery(sampleQuery);
    console.log('Sample lingkungan data:', sampleData);

    return NextResponse.json({
      success: true,
      data: {
        category_stats: categoryStats,
        sample_data: sampleData
      }
    });

  } catch (error) {
    console.error('Test lingkungan error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
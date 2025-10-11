import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const testResult = await executeQuery('SELECT 1 as test');
    console.log('Database connection test:', testResult);

    // Check if indicator_data table has data
    const dataCount = await executeQuery('SELECT COUNT(*) as count FROM indicator_data');
    console.log('Indicator data count:', dataCount);

    // Check status distribution
    const statusStats = await executeQuery(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN verified_by IS NOT NULL THEN 1 END) as verified_count
      FROM indicator_data 
      GROUP BY status
    `);
    console.log('Status distribution:', statusStats);

    // Get sample data
    const sampleData = await executeQuery(`
      SELECT id.*, i.indikator, i.kategori 
      FROM indicator_data id 
      JOIN indicators i ON id.indicator_id = i.id 
      LIMIT 5
    `);
    console.log('Sample data:', sampleData);

    return NextResponse.json({
      success: true,
      data: {
        connection_test: testResult,
        data_count: dataCount,
        status_stats: statusStats,
        sample_data: sampleData
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
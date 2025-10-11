import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth-utils';

// GET /api/public/indicators/[id] - Get specific indicator with all its data
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const indicatorId = params.id;

    // Get indicator details with metadata
    const indicatorQuery = `
      SELECT 
        i.id,
        i.code,
        i.no,
        i.indikator,
        i.deskripsi,
        i.satuan,
        i.kategori,
        i.subcategory,
        i.is_active,
        i.updated_at,
        im.level,
        im.wilayah,
        im.periode,
        im.konsep_definisi,
        im.metode_perhitungan,
        im.interpretasi,
        im.unit_description,
        im.data_quality_notes,
        im.last_updated_by,
        im.sumber_data
      FROM indicators i
      LEFT JOIN indicator_metadata im ON i.id = im.indicator_id
      WHERE i.id = ? AND i.is_active = 1
    `;

    const indicatorRows: any = await executeQuery(indicatorQuery, [indicatorId]);

    if (indicatorRows.length === 0) {
      return createErrorResponse('Indicator not found or inactive', 404);
    }

    const indicator = indicatorRows[0];

    // Get all indicator data (including draft/preliminary for context, but mark final only for public)
    const dataQuery = `
      SELECT 
        id.id,
        id.year,
        id.period_month,
        id.period_quarter,
        id.value,
        id.status,
        id.notes,
        id.updated_at
      FROM indicator_data id
      WHERE id.indicator_id = ?
      ORDER BY id.year ASC, id.period_month ASC, id.period_quarter ASC
    `;

    const dataRows: any = await executeQuery(dataQuery, [indicatorId]);

    // Separate final data for public display and all data for statistics
    const finalData = dataRows.filter((row: any) => row.status === 'final');
    const allData = dataRows;

    // Calculate statistics and trends
    let statistics = {
      latestValue: null as number | null,
      latestYear: null as number | null,
      previousValue: null as number | null,
      previousYear: null as number | null,
      changePercent: null as number | null,
      changeDirection: null as 'increase' | 'decrease' | 'stable' | null,
      lastUpdated: null as string | null,
      totalDataPoints: finalData.length,
      earliestYear: null as number | null,
      averageValue: null as number | null,
      maxValue: null as number | null,
      minValue: null as number | null,
      dataRange: null as number | null
    };

    if (finalData.length > 0) {
      // Sort by year desc and period_month desc to get latest first
      const sortedData = [...finalData].sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year; // Sort by year descending
        }
        // If years are same, sort by period_month descending (latest month first)
        if (a.period_month && b.period_month) {
          return b.period_month - a.period_month;
        }
        // If no period_month (yearly data), keep original order
        return 0;
      });
      
      statistics.latestValue = sortedData[0].value;
      statistics.latestYear = sortedData[0].year;
      statistics.lastUpdated = sortedData[0].updated_at;
      
      // For earliest year, get the first data point chronologically
      const chronologicalData = [...finalData].sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year; // Sort by year ascending
        }
        // If years are same, sort by period_month ascending (earliest month first)
        if (a.period_month && b.period_month) {
          return a.period_month - b.period_month;
        }
        return 0;
      });
      statistics.earliestYear = chronologicalData[0].year;
      
      // Calculate average, max, min
      const values = finalData.map((d: any) => d.value);
      statistics.averageValue = parseFloat((values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2));
      statistics.maxValue = Math.max(...values);
      statistics.minValue = Math.min(...values);
      statistics.dataRange = (statistics.latestYear && statistics.earliestYear) ? statistics.latestYear - statistics.earliestYear : null;
      
      if (sortedData.length > 1) {
        statistics.previousValue = sortedData[1].value;
        statistics.previousYear = sortedData[1].year;
        
        if (statistics.previousValue && statistics.previousValue !== 0 && statistics.latestValue !== null) {
          const change = ((statistics.latestValue - statistics.previousValue) / statistics.previousValue) * 100;
          statistics.changePercent = parseFloat(change.toFixed(2));
          
          if (Math.abs(change) < 0.01) {
            statistics.changeDirection = 'stable';
          } else if (change > 0) {
            statistics.changeDirection = 'increase';
          } else {
            statistics.changeDirection = 'decrease';
          }
        }
      }
    }

    // Calculate year-over-year or period-over-period changes for table display
    const dataWithChanges: any[] = [];
    
    // Sort data chronologically for proper change calculation
    const chronologicalData = [...finalData].sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year; // Sort by year ascending
      }
      // If years are same, sort by period_month ascending
      if (a.period_month && b.period_month) {
        return a.period_month - b.period_month;
      }
      return 0;
    });
    
    chronologicalData.forEach((current: any, index: number) => {
      let changePercent = null;
      let changeValue = null;
      
      if (index > 0) {
        const previous = chronologicalData[index - 1];
        changeValue = current.value - previous.value;
        if (previous.value !== 0) {
          changePercent = parseFloat(((changeValue / previous.value) * 100).toFixed(2));
        }
      }
      
      dataWithChanges.push({
        ...current,
        changePercent,
        changeValue: changeValue ? parseFloat(changeValue.toFixed(2)) : null
      });
    });

    // Get most recent update from any data point
    const mostRecentUpdate = allData.length > 0 
      ? allData.reduce((latest: any, current: any) => 
          new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
        ).updated_at
      : indicator.updated_at;

    const result = {
      id: indicator.id,
      code: indicator.code,
      no: indicator.no,
      indikator: indicator.indikator,
      deskripsi: indicator.deskripsi,
      satuan: indicator.satuan,
      kategori: indicator.kategori,
      subcategory: indicator.subcategory,
      lastUpdated: mostRecentUpdate,
      metadata: {
        level: indicator.level,
        wilayah: indicator.wilayah,
        periode: indicator.periode,
        konsep_definisi: indicator.konsep_definisi,
        metode_perhitungan: indicator.metode_perhitungan,
        interpretasi: indicator.interpretasi,
        unit_description: indicator.unit_description,
        data_quality_notes: indicator.data_quality_notes,
        sumber_data: indicator.sumber_data
      },
      data: dataWithChanges,
      statistics
    };

    return createSuccessResponse(result);

  } catch (error) {
    console.error('GET public indicator detail error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
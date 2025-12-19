import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth-utils';

// GET /api/public/indicators - Get active indicators with their data for public display
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const subcategory = url.searchParams.get('subcategory');
    const includeData = url.searchParams.get('includeData') === 'true';

    // Build query for active indicators only
    let whereClause = 'WHERE i.is_active = 1';
    const queryParams: any[] = [];

    // Filter by category
    if (category) {
      whereClause += ' AND i.kategori = ?';
      queryParams.push(category);
    }

    // Filter by subcategory
    if (subcategory) {
      whereClause += ' AND i.subcategory = ?';
      queryParams.push(subcategory);
    }

    // Get indicators with metadata
    const query = `
      SELECT 
        i.id,
        i.code,
        i.no,
        i.indikator,
        i.deskripsi,
        i.satuan,
        i.kategori,
        i.subcategory,
        i.period_type,
        i.updated_at,
        im.level,
        im.wilayah,
        im.periode,
        im.konsep_definisi,
        im.metode_perhitungan,
        im.interpretasi
      FROM indicators i
      LEFT JOIN indicator_metadata im ON i.id = im.indicator_id
      ${whereClause}
      ORDER BY i.kategori, i.subcategory, i.no ASC
    `;

    const indicators: any = await executeQuery(query, queryParams);

    let result: any[] = indicators.map((row: any) => ({
      id: row.id,
      code: row.code,
      no: row.no,
      indikator: row.indikator,
      deskripsi: row.deskripsi,
      satuan: row.satuan,
      kategori: row.kategori,
      subcategory: row.subcategory,
      updated_at: row.updated_at,
      metadata: {
        level: row.level,
        wilayah: row.wilayah,
        periode: row.periode,
        konsep_definisi: row.konsep_definisi,
        metode_perhitungan: row.metode_perhitungan,
        interpretasi: row.interpretasi
      }
    }));

    // Include data if requested
    if (includeData && result.length > 0) {
      const indicatorIds = result.map(ind => ind.id);
      
      // Get indicator data for all years, sorted by year
      const dataQuery = `
        SELECT 
          id.indicator_id,
          id.year,
          id.value,
          id.status,
          id.updated_at
        FROM indicator_data id
        WHERE id.indicator_id IN (${indicatorIds.map(() => '?').join(',')})
        AND id.status = 'final'
        ORDER BY id.indicator_id, id.year ASC
      `;

      const dataRows: any = await executeQuery(dataQuery, indicatorIds);

      // Group data by indicator_id
      const dataByIndicator = dataRows.reduce((acc: any, row: any) => {
        if (!acc[row.indicator_id]) {
          acc[row.indicator_id] = [];
        }
        acc[row.indicator_id].push({
          year: row.year,
          value: row.value,
          status: row.status,
          updated_at: row.updated_at
        });
        return acc;
      }, {});

      // Add data to each indicator and calculate statistics
      result = result.map(indicator => {
        const data = dataByIndicator[indicator.id] || [];
        
        // Calculate latest value and change
        let latestValue = null;
        let previousValue = null;
        let changePercent = null;
        let lastUpdated = null;

        if (data.length > 0) {
          // Sort by year desc to get latest first
          const sortedData = [...data].sort((a, b) => b.year - a.year);
          latestValue = sortedData[0];
          lastUpdated = sortedData[0].updated_at;
          
          if (sortedData.length > 1) {
            previousValue = sortedData[1];
            if (previousValue.value && previousValue.value !== 0) {
              changePercent = ((latestValue.value - previousValue.value) / previousValue.value) * 100;
            }
          }
        }

        return {
          ...indicator,
          data,
          statistics: {
            latestValue: latestValue ? latestValue.value : null,
            latestYear: latestValue ? latestValue.year : null,
            previousValue: previousValue ? previousValue.value : null,
            previousYear: previousValue ? previousValue.year : null,
            changePercent: changePercent ? parseFloat(changePercent.toFixed(2)) : null,
            lastUpdated,
            totalDataPoints: data.length
          }
        };
      });
    }

    // Group by category and subcategory for easier frontend consumption
    const groupedData = result.reduce((acc: any, indicator: any) => {
      const category = indicator.kategori;
      const subcategory = indicator.subcategory || 'Lainnya';
      
      if (!acc[category]) {
        acc[category] = {};
      }
      if (!acc[category][subcategory]) {
        acc[category][subcategory] = [];
      }
      
      acc[category][subcategory].push(indicator);
      return acc;
    }, {});

    return createSuccessResponse({
      indicators: result,
      grouped: groupedData,
      metadata: {
        total_indicators: result.length,
        categories: Object.keys(groupedData),
        include_data: includeData
      }
    });

  } catch (error) {
    console.error('GET public indicators error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { 
  createErrorResponse, 
  createSuccessResponse,
  parseQueryParams
} from '@/lib/auth-utils';

// GET /api/public/indicator-data - Get indicator data for public use (no authentication required)
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { page, limit, search, category } = parseQueryParams(request);
    const subcategory = request.nextUrl.searchParams.get('subcategory');
    const status = request.nextUrl.searchParams.get('status');
    const year = request.nextUrl.searchParams.get('year');
    const month = request.nextUrl.searchParams.get('month');
    const quarter = request.nextUrl.searchParams.get('quarter');

    // Build query
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    // Filter by category
    if (category) {
      whereClause += ' AND i.kategori = ?';
      queryParams.push(category);
    }

    // Add subcategory filter
    if (subcategory) {
      whereClause += ' AND i.subcategory = ?';
      queryParams.push(subcategory);
    }

    // Add status filter - only show final status for public
    whereClause += ' AND id.status = ?';
    queryParams.push('final');

    // Add year filter
    if (year) {
      whereClause += ' AND id.year = ?';
      queryParams.push(parseInt(year));
    }

    // Add month filter
    if (month) {
      whereClause += ' AND id.period_month = ?';
      queryParams.push(parseInt(month));
    }

    // Add quarter filter
    if (quarter) {
      whereClause += ' AND id.period_quarter = ?';
      queryParams.push(parseInt(quarter));
    }

    // Add search filter
    if (search) {
      whereClause += ' AND (i.indikator LIKE ? OR i.deskripsi LIKE ? OR i.code LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      ${whereClause}
    `;
    
    const countResult: any = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Calculate pagination using safe numeric values to avoid prepared statement issues with LIMIT/OFFSET
    const normalizedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 10, 100));
    const normalizedOffset = Math.max(0, (page - 1) * normalizedLimit);

    // Get indicator data with indicator info
    const query = `
      SELECT 
        id.id,
        id.indicator_id,
        id.year,
        id.period_month,
        id.period_quarter,
        id.value,
        id.status,
        id.notes,
        id.source_document,
        id.created_at,
        id.updated_at,
        i.code as indicator_code,
        i.indikator as indicator_name,
        i.subcategory,
        i.satuan,
        i.kategori,
        i.deskripsi,
        i.period_type
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      ${whereClause}
      ORDER BY id.year DESC, id.period_month DESC, id.period_quarter DESC, i.indikator ASC
      LIMIT ${normalizedLimit} OFFSET ${normalizedOffset}
    `;

    const rows: any = await executeQuery(query, queryParams);

    const indicatorData = rows.map((row: any) => ({
      id: row.id,
      indicator_id: row.indicator_id,
      year: row.year,
      period_month: row.period_month,
      period_quarter: row.period_quarter,
      value: row.value,
      status: row.status,
      notes: row.notes,
      source_document: row.source_document,
      created_at: row.created_at,
      updated_at: row.updated_at,
      indicator_code: row.indicator_code,
      indicator_name: row.indicator_name,
      subcategory: row.subcategory,
      satuan: row.satuan,
      kategori: row.kategori,
      deskripsi: row.deskripsi,
      period_type: row.period_type
    }));

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_data_points,
        COUNT(DISTINCT id.indicator_id) as indicators_with_data,
        COUNT(DISTINCT id.year) as years_covered,
        MIN(id.year) as earliest_year,
        MAX(id.year) as latest_year
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      ${whereClause}
    `;
    
    // Use parameters without search params for stats (remove search filter parameters)
    let statsParams = [...queryParams];
    if (search) {
      // Remove the last three parameters (search like parameters)
      statsParams = statsParams.slice(0, -3);
    }
    
    const statsResult: any = await executeQuery(statsQuery, statsParams);
    const stats = statsResult[0];

    // Get available years
    const yearsQuery = `
      SELECT DISTINCT id.year 
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      ${whereClause}
      ORDER BY id.year DESC
    `;
    
    const yearsResult: any = await executeQuery(yearsQuery, statsParams);
    const availableYears = yearsResult.map((row: any) => row.year);

    return createSuccessResponse({
      data: indicatorData,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / normalizedLimit),
        total_items: total,
        items_per_page: normalizedLimit
      },
      statistics: stats,
      available_years: availableYears,
      category: category || 'all',
      filters_applied: {
        category,
        subcategory,
        year,
        month,
        quarter,
        search,
        status: 'final'
      }
    });

  } catch (error) {
    console.error('GET public/indicator-data error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

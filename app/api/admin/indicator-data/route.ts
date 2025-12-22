import { NextRequest } from 'next/server';
import { executeQuery, executeTransaction } from '@/lib/database/connection';
import { 
  authenticateRequest, 
  createErrorResponse, 
  createSuccessResponse,
  parseQueryParams,
  validateRequestBody,
  logActivity
} from '@/lib/auth-utils';
import { IndicatorData } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface CreateIndicatorDataRequest {
  indicator_id: string;
  year: number;
  period_month?: number; // For monthly data (1-12)
  period_quarter?: number; // For quarterly data (1-4)
  value: number;
  status?: 'draft' | 'preliminary' | 'final';
  notes?: string;
  source_document?: string;
}

interface UpdateIndicatorDataRequest {
  value?: number;
  status?: 'draft' | 'preliminary' | 'final';
  notes?: string;
  source_document?: string;
  period_month?: number;
  period_quarter?: number;
}

// GET /api/admin/indicator-data - Get indicator data with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const indicator_id = url.searchParams.get('indicator_id');
    const indicator_name = url.searchParams.get('indicator_name');
    const year = url.searchParams.get('year');
    const period_month = url.searchParams.get('period_month');
    const period_quarter = url.searchParams.get('period_quarter');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const category = url.searchParams.get('category');
    const excludeSubcategory = url.searchParams.get('excludeSubcategory');

    // Build query with role-based filtering
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    // Filter by category based on user role
    if (user.role === 'admin_demografi') {
      whereClause += ' AND i.kategori = ?';
      queryParams.push('Statistik Demografi & Sosial');
    } else if (user.role === 'admin_ekonomi') {
      whereClause += ' AND i.kategori = ?';
      queryParams.push('Statistik Ekonomi');
    } else if (user.role === 'admin_lingkungan') {
      whereClause += ' AND i.kategori = ?';
      queryParams.push('Statistik Lingkungan Hidup & Multi-Domain');
    } else if (category) {
      whereClause += ' AND i.kategori = ?';
      queryParams.push(category);
    }

    // Filter by specific indicator
    if (indicator_id) {
      whereClause += ' AND id.indicator_id = ?';
      queryParams.push(indicator_id);
    }

    // Filter by indicator name
    if (indicator_name) {
      whereClause += ' AND i.indikator = ?';
      queryParams.push(indicator_name);
    }

    // Exclude specific subcategory
    if (excludeSubcategory) {
      whereClause += ' AND (i.subcategory != ? OR i.subcategory IS NULL)';
      queryParams.push(excludeSubcategory);
    }

    // Filter by year
    if (year) {
      whereClause += ' AND id.year = ?';
      queryParams.push(parseInt(year));
    }

    // Filter by month
    if (period_month) {
      whereClause += ' AND id.period_month = ?';
      queryParams.push(parseInt(period_month));
    }

    // Filter by quarter
    if (period_quarter) {
      whereClause += ' AND id.period_quarter = ?';
      queryParams.push(parseInt(period_quarter));
    }

    // Filter by status
    if (status) {
      whereClause += ' AND id.status = ?';
      queryParams.push(status);
    }

    // Filter by search term
    if (search) {
      whereClause += ' AND (i.indikator LIKE ? OR i.code LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      LEFT JOIN users u_created ON id.created_by = u_created.id
      LEFT JOIN users u_verified ON id.verified_by = u_verified.id
      ${whereClause}
    `;
    
    const countResult: any = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

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
        id.verified_by,
        id.verified_at,
        id.created_by,
        id.created_at,
        id.updated_at,
        i.code as indicator_code,
        i.indikator as indicator_name,
        i.subcategory,
        i.satuan,
        i.kategori,
        i.period_type,
        u_created.name as created_by_name,
        u_verified.name as verified_by_name
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      LEFT JOIN users u_created ON id.created_by = u_created.id
      LEFT JOIN users u_verified ON id.verified_by = u_verified.id
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
      month: row.period_month, // Add alias for period_month
      period_quarter: row.period_quarter,
      value: row.value,
      status: row.status || 'draft',
      notes: row.notes,
      source_document: row.source_document,
      verified_by: row.verified_by,
      verified_at: row.verified_at,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      indicator_code: row.indicator_code,
      indicator_name: row.indicator_name,
      subcategory: row.subcategory,
      satuan: row.satuan,
      unit: row.satuan, // Add alias for satuan
      kategori: row.kategori,
      category: row.kategori, // Add alias for kategori
      created_by_name: row.created_by_name,
      verified_by_name: row.verified_by_name
    }));

    // Get statistics
    const statsQuery = `
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
      ${whereClause}
    `;
    
    const statsResult: any = await executeQuery(statsQuery, queryParams);
    const stats = statsResult[0];

    // Get available years
    const yearsQuery = `
      SELECT DISTINCT id.year 
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      ${whereClause}
      ORDER BY id.year DESC
    `;
    
    const yearsResult: any = await executeQuery(yearsQuery, queryParams);
    const availableYears = yearsResult.map((row: any) => row.year);

    // Log activity
    await logActivity(user.id, 'VIEW_INDICATOR_DATA', 'indicator_data', '', {
      page,
      limit,
      indicator_id,
      indicator_name,
      year,
      excludeSubcategory,
      total_results: total
    });

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
        indicator_id,
        indicator_name,
        year,
        status,
        search,
        category,
        excludeSubcategory
      }
    });

  } catch (error) {
    console.error('GET indicator-data error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/admin/indicator-data - Create new indicator data
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Check admin permissions
    if (!['superadmin', 'admin_demografi', 'admin_ekonomi', 'admin_lingkungan'].includes(user.role)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Validate request body
    const body = await validateRequestBody<CreateIndicatorDataRequest>(request);

    // Validate required fields
    if (!body.indicator_id || !body.year || body.value === undefined) {
      return createErrorResponse('Missing required fields: indicator_id, year, value', 400);
    }

    // Verify indicator exists and user has access
    const indicatorQuery = `
      SELECT i.id, i.indikator as name, i.kategori as category_name, i.period_type 
      FROM indicators i 
      WHERE i.id = ? AND i.is_active = 1
    `;
    const indicatorRows: any = await executeQuery(indicatorQuery, [body.indicator_id]);
    
    if (indicatorRows.length === 0) {
      return createErrorResponse('Indicator not found or inactive', 404);
    }

    const indicator = indicatorRows[0];

    // Validate period data based on indicator type
    if (indicator.period_type === 'monthly') {
      if (!body.period_month || body.period_month < 1 || body.period_month > 12) {
        return createErrorResponse('Period month is required and must be between 1-12 for monthly indicators', 400);
      }
      if (body.period_quarter) {
        return createErrorResponse('Period quarter should not be set for monthly indicators', 400);
      }
    } else if (indicator.period_type === 'quarterly') {
      if (!body.period_quarter || body.period_quarter < 1 || body.period_quarter > 4) {
        return createErrorResponse('Period quarter is required and must be between 1-4 for quarterly indicators', 400);
      }
      if (body.period_month) {
        return createErrorResponse('Period month should not be set for quarterly indicators', 400);
      }
    } else {
      // Yearly indicators - allow period_month for reference even though it's yearly
      // User can input month for context/reference purposes
      // No specific validation needed for yearly
    }

    // Check role-based access to category
    if (user.role !== 'superadmin') {
      const allowedCategories = {
        'admin_demografi': 'Statistik Demografi & Sosial',
        'admin_ekonomi': 'Statistik Ekonomi',
        'admin_lingkungan': 'Statistik Lingkungan Hidup & Multi-Domain'
      };

      if (indicator.category_name !== allowedCategories[user.role as keyof typeof allowedCategories]) {
        return createErrorResponse('Access denied to this category', 403);
      }
    }

    // Check for duplicate data
    let duplicateQuery = 'SELECT id FROM indicator_data WHERE indicator_id = ? AND year = ?';
    let duplicateParams = [body.indicator_id, body.year];

    if (body.period_month) {
      duplicateQuery += ' AND period_month = ?';
      duplicateParams.push(body.period_month);
    } else {
      duplicateQuery += ' AND period_month IS NULL';
    }

    if (body.period_quarter) {
      duplicateQuery += ' AND period_quarter = ?';
      duplicateParams.push(body.period_quarter);
    } else {
      duplicateQuery += ' AND period_quarter IS NULL';
    }

    const duplicateRows: any = await executeQuery(duplicateQuery, duplicateParams);
    
    if (duplicateRows.length > 0) {
      let periodText = `year ${body.year}`;
      if (body.period_month) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periodText = `${monthNames[body.period_month - 1]} ${body.year}`;
      } else if (body.period_quarter) {
        periodText = `Q${body.period_quarter} ${body.year}`;
      }
      return createErrorResponse(`Data for ${periodText} already exists for this indicator`, 409);
    }

    // Create indicator data with audit logging
    const result = await executeTransaction(async (connection) => {
      // Generate UUID for the ID
      const dataId = uuidv4();

      // Insert indicator data
      const insertQuery = `
        INSERT INTO indicator_data (id, indicator_id, year, period_month, period_quarter, value, status, notes, source_document, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(insertQuery, [
        dataId,
        body.indicator_id,
        body.year,
        body.period_month || null,
        body.period_quarter || null,
        body.value,
        body.status || 'draft',
        body.notes || null,
        body.source_document || null,
        user.id
      ]);

      // Log audit trail
      const auditQuery = `
        INSERT INTO data_audit_log (table_name, record_id, action, new_values, user_id) 
        VALUES (?, ?, 'CREATE', ?, ?)
      `;

      await connection.execute(auditQuery, [
        'indicator_data', 
        dataId, 
        JSON.stringify({ 
          value: body.value, 
          status: body.status || 'draft',
          period_month: body.period_month || null,
          period_quarter: body.period_quarter || null
        }), 
        user.id
      ]);

      return dataId;
    });

    // Log activity
    await logActivity(user.id, 'CREATE_INDICATOR_DATA', 'indicator_data', result, {
      indicator_name: indicator.name,
      year: body.year,
      period_month: body.period_month || null,
      period_quarter: body.period_quarter || null,
      value: body.value
    });

    return createSuccessResponse({
      id: result,
      message: 'Indicator data created successfully'
    }, 201);

  } catch (error) {
    console.error('POST indicator-data error:', error);
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}

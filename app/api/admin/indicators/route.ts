import { NextRequest } from 'next/server';
import { IndicatorModel, CreateIndicatorRequest } from '@/lib/database/indicator-model';
import { executeQuery } from '@/lib/database/connection';
import { 
  authenticateRequest, 
  createErrorResponse, 
  createSuccessResponse,
  parseQueryParams,
  validateRequestBody,
  logActivity
} from '@/lib/auth-utils';
import { Indicator, Category } from '@/lib/types';

// GET /api/admin/indicators - Get indicators with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Parse query parameters
    const { page, limit, search, category } = parseQueryParams(request);
    const subcategory = request.nextUrl.searchParams.get('subcategory');
    const status = request.nextUrl.searchParams.get('status');

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

    // Add subcategory filter
    if (subcategory) {
      whereClause += ' AND i.subcategory = ?';
      queryParams.push(subcategory);
    }

    // Add status filter
    if (status) {
      if (status === 'active') {
        whereClause += ' AND i.is_active = 1';
      } else if (status === 'inactive') {
        whereClause += ' AND i.is_active = 0';
      }
    }

    // Add search filter
    if (search) {
      whereClause += ' AND (i.indikator LIKE ? OR i.deskripsi LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM indicators i
      ${whereClause}
    `;
    
    const countResult: any = await executeQuery(countQuery, queryParams);
    const total = countResult[0].total;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Check if updated_by column exists
    let hasUpdatedByColumn = false;
    try {
      const columnCheck: any = await executeQuery(`
        SELECT COUNT(*) as count FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'indicators' 
        AND COLUMN_NAME = 'updated_by'
      `, []);
      hasUpdatedByColumn = columnCheck[0]?.count > 0;
    } catch (error) {
      hasUpdatedByColumn = false;
    }

    // Build query based on column availability
    const query = hasUpdatedByColumn ? `
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
        i.created_by,
        i.updated_by,
        i.created_at,
        i.updated_at,
        u1.full_name as created_by_name,
        u2.full_name as updated_by_name,
        im.level,
        im.wilayah,
        im.periode,
        im.konsep_definisi,
        im.metode_perhitungan,
        im.interpretasi
      FROM indicators i
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.updated_by = u2.id
      LEFT JOIN indicator_metadata im ON i.id = im.indicator_id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    ` : `
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
        i.created_by,
        i.created_at,
        i.updated_at,
        u1.full_name as created_by_name,
        (SELECT u4.full_name 
         FROM data_audit_log dal4 
         LEFT JOIN users u4 ON dal4.user_id = u4.id
         WHERE dal4.table_name = 'indicators' 
         AND dal4.record_id = i.id
         AND dal4.action IN ('UPDATE', 'CREATE')
         ORDER BY dal4.created_at DESC 
         LIMIT 1) as last_updated_by_name,
        im.level,
        im.wilayah,
        im.periode,
        im.konsep_definisi,
        im.metode_perhitungan,
        im.interpretasi
      FROM indicators i
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN indicator_metadata im ON i.id = im.indicator_id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows: any = await executeQuery(query, [...queryParams, limit, offset]);

    const indicators = rows.map((row: any) => ({
      id: row.id,
      code: row.code,
      no: row.no,
      indikator: row.indikator,
      deskripsi: row.deskripsi,
      satuan: row.satuan,
      kategori: row.kategori,
      subcategory: row.subcategory,
      is_active: row.is_active === 1,
      created_by: row.created_by,
      created_by_name: row.created_by_name,
      ...(hasUpdatedByColumn && {
        updated_by: row.updated_by,
        updated_by_name: row.updated_by_name
      }),
      ...(!hasUpdatedByColumn && {
        updated_by_name: row.last_updated_by_name
      }),
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Metadata fields
      level: row.level,
      wilayah: row.wilayah,
      periode: row.periode,
      konsep_definisi: row.konsep_definisi,
      metode_perhitungan: row.metode_perhitungan,
      interpretasi: row.interpretasi
    }));

    // Get statistics - build separate query without search filter
    let statsWhereClause = 'WHERE 1=1';
    const statsParams: any[] = [];

    // Filter by category based on user role (same as main query but without search)
    if (user.role === 'admin_demografi') {
      statsWhereClause += ' AND i.kategori = ?';
      statsParams.push('Statistik Demografi & Sosial');
    } else if (user.role === 'admin_ekonomi') {
      statsWhereClause += ' AND i.kategori = ?';
      statsParams.push('Statistik Ekonomi');
    } else if (user.role === 'admin_lingkungan') {
      statsWhereClause += ' AND i.kategori = ?';
      statsParams.push('Statistik Lingkungan Hidup & Multi-Domain');
    } else if (category) {
      statsWhereClause += ' AND i.kategori = ?';
      statsParams.push(category);
    }

    // Add subcategory filter
    if (subcategory) {
      statsWhereClause += ' AND i.subcategory = ?';
      statsParams.push(subcategory);
    }

    // Add status filter
    if (status) {
      if (status === 'active') {
        statsWhereClause += ' AND i.is_active = 1';
      } else if (status === 'inactive') {
        statsWhereClause += ' AND i.is_active = 0';
      }
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_indicators,
        COUNT(CASE WHEN i.is_active = 1 THEN 1 END) as active_indicators,
        COUNT(CASE WHEN i.is_active = 0 THEN 1 END) as inactive_indicators
      FROM indicators i
      ${statsWhereClause}
    `;
    
    const statsResult: any = await executeQuery(statsQuery, statsParams);
    const stats = statsResult[0];

    // Log activity
    await logActivity(user.id, 'VIEW_INDICATORS', 'indicators', '', {
      page,
      limit,
      search,
      total_results: total
    });

    return createSuccessResponse({
      indicators,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      },
      statistics: stats
    });

  } catch (error) {
    console.error('GET indicators error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/admin/indicators - Create new indicator
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
    const body = await validateRequestBody<CreateIndicatorRequest>(request);

    // Validate required fields
    if (!body.indikator || !body.satuan || !body.kategori || !body.no) {
      return createErrorResponse('Missing required fields: indikator, satuan, kategori, no', 400);
    }

    // Check role-based access to category
    if (user.role !== 'superadmin') {
      const allowedCategories = {
        'admin_demografi': 'Statistik Demografi & Sosial',
        'admin_ekonomi': 'Statistik Ekonomi',
        'admin_lingkungan': 'Statistik Lingkungan Hidup & Multi-Domain'
      };

      if (body.kategori !== allowedCategories[user.role as keyof typeof allowedCategories]) {
        return createErrorResponse('Access denied to this category', 403);
      }
    }

    // Create indicator using model
    const indicatorData = {
      ...body,
      created_by: user.id,
      category_id: undefined // Set to undefined for now, or implement proper category mapping
    };

    const indicatorId = await IndicatorModel.create(indicatorData);

    // Log activity
    await logActivity(user.id, 'CREATE_INDICATOR', 'indicators', indicatorId.toString(), {
      indicator_name: body.indikator,
      category: body.kategori
    });

    return createSuccessResponse({
      id: indicatorId.toString(),
      message: 'Indicator created successfully'
    }, 201);

  } catch (error) {
    console.error('POST indicators error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Duplicate entry')) {
        return createErrorResponse('Indicator name already exists in this category', 409);
      }
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}
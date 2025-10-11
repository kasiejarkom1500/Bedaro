import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { 
  authenticateRequest, 
  createErrorResponse, 
  createSuccessResponse
} from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
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

    // Build query to get indicators from database
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

    // Query to get indicators with data count
    const query = `
      SELECT 
        i.id,
        i.indikator as name,
        i.subcategory,
        i.kategori,
        COUNT(id.id) as data_count
      FROM indicators i
      LEFT JOIN indicator_data id ON i.id = id.indicator_id
      ${whereClause}
      GROUP BY i.id, i.indikator, i.subcategory, i.kategori
      HAVING COUNT(id.id) > 0
      ORDER BY i.indikator ASC
    `;

    const indicators: any = await executeQuery(query, queryParams);

    console.log('Export-list query:', query);
    console.log('Query params:', queryParams);
    console.log('Indicators found:', indicators.length);
    console.log('First indicator sample:', indicators[0]);

    // Transform data untuk format export dropdown
    const exportList = indicators.map((indicator: any) => ({
      id: indicator.id,
      name: indicator.name,
      subcategory: indicator.subcategory || 'Tidak ada',
      data_count: indicator.data_count
    }));

    console.log('Transformed export list:', exportList.length, 'items');
    console.log('First transformed item:', exportList[0]);

    return createSuccessResponse(exportList);

  } catch (error) {
    console.error('Get indicators error:', error);
    return createErrorResponse('Failed to get indicators', 500);
  }
}
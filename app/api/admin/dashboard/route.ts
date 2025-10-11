import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { 
  authenticateRequest, 
  createErrorResponse, 
  createSuccessResponse,
  logActivity
} from '@/lib/auth-utils';

interface DashboardStats {
  indicators: {
    total: number;
    active: number;
    inactive: number;
  };
  data: {
    total_data_points: number;
    indicators_with_data: number;
    years_covered: number;
    earliest_year: number;
    latest_year: number;
    verified: number;
    draft: number;
    preliminary: number;
    final: number;
  };
  recent_activities: Array<{
    id: string;
    action: string;
    target_type: string;
    target_id: string;
    user_name: string;
    created_at: string;
    details?: any;
  }>;
  category_breakdown: Array<{
    category: string;
    indicator_count: number;
    data_count: number;
    last_updated: string;
  }>;
}

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const category = url.searchParams.get('category');

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

    // If specific category requested, check access
    let targetCategories = accessibleCategories;
    if (category) {
      if (!accessibleCategories.includes(category)) {
        return createErrorResponse('Access denied to this category', 403);
      }
      targetCategories = [category];
    }

    // Build category filter for SQL
    const categoryPlaceholders = targetCategories.map(() => '?').join(',');
    
    // Get indicator statistics
    const indicatorStats = await executeQuery<any[]>(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive
      FROM indicators 
      WHERE kategori IN (${categoryPlaceholders})
    `, targetCategories);

    // Get data statistics
    const dataStats = await executeQuery<any[]>(`
      SELECT 
        COUNT(id.id) as total_data_points,
        COUNT(DISTINCT id.indicator_id) as indicators_with_data,
        COUNT(DISTINCT id.year) as years_covered,
        MIN(id.year) as earliest_year,
        MAX(id.year) as latest_year
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      WHERE i.kategori IN (${categoryPlaceholders})
    `, targetCategories);

    // Get recent activities
    const recentActivities = await executeQuery<any[]>(`
      SELECT 
        al.id,
        al.action,
        al.table_name as target_type,
        al.record_id as target_id,
        u.full_name as user_name,
        al.created_at,
        al.new_values as details
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.table_name IN ('indicators', 'indicator_data')
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    // Get category breakdown
    const categoryBreakdown = await executeQuery<any[]>(`
      SELECT 
        i.kategori as category,
        COUNT(DISTINCT i.id) as indicator_count,
        COUNT(id.id) as data_count,
        MAX(COALESCE(id.updated_at, id.created_at)) as last_updated
      FROM indicators i
      LEFT JOIN indicator_data id ON i.id = id.indicator_id
      WHERE i.kategori IN (${categoryPlaceholders})
      GROUP BY i.kategori
      ORDER BY i.kategori
    `, targetCategories);

    // Format the response
    const dashboardStats: DashboardStats = {
      indicators: {
        total: indicatorStats[0]?.total || 0,
        active: indicatorStats[0]?.active || 0,
        inactive: indicatorStats[0]?.inactive || 0
      },
      data: {
        total_data_points: dataStats[0]?.total_data_points || 0,
        indicators_with_data: dataStats[0]?.indicators_with_data || 0,
        years_covered: dataStats[0]?.years_covered || 0,
        earliest_year: dataStats[0]?.earliest_year || new Date().getFullYear(),
        latest_year: dataStats[0]?.latest_year || new Date().getFullYear(),
        verified: dataStats[0]?.total_data_points || 0, // For now, treat all data as verified
        draft: 0, // No draft status in current schema
        preliminary: 0, // No preliminary status in current schema
        final: dataStats[0]?.total_data_points || 0 // Treat all as final
      },
      recent_activities: recentActivities.map(activity => ({
        ...activity,
        details: activity.details ? (typeof activity.details === 'string' ? JSON.parse(activity.details) : activity.details) : null
      })),
      category_breakdown: categoryBreakdown
    };

    // Log activity
    await logActivity(user.id, 'VIEW_DASHBOARD', 'dashboard', user.role, {
      categories: targetCategories,
      stats_summary: {
        total_indicators: dashboardStats.indicators.total,
        total_data_points: dashboardStats.data.total_data_points
      }
    });

    return createSuccessResponse({
      statistics: dashboardStats,
      user_role: user.role,
      accessible_categories: accessibleCategories,
      current_filter: category || 'all'
    });

  } catch (error) {
    console.error('GET dashboard error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
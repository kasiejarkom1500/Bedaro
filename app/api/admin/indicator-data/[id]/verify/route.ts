import { NextRequest } from 'next/server';
import { IndicatorDataModel } from '@/lib/database/indicator-data-model';
import { 
  authenticateRequest, 
  hasRoleAccess, 
  canPerformAction, 
  createErrorResponse, 
  createSuccessResponse,
  logActivity
} from '@/lib/auth-utils';

interface RouteContext {
  params: {
    id: string;
  };
}

// POST /api/admin/indicator-data/[id]/verify - Verify indicator data
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Check permission
    if (!canPerformAction(user.role, 'verify')) {
      return createErrorResponse('Insufficient permissions to verify data', 403);
    }

    // Get existing indicator data to check access
    const existingData = await IndicatorDataModel.getById(params.id);
    if (!existingData) {
      return createErrorResponse('Indicator data not found', 404);
    }

    // Check category access
    if (existingData.kategori && !hasRoleAccess(user.role, existingData.kategori)) {
      return createErrorResponse('Access denied to this category', 403);
    }

    // Check if already verified
    if (existingData.status === 'final' && existingData.verified_by) {
      return createErrorResponse('Data already verified', 400);
    }

    // Verify indicator data
    await IndicatorDataModel.verify(params.id, user.id);

    // Log activity
    await logActivity(user.id, 'VERIFY_INDICATOR_DATA', 'indicator_data', params.id, {
      indicator_name: existingData.indicator_name,
      year: existingData.year,
      previous_status: existingData.status
    });

    return createSuccessResponse({
      message: 'Indicator data verified successfully',
      verified_by: user.full_name || user.name,
      verified_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('POST verify indicator-data error:', error);
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}
import { NextRequest } from 'next/server';
import { IndicatorDataModel, UpdateIndicatorDataRequest } from '@/lib/database/indicator-data-model';
import { 
  authenticateRequest, 
  hasRoleAccess, 
  canPerformAction, 
  createErrorResponse, 
  createSuccessResponse,
  validateRequestBody,
  logActivity
} from '@/lib/auth-utils';

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/admin/indicator-data/[id] - Get single indicator data
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Check permission
    if (!canPerformAction(user.role, 'read')) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Get indicator data
    const indicatorData = await IndicatorDataModel.getById(params.id);
    
    if (!indicatorData) {
      return createErrorResponse('Indicator data not found', 404);
    }

    // Check category access
    if (indicatorData.kategori && !hasRoleAccess(user.role, indicatorData.kategori)) {
      return createErrorResponse('Access denied to this category', 403);
    }

    // Log activity
    await logActivity(user.id, 'VIEW_INDICATOR_DATA', 'indicator_data', params.id, {
      indicator_name: indicatorData.indicator_name,
      year: indicatorData.year
    });

    return createSuccessResponse(indicatorData);

  } catch (error) {
    console.error('GET indicator-data error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT /api/admin/indicator-data/[id] - Update indicator data
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Check permission
    if (!canPerformAction(user.role, 'update')) {
      return createErrorResponse('Insufficient permissions', 403);
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

    // Validate request body
    const body = await validateRequestBody<UpdateIndicatorDataRequest>(request);

    // Validate year range if being updated
    if (body.year && (body.year < 1900 || body.year > 2100)) {
      return createErrorResponse('Year must be between 1900 and 2100', 400);
    }

    // Update indicator data
    await IndicatorDataModel.update(params.id, body, user.id);

    // Log activity
    await logActivity(user.id, 'UPDATE_INDICATOR_DATA', 'indicator_data', params.id, {
      indicator_name: existingData.indicator_name,
      year: existingData.year,
      changes: body
    });

    return createSuccessResponse({
      message: 'Indicator data updated successfully'
    });

  } catch (error) {
    console.error('PUT indicator-data error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('tidak ditemukan')) {
        return createErrorResponse(error.message, 404);
      }
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE /api/admin/indicator-data/[id] - Delete indicator data
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Check permission
    if (!canPerformAction(user.role, 'delete')) {
      return createErrorResponse('Insufficient permissions', 403);
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

    // Delete indicator data
    await IndicatorDataModel.delete(params.id, user.id);

    // Log activity
    await logActivity(user.id, 'DELETE_INDICATOR_DATA', 'indicator_data', params.id, {
      indicator_name: existingData.indicator_name,
      year: existingData.year,
      value: existingData.value
    });

    return createSuccessResponse({
      message: 'Indicator data deleted successfully'
    });

  } catch (error) {
    console.error('DELETE indicator-data error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('tidak ditemukan')) {
        return createErrorResponse(error.message, 404);
      }
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}
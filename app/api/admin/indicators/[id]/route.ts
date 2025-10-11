import { NextRequest } from 'next/server';
import { IndicatorModel, CreateIndicatorRequest } from '@/lib/database/indicator-model';
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

// GET /api/admin/indicators/[id] - Get single indicator
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

    // Get indicator
    const indicator = await IndicatorModel.getById(params.id);
    
    if (!indicator) {
      return createErrorResponse('Indicator not found', 404);
    }

    // Check category access
    if (!hasRoleAccess(user.role, indicator.kategori)) {
      return createErrorResponse('Access denied to this category', 403);
    }

    // Log activity
    await logActivity(user.id, 'VIEW_INDICATOR', 'indicators', params.id, {
      indicator_name: indicator.indikator
    });

    return createSuccessResponse(indicator);

  } catch (error) {
    console.error('GET indicator error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT /api/admin/indicators/[id] - Update indicator
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

    // Get existing indicator to check access
    const existingIndicator = await IndicatorModel.getById(params.id);
    if (!existingIndicator) {
      return createErrorResponse('Indicator not found', 404);
    }

    // Check category access for existing indicator
    if (!hasRoleAccess(user.role, existingIndicator.kategori)) {
      return createErrorResponse('Access denied to this category', 403);
    }

    // Validate request body
    const body = await validateRequestBody<Partial<CreateIndicatorRequest>>(request);

    // If category is being changed, check access to new category
    if (body.kategori && body.kategori !== existingIndicator.kategori) {
      if (!hasRoleAccess(user.role, body.kategori)) {
        return createErrorResponse('Access denied to target category', 403);
      }
    }

    // Update indicator
    await IndicatorModel.update(params.id, body, user.id);

    // Log activity
    await logActivity(user.id, 'UPDATE_INDICATOR', 'indicators', params.id, {
      indicator_name: existingIndicator.indikator,
      changes: body
    });

    return createSuccessResponse({
      message: 'Indicator updated successfully'
    });

  } catch (error) {
    console.error('PUT indicator error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Duplicate entry')) {
        return createErrorResponse('Indicator code already exists', 409);
      }
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE /api/admin/indicators/[id] - Delete indicator (soft delete)
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

    // Get existing indicator to check access
    const existingIndicator = await IndicatorModel.getById(params.id);
    if (!existingIndicator) {
      return createErrorResponse('Indicator not found', 404);
    }

    // Check category access
    if (!hasRoleAccess(user.role, existingIndicator.kategori)) {
      return createErrorResponse('Access denied to this category', 403);
    }

    // Hard delete indicator (completely remove from database)
    // Change to softDelete = true if you want soft delete instead
    const hardDelete = true; // Set to false for soft delete
    await IndicatorModel.delete(params.id, user.id, hardDelete);

    // Log activity
    await logActivity(user.id, hardDelete ? 'DELETE_INDICATOR' : 'DEACTIVATE_INDICATOR', 'indicators', params.id, {
      indicator_name: existingIndicator.indikator,
      category: existingIndicator.kategori
    });

    return createSuccessResponse({
      message: 'Indicator deleted successfully'
    });

  } catch (error) {
    console.error('DELETE indicator error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
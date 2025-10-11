import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { 
  authenticateRequest, 
  createErrorResponse, 
  createSuccessResponse,
  logActivity
} from '@/lib/auth-utils';
import { Category } from '@/lib/types';

// GET /api/admin/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Get all categories
    const query = `
      SELECT 
        id,
        name,
        description,
        created_at,
        updated_at
      FROM categories 
      ORDER BY name ASC
    `;

    const rows: any = await executeQuery(query);

    const categories: Category[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    // Filter categories based on user role
    let filteredCategories = categories;
    if (user.role !== 'superadmin') {
      const allowedCategories = {
        'admin_demografi': 'Statistik Demografi & Sosial',
        'admin_ekonomi': 'Statistik Ekonomi',
        'admin_lingkungan': 'Statistik Lingkungan Hidup & Multi-Domain'
      };

      const allowedCategory = allowedCategories[user.role as keyof typeof allowedCategories];
      if (allowedCategory) {
        filteredCategories = categories.filter(cat => cat.name === allowedCategory);
      }
    }

    // Log activity
    await logActivity(user.id, 'VIEW_CATEGORIES', 'categories', '', {
      total_categories: filteredCategories.length
    });

    return createSuccessResponse({
      categories: filteredCategories
    });

  } catch (error) {
    console.error('GET categories error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/admin/categories - Create new category (superadmin only)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      return createErrorResponse(error || 'Authentication required', 401);
    }

    // Check superadmin permissions
    if (user.role !== 'superadmin') {
      return createErrorResponse('Only superadmin can create categories', 403);
    }

    // Validate request body
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return createErrorResponse('Missing required field: name', 400);
    }

    // Check for duplicate name
    const duplicateQuery = 'SELECT id FROM categories WHERE name = ?';
    const duplicateRows: any = await executeQuery(duplicateQuery, [body.name]);
    
    if (duplicateRows.length > 0) {
      return createErrorResponse('Category with this name already exists', 409);
    }

    // Create category
    const insertQuery = `
      INSERT INTO categories (name, description) 
      VALUES (?, ?)
    `;

    const result: any = await executeQuery(insertQuery, [
      body.name,
      body.description || null
    ]);

    const categoryId = result.insertId;

    // Log activity
    await logActivity(user.id, 'CREATE_CATEGORY', 'categories', categoryId.toString(), {
      category_name: body.name
    });

    return createSuccessResponse({
      id: categoryId.toString(),
      message: 'Category created successfully'
    }, 201);

  } catch (error) {
    console.error('POST categories error:', error);
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}
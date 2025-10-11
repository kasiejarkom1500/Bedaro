import { NextRequest } from 'next/server';
import { executeQuery } from './database/connection';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  role: 'superadmin' | 'admin_demografi' | 'admin_ekonomi' | 'admin_lingkungan' | 'viewer';
  department?: string;
  is_active: boolean;
}

export interface AuthResult {
  user: User | null;
  error?: string;
}

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Get user from JWT token
export async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.id) {
      return null;
    }

    const users = await executeQuery<User[]>(
      'SELECT id, email, full_name, name, role, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.id]
    );

    return users[0] || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Extract and verify authentication from request
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await getUserFromToken(token);

    if (!user) {
      return { user: null, error: 'Invalid or expired token' };
    }

    if (!user.is_active) {
      return { user: null, error: 'Account is deactivated' };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

// Check if user has required role for category access
export function hasRoleAccess(userRole: string, requiredCategory: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    'superadmin': ['Statistik Ekonomi', 'Statistik Demografi & Sosial', 'Statistik Lingkungan Hidup & Multi-Domain'],
    'admin_ekonomi': ['Statistik Ekonomi'],
    'admin_demografi': ['Statistik Demografi & Sosial'],
    'admin_lingkungan': ['Statistik Lingkungan Hidup & Multi-Domain'],
    'viewer': [] // Viewers cannot modify data
  };

  const allowedCategories = rolePermissions[userRole] || [];
  return allowedCategories.includes(requiredCategory);
}

// Check if user can perform specific action
export function canPerformAction(userRole: string, action: 'read' | 'create' | 'update' | 'delete' | 'verify'): boolean {
  const actionPermissions = {
    'superadmin': ['read', 'create', 'update', 'delete', 'verify'],
    'admin_ekonomi': ['read', 'create', 'update', 'delete', 'verify'],
    'admin_demografi': ['read', 'create', 'update', 'delete', 'verify'],
    'admin_lingkungan': ['read', 'create', 'update', 'delete', 'verify'],
    'viewer': ['read']
  };

  const allowedActions = actionPermissions[userRole as keyof typeof actionPermissions] || [];
  return allowedActions.includes(action);
}

// Get category from user role
export function getCategoryFromRole(userRole: string): string | null {
  const roleToCategory = {
    'admin_ekonomi': 'Statistik Ekonomi',
    'admin_demografi': 'Statistik Demografi & Sosial',
    'admin_lingkungan': 'Statistik Lingkungan Hidup & Multi-Domain'
  };

  return roleToCategory[userRole as keyof typeof roleToCategory] || null;
}

// Middleware for role-based access control
export function requireRole(roles: string[]) {
  return (user: User | null): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };
}

// Middleware for category access control
export function requireCategoryAccess(category: string) {
  return (user: User | null): boolean => {
    if (!user) return false;
    return hasRoleAccess(user.role, category);
  };
}

// Log user activity
export async function logActivity(
  userId: string,
  action: string,
  table_name: string,
  record_id: string,
  details?: any
) {
  try {
    await executeQuery(`
      INSERT INTO activity_logs (id, user_id, action, table_name, record_id, new_values, ip_address, user_agent)
      VALUES (UUID(), ?, ?, ?, ?, ?, '', '')
    `, [
      userId,
      action,
      table_name,
      record_id,
      details ? JSON.stringify(details) : null
    ]);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error for logging failures
  }
}

// Response helpers
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createSuccessResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Validate request body
export async function validateRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

// Parse query parameters with defaults
export function parseQueryParams(request: NextRequest) {
  const url = new URL(request.url);
  
  return {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: Math.min(parseInt(url.searchParams.get('limit') || '10'), 100), // Max 100 items per page
    search: url.searchParams.get('search') || undefined,
    year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
    status: url.searchParams.get('status') || undefined,
    indicator_id: url.searchParams.get('indicator_id') || undefined,
    category: url.searchParams.get('category') || undefined
  };
}
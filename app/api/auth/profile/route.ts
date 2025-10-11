import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Import executeQuery to get full user data
    const { executeQuery } = await import('@/lib/database/connection');
    
    // Get full user profile from database
    const users = await executeQuery<any[]>(
      'SELECT id, email, full_name, name, role, is_active, created_at, updated_at FROM users WHERE id = ? AND is_active = 1',
      [user.id]
    );

    const fullUser = users[0];

    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile data
    return NextResponse.json({
      success: true,
      user: fullUser
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { full_name, name, email } = await request.json();

    // Import executeQuery here to avoid circular dependency
    const { executeQuery } = await import('@/lib/database/connection');

    // Convert undefined to null for MySQL
    const updateValues = [
      email || user.email,
      full_name || user.full_name || null,
      name || user.name || null,
      user.id
    ];

    // Update user profile
    await executeQuery(
      `UPDATE users SET 
       email = ?,
       full_name = ?,
       name = ?,
       updated_at = NOW()
       WHERE id = ?`,
      updateValues
    );

    // Fetch updated user
    const updatedUsers = await executeQuery<any[]>(
      'SELECT id, email, full_name, name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [user.id]
    );

    const updatedUser = updatedUsers[0];

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
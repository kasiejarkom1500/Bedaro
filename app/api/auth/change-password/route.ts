import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { executeQuery } from '@/lib/database/connection';
import { authenticateRequest } from '@/lib/auth-utils';

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

    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password lama dan password baru harus diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Get current user with password
    const users = await executeQuery<Array<{ password: string }>>(
      'SELECT password FROM users WHERE id = ? AND is_active = 1',
      [user.id]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const currentUser = users[0];

    // Verify current password
    let isCurrentPasswordValid = false;
    
    try {
      // Try bcrypt comparison first (for hashed passwords)
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
    } catch (error) {
      // If bcrypt fails, assume it's plain text (for development)
      isCurrentPasswordValid = currentPassword === currentUser.password;
    }

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Password lama tidak benar' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await executeQuery(
      'UPDATE users SET password = ?, last_password_change = NOW(), updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengubah password' },
      { status: 500 }
    );
  }
}
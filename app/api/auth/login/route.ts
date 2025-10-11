import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '@/lib/database/connection';
import type { User } from '@/lib/types';

interface UserWithPassword extends User {
  password: string;
  is_active: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Find user in database
    const users = await executeQuery<UserWithPassword[]>(
      'SELECT id, email, full_name, name, role, password, created_at, updated_at, is_active FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // For development/demo purposes, if stored password is plain text, compare directly
    // In production, always use hashed passwords
    let isValidPassword = false;
    
    try {
      // Try bcrypt comparison first (for hashed passwords)
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (error) {
      // If bcrypt fails, assume it's plain text (for development)
      isValidPassword = password === user.password;
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, // Use 'id' instead of 'userId' to match auth-utils
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data without password
    const userData: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return NextResponse.json({
      success: true,
      user: userData,
      token: token,
      message: 'Login berhasil'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
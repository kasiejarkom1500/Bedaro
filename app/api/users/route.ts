import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { authenticateRequest } from '@/lib/auth-utils';
import type { User } from '@/lib/types';
import bcrypt from 'bcryptjs';

// Security validation functions
function validatePassword(password: string, email: string, name: string): { isValid: boolean; message: string } {
  const errors = []

  // 1. Minimal 8 karakter
  if (password.length < 8) {
    errors.push("minimal 8 karakter")
  }

  // 2. Mengandung huruf besar (A-Z)
  if (!/[A-Z]/.test(password)) {
    errors.push("mengandung huruf besar (A-Z)")
  }

  // 3. Mengandung huruf kecil (a-z)
  if (!/[a-z]/.test(password)) {
    errors.push("mengandung huruf kecil (a-z)")
  }

  // 4. Mengandung karakter spesial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push("mengandung karakter spesial (!@#$%^&* dll)")
  }

  // 5. Tidak boleh sama dengan username/email
  const emailUsername = email.split('@')[0].toLowerCase()
  if (password.toLowerCase() === emailUsername || password.toLowerCase() === email.toLowerCase()) {
    errors.push("tidak boleh sama dengan username atau email")
  }

  // 6. Tidak boleh sama dengan nama
  if (name && password.toLowerCase() === name.toLowerCase()) {
    errors.push("tidak boleh sama dengan nama pengguna")
  }

  // 7. Tidak boleh berisi spasi
  if (/\s/.test(password)) {
    errors.push("tidak boleh berisi spasi")
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      message: `Password harus: ${errors.join(", ")}`
    }
  }

  return {
    isValid: true,
    message: "Password memenuhi syarat keamanan"
  }
}

function validateEmail(email: string): { isValid: boolean; message: string } {
  // 1. Format email valid
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Format email tidak valid" }
  }

  // 2. Domain harus @bps.go.id
  if (!email.toLowerCase().endsWith('@bps.go.id')) {
    return { isValid: false, message: "Email harus menggunakan domain @bps.go.id" }
  }

  return { isValid: true, message: "Email valid" }
}

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

    // Only superadmin can view all users
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const users = await executeQuery<User[]>(
      'SELECT id, email, full_name, name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    return NextResponse.json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Only superadmin can create users
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { email, password, full_name, name, role } = await request.json();

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate email security
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.message },
        { status: 400 }
      );
    }

    // Validate password security
    const passwordValidation = validatePassword(password, email, full_name || name || '');
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if user already exists (email)
    const existingUsers = await executeQuery<User[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate UUID for new user
    const userId = crypto.randomUUID();

    // Insert new user
    await executeQuery(
      `INSERT INTO users (id, email, password, full_name, name, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [userId, email, password_hash, full_name || null, name || null, role]
    );

    // Fetch the created user
    const newUsers = await executeQuery<User[]>(
      'SELECT id, email, full_name, name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    return NextResponse.json(newUsers[0], { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      console.log('Authentication failed:', error);
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Only superadmin can update users
    if (user.role !== 'superadmin') {
      console.log('Insufficient permissions for user:', user.role);
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id, email, full_name, name, role, password } = await request.json();

    console.log('Update user request:', { id, email, full_name, name, role, passwordProvided: !!password });

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!email && !full_name && !name && !role && !password) {
      return NextResponse.json(
        { error: 'At least one field is required for update' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return NextResponse.json(
          { error: emailValidation.message },
          { status: 400 }
        );
      }

      // Check if email is already used by another user
      const existingUsers = await executeQuery<User[]>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh pengguna lain' },
          { status: 409 }
        );
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim() !== '') {
      // Validate password security
      const passwordValidation = validatePassword(password, email || '', full_name || name || '');
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { error: passwordValidation.message },
          { status: 400 }
        );
      }

      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('Password will be updated');
    }

    // Convert undefined to null for MySQL
    const updateValues = [
      email || null,
      full_name || null, 
      name || null,
      role || null,
      hashedPassword,
      id
    ];

    // Update user with or without password
    const updateQuery = hashedPassword 
      ? `UPDATE users SET 
         email = COALESCE(?, email),
         full_name = COALESCE(?, full_name),
         name = COALESCE(?, name),
         role = COALESCE(?, role),
         password = COALESCE(?, password),
         updated_at = NOW()
         WHERE id = ?`
      : `UPDATE users SET 
         email = COALESCE(?, email),
         full_name = COALESCE(?, full_name),
         name = COALESCE(?, name),
         role = COALESCE(?, role),
         updated_at = NOW()
         WHERE id = ?`;

    const queryValues = hashedPassword 
      ? updateValues 
      : updateValues.slice(0, -2).concat([id]); // Remove hashedPassword and use id

    console.log('Executing update query with values:', queryValues.map((v, i) => i === 4 ? '[PASSWORD]' : v));

    // Update user
    const updateResult = await executeQuery(updateQuery, queryValues);
    console.log('Update result:', updateResult);

    // Fetch updated user
    const updatedUsers = await executeQuery<User[]>(
      'SELECT id, email, full_name, name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    console.log('Fetched updated user:', updatedUsers);

    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Returning updated user:', updatedUsers[0]);
    return NextResponse.json(updatedUsers[0]);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Only superadmin can delete users
    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Don't allow deleting yourself
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Hard delete user from database
    const result = await executeQuery(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Database connection
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bps_bungo_db',
    charset: 'utf8mb4'
  })
}

// Middleware untuk autentikasi
async function authenticate(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return { error: 'Token tidak ditemukan', status: 401 }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Get user details from database
    const connection = await getConnection()
    
    try {
      const [userRows] = await connection.execute(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [decoded.id]
      )
      
      const user = (userRows as any[])[0]
      
      if (!user) {
        return { error: 'User tidak ditemukan', status: 401 }
      }

      return { user, connection }
    } catch (dbError) {
      await connection.end()
      throw dbError
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Token tidak valid', status: 401 }
  }
}

// PATCH - Toggle publication status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request)
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user, connection } = authResult
    
    try {
      const body = await request.json()
      const { is_published } = body

      // Check if article exists and user has permission
      const [existingRows] = await connection.execute(
        'SELECT * FROM articles WHERE id = ?',
        [params.id]
      )
      
      const existingArticle = (existingRows as any[])[0]
      
      if (!existingArticle) {
        return NextResponse.json(
          { error: 'Artikel tidak ditemukan' },
          { status: 404 }
        )
      }

      // Check permission
      if (user.role !== 'superadmin') {
        const roleCategories: { [key: string]: string } = {
          'admin_demografi': 'demografi',
          'admin_ekonomi': 'ekonomi',
          'admin_lingkungan': 'lingkungan'
        }
        
        const userCategory = roleCategories[user.role]
        if (userCategory && existingArticle.category !== userCategory) {
          return NextResponse.json(
            { error: 'Anda tidak memiliki izin untuk mengubah status publikasi artikel ini' },
            { status: 403 }
          )
        }
      }

      const publishedAt = is_published ? new Date() : null
      const publishedBy = is_published ? user.id : null
      
      const query = `
        UPDATE articles SET
          is_published = ?, 
          published_at = ?, 
          published_by = ?,
          updated_at = NOW()
        WHERE id = ?
      `
      
      await connection.execute(query, [is_published ? 1 : 0, publishedAt, publishedBy, params.id])

      console.log(`Article ${params.id} publication status changed to: ${is_published ? 'published' : 'unpublished'}`)

      return NextResponse.json({
        success: true,
        data: { 
          id: params.id,
          is_published: is_published ? 1 : 0,
          published_at: publishedAt
        }
      })

    } finally {
      await connection.end()
    }

  } catch (error) {
    console.error('Error updating publication status:', error)
    return NextResponse.json(
      { error: 'Gagal mengubah status publikasi' },
      { status: 500 }
    )
  }
}
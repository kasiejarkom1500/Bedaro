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

// GET - Get article details with tracking information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id
  
  try {
    const authResult = await authenticate(request)
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { connection } = authResult
    
    try {
      const query = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.author,
          a.duration,
          a.tags,
          a.category,
          a.created_at,
          a.updated_at,
          a.published_at,
          a.is_published,
          a.views_count,
          creator.full_name AS created_by_name,
          creator.name AS created_by_username,
          creator.email AS created_by_email,
          updater.full_name AS updated_by_name,
          updater.name AS updated_by_username,
          updater.email AS updated_by_email,
          publisher.full_name AS published_by_name,
          publisher.name AS published_by_username,
          publisher.email AS published_by_email
        FROM articles a
        LEFT JOIN users creator ON a.author_id = creator.id
        LEFT JOIN users updater ON a.updated_by = updater.id
        LEFT JOIN users publisher ON a.published_by = publisher.id
        WHERE a.id = ?
      `

      const [rows]: [any[], any] = await connection.execute(query, [articleId])
      const articles: any[] = rows as any[]
      
      if (articles.length === 0) {
        return NextResponse.json(
          { error: 'Artikel tidak ditemukan' },
          { status: 404 }
        )
      }

      const article = articles[0]
      
      // Parse JSON fields and format response
      const processedArticle = {
        id: article.id,
        title: article.title,
        content: article.content,
        author: article.author,
        duration: article.duration,
        tags: article.tags ? JSON.parse(article.tags) : [],
        category: article.category,
        created_at: article.created_at,
        updated_at: article.updated_at,
        published_at: article.published_at,
        is_published: !!article.is_published,
        views_count: article.views_count || 0,
        // Direct fields for frontend compatibility
        created_by_name: article.created_by_name,
        created_by_username: article.created_by_username,
        updated_by_name: article.updated_by_name,
        updated_by_username: article.updated_by_username,
        published_by_name: article.published_by_name,
        published_by_username: article.published_by_username
      }

      return NextResponse.json({
        success: true,
        data: processedArticle
      })

    } finally {
      await connection.end()
    }

  } catch (error) {
    console.error('Error fetching article details:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil detail artikel' },
      { status: 500 }
    )
  }
}
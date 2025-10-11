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
    console.log('Decoded token:', decoded)
    
    // Get user details from database
    const connection = await getConnection()
    
    try {
      const [userRows] = await connection.execute(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [decoded.id]
      )
      
      const user = (userRows as any[])[0]
      console.log('Found user:', user)
      
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

// GET - Get all articles
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request)
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user, connection } = authResult
    
    try {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const published = url.searchParams.get('published')
      
      let query = `
        SELECT 
          a.*,
          a.author as author_name
        FROM articles a
        WHERE 1=1
      `
      const params: any[] = []

      // Filter by category if specified
      if (category && category !== 'all') {
        query += ' AND a.category = ?'
        params.push(category)
      }

      // Filter by published status if specified
      if (published === 'true') {
        query += ' AND a.is_published = 1'
      } else if (published === 'false') {
        query += ' AND a.is_published = 0'
      }

      // Role-based filtering
      if (user.role !== 'superadmin') {
        // Admin can only see articles from their category
        const roleCategories: { [key: string]: string } = {
          'admin_demografi': 'demografi',
          'admin_ekonomi': 'ekonomi',
          'admin_lingkungan': 'lingkungan'
        }
        
        const userCategory = roleCategories[user.role]
        if (userCategory) {
          query += ' AND a.category = ?'
          params.push(userCategory)
        }
      }

      query += ' ORDER BY a.created_at DESC'
      
      const [rows] = await connection.execute(query, params)
      const articles = rows as any[]
      
      // Get sections for each article
      const processedArticles = await Promise.all(articles.map(async (article) => {
        // Get sections for this article
        const [sectionRows] = await connection.execute(
          'SELECT * FROM article_sections WHERE article_id = ? ORDER BY order_number ASC',
          [article.id]
        )
        
        return {
          ...article,
          tags: article.tags ? JSON.parse(article.tags) : [],
          sections: sectionRows || [],
          author: article.author || 'Admin'
        }
      }))

      console.log(`Found ${processedArticles.length} articles`)

      return NextResponse.json({
        success: true,
        articles: processedArticles
      })

    } finally {
      await connection.end()
    }

  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data artikel' },
      { status: 500 }
    )
  }
}

// POST - Create new article
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request)
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user, connection } = authResult
    
    try {
      const body = await request.json()
      const { title, content, author, duration, tags, category, sections, is_published = false } = body

      if (!title || !content) {
        return NextResponse.json(
          { error: 'Judul dan konten artikel harus diisi' },
          { status: 400 }
        )
      }

      // Validate category
      const validCategories = ['demografi', 'ekonomi', 'lingkungan']
      const articleCategory = category || 'demografi'
      
      if (!validCategories.includes(articleCategory)) {
        return NextResponse.json(
          { error: 'Kategori artikel tidak valid' },
          { status: 400 }
        )
      }

      // Role-based category validation for non-superadmin users
      if (user.role !== 'superadmin') {
        const roleCategories: { [key: string]: string } = {
          'admin_demografi': 'demografi',
          'admin_ekonomi': 'ekonomi',
          'admin_lingkungan': 'lingkungan'
        }
        
        const allowedCategory = roleCategories[user.role]
        if (allowedCategory && articleCategory !== allowedCategory) {
          return NextResponse.json(
            { error: `Anda hanya dapat membuat artikel kategori ${allowedCategory}. Role: ${user.role}` },
            { status: 403 }
          )
        }
      }

      // Generate UUID for article ID
      const articleId = crypto.randomUUID()
      
      const query = `
        INSERT INTO articles (
          id, title, content, author, duration, tags, category, 
          author_id, updated_by, is_published, published_at, published_by, views_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${is_published ? 'NOW()' : 'NULL'}, ?, ?, NOW(), NOW())
      `
      
      const params = [
        articleId,
        title,
        content,
        author || user.full_name || user.name || 'Admin',
        duration || '5 menit',
        JSON.stringify(tags || []),
        articleCategory,
        user.id,
        user.id, // updated_by - same as author_id for new articles
        is_published ? 1 : 0,
        is_published ? user.id : null, // published_by - set if published immediately
        0 // views_count - default to 0
      ]

      console.log('Creating article with params:', params)

      await connection.execute(query, params)

      // Insert sections if provided
      if (sections && Array.isArray(sections) && sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]
          if (section.title && section.content) {
            const sectionId = crypto.randomUUID()
            await connection.execute(
              'INSERT INTO article_sections (id, article_id, title, content, order_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
              [sectionId, articleId, section.title, section.content, i + 1]
            )
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: { 
          id: articleId,
          title,
          content,
          author: author || user.full_name || user.name || 'Admin',
          duration: duration || '5 menit',
          tags: tags || [],
          sections: sections || [],
          category: articleCategory,
          is_published: is_published ? 1 : 0,
          views_count: 0
        }
      })

    } finally {
      await connection.end()
    }

  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Gagal membuat artikel' },
      { status: 500 }
    )
  }
}
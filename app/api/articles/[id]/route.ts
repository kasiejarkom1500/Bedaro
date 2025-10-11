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

// GET - Get single article
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
          a.*,
          a.author as author_name
        FROM articles a
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
      
      // Get sections for this article
      const [sectionRows] = await connection.execute(
        'SELECT * FROM article_sections WHERE article_id = ? ORDER BY order_number ASC',
        [article.id]
      )
      
      // Parse JSON fields
      const processedArticle = {
        ...article,
        tags: article.tags ? JSON.parse(article.tags) : [],
        sections: sectionRows || [],
        author: article.author || 'Admin'
      }

      return NextResponse.json({
        success: true,
        data: processedArticle
      })

    } finally {
      await connection.end()
    }

  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data artikel' },
      { status: 500 }
    )
  }
}

// PUT - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id
  
  try {
    const authResult = await authenticate(request)
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user, connection } = authResult

    // Parse request body
    const body = await request.json()
    const { title, content, category, author, duration, tags, sections, is_published } = body

    // Debug logging to see what values we're getting
    console.log('Update article body:', {
      title,
      content: content ? `${content.substring(0, 50)}...` : content,
      category,
      author,
      duration,
      tags,
      sections: sections ? `${sections.length} sections` : 'no sections',
      is_published
    })

    // Validate required fields
    if (!title || !content || !category) {
      await connection.end()
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    try {
      // Check if article exists and user has permission
      const checkQuery = `
        SELECT author_id, category 
        FROM articles 
        WHERE id = ?
      `
      const [checkRows]: [any[], any] = await connection.execute(checkQuery, [articleId])
      const checkArticles: any[] = checkRows as any[]

      if (checkArticles.length === 0) {
        await connection.end()
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        )
      }

      const article = checkArticles[0]

      // Check permission - Updated for current role system
      console.log('Permission check:', {
        userRole: user.role,
        userId: user.id,
        articleAuthorId: article.author_id,
        articleCategory: article.category
      })

      // Allow superadmin to edit anything
      if (user.role === 'superadmin') {
        // Continue with update
      }
      // Allow admin to edit articles in their category
      else if (user.role.startsWith('admin_')) {
        const roleCategories: { [key: string]: string } = {
          'admin_demografi': 'demografi',
          'admin_ekonomi': 'ekonomi',
          'admin_lingkungan': 'lingkungan'
        }
        
        const userCategory = roleCategories[user.role]
        if (!userCategory || article.category !== userCategory) {
          await connection.end()
          return NextResponse.json(
            { error: 'Forbidden: You can only edit articles in your category' },
            { status: 403 }
          )
        }
      }
      // Allow author to edit their own articles
      else if (article.author_id !== user.id) {
        await connection.end()
        return NextResponse.json(
          { error: 'Forbidden: You can only edit your own articles' },
          { status: 403 }
        )
      }

      // Get current article status to determine if this is a publish action
      const [currentRows]: [any[], any] = await connection.execute(
        'SELECT is_published, published_by FROM articles WHERE id = ?',
        [articleId]
      )
      const currentArticle = (currentRows as any[])[0]
      const wasPublished = currentArticle?.is_published
      const existingPublishedBy = currentArticle?.published_by

      // Determine if this is a publish action (was not published, now is published)
      const isPublishAction = !wasPublished && is_published

      // Update article
      const updateQuery = `
        UPDATE articles 
        SET title = ?, content = ?, category = ?, 
            author = ?, duration = ?, tags = ?, is_published = ?, 
            published_at = ?, published_by = ?, updated_by = ?, updated_at = NOW()
        WHERE id = ?
      `
      
      const updateParams = [
        title, 
        content, 
        category, 
        author || null,
        duration || null,
        tags ? JSON.stringify(Array.isArray(tags) ? tags : []) : null,
        is_published ? 1 : 0,
        is_published ? (isPublishAction ? new Date() : (currentArticle?.published_at || new Date())) : null,
        isPublishAction ? user.id : (is_published ? existingPublishedBy : null), // Keep existing published_by when still published
        user.id, // updated_by
        articleId
      ]

      console.log('Update query params:', updateParams)
      
      await connection.execute(updateQuery, updateParams)

      // Delete existing sections
      await connection.execute(
        'DELETE FROM article_sections WHERE article_id = ?',
        [articleId]
      )

      // Insert new sections if provided
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

      // Get updated article
      const getQuery = `
        SELECT 
          a.*,
          u.full_name as author_name
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.id = ?
      `
      
      const [updatedRows]: [any[], any] = await connection.execute(getQuery, [articleId])
      const updatedArticles: any[] = updatedRows as any[]

      // Get updated sections
      const [updatedSectionRows] = await connection.execute(
        'SELECT * FROM article_sections WHERE article_id = ? ORDER BY order_number ASC',
        [articleId]
      )

      const updatedArticle = {
        ...updatedArticles[0],
        sections: updatedSectionRows || [],
        tags: updatedArticles[0].tags ? JSON.parse(updatedArticles[0].tags) : []
      }

      await connection.end()

      return NextResponse.json({
        message: 'Article updated successfully',
        article: updatedArticle
      })

    } catch (error) {
      await connection.end()
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Update article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id
  
  try {
    const authResult = await authenticate(request)
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { user, connection } = authResult
    
    try {
      // Check if article exists and user has permission
      const [existingRows]: [any[], any] = await connection.execute(
        'SELECT * FROM articles WHERE id = ?',
        [articleId]
      )
      
      const existingArticle: any = (existingRows as any[])[0]
      
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
            { error: 'Anda tidak memiliki izin untuk menghapus artikel ini' },
            { status: 403 }
          )
        }
      }

      // Delete sections first (foreign key constraint)
      await connection.execute('DELETE FROM article_sections WHERE article_id = ?', [articleId])
      
      // Delete article
      await connection.execute('DELETE FROM articles WHERE id = ?', [articleId])

      return NextResponse.json({
        success: true,
        message: 'Artikel berhasil dihapus'
      })

    } finally {
      await connection.end()
    }

  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus artikel' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

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

// GET - Get published articles for public access (literasi page)
export async function GET(request: NextRequest) {
  try {
    const connection = await getConnection()
    
    try {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      
      let query = `
        SELECT 
          a.id,
          a.title,
          a.content,
          a.author,
          a.duration,
          a.tags,
          a.category,
          a.views_count,
          a.created_at,
          a.updated_at,
          a.published_at
        FROM articles a
        WHERE a.is_published = 1
      `
      const params: any[] = []

      // Filter by category if specified
      if (category && category !== 'all') {
        query += ' AND a.category = ?'
        params.push(category)
      }

      query += ' ORDER BY a.published_at DESC, a.created_at DESC'
      
      const [rows] = await connection.execute(query, params)
      const articles = rows as any[]
      
      // Get sections for each article
      const processedArticles = await Promise.all(articles.map(async (article) => {
        // Get sections for this article
        const [sectionRows] = await connection.execute(
          'SELECT title, content, order_number FROM article_sections WHERE article_id = ? ORDER BY order_number ASC',
          [article.id]
        )
        
        return {
          id: article.id,
          title: article.title,
          content: article.content,
          author: article.author || 'Admin BPS',
          duration: article.duration || '5 menit',
          tags: article.tags ? JSON.parse(article.tags) : [],
          category: article.category,
          views_count: article.views_count || 0,
          created_at: article.created_at,
          updated_at: article.updated_at,
          published_at: article.published_at,
          sections: sectionRows || []
        }
      }))

      return NextResponse.json(processedArticles)

    } finally {
      await connection.end()
    }

  } catch (error) {
    console.error('Error fetching public articles:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data artikel' },
      { status: 500 }
    )
  }
}
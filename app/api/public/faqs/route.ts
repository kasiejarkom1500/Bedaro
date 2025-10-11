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

// GET - Get published FAQs for public access (literasi page)
export async function GET(request: NextRequest) {
  try {
    const connection = await getConnection()
    
    try {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const limit = url.searchParams.get('limit')
      
      let query = `
        SELECT 
          id,
          question,
          answer,
          category,
          is_featured,
          order_number,
          views_count,
          created_at,
          updated_at
        FROM faqs
        WHERE status = 'published'
      `
      const params: any[] = []

      // Filter by category if specified
      if (category && category !== 'all') {
        query += ' AND category = ?'
        params.push(category)
      }

      // Order by featured first, then by order number, then by creation date
      query += ' ORDER BY is_featured DESC, order_number ASC, created_at DESC'
      
      // Add limit if specified
      if (limit && !isNaN(parseInt(limit))) {
        query += ' LIMIT ?'
        params.push(parseInt(limit))
      }
      
      console.log('Public FAQs query:', query)
      console.log('Query params:', params)

      const [rows] = await connection.execute(query, params)
      const faqs = rows as any[]
      
      console.log(`Found ${faqs.length} published FAQs for public access`)

      return NextResponse.json(faqs)

    } finally {
      await connection.end()
    }

  } catch (error) {
    console.error('Error fetching public FAQs:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data FAQ' },
      { status: 500 }
    )
  }
}
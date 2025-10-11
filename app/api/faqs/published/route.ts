import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection
async function createConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bps_bungo_db',
  })
}

// GET - Fetch published FAQs for public view
export async function GET(request: NextRequest) {
  try {
    const connection = await createConnection()
    
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || 'all'
    const search = searchParams.get('search') || ''
    
    let query = `
      SELECT 
        id,
        question,
        answer,
        category,
        created_at,
        updated_at,
        views_count
      FROM faqs 
      WHERE status = 'published' 
      AND is_featured = 1 
      AND is_active = 1
    `
    
    const queryParams: any[] = []
    
    if (category !== 'all') {
      query += ' AND category = ?'
      queryParams.push(category)
    }
    
    if (search) {
      query += ' AND (question LIKE ? OR answer LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`)
    }
    
    query += ' ORDER BY order_number ASC, created_at DESC'
    
    const [faqs] = await connection.execute(query, queryParams)
    await connection.end()

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('Error fetching published FAQs:', error)
    return NextResponse.json({ error: 'Gagal mengambil data FAQ' }, { status: 500 })
  }
}
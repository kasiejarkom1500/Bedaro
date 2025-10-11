import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

// Database connection
async function createConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bps_bungo_db',
  })
}

// GET - Fetch all FAQs for admin management
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    if (!decoded.role || !decoded.role.startsWith('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const connection = await createConnection()
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    let baseQuery = `
      FROM faqs f
      LEFT JOIN users u ON f.answered_by = u.id
      WHERE 1=1
    `
    
    const queryParams: any[] = []
    
    if (status !== 'all') {
      baseQuery += ' AND f.status = ?'
      queryParams.push(status)
    }
    
    if (search) {
      baseQuery += ' AND (f.question LIKE ? OR f.answer LIKE ? OR f.user_full_name LIKE ? OR f.user_email LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    // Count total items for pagination
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`
    const [countResult] = await connection.execute(countQuery, queryParams) as any
    const totalItems = countResult[0].total
    const totalPages = Math.ceil(totalItems / limit)
    
    // Get paginated data
    const dataQuery = `
      SELECT 
        f.*,
        u.full_name as answered_by_name
      ${baseQuery}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `
    
    const [faqs] = await connection.execute(dataQuery, [...queryParams, limit, offset])
    
    // Get statistics for status counts (without pagination)
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) as answered,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published
      FROM faqs f
      WHERE 1=1
    `
    const statsParams: any[] = []
    
    // Apply same search filter for stats
    let statsCondition = ''
    if (search) {
      statsCondition = ' AND (f.question LIKE ? OR f.answer LIKE ? OR f.user_full_name LIKE ? OR f.user_email LIKE ?)'
      statsParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    const [statsResult] = await connection.execute(statsQuery + statsCondition, statsParams) as any
    const stats = statsResult[0]
    
    await connection.end()

    return NextResponse.json({ 
      faqs,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      statistics: {
        all: stats.total,
        pending: stats.pending,
        answered: stats.answered,
        published: stats.published
      }
    })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json({ error: 'Gagal mengambil data FAQ' }, { status: 500 })
  }
}

// POST - Admin adds new FAQ question
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    if (!decoded.role || !decoded.role.startsWith('admin')) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { question, answer, category, user_email, user_phone, user_full_name } = body

    // Validation
    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ 
        error: 'Pertanyaan dan jawaban harus diisi' 
      }, { status: 400 })
    }

    const connection = await createConnection()
    
    const faqId = uuidv4()
    const now = new Date()
    
    console.log('Decoded JWT:', decoded)
    console.log('Request body:', { question, answer, category, user_email, user_phone, user_full_name })
    
    // Insert new FAQ created by admin
    const insertQuery = `
      INSERT INTO faqs (
        id, question, answer, category, status, 
        user_email, user_phone, user_full_name,
        answered_by, answered_at, is_featured, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const insertParams = [
      faqId || uuidv4(), // Ensure faqId is not undefined
      (question || '').trim(),
      (answer || '').trim(), 
      category || 'umum',
      'published', // Admin-created FAQs are automatically published
      user_email || 'admin@bps-bungo.id',
      user_phone || '-',
      user_full_name || 'Admin BPS Bungo',
      decoded.userId || null, // Admin who created it - ensure not undefined
      now, // answered_at (since it's immediately answered)
      true, // is_featured
      true, // is_active
      now, // created_at
      now  // updated_at
    ]
    
    console.log('Insert parameters:', insertParams)
    console.log('Parameter types:', insertParams.map(p => typeof p))
    
    // Check for undefined values
    const undefinedIndices = insertParams.map((param, index) => param === undefined ? index : null).filter(i => i !== null)
    if (undefinedIndices.length > 0) {
      console.error('Found undefined parameters at indices:', undefinedIndices)
      return NextResponse.json({ error: 'Invalid parameters detected' }, { status: 400 })
    }
    
    await connection.execute(insertQuery, insertParams)
    await connection.end()

    return NextResponse.json({ 
      message: 'FAQ berhasil ditambahkan',
      faqId 
    })
  } catch (error) {
    console.error('Error adding FAQ:', error)
    return NextResponse.json({ error: 'Gagal menambahkan FAQ' }, { status: 500 })
  }
}
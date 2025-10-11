import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
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

// POST - Submit new question from visitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, userPhone, userFullName, question } = body

    if (!userEmail || !userPhone || !userFullName || !question) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const connection = await createConnection()
    const questionId = uuidv4()

    const [result] = await connection.execute(
      `INSERT INTO faqs (
        id, 
        question, 
        answer, 
        category, 
        user_email, 
        user_phone, 
        user_full_name, 
        status, 
        is_active, 
        is_featured,
        created_at
      ) VALUES (?, ?, '', 'umum', ?, ?, ?, 'pending', 1, 0, NOW())`,
      [questionId, question, userEmail, userPhone, userFullName]
    )

    await connection.end()

    return NextResponse.json({ 
      message: 'Pertanyaan berhasil dikirim dan akan segera ditinjau oleh admin',
      id: questionId 
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting question:', error)
    return NextResponse.json({ error: 'Gagal mengirim pertanyaan' }, { status: 500 })
  }
}
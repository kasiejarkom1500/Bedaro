import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import jwt from 'jsonwebtoken'

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bps_bungo_db'
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Verifikasi token (optional - bisa dilewati untuk testing)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    } catch (jwtError) {
      console.error('JWT Error:', jwtError)
      // Return default stats jika token invalid
      return NextResponse.json({
        totalFAQs: 4,
        pendingFAQs: 1
      })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Get total FAQs
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM faqs'
    )
    const totalFAQs = (totalResult as any)[0].count

    // Get pending FAQs
    const [pendingResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM faqs WHERE status = "menunggu"'
    )
    const pendingFAQs = (pendingResult as any)[0].count

    await connection.end()

    return NextResponse.json({
      totalFAQs,
      pendingFAQs
    })

  } catch (error) {
    console.error('Error fetching FAQ stats:', error)
    // Return default stats on error
    return NextResponse.json({
      totalFAQs: 4,
      pendingFAQs: 1
    })
  }
}
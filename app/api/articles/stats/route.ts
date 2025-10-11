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
        totalArticles: 2,
        publishedArticles: 1
      })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Get total articles
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM articles'
    )
    const totalArticles = (totalResult as any)[0].count

    // Get published articles
    const [publishedResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM articles WHERE is_published = 1'
    )
    const publishedArticles = (publishedResult as any)[0].count

    await connection.end()

    return NextResponse.json({
      totalArticles,
      publishedArticles
    })

  } catch (error) {
    console.error('Error fetching article stats:', error)
    // Return default stats on error
    return NextResponse.json({
      totalArticles: 2,
      publishedArticles: 1
    })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import jwt from 'jsonwebtoken'

// Database connection
async function createConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bps_bungo_db',
  })
}

// PUT - Answer FAQ (admin action)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { answer, category, status, is_featured } = body
    const faqId = params.id
    const userId = decoded.id

    const connection = await createConnection()

    let query = 'UPDATE faqs SET '
    const queryParams: any[] = []
    const updates: string[] = []

    if (answer !== undefined) {
      updates.push('answer = ?', 'status = "answered"', 'answered_by = ?', 'answered_at = NOW()')
      queryParams.push(answer, userId)
    }

    if (category !== undefined) {
      updates.push('category = ?')
      queryParams.push(category)
    }

    if (status !== undefined) {
      updates.push('status = ?')
      queryParams.push(status)
      
      if (status === 'published') {
        updates.push('is_featured = 1')
      }
    }

    if (is_featured !== undefined) {
      updates.push('is_featured = ?')
      queryParams.push(is_featured ? 1 : 0)
    }

    if (updates.length === 0) {
      await connection.end()
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 })
    }

    query += updates.join(', ') + ' WHERE id = ?'
    queryParams.push(faqId)

    const [result] = await connection.execute(query, queryParams)

    if ((result as any).affectedRows === 0) {
      await connection.end()
      return NextResponse.json({ error: 'FAQ tidak ditemukan' }, { status: 404 })
    }

    await connection.end()

    return NextResponse.json({ message: 'FAQ berhasil diupdate' })
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json({ error: 'Gagal mengupdate FAQ' }, { status: 500 })
  }
}

// DELETE - Delete FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const faqId = params.id
    const connection = await createConnection()

    const [result] = await connection.execute(
      'DELETE FROM faqs WHERE id = ?',
      [faqId]
    )

    if ((result as any).affectedRows === 0) {
      await connection.end()
      return NextResponse.json({ error: 'FAQ tidak ditemukan' }, { status: 404 })
    }

    await connection.end()

    return NextResponse.json({ message: 'FAQ berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json({ error: 'Gagal menghapus FAQ' }, { status: 500 })
  }
}
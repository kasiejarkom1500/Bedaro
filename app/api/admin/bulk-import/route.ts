import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeTransaction } from '@/lib/database/connection';
import { authenticateRequest } from '@/lib/auth-utils';

export interface BulkImportResult {
  success: boolean;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

// POST - Bulk import indicator data
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
    if (!['superadmin', 'admin_demografi', 'admin_ekonomi', 'admin_lingkungan'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { data, category, operation = 'upsert' } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Data array is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Role-based category validation
    const allowedCategories = {
      'admin_demografi': ['Statistik Demografi & Sosial'],
      'admin_ekonomi': ['Statistik Ekonomi'],
      'admin_lingkungan': ['Statistik Lingkungan Hidup & Multi-Domain'],
      'superadmin': ['Statistik Demografi & Sosial', 'Statistik Ekonomi', 'Statistik Lingkungan Hidup & Multi-Domain']
    };

    if (category && !allowedCategories[user.role as keyof typeof allowedCategories]?.includes(category)) {
      return NextResponse.json(
        { error: 'You are not authorized to import data for this category' },
        { status: 403 }
      );
    }

    const result: BulkImportResult = {
      success: true,
      imported_count: 0,
      updated_count: 0,
      skipped_count: 0,
      error_count: 0,
      errors: []
    };

    // Process data in transaction
    await executeTransaction(async (connection) => {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;

        try {
          // Validate required fields
          if (!row.indicator_id || !row.year) {
            result.errors.push({
              row: rowNumber,
              error: 'indicator_id and year are required',
              data: row
            });
            result.error_count++;
            continue;
          }

          // Validate year
          const currentYear = new Date().getFullYear();
          if (row.year < 2000 || row.year > currentYear + 5) {
            result.errors.push({
              row: rowNumber,
              error: 'Invalid year range',
              data: row
            });
            result.error_count++;
            continue;
          }

          // Check if indicator exists and get category
          const [indicatorResult] = await connection.execute(
            'SELECT kategori FROM indicators WHERE id = ? AND is_active = 1',
            [row.indicator_id]
          );

          const indicators = indicatorResult as any[];
          if (indicators.length === 0) {
            result.errors.push({
              row: rowNumber,
              error: 'Indicator not found or inactive',
              data: row
            });
            result.error_count++;
            continue;
          }

          const indicatorCategory = indicators[0].kategori;

          // Check category access
          if (category && indicatorCategory !== category) {
            result.errors.push({
              row: rowNumber,
              error: 'Indicator does not belong to specified category',
              data: row
            });
            result.error_count++;
            continue;
          }

          if (!allowedCategories[user.role as keyof typeof allowedCategories]?.includes(indicatorCategory)) {
            result.errors.push({
              row: rowNumber,
              error: 'You are not authorized to import data for this indicator category',
              data: row
            });
            result.error_count++;
            continue;
          }

          // Check if data already exists
          const [existingResult] = await connection.execute(
            'SELECT id, revision_number FROM indicator_data WHERE indicator_id = ? AND year = ?',
            [row.indicator_id, row.year]
          );

          const existingData = existingResult as any[];

          if (existingData.length > 0) {
            if (operation === 'skip') {
              result.skipped_count++;
              continue;
            } else if (operation === 'upsert' || operation === 'update') {
              // Update existing data
              const existingId = existingData[0].id;
              const newRevision = existingData[0].revision_number + 1;

              await connection.execute(
                `UPDATE indicator_data 
                 SET value = ?, status = ?, notes = ?, source_document = ?, 
                     revision_number = ?, updated_at = NOW()
                 WHERE id = ?`,
                [
                  row.value || null,
                  row.status || 'draft',
                  row.notes || null,
                  row.source_document || null,
                  newRevision,
                  existingId
                ]
              );

              result.updated_count++;
            }
          } else {
            if (operation === 'update') {
              result.errors.push({
                row: rowNumber,
                error: 'Data does not exist for update operation',
                data: row
              });
              result.error_count++;
              continue;
            }

            // Create new data
            const dataId = crypto.randomUUID();

            await connection.execute(
              `INSERT INTO indicator_data (
                id, indicator_id, year, value, status, notes, 
                created_by, source_document, revision_number,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
              [
                dataId,
                row.indicator_id,
                row.year,
                row.value || null,
                row.status || 'draft',
                row.notes || null,
                user.id,
                row.source_document || null
              ]
            );

            result.imported_count++;
          }

        } catch (rowError) {
          console.error(`Error processing row ${rowNumber}:`, rowError);
          result.errors.push({
            row: rowNumber,
            error: rowError instanceof Error ? rowError.message : 'Unknown error',
            data: row
          });
          result.error_count++;
        }
      }

      // Log audit trail
      await connection.execute(
        `INSERT INTO data_audit_log (
          id, table_name, record_id, action, user_id, 
          old_values, new_values, changes_summary, created_at
        ) VALUES (?, 'indicator_data', 'bulk_import', 'IMPORT', ?, NULL, ?, ?, NOW())`,
        [
          crypto.randomUUID(),
          user.id,
          JSON.stringify({ 
            operation,
            category: category || 'mixed',
            total_rows: data.length
          }),
          `Bulk import: ${result.imported_count} created, ${result.updated_count} updated, ${result.error_count} errors`
        ]
      );
    });

    // Determine if operation was successful
    result.success = result.error_count === 0 || result.error_count < data.length / 2;

    return NextResponse.json(result, { 
      status: result.success ? 200 : 207 // 207 = Multi-Status
    });

  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}

// GET - Get import template or validation rules
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const category = searchParams.get('category');

    if (action === 'template') {
      // Get sample template data
      const template = {
        fields: [
          { name: 'indicator_id', type: 'string', required: true, description: 'UUID of the indicator' },
          { name: 'year', type: 'number', required: true, description: 'Data year (2000-2030)' },
          { name: 'value', type: 'number', required: false, description: 'Numerical value' },
          { name: 'status', type: 'string', required: false, description: 'draft|preliminary|final (default: draft)' },
          { name: 'notes', type: 'string', required: false, description: 'Additional notes' },
          { name: 'source_document', type: 'string', required: false, description: 'Source document reference' }
        ],
        sample_data: [
          {
            indicator_id: 'f40d7462-a66c-49f5-a4ba-1cf5742b87f2',
            year: 2024,
            value: 17500.50,
            status: 'draft',
            notes: 'Preliminary estimate',
            source_document: 'BPS Survey 2024'
          }
        ]
      };

      return NextResponse.json(template);
    }

    if (action === 'indicators') {
      // Get available indicators for the user
      let whereClause = 'WHERE i.is_active = 1';
      const queryParams: any[] = [];

      if (category) {
        whereClause += ' AND i.kategori = ?';
        queryParams.push(category);
      }

      // Role-based filtering
      if (user.role === 'admin_demografi') {
        whereClause += ' AND i.kategori = ?';
        queryParams.push('Statistik Demografi & Sosial');
      } else if (user.role === 'admin_ekonomi') {
        whereClause += ' AND i.kategori = ?';
        queryParams.push('Statistik Ekonomi');
      } else if (user.role === 'admin_lingkungan') {
        whereClause += ' AND i.kategori = ?';
        queryParams.push('Statistik Lingkungan Hidup & Multi-Domain');
      }

      const indicators = await executeQuery<{
        id: string;
        code: string;
        indikator: string;
        kategori: string;
        satuan: string;
      }[]>(
        `SELECT i.id, i.code, i.indikator, i.kategori, i.satuan
         FROM indicators i
         ${whereClause}
         ORDER BY i.no ASC, i.indikator ASC`,
        queryParams
      );

      return NextResponse.json({ indicators });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in bulk import GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch import information' },
      { status: 500 }
    );
  }
}
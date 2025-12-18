import { executeQuery, executeTransaction } from './connection';
import { v4 as uuidv4 } from 'uuid';

export interface IndicatorDataWithDetails extends IndicatorData {
  indicator_name?: string;
  indicator_code?: string;
  kategori?: string;
  satuan?: string;
  created_by_name?: string;
  verified_by_name?: string;
}

export interface IndicatorData {
  id: string;
  indicator_id: string;
  year: number;
  period_month?: number;
  period_quarter?: number;
  value?: number;
  status: 'draft' | 'preliminary' | 'final';
  notes?: string;
  verified_by?: string;
  verified_at?: Date;
  created_by?: string;
  source_document?: string;
  revision_number: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateIndicatorDataRequest {
  indicator_id: string;
  year: number;
  period_month?: number;
  period_quarter?: number;
  value?: number;
  status?: 'draft' | 'preliminary' | 'final';
  notes?: string;
  created_by: string;
  source_document?: string;
}

export interface UpdateIndicatorDataRequest {
  year?: number;
  period_month?: number;
  period_quarter?: number;
  value?: number;
  status?: 'draft' | 'preliminary' | 'final';
  notes?: string;
  verified_by?: string;
  source_document?: string;
}

export interface BulkImportData {
  indicator_id: string;
  year: number;
  period_month?: number;
  period_quarter?: number;
  value?: number;
  notes?: string;
  source_document?: string;
}

// Indicator Data CRUD operations
export class IndicatorDataModel {
  // Get indicator data by category with pagination and filtering
  static async getByCategory(
    kategori: string,
    page: number = 1,
    limit: number = 10,
    filters?: {
      year?: number;
      status?: string;
      indicator_id?: string;
      search?: string;
    }
  ): Promise<{ data: IndicatorDataWithDetails[]; total: number; pages: number }> {
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const normalizedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 10, 100));
    const offset = (safePage - 1) * normalizedLimit;
    
    let whereClause = 'WHERE i.kategori = ?';
    let params: any[] = [kategori];
    
    if (filters?.year) {
      whereClause += ' AND id.year = ?';
      params.push(filters.year);
    }
    
    if (filters?.status) {
      whereClause += ' AND id.status = ?';
      params.push(filters.status);
    }
    
    if (filters?.indicator_id) {
      whereClause += ' AND id.indicator_id = ?';
      params.push(filters.indicator_id);
    }
    
    if (filters?.search) {
      whereClause += ' AND (i.indikator LIKE ? OR i.code LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      ${whereClause}
    `;
    const countResult = await executeQuery<{ total: number }[]>(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated results with details
    const query = `
      SELECT 
        id.*,
        i.indikator as indicator_name,
        i.code as indicator_code,
        i.kategori,
        i.satuan,
        uc.full_name as created_by_name,
        uv.full_name as verified_by_name
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      LEFT JOIN users uc ON id.created_by = uc.id
      LEFT JOIN users uv ON id.verified_by = uv.id
      ${whereClause}
      ORDER BY id.year DESC, id.period_month DESC, id.period_quarter DESC, i.no ASC, id.created_at DESC
      LIMIT ${normalizedLimit} OFFSET ${offset}
    `;
    
    const data = await executeQuery<IndicatorDataWithDetails[]>(query, params);
    
    return {
      data,
      total,
      pages: Math.ceil(total / normalizedLimit)
    };
  }

  // Get indicator data by ID
  static async getById(id: string): Promise<IndicatorDataWithDetails | null> {
    const query = `
      SELECT 
        id.*,
        i.indikator as indicator_name,
        i.code as indicator_code,
        i.kategori,
        i.satuan,
        uc.full_name as created_by_name,
        uv.full_name as verified_by_name
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      LEFT JOIN users uc ON id.created_by = uc.id
      LEFT JOIN users uv ON id.verified_by = uv.id
      WHERE id.id = ?
    `;
    
    const results = await executeQuery<IndicatorDataWithDetails[]>(query, [id]);
    return results[0] || null;
  }

  // Get data by indicator, year and period (for checking duplicates)
  static async getByIndicatorAndPeriod(
    indicator_id: string, 
    year: number, 
    period_month?: number, 
    period_quarter?: number
  ): Promise<IndicatorData | null> {
    let query = 'SELECT * FROM indicator_data WHERE indicator_id = ? AND year = ?';
    const params: any[] = [indicator_id, year];

    if (period_month) {
      query += ' AND period_month = ?';
      params.push(period_month);
    } else {
      query += ' AND period_month IS NULL';
    }

    if (period_quarter) {
      query += ' AND period_quarter = ?';
      params.push(period_quarter);
    } else {
      query += ' AND period_quarter IS NULL';
    }

    const results = await executeQuery<IndicatorData[]>(query, params);
    return results[0] || null;
  }

  // Get data by indicator and year (for checking duplicates) - deprecated, use getByIndicatorAndPeriod
  static async getByIndicatorAndYear(indicator_id: string, year: number): Promise<IndicatorData | null> {
    const query = 'SELECT * FROM indicator_data WHERE indicator_id = ? AND year = ?';
    const results = await executeQuery<IndicatorData[]>(query, [indicator_id, year]);
    return results[0] || null;
  }

  // Create new indicator data
  static async create(data: CreateIndicatorDataRequest): Promise<string> {
    const id = uuidv4();
    
    return executeTransaction(async (connection) => {
      // Check for duplicate indicator-year-period combination
      let duplicateQuery = 'SELECT id FROM indicator_data WHERE indicator_id = ? AND year = ?';
      let duplicateParams = [data.indicator_id, data.year];

      if (data.period_month) {
        duplicateQuery += ' AND period_month = ?';
        duplicateParams.push(data.period_month);
      } else {
        duplicateQuery += ' AND period_month IS NULL';
      }

      if (data.period_quarter) {
        duplicateQuery += ' AND period_quarter = ?';
        duplicateParams.push(data.period_quarter);
      } else {
        duplicateQuery += ' AND period_quarter IS NULL';
      }

      const [existing] = await connection.execute(duplicateQuery, duplicateParams);

      if (Array.isArray(existing) && existing.length > 0) {
        let periodText = `tahun ${data.year}`;
        if (data.period_month) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          periodText = `${monthNames[data.period_month - 1]} ${data.year}`;
        } else if (data.period_quarter) {
          periodText = `Q${data.period_quarter} ${data.year}`;
        }
        throw new Error(`Data untuk ${periodText} sudah ada untuk indikator ini`);
      }

      // Insert indicator data
      const query = `
        INSERT INTO indicator_data (
          id, indicator_id, year, period_month, period_quarter, value, status, notes, created_by, source_document
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(query, [
        id,
        data.indicator_id,
        data.year,
        data.period_month || null,
        data.period_quarter || null,
        data.value,
        data.status || 'draft',
        data.notes,
        data.created_by,
        data.source_document
      ]);

      // Log audit trail
      await connection.execute(`
        INSERT INTO data_audit_log (id, table_name, record_id, action, user_id, new_values)
        VALUES (?, 'indicator_data', ?, 'CREATE', ?, ?)
      `, [
        uuidv4(),
        id,
        data.created_by,
        JSON.stringify({ created: data })
      ]);

      return id;
    });
  }

  // Update indicator data
  static async update(id: string, data: UpdateIndicatorDataRequest, updated_by: string): Promise<void> {
    return executeTransaction(async (connection) => {
      // Get current data for audit
      const [currentData] = await connection.execute(
        'SELECT * FROM indicator_data WHERE id = ?',
        [id]
      );

      if (!Array.isArray(currentData) || currentData.length === 0) {
        throw new Error('Data tidak ditemukan');
      }

      // Build dynamic update query
      const fields = Object.keys(data).filter(key => data[key as keyof UpdateIndicatorDataRequest] !== undefined);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => data[field as keyof UpdateIndicatorDataRequest]);

      if (fields.length === 0) return;

      // Increment revision number
      const query = `
        UPDATE indicator_data 
        SET ${setClause}, revision_number = revision_number + 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await connection.execute(query, [...values, id]);

      // Log audit trail
      await connection.execute(`
        INSERT INTO data_audit_log (id, table_name, record_id, action, user_id, new_values)
        VALUES (?, 'indicator_data', ?, 'UPDATE', ?, ?)
      `, [
        uuidv4(),
        id,
        updated_by,
        JSON.stringify({ before: currentData[0], after: data })
      ]);
    });
  }

  // Verify indicator data
  static async verify(id: string, verified_by: string): Promise<void> {
    return executeTransaction(async (connection) => {
      // Get current data
      const [currentDataResult] = await connection.execute(
        'SELECT * FROM indicator_data WHERE id = ?',
        [id]
      );

      if (!Array.isArray(currentDataResult) || currentDataResult.length === 0) {
        throw new Error('Data tidak ditemukan');
      }

      const currentData = currentDataResult as any[];

      // Update verification status
      await connection.execute(`
        UPDATE indicator_data 
        SET status = 'final', verified_by = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [verified_by, id]);

      // Log audit trail
      await connection.execute(`
        INSERT INTO data_audit_log (id, table_name, record_id, action, user_id, new_values)
        VALUES (?, 'indicator_data', ?, 'VERIFY', ?, ?)
      `, [
        uuidv4(),
        id,
        verified_by,
        JSON.stringify({ verified: true, previous_status: currentData[0]?.status })
      ]);
    });
  }

  // Delete indicator data
  static async delete(id: string, deleted_by: string): Promise<void> {
    return executeTransaction(async (connection) => {
      // Get current data for audit
      const [currentData] = await connection.execute(
        'SELECT * FROM indicator_data WHERE id = ?',
        [id]
      );

      if (!Array.isArray(currentData) || currentData.length === 0) {
        throw new Error('Data tidak ditemukan');
      }

      // Delete the record
      await connection.execute('DELETE FROM indicator_data WHERE id = ?', [id]);

      // Log audit trail
      await connection.execute(`
        INSERT INTO data_audit_log (id, table_name, record_id, action, user_id, new_values)
        VALUES (?, 'indicator_data', ?, 'DELETE', ?, ?)
      `, [
        uuidv4(),
        id,
        deleted_by,
        JSON.stringify({ deleted: currentData[0] })
      ]);
    });
  }

  // Bulk import data
  static async bulkImport(
    data: BulkImportData[],
    created_by: string,
    overwrite: boolean = false
  ): Promise<{ success: number; errors: string[]; skipped: number }> {
    const results: { success: number; errors: string[]; skipped: number } = { success: 0, errors: [], skipped: 0 };
    
    return executeTransaction(async (connection) => {
      for (const item of data) {
        try {
          // Check for existing data
          let existingQuery = 'SELECT id FROM indicator_data WHERE indicator_id = ? AND year = ?';
          let existingParams = [item.indicator_id, item.year];

          if (item.period_month) {
            existingQuery += ' AND period_month = ?';
            existingParams.push(item.period_month);
          } else {
            existingQuery += ' AND period_month IS NULL';
          }

          if (item.period_quarter) {
            existingQuery += ' AND period_quarter = ?';
            existingParams.push(item.period_quarter);
          } else {
            existingQuery += ' AND period_quarter IS NULL';
          }

          const [existing] = await connection.execute(existingQuery, existingParams);

          if (Array.isArray(existing) && existing.length > 0) {
            if (overwrite) {
              // Update existing record
              await connection.execute(`
                UPDATE indicator_data 
                SET value = ?, notes = ?, source_document = ?, revision_number = revision_number + 1, updated_at = CURRENT_TIMESTAMP
                WHERE indicator_id = ? AND year = ? ${item.period_month ? 'AND period_month = ?' : 'AND period_month IS NULL'} ${item.period_quarter ? 'AND period_quarter = ?' : 'AND period_quarter IS NULL'}
              `, [
                item.value, 
                item.notes, 
                item.source_document, 
                item.indicator_id, 
                item.year,
                ...(item.period_month ? [item.period_month] : []),
                ...(item.period_quarter ? [item.period_quarter] : [])
              ]);
              
              results.success++;
            } else {
              results.skipped++;
            }
          } else {
            // Insert new record
            const id = uuidv4();
            await connection.execute(`
              INSERT INTO indicator_data (
                id, indicator_id, year, period_month, period_quarter, value, notes, source_document, created_by, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
            `, [id, item.indicator_id, item.year, item.period_month || null, item.period_quarter || null, item.value, item.notes, item.source_document, created_by]);
            
            results.success++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          let periodText = `Tahun ${item.year}`;
          if (item.period_month) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            periodText = `${monthNames[item.period_month - 1]} ${item.year}`;
          } else if (item.period_quarter) {
            periodText = `Q${item.period_quarter} ${item.year}`;
          }
          results.errors.push(`${periodText}: ${errorMessage}`);
        }
      }

      // Log bulk import audit
      await connection.execute(`
        INSERT INTO data_audit_log (id, table_name, record_id, action, user_id, new_values)
        VALUES (?, 'indicator_data', ?, 'BULK_IMPORT', ?, ?)
      `, [
        uuidv4(),
        'bulk_import',
        created_by,
        JSON.stringify({ 
          total_processed: data.length,
          results: results,
          timestamp: new Date().toISOString()
        })
      ]);

      return results;
    });
  }

  // Get data statistics by category
  static async getStatsByCategory(kategori: string) {
    const query = `
      SELECT 
        COUNT(*) as total_data_points,
        COUNT(CASE WHEN id.status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN id.status = 'preliminary' THEN 1 END) as preliminary_count,
        COUNT(CASE WHEN id.status = 'final' THEN 1 END) as final_count,
        COUNT(CASE WHEN id.verified_by IS NOT NULL THEN 1 END) as verified_count,
        MIN(id.year) as earliest_year,
        MAX(id.year) as latest_year
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      WHERE i.kategori = ?
    `;
    
    const results = await executeQuery<any[]>(query, [kategori]);
    return results[0];
  }

  // Get year range data for category
  static async getYearRangeByCategory(kategori: string) {
    const query = `
      SELECT DISTINCT year
      FROM indicator_data id
      JOIN indicators i ON id.indicator_id = i.id
      WHERE i.kategori = ?
      ORDER BY year DESC
    `;
    
    const results = await executeQuery<{ year: number }[]>(query, [kategori]);
    return results.map(r => r.year);
  }
}

import { executeQuery, executeTransaction } from './connection';
import { v4 as uuidv4 } from 'uuid';

// Types for indicator management
export interface Indicator {
  id: string;
  code?: string;
  no: number;
  indikator: string;
  kategori: 'Statistik Ekonomi' | 'Statistik Demografi & Sosial' | 'Statistik Lingkungan Hidup & Multi-Domain';
  subcategory?: string;
  satuan: string;
  source?: string;
  methodology?: string;
  deskripsi?: string;
  is_active: boolean;
  created_by?: string;
  category_id?: string;
  created_at?: Date;
  updated_at?: Date;
  // Metadata fields
  level?: string;
  wilayah?: string;
  periode?: string;
  konsep_definisi?: string;
  metode_perhitungan?: string;
  interpretasi?: string;
}

export interface IndicatorData {
  id: string;
  indicator_id: string;
  year: number;
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

export interface CreateIndicatorRequest {
  code?: string;
  no: number;
  indikator: string;
  kategori: 'Statistik Ekonomi' | 'Statistik Demografi & Sosial' | 'Statistik Lingkungan Hidup & Multi-Domain';
  subcategory?: string;
  satuan: string;
  source?: string;
  methodology?: string;
  deskripsi?: string;
  created_by: string;
  category_id?: string;
  is_active?: boolean;
  // Metadata fields
  level?: string;
  wilayah?: string;
  periode?: string;
  konsep_definisi?: string;
  metode_perhitungan?: string;
  interpretasi?: string;
}

export interface CreateIndicatorDataRequest {
  indicator_id: string;
  year: number;
  value?: number;
  status?: 'draft' | 'preliminary' | 'final';
  notes?: string;
  created_by: string;
  source_document?: string;
}

export interface UpdateIndicatorDataRequest {
  year?: number;
  value?: number;
  status?: 'draft' | 'preliminary' | 'final';
  notes?: string;
  verified_by?: string;
  source_document?: string;
}

// Indicator CRUD operations
export class IndicatorModel {
  // Get indicators by category with pagination
  static async getByCategory(
    kategori: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ indicators: Indicator[]; total: number; pages: number }> {
    const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
    const normalizedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 10, 100));
    const offset = (safePage - 1) * normalizedLimit;
    
    let whereClause = 'WHERE kategori = ?';
    let params: any[] = [kategori];
    
    if (search) {
      whereClause += ' AND (indikator LIKE ? OR code LIKE ? OR subcategory LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM indicators ${whereClause}`;
    const countResult = await executeQuery<{ total: number }[]>(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated results
    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        u.full_name as created_by_name,
        im.level,
        im.wilayah,
        im.periode,
        im.konsep_definisi,
        im.metode_perhitungan,
        im.interpretasi
      FROM indicators i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN indicator_metadata im ON i.id = im.indicator_id
      ${whereClause}
      ORDER BY i.no ASC, i.created_at DESC
      LIMIT ${normalizedLimit} OFFSET ${offset}
    `;
    
    const indicators = await executeQuery<Indicator[]>(query, params);
    
    return {
      indicators,
      total,
      pages: Math.ceil(total / normalizedLimit)
    };
  }

  // Get indicator by ID
  static async getById(id: string): Promise<Indicator | null> {
    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        u.full_name as created_by_name,
        im.level,
        im.wilayah,
        im.periode,
        im.konsep_definisi,
        im.metode_perhitungan,
        im.interpretasi
      FROM indicators i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN indicator_metadata im ON i.id = im.indicator_id
      WHERE i.id = ?
    `;
    
    const results = await executeQuery<Indicator[]>(query, [id]);
    return results[0] || null;
  }

  // Create new indicator
  static async create(data: CreateIndicatorRequest): Promise<string> {
    const id = uuidv4();
    
    return executeTransaction(async (connection) => {
      // Insert indicator
      const query = `
        INSERT INTO indicators (
          id, code, no, indikator, kategori, subcategory, satuan,
          source, methodology, deskripsi, created_by, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(query, [
        id,
        data.code || null,
        data.no,
        data.indikator,
        data.kategori,
        data.subcategory || null,
        data.satuan,
        data.source || null,
        data.methodology || null,
        data.deskripsi || null,
        data.created_by,
        data.category_id || null
      ]);

      // Insert metadata if provided
      const metadataFields = ['level', 'wilayah', 'periode', 'konsep_definisi', 'metode_perhitungan', 'interpretasi'];
      const hasMetadata = metadataFields.some(field => data[field as keyof CreateIndicatorRequest]);

      if (hasMetadata) {
        const metadataId = uuidv4();
        const metadataQuery = `
          INSERT INTO indicator_metadata (
            id, indicator_id, level, wilayah, periode,
            konsep_definisi, metode_perhitungan, interpretasi
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.execute(metadataQuery, [
          metadataId,
          id,
          data.level || 'Kabupaten',
          data.wilayah || 'Kabupaten Bungo',
          data.periode || 'Tahunan',
          data.konsep_definisi || null,
          data.metode_perhitungan || null,
          data.interpretasi || null
        ]);
      }

      // Log audit trail
      await connection.execute(`
        INSERT INTO data_audit_log (id, table_name, record_id, action, user_id, new_values)
        VALUES (?, 'indicators', ?, 'CREATE', ?, ?)
      `, [
        uuidv4(),
        id,
        data.created_by,
        JSON.stringify(data)
      ]);

      return id;
    });
  }

  // Update indicator
  static async update(id: string, data: Partial<CreateIndicatorRequest>, updated_by: string): Promise<void> {
    return executeTransaction(async (connection) => {
      // Get current data for audit
      const [currentData] = await connection.execute(
        'SELECT * FROM indicators WHERE id = ?',
        [id]
      );

      // Separate indicator fields from metadata fields
      const indicatorFields = ['code', 'no', 'indikator', 'kategori', 'subcategory', 'satuan', 'source', 'methodology', 'deskripsi', 'is_active'];
      const metadataFields = ['level', 'wilayah', 'periode', 'konsep_definisi', 'metode_perhitungan', 'interpretasi'];

      // Update indicators table (exclude category_id to avoid foreign key constraint)
      const indicatorData: any = {};
      indicatorFields.forEach(field => {
        if (field in data && data[field as keyof CreateIndicatorRequest] !== undefined) {
          // Convert undefined to null for MySQL
          const value = data[field as keyof CreateIndicatorRequest];
          indicatorData[field] = value === undefined ? null : value;
        }
      });

      if (Object.keys(indicatorData).length > 0) {
        // Check if updated_by column exists in the database
        try {
          const columnCheck = await connection.execute(
            `SELECT COUNT(*) as count FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'indicators' 
             AND COLUMN_NAME = 'updated_by'`
          ) as any[];
          
          const hasUpdatedByColumn = columnCheck[0]?.[0]?.count > 0;
          
          const setClause = Object.keys(indicatorData).map(field => `${field} = ?`).join(', ');
          const values = Object.values(indicatorData).map(v => v === undefined ? null : v);
          
          if (hasUpdatedByColumn) {
            // Include updated_by if column exists
            const query = `UPDATE indicators SET ${setClause}, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            await connection.execute(query, [...values, updated_by, id]);
          } else {
            // Exclude updated_by if column doesn't exist
            const query = `UPDATE indicators SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            await connection.execute(query, [...values, id]);
          }
        } catch (error) {
          // Fallback: assume column doesn't exist
          const setClause = Object.keys(indicatorData).map(field => `${field} = ?`).join(', ');
          const values = Object.values(indicatorData).map(v => v === undefined ? null : v);
          const query = `UPDATE indicators SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
          await connection.execute(query, [...values, id]);
        }
      }

      // Update metadata table
      const metadataData: any = {};
      metadataFields.forEach(field => {
        if (field in data && data[field as keyof CreateIndicatorRequest] !== undefined) {
          metadataData[field] = data[field as keyof CreateIndicatorRequest];
        }
      });

      if (Object.keys(metadataData).length > 0) {
        // Check if metadata exists
        const [existingMetadata] = await connection.execute(
          'SELECT id FROM indicator_metadata WHERE indicator_id = ?',
          [id]
        ) as any[];

        if (existingMetadata.length > 0) {
          // Update existing metadata
          const setClause = Object.keys(metadataData).map(field => `${field} = ?`).join(', ');
          const values = Object.values(metadataData).map(val => val || null);
          const query = `UPDATE indicator_metadata SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE indicator_id = ?`;
          await connection.execute(query, [...values, id]);
        } else {
          // Create new metadata
          const metadataId = uuidv4();
          const fields = ['id', 'indicator_id', ...Object.keys(metadataData)];
          const placeholders = fields.map(() => '?').join(', ');
          const values = [metadataId, id, ...Object.values(metadataData).map(val => val || null)];
          const query = `INSERT INTO indicator_metadata (${fields.join(', ')}) VALUES (${placeholders})`;
          await connection.execute(query, values);
        }
      }

      // Log audit trail
      await connection.execute(`
        INSERT INTO data_audit_log (id, table_name, record_id, action, user_id, old_values, new_values)
        VALUES (?, 'indicators', ?, 'UPDATE', ?, ?, ?)
      `, [
        uuidv4(),
        id,
        updated_by,
        JSON.stringify(currentData),
        JSON.stringify(data)
      ]);
    });
  }

  // Delete indicator (soft delete or hard delete)
  static async delete(id: string, deleted_by: string, hardDelete: boolean = false): Promise<void> {
    return executeTransaction(async (connection) => {
      // Get current data for audit
      const [currentData] = await connection.execute(
        'SELECT * FROM indicators WHERE id = ?',
        [id]
      );

      if (hardDelete) {
        // Hard delete - actually remove from database
        // First delete related metadata to avoid foreign key constraints
        await connection.execute(
          'DELETE FROM indicator_metadata WHERE indicator_id = ?',
          [id]
        );
        
        // Then delete the indicator
        await connection.execute(
          'DELETE FROM indicators WHERE id = ?',
          [id]
        );
      } else {
        // Soft delete - just mark as inactive
        await connection.execute(
          'UPDATE indicators SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );
      }

      // Log audit trail
      await connection.execute(`
        INSERT INTO data_audit_log (id, table_name, record_id, action, user_id, old_values)
        VALUES (?, 'indicators', ?, ?, ?, ?)
      `, [
        uuidv4(),
        id,
        hardDelete ? 'DELETE' : 'DEACTIVATE',
        deleted_by,
        JSON.stringify(currentData)
      ]);
    });
  }

  // Get indicator statistics by category
  static async getStatsByCategory(kategori: string) {
    const query = `
      SELECT 
        COUNT(*) as total_indicators,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_indicators,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_indicators,
        (SELECT COUNT(*) FROM indicator_data id 
         JOIN indicators i ON id.indicator_id = i.id 
         WHERE i.kategori = ?) as total_data_points
      FROM indicators 
      WHERE kategori = ?
    `;
    
    const results = await executeQuery<any[]>(query, [kategori, kategori]);
    return results[0];
  }
}

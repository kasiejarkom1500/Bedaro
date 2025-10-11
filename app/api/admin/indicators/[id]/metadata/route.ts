import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/connection';
import { 
  authenticateRequest, 
  createErrorResponse, 
  createSuccessResponse,
  logActivity
} from '@/lib/auth-utils';

// GET /api/admin/indicators/[id]/metadata - Get metadata for a specific indicator
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== METADATA ENDPOINT CALLED ===');
    console.log('Indicator ID:', params.id);
    
    // Authenticate user
    const { user, error } = await authenticateRequest(request);
    if (!user) {
      console.log('Authentication failed:', error);
      return createErrorResponse(error || 'Authentication required', 401);
    }

    console.log('User authenticated:', user.email);
    const indicatorId = params.id;

    // Check if indicator exists and user has access
    const indicatorQuery = `
      SELECT i.id, i.indikator, i.kategori
      FROM indicators i 
      WHERE i.id = ?
    `;
    
    const indicatorResult: any = await executeQuery(indicatorQuery, [indicatorId]);
    
    if (indicatorResult.length === 0) {
      return createErrorResponse('Indicator not found', 404);
    }

    const indicator = indicatorResult[0];

    // Check role-based access
    if (user.role === 'admin_demografi' && indicator.kategori !== 'Statistik Demografi & Sosial') {
      return createErrorResponse('Access denied for this category', 403);
    }
    if (user.role === 'admin_ekonomi' && indicator.kategori !== 'Statistik Ekonomi') {
      return createErrorResponse('Access denied for this category', 403);
    }
    if (user.role === 'admin_lingkungan' && indicator.kategori !== 'Statistik Lingkungan Hidup & Multi-Domain') {
      return createErrorResponse('Access denied for this category', 403);
    }

    // Get metadata for the indicator
    const metadataQuery = `
      SELECT 
        im.level,
        im.wilayah,
        im.periode,
        im.konsep_definisi,
        im.metode_perhitungan,
        im.interpretasi,
        i.satuan,
        im.created_at,
        im.updated_at
      FROM indicators i
      LEFT JOIN indicator_metadata im ON i.id = im.indicator_id
      WHERE i.id = ?
    `;
    
    const metadataResult: any = await executeQuery(metadataQuery, [indicatorId]);
    
    console.log('Metadata query result:', metadataResult);
    console.log('Number of metadata records found:', metadataResult.length);
    
    // Transform the data into field-value pairs for display
    const metadata = [];
    
    if (metadataResult.length > 0) {
      const data = metadataResult[0];
      
      // Always show satuan from indicators table
      if (data.satuan) {
        metadata.push({ 
          field_name: 'Satuan', 
          field_value: data.satuan, 
          source: 'indicators',
          created_at: data.created_at 
        });
      }
      
      // Add metadata fields if they exist
      if (data.level) {
        metadata.push({ 
          field_name: 'Level', 
          field_value: data.level, 
          source: 'indicator_metadata',
          created_at: data.created_at 
        });
      }
      
      if (data.wilayah) {
        metadata.push({ 
          field_name: 'Wilayah', 
          field_value: data.wilayah, 
          source: 'indicator_metadata',
          created_at: data.created_at 
        });
      }
      
      if (data.periode) {
        metadata.push({ 
          field_name: 'Periode', 
          field_value: data.periode, 
          source: 'indicator_metadata',
          created_at: data.created_at 
        });
      }
      
      if (data.konsep_definisi) {
        metadata.push({ 
          field_name: 'Konsep & Definisi', 
          field_value: data.konsep_definisi, 
          source: 'indicator_metadata',
          created_at: data.created_at 
        });
      }
      
      if (data.metode_perhitungan) {
        metadata.push({ 
          field_name: 'Metode Perhitungan', 
          field_value: data.metode_perhitungan, 
          source: 'indicator_metadata',
          created_at: data.created_at 
        });
      }
      
      if (data.interpretasi) {
        metadata.push({ 
          field_name: 'Interpretasi', 
          field_value: data.interpretasi, 
          source: 'indicator_metadata',
          created_at: data.created_at 
        });
      }
    }

    // Log activity
    await logActivity(user.id, 'VIEW_INDICATOR_METADATA', 'indicator_metadata', indicatorId, {
      indicator_name: indicator.indikator
    });

    console.log('Final metadata array:', metadata);
    console.log('Returning response with', metadata.length, 'metadata fields');

    return createSuccessResponse({
      indicator: {
        id: indicator.id,
        name: indicator.indikator,
        category: indicator.kategori
      },
      metadata: metadata
    });

  } catch (error) {
    console.error('Error fetching indicator metadata:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
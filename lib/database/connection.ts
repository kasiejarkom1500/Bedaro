import mysql from 'mysql2/promise';

// Database configuration with fallback
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bps_bungo_db',
  // Try socket first, then fallback to TCP
  ...(process.env.DB_SOCKET ? { socketPath: process.env.DB_SOCKET } : {}),
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
};

// Create connection pool for better performance
let pool: mysql.Pool;

try {
  pool = mysql.createPool(dbConfig);
} catch (error) {
  console.warn('Failed to create pool with socket, trying TCP connection...');
  // Fallback to TCP connection without socket
  const tcpConfig = {
    ...dbConfig,
    socketPath: undefined
  };
  pool = mysql.createPool(tcpConfig);
}

// Database connection wrapper with error handling and fallback
export async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error: any) {
    console.error('Database connection error:', error);
    
    // If socket connection fails, try creating TCP connection
    if (error.code === 'ENOENT' && error.path?.includes('mysql.sock')) {
      console.warn('Socket connection failed, trying TCP connection...');
      try {
        const tcpConfig = {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306'),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'bps_bungo_db',
          connectionLimit: 10,
          waitForConnections: true,
          queueLimit: 0
        };
        const tcpPool = mysql.createPool(tcpConfig);
        const connection = await tcpPool.getConnection();
        return connection;
      } catch (tcpError) {
        console.error('TCP connection also failed:', tcpError);
        throw new Error('Failed to connect to database via socket and TCP');
      }
    }
    
    throw new Error('Failed to connect to database');
  }
}

// Execute query with automatic connection management
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T> {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results as T;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Execute transaction with automatic rollback on error
export async function executeTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    console.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await executeQuery('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Get database statistics
export async function getDatabaseStats() {
  try {
    const stats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM indicators) as total_indicators,
        (SELECT COUNT(*) FROM indicator_data) as total_data_points,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM data_audit_log) as total_audit_logs
    `);
    return stats[0];
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}
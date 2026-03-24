import pool from './hrm_db';

export async function logAudit(userId: string | null, actionDetail: string, connection?: any) {
  try {
    const safeUserId = userId ? decodeURIComponent(userId) : 'System';
    const query = 'INSERT INTO tbl_audit_logs (user_id, action_detail, action_date) VALUES (?, ?, NOW())';
    const params = [safeUserId, actionDetail];
    
    if (connection) {
      await connection.query(query, params);
    } else {
      await pool.query(query, params);
    }
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
}

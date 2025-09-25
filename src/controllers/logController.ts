// src/controllers/logController.ts
import pool from "@/utils/db";
import { RowDataPacket } from "mysql2";

export interface LogEntry extends RowDataPacket {
  log_id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  changed_by: string;
  changes: string; // JSON string
  created_at: string;
}

/**
 * Get all logs
 */
export async function getLogs() {
  const [rows] = await pool.execute<LogEntry[]>(
    `SELECT * FROM ChangeLogs ORDER BY created_at DESC`
  );

  return rows.map((log) => ({
    ...log,
    changes: log.changes ? JSON.parse(log.changes) : {},
  }));
}

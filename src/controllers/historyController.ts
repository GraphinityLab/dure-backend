import pool from "@/utils/db";
import { RowDataPacket } from "mysql2";

/**
 * Interface for AppointmentHistory rows
 */
export interface AppointmentHistory extends RowDataPacket {
  history_id: number;
  appointment_id: number;
  client_name: string;
  service_name: string;
  service_price: number;
  service_category: string;
  service_description: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: string;
  staff_id: number | null;
  changed_by: string | null;
  created_at: string;
}

/**
 * Fetch all appointment history records
 */
export async function getAppointmentHistory(): Promise<AppointmentHistory[]> {
  try {
    const [rows] = await pool.execute<AppointmentHistory[]>(
      `SELECT * 
       FROM AppointmentHistory 
       ORDER BY created_at DESC`
    );
    return rows;
  } catch (err) {
    console.error("Error fetching appointment history:", err);
    throw new Error("Internal Server Error");
  }
}

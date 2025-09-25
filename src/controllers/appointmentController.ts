// controllers/appointmentController.ts
import { NextApiRequest } from "next";
import pool from "@/utils/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendEmail } from "@/utils/emailutils";
import moment from "moment";

// ---------------- Types ----------------
interface Appointment extends RowDataPacket {
  appointment_id?: number;
  client_id: number;
  staff_id?: number | null;
  service_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
  status: "pending" | "confirmed" | "declined";
}

interface AppointmentWithDetails extends Appointment {
  userEmail: string;
  clientFirstName: string;
  clientLastName: string;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number;
  serviceCategory: string;
  staffFirstName: string;
  staffLastName: string;
}

// ---------------- Helpers ----------------
async function saveHistory(
  appointment_id: number,
  changed_by: string | null = null
) {
  const [rows] = await pool.execute<any[]>(
    `SELECT a.*,
            CONCAT(c.first_name, ' ', c.last_name) AS client_name,
            s.name AS service_name,
            s.price AS service_price,
            s.category AS service_category,
            s.description AS service_description
     FROM Appointments a
     JOIN Clients c ON a.client_id = c.client_id
     JOIN Services s ON a.service_id = s.service_id
     WHERE a.appointment_id = ?`,
    [appointment_id]
  );

  if (rows.length > 0) {
    const app = rows[0];
    await pool.execute<ResultSetHeader>(
      `INSERT INTO AppointmentHistory (
         appointment_id,
         client_name,
         service_name,
         service_price,
         service_category,
         service_description,
         appointment_date,
         start_time,
         end_time,
         notes,
         status,
         staff_id,
         changed_by
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         client_name = VALUES(client_name),
         service_name = VALUES(service_name),
         service_price = VALUES(service_price),
         service_category = VALUES(service_category),
         service_description = VALUES(service_description),
         appointment_date = VALUES(appointment_date),
         start_time = VALUES(start_time),
         end_time = VALUES(end_time),
         notes = VALUES(notes),
         status = VALUES(status),
         staff_id = VALUES(staff_id),
         changed_by = VALUES(changed_by),
         created_at = CURRENT_TIMESTAMP`,
      [
        appointment_id,
        app.client_name,
        app.service_name,
        app.service_price,
        app.service_category,
        app.service_description,
        app.appointment_date,
        app.start_time,
        app.end_time,
        app.notes,
        app.status,
        app.staff_id,
        changed_by,
      ]
    );
  }
}

async function logChange({
  entity_type,
  entity_id,
  action,
  changed_by,
  changes,
}: {
  entity_type: string;
  entity_id: number;
  action: string;
  changed_by: string | null;
  changes?: any;
}) {
  const timestamp = new Date();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO ChangeLogs (entity_type, entity_id, action, changed_by, changes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entity_type,
      entity_id,
      action,
      changed_by ?? "Unknown",
      JSON.stringify(changes ?? {}),
      timestamp,
    ]
  );
}

// ---------------- Controllers ----------------

export async function getAppointments(mockRequest?: NextApiRequest) {
  const query = `
    SELECT 
      A.*,
      C.first_name AS clientFirstName, 
      C.last_name AS clientLastName, 
      S.name AS serviceName,
      S.description AS serviceDescription,
      S.price AS servicePrice,
      S.category AS serviceCategory
    FROM Appointments AS A
    INNER JOIN Clients AS C ON A.client_id = C.client_id
    INNER JOIN Services AS S ON A.service_id = S.service_id
  `;
  const [rows] = await pool.execute<any[]>(query);
  return rows;
}

export async function getAppointmentById(id: string) {
  const [rows] = await pool.execute<AppointmentWithDetails[]>(
    `SELECT a.*, 
            c.first_name AS clientFirstName, 
            c.last_name AS clientLastName, 
            s.name AS serviceName, 
            s.description AS serviceDescription, 
            s.price AS servicePrice
     FROM Appointments a
     JOIN Clients c ON a.client_id = c.client_id
     JOIN Services s ON a.service_id = s.service_id
     WHERE a.appointment_id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createAppointment(data: any, changed_by: string | null = null) {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO Appointments 
      (client_id, service_id, appointment_date, start_time, end_time, notes, status, staff_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.client_id,
      data.service_id,
      data.appointment_date,
      data.start_time,
      data.end_time,
      data.notes,
      data.status,
      data.staff_id,
    ]
  );

  const newId = result.insertId;
  await saveHistory(newId, changed_by);
  await logChange({
    entity_type: "appointment",
    entity_id: newId,
    action: "create",
    changed_by: changed_by ?? "Unknown",
    changes: { old: null, new: data },
  });

  return { message: "Appointment created successfully", appointment_id: newId };
}

export async function updateAppointment(data: any, changed_by: string | null = null) {
  const { appointment_id } = data;

  const [beforeRows] = await pool.execute<any[]>(
    `SELECT * FROM Appointments WHERE appointment_id = ?`,
    [appointment_id]
  );
  const before = beforeRows[0];
  if (!before) throw new Error("Appointment not found");

  const fields: string[] = [];
  const params: any[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key !== "appointment_id") {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }
  params.push(appointment_id);

  await pool.execute<ResultSetHeader>(
    `UPDATE Appointments SET ${fields.join(", ")} WHERE appointment_id = ?`,
    params
  );

  const [afterRows] = await pool.execute<any[]>(
    `SELECT * FROM Appointments WHERE appointment_id = ?`,
    [appointment_id]
  );
  const after = afterRows[0];

  await saveHistory(Number(appointment_id), changed_by);
  await logChange({
    entity_type: "appointment",
    entity_id: Number(appointment_id),
    action: "update",
    changed_by: changed_by ?? "Unknown",
    changes: { old: before, new: after },
  });

  return { message: "Appointment updated successfully" };
}

export async function confirmDeclineAppointment(
  data: { appointment_id: string; status: "confirmed" | "declined"; staff_id?: number; reason?: string },
  changed_by: string | null = null
) {
  const { appointment_id, status, staff_id, reason } = data;

  const [beforeRows] = await pool.execute<any[]>(
    `SELECT * FROM Appointments WHERE appointment_id = ?`,
    [appointment_id]
  );
  const before = beforeRows[0];
  if (!before) throw new Error("Appointment not found");

  if (status === "confirmed" && !staff_id)
    throw new Error("Staff ID is required to confirm an appointment");
  if (status === "declined" && !reason)
    throw new Error("Reason is required when declining an appointment");

  await pool.execute<ResultSetHeader>(
    `UPDATE Appointments 
     SET status = ?, staff_id = ?, notes = ? 
     WHERE appointment_id = ?`,
    [status, staff_id ?? null, status === "declined" ? reason : null, appointment_id]
  );

  const [afterRows] = await pool.execute<any[]>(
    `SELECT * FROM Appointments WHERE appointment_id = ?`,
    [appointment_id]
  );
  const after = afterRows[0];

  await saveHistory(Number(appointment_id), changed_by);
  await logChange({
    entity_type: "appointment",
    entity_id: Number(appointment_id),
    action: status,
    changed_by: changed_by ?? "Unknown",
    changes: { old: before, new: after },
  });

  // 🔹 Email notifications
  const [rows] = await pool.execute<AppointmentWithDetails[]>(
    `SELECT a.*, c.email as userEmail, 
            s.first_name as staffFirstName, s.last_name as staffLastName, 
            svc.name as serviceName, svc.price as servicePrice
     FROM Appointments a
     JOIN Clients c ON a.client_id = c.client_id
     LEFT JOIN Staff s ON a.staff_id = s.staff_id
     JOIN Services svc ON a.service_id = svc.service_id
     WHERE a.appointment_id = ?`,
    [appointment_id]
  );
  const appointment = rows[0];
  if (appointment) {
    try {
      const subject =
        status === "confirmed"
          ? `✨ Your Appointment Has Been Confirmed!`
          : `⚠️ Your Appointment Has Been Declined`;

      const appointmentDate = moment(appointment.appointment_date).format(
        "dddd, MMMM Do YYYY"
      );
      const startTime = appointment.start_time;
      const endTime = appointment.end_time;
      const greeting = appointment.clientFirstName
        ? `Hello ${appointment.clientFirstName},`
        : "Hello,";

      const body =
        status === "confirmed"
          ? `
            <h2>Appointment Confirmed ✅</h2>
            <p>${greeting}</p>
            <p>Your appointment for <b>${appointment.serviceName}</b> has been <b>confirmed</b>.</p>
            <p><b>Date:</b> ${appointmentDate}<br/>
               <b>Time:</b> ${startTime} - ${endTime}<br/>
               <b>Staff:</b> ${appointment.staffFirstName ?? ""} ${
              appointment.staffLastName ?? ""
            }</p>
          `
          : `
            <h2>Appointment Declined ❌</h2>
            <p>${greeting}</p>
            <p>Unfortunately, your appointment for <b>${appointment.serviceName}</b> on <b>${appointmentDate}</b> at <b>${startTime} - ${endTime}</b> has been declined.</p>
            <p><b>Reason:</b> ${reason}</p>
            <p>Please try booking another time.</p>
          `;

      await sendEmail(
        appointment.userEmail,
        subject,
        `<html><body>${body}</body></html>`
      );
    } catch (err) {
      console.error("Email failed:", err);
    }
  }

  return { message: `Appointment ${status} successfully` };
}

export async function deleteAppointment(id: string, changed_by: string | null = null) {
  if (!id || isNaN(Number(id))) throw new Error("Invalid appointment ID");

  const [beforeRows] = await pool.execute<any[]>(
    `SELECT * FROM Appointments WHERE appointment_id = ?`,
    [id]
  );
  const before = beforeRows[0];
  if (!before) throw new Error("Appointment not found");

  await pool.execute<ResultSetHeader>(
    `DELETE FROM Appointments WHERE appointment_id = ?`,
    [id]
  );

  await logChange({
    entity_type: "appointment",
    entity_id: Number(id),
    action: "delete",
    changed_by: changed_by ?? "Unknown",
    changes: { old: before, new: null },
  });

  return { message: "Appointment deleted successfully" };
}

import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/utils/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { sendEmail } from "@/utils/emailutils";
import moment from "moment";

// Define interfaces for your data structures.
interface Appointment extends RowDataPacket {
    appointment_id?: number;
    user_id: number;
    timeslot_id: number;
    service_id: number;
    created_at?: string;
    status: "pending" | "confirmed" | "declined";
}

interface AppointmentWithDetails extends Appointment {
    userEmail: string;
    clientFirstName: string;
    clientLastName: string;
    serviceName: string;
    serviceDescription: string; // Added serviceDescription to the interface
    servicePrice: number; // Added servicePrice to the interface
    serviceCategory: string; // Added serviceCategory
    staffFirstName: string;
    staffLastName: string;
}

/**
 * @desc Get all appointments with associated client and service details
 * @param req The NextApiRequest object.
 * @param res The NextApiResponse object to send the response.
 */
export async function getAppointments(mockRequest?: NextApiRequest, p0?: any) {
    try {
        // SQL query to join Appointments with Clients and Services tables
        const query = `
    SELECT 
      A.*,
      C.first_name AS clientFirstName, 
      C.last_name AS clientLastName, 
      S.name AS serviceName,
      S.description AS serviceDescription,
      S.price AS servicePrice,
      S.category AS serviceCategory
    FROM 
      Appointments AS A
    INNER JOIN 
      Clients AS C ON A.client_id = C.client_id
    INNER JOIN 
      Services AS S ON A.service_id = S.service_id
    `;

        const [rows] = await pool.execute<any[]>(query);
        return rows;
    } catch (err) {
        console.error("Error fetching appointments:", err);
        throw new Error("Internal Server Error");
    }
}


/**
 * @desc Get a single appointment by ID with details
 * @param id The appointment ID.
 */
export async function getAppointmentById(id: string) {
    const [rows] = await pool.execute<AppointmentWithDetails[]>(
        `SELECT a.*, c.first_name AS clientFirstName, c.last_name AS clientLastName, s.name AS serviceName, s.description AS serviceDescription, s.price AS servicePrice
    FROM Appointments a
    JOIN Clients c ON a.client_id = c.client_id
    JOIN Services s ON a.service_id = s.service_id
    WHERE a.appointment_id = ?`,
        [id]
    );
    return rows[0] ?? null;
}

// ✅ Update
export async function updateAppointment(data: {
    appointment_id: string;
    staff_id?: number;
    appointment_date?: string;
    start_time?: string;
    service_id?: number;
    status?: string;
    notes?: string; // Added notes to the interface
}) {
    const { appointment_id, staff_id, appointment_date, start_time, service_id, status, notes } = data;

    // We will now handle a potential change to the timeslot.
    // First, get the current appointment and service details.
    const [currentApp] = await pool.execute<any[]>(
        `SELECT a.service_id, a.appointment_date, a.start_time, s.duration_minutes
     FROM Appointments a
     JOIN Services s ON a.service_id = s.service_id
     WHERE a.appointment_id = ?`,
        [appointment_id]
    );

    if (currentApp.length === 0) {
        throw new Error("Appointment not found or no changes were made.");
    }

    const currentServiceId = currentApp[0].service_id;
    const newServiceId = service_id || currentServiceId;

    // Calculate the new start and end times based on the updated data.
    let newAppointmentDate = appointment_date || currentApp[0].appointment_date;
    let newStartTime = start_time || currentApp[0].start_time;

    // Get the duration for the potentially new service.
    const [newServiceDetails] = await pool.execute<any[]>(
        `SELECT duration_minutes FROM services WHERE service_id = ?`,
        [newServiceId]
    );
    const durationMinutes = newServiceDetails[0]?.duration_minutes || currentApp[0].duration_minutes;

    // Calculate the end time for the new appointment slot.
    const startDate = moment(`${newAppointmentDate}T${newStartTime}`);
    const endDate = moment(startDate).add(durationMinutes, 'minutes');

    const formattedNewEndTime = endDate.format('HH:mm:ss');

    // CRITICAL AVAILABILITY CHECK: Look for any appointments that overlap.
    // We MUST exclude the current appointment from this check.
    const overlapCheckSql = `
    SELECT COUNT(*) AS count
    FROM appointments
    WHERE appointment_id != ? AND appointment_date = ?
    AND (
      (start_time <= ? AND end_time > ?) OR
      (start_time < ? AND end_time >= ?)
    )
  `;
    const [overlapResult] = await pool.execute<any[]>(overlapCheckSql, [
        appointment_id,
        newAppointmentDate,
        newStartTime,
        newStartTime,
        formattedNewEndTime,
        formattedNewEndTime,
    ]);

    if (overlapResult[0].count > 0) {
        throw new Error("The selected time slot is no longer available. Please select a different time.");
    }

    // If there's no overlap, proceed with the update.
    const fieldsToUpdate: string[] = [];
    const params: (string | number | null)[] = [];

    // Dynamically build the query based on provided data
    if (staff_id !== undefined) {
        fieldsToUpdate.push("staff_id = ?");
        params.push(staff_id === null ? null : staff_id);
    }
    if (service_id !== undefined) {
        fieldsToUpdate.push("service_id = ?");
        params.push(service_id === null ? null : service_id);
    }
    if (status !== undefined) {
        fieldsToUpdate.push("status = ?");
        params.push(status);
    }
    if (notes !== undefined) {
        fieldsToUpdate.push("notes = ?");
        params.push(notes);
    }

    // Add the newly validated timeslot fields to the update query.
    fieldsToUpdate.push("appointment_date = ?");
    params.push(newAppointmentDate);
    fieldsToUpdate.push("start_time = ?");
    params.push(newStartTime);
    fieldsToUpdate.push("end_time = ?");
    params.push(formattedNewEndTime);

    // Ensure at least one field is being updated
    if (fieldsToUpdate.length === 0) {
        throw new Error("No fields provided to update.");
    }

    // Construct the final query string
    const query = `UPDATE Appointments SET ${fieldsToUpdate.join(", ")} WHERE appointment_id = ?`;
    params.push(data.appointment_id);

    try {
        const [result] = await pool.execute<ResultSetHeader>(query, params);

        if (result.affectedRows === 0) {
            throw new Error("Appointment not found or no changes were made.");
        }

        return { message: "Appointment updated successfully" };
    } catch (error) {
        console.error("Error in updateAppointment:", error);
        throw error;
    }
}

// ✅ Delete
export async function deleteAppointment(id: string) {
    const [result] = await pool.execute<ResultSetHeader>(
        "DELETE FROM Appointments WHERE appointment_id = ?",
        [id]
    );

    if (result.affectedRows === 0) {
        throw new Error("Appointment not found");
    }

    return { message: "Appointment deleted successfully" };
}

// ✅ Confirm / Decline
export async function confirmDeclineAppointment(data: {
    appointment_id: string;
    status: "confirmed" | "declined";
    staff_id?: number;
}) {
    const { appointment_id, status, staff_id } = data;

    if (status === "confirmed" && !staff_id) {
        throw new Error("Staff ID is required to confirm an appointment");
    }

    await pool.execute<ResultSetHeader>(
        "UPDATE Appointments SET status = ?, staff_id = ? WHERE appointment_id = ?",
        [status, staff_id ?? null, appointment_id]
    );

    // Fetch details for email
    const [rows] = await pool.execute<AppointmentWithDetails[]>(
        `SELECT a.*, c.email as userEmail, s.first_name as staffFirstName, s.last_name as staffLastName, svc.name as serviceName, svc.price as servicePrice
    FROM Appointments a
    JOIN Clients c ON a.client_id = c.client_id
    LEFT JOIN Staff s ON a.staff_id = s.staff_id
    JOIN Services svc ON a.service_id = svc.service_id
    WHERE a.appointment_id = ?`,
        [appointment_id]
    );

    const appointment = rows[0];
    if (!appointment) {
        throw new Error("Appointment not found");
    }

    // Send email (don’t block on errors)
    try {
        const subject =
            status === "confirmed"
                ? `✨ Your Appointment Has Been Confirmed!`
                : `⚠️ Your Appointment Has Been Declined`;

        // Format appointment date and time
        const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString(
            "en-US",
            { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        );
        const startTime = appointment.start_time;
        const endTime = appointment.end_time;

        // Greeting (fallback to generic if no name)
        const greeting = appointment.clientFirstName
            ? `Hello ${appointment.clientFirstName},`
            : `Hello,`;

        const body =
            status === "confirmed"
                ? `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f7f6; padding: 20px; border-radius: 8px;">
          <h2 style="color: #5f4b5a; margin-bottom: 10px;">Appointment Confirmed ✅</h2>
          <p style="font-size: 16px;">${greeting}</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Great news! Your appointment for <b style="color:#c1a38f;">${appointment.serviceName}</b>
            has been <b style="color:green;">confirmed</b>.
          </p>
          <div style="margin: 20px 0; padding: 15px; background: #fff; border: 1px solid #e8dcd4; border-radius: 6px;">
            <p style="margin: 4px 0;"><b>Staff:</b> ${appointment.staffFirstName} ${appointment.staffLastName}</p>
            <p style="margin: 4px 0;"><b>Date:</b> ${appointmentDate}</p>
            <p style="margin: 4px 0;"><b>Time:</b> ${startTime} - ${endTime}</p>
            <p style="margin: 4px 0;"><b>Service:</b> ${appointment.serviceName} ($${appointment.servicePrice})</p>
          </div>
          <p style="font-size: 15px; line-height: 1.6;">
            We look forward to seeing you! If you need to reschedule, please contact us at your earliest convenience.
          </p>
          <p style="margin-top: 30px; font-size: 13px; color: #777;">
            — The Glamour Team ✨
          </p>
        </div>
      `
                : `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #fdf6f6; padding: 20px; border-radius: 8px;">
          <h2 style="color: #a94442; margin-bottom: 10px;">Appointment Declined ❌</h2>
          <p style="font-size: 16px;">${greeting}</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Unfortunately, your appointment for <b style="color:#c1a38f;">${appointment.serviceName}</b> 
            has been <b style="color:#a94442;">declined</b>.
          </p>
          <div style="margin: 20px 0; padding: 15px; background: #fff; border: 1px solid #f5c6cb; border-radius: 6px;">
            <p style="margin: 4px 0;"><b>Date:</b> ${appointmentDate}</p>
            <p style="margin: 4px 0;"><b>Time:</b> ${startTime} - ${endTime}</p>
            <p style="margin: 4px 0;"><b>Service:</b> ${appointment.serviceName} ($${appointment.servicePrice})</p>
          </div>
          <p style="font-size: 15px; line-height: 1.6;">
            We apologize for the inconvenience. Please try booking another time that works for you.
          </p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="https://yourdomain.com/book" 
               style="display:inline-block; background-color:#a94442; color:#fff; padding:12px 24px; 
                      text-decoration:none; border-radius:6px; font-weight:bold; font-size:15px;">
              Reschedule Appointment
            </a>
          </div>
          <p style="margin-top: 30px; font-size: 13px; color: #777;">
            — The Glamour Team ✨
          </p>
        </div>
      `;

        await sendEmail(
            appointment.userEmail,
            subject,
            `<html><body>${body}</body></html>`
        );
    } catch (err) {
        console.error("Email failed:", err);
    }

    return { message: `Appointment ${status} successfully` };
}

// ✅ Create
export async function createAppointment(data: {
    client_id: number;
    service_id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    notes: string;
    status: "pending" | "confirmed" | "declined";
    staff_id: number | null;
}) {
    const [result] = await pool.execute<ResultSetHeader>(
        "INSERT INTO Appointments (client_id, service_id, appointment_date, start_time, end_time, notes, status, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [data.client_id, data.service_id, data.appointment_date, data.start_time, data.end_time, data.notes, data.status, data.staff_id]
    );
    return {
        message: "Appointment created successfully",
        appointment_id: result.insertId,
    };
}

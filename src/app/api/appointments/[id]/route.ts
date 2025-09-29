import { NextRequest, NextResponse } from "next/server";
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  confirmDeclineAppointment,
} from "@/controllers/appointmentController";

// Permission checker
const checkPermissions = (request: NextRequest, requiredPermissions: string[]) => {
  const userPermissionsHeader = request.headers.get("x-user-permissions");
  if (!userPermissionsHeader) {
    return NextResponse.json({ message: "Permissions not found" }, { status: 403 });
  }
  try {
    const userPermissions = JSON.parse(userPermissionsHeader);
    const hasPermission = requiredPermissions.every((p) => userPermissions.includes(p));
    if (!hasPermission) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    return null;
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
};

// -------------------- GET appointment by ID --------------------
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(req, ["appointment_read_single"]);
  if (permissionError) return permissionError;

  const appointment = await getAppointmentById(id);
  if (!appointment) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(appointment);
}

// -------------------- PUT update appointment --------------------
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(req, ["appointment_update"]);
  if (permissionError) return permissionError;

  const body = await req.json();
  const result = await updateAppointment({ ...body, appointment_id: id });
  return NextResponse.json(result);
}

// -------------------- DELETE appointment --------------------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(req, ["appointment_delete"]);
  if (permissionError) return permissionError;

  const result = await deleteAppointment(id);
  return NextResponse.json(result);
}

// -------------------- PATCH confirm/decline appointment --------------------
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(req, ["appointment_confirm_deny"]);
  if (permissionError) return permissionError;

  const body = await req.json();
  if (!body.status || !["confirmed", "declined"].includes(body.status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const result = await confirmDeclineAppointment({
    appointment_id: id,
    status: body.status,
    staff_id: body.staff_id,
    reason: body.reason,
  });
  return NextResponse.json(result);
}

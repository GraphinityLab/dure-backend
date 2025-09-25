import { NextRequest, NextResponse } from "next/server";
import { getAppointments, createAppointment } from "@/controllers/appointmentController";

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

// GET all appointments
export async function GET(req: NextRequest) {
  const permissionError = checkPermissions(req, ["appointment_read_all"]);
  if (permissionError) return permissionError;

  const appointments = await getAppointments();
  return NextResponse.json(appointments);
}

// POST create appointment
export async function POST(req: NextRequest) {
  const permissionError = checkPermissions(req, ["appointment_create"]);
  if (permissionError) return permissionError;

  const body = await req.json();
  const result = await createAppointment(body);
  return NextResponse.json(result, { status: 201 });
}

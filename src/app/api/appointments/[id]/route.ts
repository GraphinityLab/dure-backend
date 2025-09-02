// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  confirmDeclineAppointment,
} from "@/controllers/appointmentController";

// Middleware-like function to check user permissions
const checkPermissions = (request: NextRequest, requiredPermissions: string[]) => {
  const userPermissionsHeader = request.headers.get('x-user-permissions');
  if (!userPermissionsHeader) {
    return NextResponse.json({ message: 'Permissions not found' }, { status: 403 });
  }

  try {
    const userPermissions = JSON.parse(userPermissionsHeader);
    const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));
    if (!hasPermission) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return null; // Permissions are valid
  } catch (error) {
    console.error('Error parsing user permissions:', error);
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
};

// GET appointment
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(req, ['appointment_read_single']);
  if (permissionError) {
    return permissionError;
  }

  try {
    const appointment = await getAppointmentById(params.id);
    if (!appointment) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(appointment);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PUT update appointment
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(req, ['appointment_update']);
  if (permissionError) {
    return permissionError;
  }
  
  try {
    const body = await req.json();
    const result = await updateAppointment({ ...body, appointment_id: params.id });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: err.message ?? "Internal Server Error" }, { status: 500 });
  }
}

// DELETE appointment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(req, ['appointment_delete']);
  if (permissionError) {
    return permissionError;
  }
  
  try {
    const result = await deleteAppointment(params.id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: err.message ?? "Internal Server Error" }, { status: 500 });
  }
}

// PATCH confirm/decline
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(req, ['appointment_confirm_deny']);
  if (permissionError) {
    return permissionError;
  }
  
  try {
    
    const { id } = params; // Correctly extract the id from the params object
    const body = await req.json();
    const { status, staff_id } = body;
    
    console.log(`Received PATCH request for appointment ID: ${id}`);
    console.log(`Request body:`, body);

    // Validate the status to prevent invalid values from reaching the controller
    if (!status || (status !== 'confirmed' && status !== 'declined')) {
      return NextResponse.json({ message: "Invalid status value provided." }, { status: 400 });
    }

    const result = await confirmDeclineAppointment({
      status,
      staff_id,
      appointment_id: id,
    });
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in PATCH handler:', err);
    return NextResponse.json({ message: err.message ?? "Internal Server Error" }, { status: 500 });
  }
}

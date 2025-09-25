import { NextRequest, NextResponse } from "next/server";
import { getAppointmentHistory } from "@/controllers/historyController";

// Helper function for permissions
const checkPermissions = (
  request: NextRequest,
  requiredPermissions: string[]
) => {
  const userPermissionsHeader = request.headers.get("x-user-permissions");
  if (!userPermissionsHeader) {
    return NextResponse.json({ message: "Permissions not found" }, { status: 403 });
  }

  try {
    const userPermissions = JSON.parse(userPermissionsHeader);
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
    if (!hasPermission) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null; // valid
  } catch (error) {
    console.error("Error parsing user permissions:", error);
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
};

// GET /api/history - Get all appointment history
export async function GET(request: NextRequest) {
  const permissionError = checkPermissions(request, ["appointment_read_all"]);
  if (permissionError) {
    return permissionError;
  }

  try {
    const history = await getAppointmentHistory();
    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error("GET history route error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from "next/server";
import { updateStaff, deleteStaff, getStaffByID } from "@/controllers/staffController";

// ---------------- Helpers ----------------
const createMockApiObjects = async (request: NextRequest, includeBody: boolean = false) => {
  let responseData: any = {};
  let responseStatus = 200;

  const body = includeBody ? await request.json().catch(() => ({})) : {};

  const mockRequest: any = {
    method: request.method,
    body,
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: Object.fromEntries(request.headers), // forward headers (identity + permissions)
  };

  const mockResponse = {
    status(statusCode: number) {
      responseStatus = statusCode;
      return mockResponse;
    },
    json(data: any) {
      responseData = data;
      return data;
    },
  };

  return {
    mockRequest,
    mockResponse,
    get responseData() {
      return responseData;
    },
    get responseStatus() {
      return responseStatus;
    },
  };
};

// ---------------- Permissions ----------------
const checkPermissions = (request: NextRequest, requiredPermissions: string[]) => {
  const userPermissionsHeader = request.headers.get("x-user-permissions");
  if (!userPermissionsHeader) {
    return NextResponse.json({ message: "Permissions not found" }, { status: 403 });
  }
  try {
    const userPermissions = JSON.parse(userPermissionsHeader);
    const hasPermission = requiredPermissions.every((p: string) =>
      userPermissions.includes(p)
    );
    if (!hasPermission) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
};

// ---------------- Routes ----------------

// GET staff by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(request, ["staff_read_single"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request, false);
  api.mockRequest.query.id = params.id;

  await getStaffByID(api.mockRequest, api.mockResponse as any);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// UPDATE staff
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(request, ["staff_update"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request, true);
  api.mockRequest.query.id = params.id;

  await updateStaff(api.mockRequest, api.mockResponse as any);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// DELETE staff
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(request, ["staff_delete"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request, true);
  api.mockRequest.query.id = params.id;

  await deleteStaff(api.mockRequest, api.mockResponse as any);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

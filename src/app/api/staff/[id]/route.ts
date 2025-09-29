import { NextResponse, NextRequest } from "next/server";
import { NextApiRequest, NextApiResponse } from "next";
import { updateStaff, deleteStaff, getStaffByID } from "@/controllers/staffController";

// ---------------- Helpers ----------------
const createMockApiObjects = async (
  request: NextRequest,
  includeBody = false
): Promise<{
  mockRequest: NextApiRequest;
  mockResponse: NextApiResponse;
  responseData: unknown;
  responseStatus: number;
}> => {
  let responseData: unknown = {};
  let responseStatus = 200;

  const body = includeBody ? await request.json().catch(() => ({})) : {};

  const mockRequest = {
    method: request.method as "GET" | "PUT" | "DELETE",
    body,
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: Object.fromEntries(request.headers),
    cookies: {},
    env: {},
  } as unknown as NextApiRequest;

  const mockResponse = {
    status(statusCode: number) {
      responseStatus = statusCode;
      return mockResponse;
    },
    json(data: unknown) {
      responseData = data;
      return mockResponse;
    },
  } as unknown as NextApiResponse;

  return {
    mockRequest,
    mockResponse,
    get responseData() {
      return responseData;
    },
    set responseData(value: unknown) {
      responseData = value;
    },
    get responseStatus() {
      return responseStatus;
    },
    set responseStatus(value: number) {
      responseStatus = value;
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
    const userPermissions: string[] = JSON.parse(userPermissionsHeader);
    const hasPermission = requiredPermissions.every((p) =>
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
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const permissionError = checkPermissions(request, ["staff_read_single"]);
  if (permissionError) return permissionError;

  const { id } = await context.params; // ✅ await params

  const api = await createMockApiObjects(request);
  api.mockRequest.query = { id };

  await getStaffByID(api.mockRequest, api.mockResponse);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// UPDATE staff
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const permissionError = checkPermissions(request, ["staff_update"]);
  if (permissionError) return permissionError;

  const { id } = await context.params; // ✅ await params

  const api = await createMockApiObjects(request, true);
  api.mockRequest.query = { id };

  await updateStaff(api.mockRequest, api.mockResponse);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// DELETE staff
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const permissionError = checkPermissions(request, ["staff_delete"]);
  if (permissionError) return permissionError;

  const { id } = await context.params; // ✅ await params

  const api = await createMockApiObjects(request, true);
  api.mockRequest.query = { id };

  await deleteStaff(api.mockRequest, api.mockResponse);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

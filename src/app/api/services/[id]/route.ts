import { NextRequest, NextResponse } from "next/server";
import { NextApiRequest, NextApiResponse } from "next";
import { getServiceById, updateService, deleteService } from "@/controllers/servicesController";

// ---------------- Permissions ----------------
const checkPermissions = (
  request: NextRequest,
  requiredPermissions: string[]
): NextResponse | null => {
  const userPermissionsHeader = request.headers.get("x-user-permissions");
  if (!userPermissionsHeader) {
    return NextResponse.json({ message: "Permissions not found" }, { status: 403 });
  }

  try {
    const userPermissions: string[] = JSON.parse(userPermissionsHeader);
    const hasPermission = requiredPermissions.every((p) => userPermissions.includes(p));
    if (!hasPermission) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
  } catch (error) {
    console.error("Error parsing user permissions:", error);
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
};

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
  let responseData: unknown;
  let responseStatus = 200;

  const mockRequest = {
    method: request.method as "GET" | "PUT" | "DELETE",
    body: includeBody ? await request.json().catch(() => ({})) : {},
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: Object.fromEntries(request.headers),
  } as unknown as NextApiRequest;

  // Minimal mock that the controllers accept
  const mockResponse = {
    status: (statusCode: number) => {
      responseStatus = statusCode;
      return mockResponse;
    },
    json: (data: unknown) => {
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

// ---------------- Routes ----------------

// GET /api/services/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(request, ["service_read_single"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request);
  api.mockRequest.query = { id };

  await getServiceById(api.mockRequest, api.mockResponse);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// PUT /api/services/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(request, ["service_update"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request, true);
  api.mockRequest.query = { id };
  api.mockRequest.body = { ...(api.mockRequest.body as Record<string, unknown>), service_id: id };

  await updateService(api.mockRequest, api.mockResponse);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// DELETE /api/services/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(request, ["service_delete"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request);
  api.mockRequest.query = { id };

  await deleteService(api.mockRequest, api.mockResponse);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

import { NextRequest, NextResponse } from "next/server";
import { NextApiRequest } from "next";
import { getServiceById, updateService, deleteService } from "@/controllers/servicesController";

// ---------------- Permissions ----------------
const checkPermissions = (request: NextRequest, requiredPermissions: string[]) => {
  const userPermissionsHeader = request.headers.get("x-user-permissions");
  if (!userPermissionsHeader) {
    return NextResponse.json({ message: "Permissions not found" }, { status: 403 });
  }

  try {
    const userPermissions = JSON.parse(userPermissionsHeader);
    const hasPermission = requiredPermissions.every((p) =>
      userPermissions.includes(p)
    );
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
const createMockApiObjects = async (request: NextRequest, includeBody: boolean = false) => {
  let responseData: any;
  let responseStatus: number = 200;

  const mockRequest: NextApiRequest = {
    method: request.method as "GET" | "PUT" | "DELETE",
    body: includeBody ? await request.json().catch(() => ({})) : {},
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: Object.fromEntries(request.headers), // ✅ forward headers
  } as NextApiRequest;

  const mockResponse = {
    status: (statusCode: number) => {
      responseStatus = statusCode;
      return mockResponse;
    },
    json: (data: any) => {
      responseData = data;
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

// ---------------- Routes ----------------

// GET /api/services/:id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(request, ["service_read_single"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request);
  api.mockRequest.query = { id: params.id };

  await getServiceById(api.mockRequest, api.mockResponse as any);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// PUT /api/services/:id
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(request, ["service_update"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request, true);
  api.mockRequest.query = { id: params.id };
  api.mockRequest.body = { ...api.mockRequest.body, service_id: params.id };

  await updateService(api.mockRequest, api.mockResponse as any);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// DELETE /api/services/:id
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(request, ["service_delete"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request);
  api.mockRequest.query = { id: params.id };

  await deleteService(api.mockRequest, api.mockResponse as any);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

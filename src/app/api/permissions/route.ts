// app/api/permissions/route.ts
import { NextResponse, NextRequest } from "next/server";
import { NextApiRequest, NextApiResponse } from "next";
import { getPermissions, createPermission } from "@/controllers/rolePermissionsController";

// Minimal mock response type
interface MockResponse {
  status: (statusCode: number) => MockResponse;
  json: (data: unknown) => void;
}

// Helper function to create mock NextApiRequest and NextApiResponse objects
const createMockApiObjects = async (
  request: NextRequest,
  includeBody = false
): Promise<{
  mockRequest: NextApiRequest;
  mockResponse: MockResponse;
  responseData: unknown;
  responseStatus: number;
}> => {
  let responseData: unknown;
  let responseStatus = 200;

  const mockRequest: NextApiRequest = {
    method: request.method as "GET" | "POST",
    body: includeBody ? await request.json().catch(() => ({})) : {},
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: Object.fromEntries(request.headers),
  } as NextApiRequest;

  const mockResponse: MockResponse = {
    status: (statusCode: number) => {
      responseStatus = statusCode;
      return mockResponse;
    },
    json: (data: unknown) => {
      responseData = data;
    },
  };

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

// Middleware-like function to check user permissions
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
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
    if (!hasPermission) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null; // Permissions are valid
  } catch (error) {
    console.error("Error parsing user permissions:", error);
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
};

// ✅ GET /api/permissions - Fetches all permissions (Admin only)
export async function GET(request: NextRequest) {
  const permissionError = checkPermissions(request, ["permission_read_all"]);
  if (permissionError) return permissionError;

  try {
    const api = await createMockApiObjects(request);
    await getPermissions(
      api.mockRequest,
      api.mockResponse as unknown as NextApiResponse
    );
    return NextResponse.json(api.responseData, { status: api.responseStatus });
  } catch (error) {
    console.error("GET permissions route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ✅ POST /api/permissions - Creates a new permission (Admin only)
export async function POST(request: NextRequest) {
  const permissionError = checkPermissions(request, ["permission_create"]);
  if (permissionError) return permissionError;

  try {
    const api = await createMockApiObjects(request, true);
    await createPermission(
      api.mockRequest,
      api.mockResponse as unknown as NextApiResponse
    );
    return NextResponse.json(api.responseData, { status: api.responseStatus });
  } catch (error) {
    console.error("POST permissions route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// app/api/roles/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { NextApiRequest, NextApiResponse } from "next";
import {
  getPermissionsByRole,
  addPermissionToRole,
  removePermissionFromRole,
  deleteRole,
} from "@/controllers/rolePermissionsController";

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
    return null; // ✅ permissions valid
  } catch (error) {
    console.error("Error parsing user permissions:", error);
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
};

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
    method: request.method as "GET" | "POST" | "DELETE",
    body: includeBody ? await request.json().catch(() => ({})) : {},
    query: Object.fromEntries(request.nextUrl.searchParams),
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

// ✅ GET /api/roles/[id] - Gets all permissions for a specific role
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(request, ["role_read_all"]);
  if (permissionError) return permissionError;

  try {
    const api = await createMockApiObjects(request);
    api.mockRequest.query = { role_id: id };

    await getPermissionsByRole(
      api.mockRequest,
      api.mockResponse as unknown as NextApiResponse
    );

    return NextResponse.json(api.responseData, { status: api.responseStatus });
  } catch (error) {
    console.error("GET permissions by role route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ✅ POST /api/roles/[id] - Adds a permission to a specific role
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(request, ["role_update"]);
  if (permissionError) return permissionError;

  try {
    const body = await request.json();
    const api = await createMockApiObjects(request, true);
    api.mockRequest.body = { ...body, role_id: id };

    await addPermissionToRole(
      api.mockRequest,
      api.mockResponse as unknown as NextApiResponse
    );

    return NextResponse.json(api.responseData, { status: api.responseStatus });
  } catch (error) {
    console.error("POST add permission to role route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ✅ DELETE /api/roles/[id] - Deletes an entire role or a specific permission from it
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(request, ["role_delete", "role_update"]);
  if (permissionError) return permissionError;

  try {
    let permission_id: string | null = null;

    // Safely parse the request body
    try {
      const body = await request.json();
      if (body && typeof body.permission_id === "string") {
        permission_id = body.permission_id;
      }
    } catch {
      // No body provided → assume delete full role
    }

    const api = await createMockApiObjects(request, true);

    if (permission_id) {
      // Case 1: Delete a specific permission from a role
      api.mockRequest.body = { role_id: id, permission_id };
      await removePermissionFromRole(
        api.mockRequest,
        api.mockResponse as unknown as NextApiResponse
      );
    } else {
      // Case 2: Delete the entire role
      api.mockRequest.query = { role_id: id };
      await deleteRole(
        api.mockRequest,
        api.mockResponse as unknown as NextApiResponse
      );
    }

    return NextResponse.json(api.responseData, { status: api.responseStatus });
  } catch (error) {
    console.error("DELETE role route error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getClientById, updateClient, deleteClient } from "@/controllers/clientController";
import type { NextApiRequest, NextApiResponse } from "next";

// Minimal mock request/response for controller compatibility
interface MockRequest {
  query: Record<string, string | string[]>;
  body?: unknown;
  headers: Record<string, string>;
}

interface MockResponse {
  status: (code: number) => {
    json: (data: unknown) => void;
  };
}

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

// ✅ GET client by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(req, ["client_read_single"]);
  if (permissionError) return permissionError;

  try {
    let responseData: { status: number; data: unknown } | undefined;

    const mockRequest: MockRequest = {
      query: { id },
      headers: Object.fromEntries(req.headers),
    };

    const mockResponse: MockResponse = {
      status: (code: number) => ({
        json: (data: unknown) => {
          responseData = { status: code, data };
        },
      }),
    };

    await getClientById(
      mockRequest as unknown as NextApiRequest,
      mockResponse as unknown as NextApiResponse
    );

    return NextResponse.json(responseData?.data, { status: responseData?.status ?? 200 });
  } catch (err) {
    console.error("GET /clients/:id error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ✅ PUT update client
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(req, ["client_update"]);
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    let responseData: { status: number; data: unknown } | undefined;

    const mockRequest: MockRequest = {
      query: { id },
      body,
      headers: Object.fromEntries(req.headers),
    };

    const mockResponse: MockResponse = {
      status: (code: number) => ({
        json: (data: unknown) => {
          responseData = { status: code, data };
        },
      }),
    };

    await updateClient(
      mockRequest as unknown as NextApiRequest,
      mockResponse as unknown as NextApiResponse
    );

    return NextResponse.json(responseData?.data, { status: responseData?.status ?? 200 });
  } catch (err) {
    console.error("PUT /clients/:id error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ✅ DELETE client
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const permissionError = checkPermissions(req, ["client_delete"]);
  if (permissionError) return permissionError;

  try {
    let responseData: { status: number; data: unknown } | undefined;

    const mockRequest: MockRequest = {
      query: { id },
      headers: Object.fromEntries(req.headers),
    };

    const mockResponse: MockResponse = {
      status: (code: number) => ({
        json: (data: unknown) => {
          responseData = { status: code, data };
        },
      }),
    };

    await deleteClient(
      mockRequest as unknown as NextApiRequest,
      mockResponse as unknown as NextApiResponse
    );

    return NextResponse.json(responseData?.data, { status: responseData?.status ?? 200 });
  } catch (err) {
    console.error("DELETE /clients/:id error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

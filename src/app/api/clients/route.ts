import { NextRequest, NextResponse } from "next/server";
import { createClient, getAllClients } from "@/controllers/clientController";
import type { NextApiRequest, NextApiResponse } from "next";

// Minimal mock interfaces — just enough for controllers
interface MockRequest {
  body?: unknown;
  headers: Record<string, string>;
  query?: Record<string, string | string[]>;
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

// ✅ GET all clients
export async function GET(req: NextRequest) {
  const permissionError = checkPermissions(req, ["client_read_all"]);
  if (permissionError) return permissionError;

  try {
    let responseData: unknown;

    const mockResponse: MockResponse = {
      status: (code: number) => ({
        json: (data: unknown) => {
          responseData = { status: code, data }; // store both
        },
      }),
    };

    const mockRequest: MockRequest = {
      headers: Object.fromEntries(req.headers),
      query: {}, // 👈 avoids TS error about query being undefined
    };

    await getAllClients(
      mockRequest as unknown as NextApiRequest,
      mockResponse as unknown as NextApiResponse
    );

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("GET /clients error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// ✅ POST create a new client
export async function POST(req: NextRequest) {
  const permissionError = checkPermissions(req, ["client_create"]);
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    let responseData: unknown;

    const mockResponse: MockResponse = {
      status: (code: number) => ({
        json: (data: unknown) => {
          responseData = { status: code, data }; // store both
        },
      }),
    };


    const mockRequest: MockRequest = {
      body,
      headers: Object.fromEntries(req.headers),
      query: {}, // 👈 ensures it's never undefined
    };

    await createClient(
      mockRequest as unknown as NextApiRequest,
      mockResponse as unknown as NextApiResponse
    );

    return NextResponse.json(responseData, { status: 201 });
  } catch (err) {
    console.error("POST /clients error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

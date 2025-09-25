// src/app/api/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NextApiRequest } from "next";
import { getLogs } from "@/controllers/logController";

// Utility: create mock API objects
const createMockApiObjects = async (request: NextRequest, includeBody = false) => {
  let responseData: any;
  let responseStatus: number = 200;

  const mockRequest: NextApiRequest = {
    method: request.method as "GET" | "POST",
    body: includeBody ? await request.json().catch(() => ({})) : {},
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: Object.fromEntries(request.headers),
    cookies: {},
    env: {},
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
    set responseData(value: any) {
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

// Permissions middleware
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

// ✅ GET /api/logs - Fetch all logs
export async function GET(request: NextRequest) {
  const permissionError = checkPermissions(request, ["logs_read_all"]);
  if (permissionError) {
    return permissionError;
  }

  try {
    const api = await createMockApiObjects(request);

    const logs = await getLogs();
    const serializableLogs = logs.map((log) => ({ ...log }));

    return NextResponse.json(serializableLogs, { status: api.responseStatus });
  } catch (error) {
    console.error("GET logs route error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

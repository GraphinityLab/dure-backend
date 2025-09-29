// src/app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NextApiRequest, NextApiResponse } from "next";
import { getServices, createService } from "@/controllers/servicesController";

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
  } catch (error) {
    console.error("Error parsing user permissions:", error);
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
};

// ---------------- Helpers ----------------
interface MockApi {
  mockRequest: NextApiRequest;
  mockResponse: NextApiResponse;
  responseData: unknown;
  responseStatus: number;
}

const createMockApiObjects = async (
  request: NextRequest,
  includeBody: boolean = false
): Promise<MockApi> => {
  let responseData: unknown;
  let responseStatus = 200;

  const mockRequest = {
    method: request.method as "GET" | "POST",
    body: includeBody ? await request.json().catch(() => ({})) : {},
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: Object.fromEntries(request.headers),
  } as unknown as NextApiRequest;

  // cast as NextApiResponse so controllers accept it
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

// GET /api/services
export async function GET(request: NextRequest) {
  const permissionError = checkPermissions(request, ["service_read_all"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request);
  await getServices(api.mockRequest, api.mockResponse);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

// POST /api/services
export async function POST(request: NextRequest) {
  const permissionError = checkPermissions(request, ["service_create"]);
  if (permissionError) return permissionError;

  const api = await createMockApiObjects(request, true);
  await createService(api.mockRequest, api.mockResponse);
  return NextResponse.json(api.responseData, { status: api.responseStatus });
}

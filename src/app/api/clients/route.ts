import { NextRequest, NextResponse } from "next/server";
import { createClient, getAllClients } from "@/controllers/clientController";

// Middleware-like function to check user permissions
const checkPermissions = (request: NextRequest, requiredPermissions: string[]) => {
  const userPermissionsHeader = request.headers.get('x-user-permissions');
  if (!userPermissionsHeader) {
    return NextResponse.json({ message: 'Permissions not found' }, { status: 403 });
  }

  try {
    const userPermissions = JSON.parse(userPermissionsHeader);
    const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
    if (!hasPermission) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    return null;
  } catch (error) {
    console.error('Error parsing user permissions:', error);
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
};

// GET all clients
export async function GET(req: NextRequest) {
  const permissionError = checkPermissions(req, ['client_read_all']);
  if (permissionError) return permissionError;

  try {
    let responseData: any;
    const mockResponse = {
      status: (code: number) => ({
        json: (data: any) => {
          responseData = data;
          return data;
        },
      }),
    };

    await getAllClients({ headers: Object.fromEntries(req.headers) } as any, mockResponse as any);
    return NextResponse.json(responseData);
  } catch (err) {
    console.error("GET /clients error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST create a new client
export async function POST(req: NextRequest) {
  const permissionError = checkPermissions(req, ['client_create']);
  if (permissionError) return permissionError;

  try {
    const body = await req.json();

    let responseData: any;
    const mockResponse = {
      status: (code: number) => ({
        json: (data: any) => {
          responseData = data;
          return data;
        },
      }),
    };

    await createClient({ body, headers: Object.fromEntries(req.headers) } as any, mockResponse as any);
    return NextResponse.json(responseData, { status: 201 });
  } catch (err) {
    console.error("POST /clients error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

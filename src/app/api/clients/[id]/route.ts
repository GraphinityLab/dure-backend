import { NextRequest, NextResponse } from "next/server";
import { getClientById, updateClient, deleteClient } from "@/controllers/clientController";

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

// GET client by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(req, ['client_read_single']);
  if (permissionError) return permissionError;

  try {
    const mockRequest = {
      query: { id: params.id },
      headers: Object.fromEntries(req.headers),
    } as any;

    let responseData: any;
    const mockResponse = {
      status: (code: number) => ({
        json: (data: any) => {
          responseData = data;
          return data;
        },
      }),
    };

    await getClientById(mockRequest, mockResponse as any);
    return NextResponse.json(responseData);
  } catch (err) {
    console.error("GET /clients/:id error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PUT update client
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(req, ['client_update']);
  if (permissionError) return permissionError;

  try {
    const body = await req.json();

    const mockRequest = {
      query: { id: params.id },
      body,
      headers: Object.fromEntries(req.headers),
    } as any;

    let responseData: any;
    const mockResponse = {
      status: (code: number) => ({
        json: (data: any) => {
          responseData = data;
          return data;
        },
      }),
    };

    await updateClient(mockRequest, mockResponse as any);
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("PUT /clients/:id error:", err);
    return NextResponse.json({ message: err.message ?? "Internal Server Error" }, { status: 500 });
  }
}

// DELETE client
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = checkPermissions(req, ['client_delete']);
  if (permissionError) return permissionError;

  try {
    const mockRequest = {
      query: { id: params.id },
      headers: Object.fromEntries(req.headers),
    } as any;

    let responseData: any;
    const mockResponse = {
      status: (code: number) => ({
        json: (data: any) => {
          responseData = data;
          return data;
        },
      }),
    };

    await deleteClient(mockRequest, mockResponse as any);
    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("DELETE /clients/:id error:", err);
    return NextResponse.json({ message: err.message ?? "Internal Server Error" }, { status: 500 });
  }
}

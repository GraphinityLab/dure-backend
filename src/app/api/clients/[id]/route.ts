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
  const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));
  if (!hasPermission) {
   return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  return null; // Permissions are valid
 } catch (error) {
  console.error('Error parsing user permissions:', error);
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
 }
};

// GET client by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
 const permissionError = checkPermissions(req, ['client_read_single']);
 if (permissionError) {
  return permissionError;
 }

 try {
  // The controller needs to be adapted to Next.js App Router conventions.
  const mockRequest = { query: { id: params.id } } as any;
  const mockResponse = {
   status: (code: number) => ({ json: (data: any) => data }),
  };
  const client = await getClientById(mockRequest, mockResponse as any);
  return NextResponse.json(client);
 } catch (err) {
  console.error(err);
  return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
 }
}

// PUT update client
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
 const permissionError = checkPermissions(req, ['client_update']);
 if (permissionError) {
  return permissionError;
 }

 try {
  const body = await req.json();
  // The controller needs to be adapted to Next.js App Router conventions.
  const mockRequest = { query: { id: params.id }, body } as any;
  const mockResponse = {
   status: (code: number) => ({ json: (data: any) => data }),
  };
  const result = await updateClient(mockRequest, mockResponse as any);
  return NextResponse.json(result);
 } catch (err: any) {
  console.error(err);
  return NextResponse.json({ message: err.message ?? "Internal Server Error" }, { status: 500 });
 }
}

// DELETE client
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
 const permissionError = checkPermissions(req, ['client_delete']);
 if (permissionError) {
  return permissionError;
 }

 try {
  // The controller needs to be adapted to Next.js App Router conventions.
  const mockRequest = { query: { id: params.id } } as any;
  const mockResponse = {
   status: (code: number) => ({ json: (data: any) => data }),
  };
  const result = await deleteClient(mockRequest, mockResponse as any);
  return NextResponse.json(result);
 } catch (err: any) {
  console.error(err);
  return NextResponse.json({ message: err.message ?? "Internal Server Error" }, { status: 500 });
 }
}

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

// GET all clients
export async function GET(req: NextRequest) {
 const permissionError = checkPermissions(req, ['client_read_all']);
 if (permissionError) {
  return permissionError;
 }

 try {
  // The controller needs to be adapted to Next.js App Router conventions.
  // For now, we'll return a mock response. In a real-world scenario, you'd
  // refactor the controller to not rely on the NextApiRequest/Response objects.
  const mockResponse = {
   status: (code: number) => ({ json: (data: any) => data }),
  };
  const clients = await getAllClients({} as any, mockResponse as any);
  return NextResponse.json(clients);
 } catch (err) {
  console.error(err);
  return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
 }
}

// POST create a new client
export async function POST(req: NextRequest) {
 const permissionError = checkPermissions(req, ['client_create']);
 if (permissionError) {
  return permissionError;
 }
 
 try {
  const body = await req.json();
  // The controller needs to be adapted to Next.js App Router conventions.
  const mockResponse = {
   status: (code: number) => ({ json: (data: any) => data }),
  };
  const newClient = await createClient({ body } as any, mockResponse as any);
  return NextResponse.json(newClient, { status: 201 });
 } catch (err) {
  console.error(err);
  return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
 }
}

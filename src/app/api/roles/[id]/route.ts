// app/roles/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { NextApiRequest } from 'next';
import { getPermissionsByRole, addPermissionToRole, removePermissionFromRole, deleteRole } from '@/controllers/rolePermissionsController';

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
        return null; // ✅ permissions valid
    } catch (error) {
        console.error('Error parsing user permissions:', error);
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
};

// Helper function to create mock NextApiRequest and NextApiResponse objects
const createMockApiObjects = async (request: NextRequest, includeBody: boolean = false) => {
    let responseData: any;
    let responseStatus: number = 200;

    const mockRequest: NextApiRequest = {
        method: request.method as 'GET' | 'POST' | 'DELETE',
        body: includeBody ? await request.json().catch(() => ({})) : {},
        query: Object.fromEntries(request.nextUrl.searchParams),
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

// GET /api/roles/[id] - Gets all permissions for a specific role
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const permissionError = checkPermissions(request, ['role_read_all']);
    if (permissionError) return permissionError;

    try {
        const api = await createMockApiObjects(request);
        api.mockRequest.query = { role_id: params.id };

        await getPermissionsByRole(api.mockRequest, api.mockResponse as any);
        return NextResponse.json(api.responseData, { status: api.responseStatus });
    } catch (error) {
        console.error('GET permissions by role route error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/roles/[id] - Adds a permission to a specific role
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const permissionError = checkPermissions(request, ['role_update']);
    if (permissionError) return permissionError;

    try {
        const body = await request.json();
        const api = await createMockApiObjects(request, true);
        api.mockRequest.body = { ...body, role_id: params.id };

        await addPermissionToRole(api.mockRequest, api.mockResponse as any);
        return NextResponse.json(api.responseData, { status: api.responseStatus });
    } catch (error) {
        console.error('POST add permission to role route error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/roles/[id] - Deletes an entire role or a specific permission from it
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const permissionError = checkPermissions(request, ['role_delete', 'role_update']);
    if (permissionError) return permissionError;

    try {
        const role_id = params.id;

        let permission_id = null;
        
        // Safely attempt to parse the request body
        try {
            const body = await request.json();
            if (body && body.permission_id) {
                permission_id = body.permission_id;
            }
        } catch (e) {
            // This catches the SyntaxError that occurs when no body is present.
            // We assume the intent is to delete the entire role in this case.
            // console.log("No JSON body found, proceeding with full role deletion.");
        }

        const api = await createMockApiObjects(request, true);

        if (permission_id) {
            // Case 1: Delete a specific permission from a role
            api.mockRequest.body = { role_id, permission_id };
            await removePermissionFromRole(api.mockRequest, api.mockResponse as any);
        } else {
            // Case 2: Delete the entire role
            api.mockRequest.query = { role_id };
            await deleteRole(api.mockRequest, api.mockResponse as any);
        }

        return NextResponse.json(api.responseData, { status: api.responseStatus });
    } catch (error) {
        console.error('DELETE role route error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

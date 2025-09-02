// app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest } from 'next';
import { getServiceById, updateService, deleteService } from '@/controllers/servicesController';

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

// Helper function to convert Next.js App Router request to Pages Router format
const createMockApiObjects = async (request: NextRequest, includeBody: boolean = false) => {
    let responseData: any;
    let responseStatus: number = 200;

    // Create a mock NextApiRequest object
    const mockRequest: NextApiRequest = {
        method: request.method as 'GET' | 'PUT' | 'DELETE',
        body: includeBody ? await request.json().catch(() => ({})) : {},
        query: Object.fromEntries(request.nextUrl.searchParams),
    } as NextApiRequest;

    // Mock response that captures data & status
    const mockResponse = {
        status: (statusCode: number) => {
            responseStatus = statusCode;
            return mockResponse; // Allow chaining
        },
        json: (data: any) => {
            responseData = data;
        },
    };

    // Return getters and setters instead of raw values
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    // Check for 'view:services' permission
    const permissionError = checkPermissions(request, ['service_read_single']);
    if (permissionError) {
        return permissionError;
    }
    const api = await createMockApiObjects(request);
    api.mockRequest.query = { id: params.id };
    
    await getServiceById(api.mockRequest, api.mockResponse as any);
    return NextResponse.json(api.responseData, { status: api.responseStatus });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    // Check for 'update:services' permission
    const permissionError = checkPermissions(request, ['service_update']);
    if (permissionError) {
        return permissionError;
    }
    const api = await createMockApiObjects(request, true);
    api.mockRequest.query = { id: params.id };
    api.mockRequest.body = { ...api.mockRequest.body, service_id: params.id };
    
    await updateService(api.mockRequest, api.mockResponse as any);
    return NextResponse.json(api.responseData, { status: api.responseStatus });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    // Check for 'delete:services' permission
    const permissionError = checkPermissions(request, ['service_delete']);
    if (permissionError) {
        return permissionError;
    }
    const api = await createMockApiObjects(request);
    api.mockRequest.query = { id: params.id };

    await deleteService(api.mockRequest, api.mockResponse as any);
    return NextResponse.json(api.responseData, { status: api.responseStatus });
}

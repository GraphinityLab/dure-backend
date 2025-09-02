// app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest } from 'next';
import { 
    getServices,
    createService
} from '@/controllers/servicesController';

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
const createMockApiObjects = async (request: NextRequest) => {
    let responseData: any;
    let responseStatus: number = 200;

    // Create a mock NextApiRequest object
    const mockRequest: NextApiRequest = {
        method: request.method as 'GET' | 'POST',
        body: await request.json().catch(() => ({})), // Handle case with no body
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

export async function GET(request: NextRequest) {
    const permissionError = checkPermissions(request, ['service_read_all']);
    if (permissionError) {
        return permissionError;
    }
    const api = await createMockApiObjects(request);
    await getServices(api.mockRequest, api.mockResponse as any);
    return NextResponse.json(api.responseData, { status: api.responseStatus });
}

export async function POST(request: NextRequest) {
    const permissionError = checkPermissions(request, ['service_create']);
    if (permissionError) {
        return permissionError;
    }
    const api = await createMockApiObjects(request);
    await createService(api.mockRequest, api.mockResponse as any);
    return NextResponse.json(api.responseData, { status: api.responseStatus });
}

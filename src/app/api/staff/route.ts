import { NextResponse, NextRequest } from 'next/server';
import { NextApiRequest } from 'next';
import { getStaff, createStaff } from '@/controllers/staffController';

const createMockApiObjects = async (request: NextRequest, includeBody: boolean = false) => {
    let responseData: any;
    let responseStatus = 200;

    const mockRequest: NextApiRequest = {
        method: request.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
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
        get responseStatus() {
            return responseStatus;
        },
    };
};

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

// ✅ GET /api/staff
export async function GET(request: NextRequest) {
    const permissionError = checkPermissions(request, ['staff_read_all']);
    if (permissionError) return permissionError;

    try {
        const api = await createMockApiObjects(request);
        await getStaff(api.mockRequest, api.mockResponse as any);
        return NextResponse.json(api.responseData, { status: api.responseStatus });
    } catch (error) {
        console.error('GET all staff route error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ POST /api/staff
export async function POST(request: NextRequest) {
    const permissionError = checkPermissions(request, ['staff_create']);
    if (permissionError) return permissionError;

    try {
        const api = await createMockApiObjects(request, true);
        await createStaff(api.mockRequest, api.mockResponse as any);
        return NextResponse.json(api.responseData, { status: api.responseStatus });
    } catch (error) {
        console.error('POST staff route error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

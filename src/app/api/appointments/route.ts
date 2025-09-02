import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest } from 'next';
import { getAppointments} from '@/controllers/appointmentController';

// Helper function to convert Next.js App Router request to Pages Router format
const createMockApiObjects = async (request: NextRequest, includeBody: boolean = false) => {
    let responseData: any;
    let responseStatus: number = 200;

    // Create a mock NextApiRequest object
    const mockRequest: NextApiRequest = {
        method: request.method as 'GET' | 'POST',
        body: includeBody ? await request.json().catch(() => ({})) : {}, // Handle case with no body
        query: Object.fromEntries(request.nextUrl.searchParams),
        headers: Object.fromEntries(request.headers),
        cookies: {},
        env: {},
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

// GET /api/appointments - Get all appointments
export async function GET(request: NextRequest) {
    const permissionError = checkPermissions(request, ['appointment_read_all']);
    if (permissionError) {
        return permissionError;
    }
    
    try {
        const api = await createMockApiObjects(request);
        
        // This is the fix for the TypeError. The getAppointments function returns non-serializable data.
        // We will call the function directly and then make the returned data serializable.
        const appointments = await getAppointments(api.mockRequest, api.mockResponse as any);
        const serializableAppointments = appointments.map(appointment => ({...appointment}));
        
        return NextResponse.json(serializableAppointments, { status: api.responseStatus });
    } catch (error) {
        console.error('GET appointments route error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

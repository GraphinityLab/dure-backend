import { NextRequest, NextResponse } from "next/server";
import { NextApiRequest, NextApiResponse } from "next";
import { verifyStaffPassword } from "@/controllers/staffController";

// ---------------- Permissions ----------------
function checkPermissions(request: NextRequest, required: string[]) {
  const header = request.headers.get("x-user-permissions");
  if (!header) {
    return NextResponse.json({ message: "Permissions not found" }, { status: 403 });
  }
  try {
    const userPermissions: string[] = JSON.parse(header);
    const ok = required.every((p) => userPermissions.includes(p));
    if (!ok) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return null;
  } catch (err) {
    console.error("Permission parse error:", err);
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

// ---------------- Route ----------------
// ✅ POST /api/staff/[id]/verify-password
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const perm = checkPermissions(request, ["verify_password"]);
  if (perm) return perm;

  try {
    const body = await request.json().catch(() => ({}));
    const { id } = await context.params; // ✅ await params

    const mockReq = {
      method: "POST",
      body,
      query: { id },
      headers: Object.fromEntries(request.headers),
    } as unknown as NextApiRequest;

    let responseData: unknown = null;
    let responseStatus = 200;

    const mockRes = {
      status(code: number) {
        responseStatus = code;
        return mockRes;
      },
      json(data: unknown) {
        responseData = data;
        return mockRes;
      },
    } as unknown as NextApiResponse;

    await verifyStaffPassword(mockReq, mockRes);

    return NextResponse.json(responseData, { status: responseStatus });
  } catch (err) {
    console.error("verify-password route error:", err);
    return NextResponse.json(
      { message: "Internal Server Error", error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

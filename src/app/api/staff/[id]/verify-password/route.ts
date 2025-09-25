import { NextRequest, NextResponse } from "next/server";
import { verifyStaffPassword } from "@/controllers/staffController";

// Permission check
function checkPermissions(request: NextRequest, required: string[]) {
  const header = request.headers.get("x-user-permissions");
  if (!header) {
    return NextResponse.json({ message: "Permissions not found" }, { status: 403 });
  }
  try {
    const userPermissions = JSON.parse(header);
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

// ✅ POST /api/staff/[id]/verify-password
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const perm = checkPermissions(request, ["verify_password"]);
  if (perm) return perm;

  try {
    const body = await request.json().catch(() => ({}));

    const mockReq: any = {
      method: "POST",
      body,
      query: { id: params.id },
      headers: Object.fromEntries(request.headers),
    };

    let responseData: any = null;
    let responseStatus = 200;

    const mockRes: any = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(data: any) {
        responseData = data;
        return data;
      },
    };

    await verifyStaffPassword(mockReq, mockRes);

    return NextResponse.json(responseData, { status: responseStatus });
  } catch (err: any) {
    console.error("verify-password route error:", err);
    return NextResponse.json({ message: "Internal Server Error", error: err?.message || err }, { status: 500 });
  }
}

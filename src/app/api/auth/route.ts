// auth/route.ts
import { NextResponse } from "next/server";
import { loginStaff } from "@/controllers/staffController";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Email/username and password are required." },
        { status: 400 }
      );
    }

    const result = await loginStaff(identifier, password);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Auth login error:", error);

    const status = error.message === "Invalid credentials" ? 401 : 500;
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status }
    );
  }
}

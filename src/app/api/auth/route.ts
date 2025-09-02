import { NextResponse } from "next/server";
import pool from "@/utils/db";
import { comparePassword } from "@/utils/passwordUtils";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secure_jwt_secret";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Email/username and password are required." },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    // 1. Find user
    const [rows]: any = await connection.execute(
      "SELECT * FROM Users WHERE email = ? OR username = ?",
      [identifier, identifier]
    );
    const user = rows[0];
    if (!user) {
      connection.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    // 2. Verify password
    const isMatch = await comparePassword(password, user.hashed_password);
    if (!isMatch) {
      connection.release();
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
    }

    // 3. Fetch role
    const [roleRows]: any = await connection.execute(
      "SELECT role_name FROM Roles WHERE role_id = ?",
      [user.role_id]
    );
    const roleName = roleRows[0]?.role_name || "No Role";

    // 4. Fetch permissions
    const [permRows]: any = await connection.execute(
      `SELECT p.permission_name
       FROM RolePermissions rp
       JOIN Permissions p ON rp.permission_id = p.permission_id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );
    const permissions = permRows.map((row: any) => row.permission_name);

    // 5. Generate JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        role_id: user.role_id,
        role_name: roleName,
        permissions,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    connection.release();

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        username: user.username,
        role: roleName,
        permissions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

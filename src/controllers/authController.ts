import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/utils/db";
import { comparePassword, hashPassword } from "@/utils/passwordUtils";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secure_jwt_secret";

interface UserResult extends RowDataPacket {
  user_id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  hashed_password: string;
  role_id: number;
}

interface RoleResult extends RowDataPacket {
  role_name: string;
}

interface PermissionResult extends RowDataPacket {
  permission_name: string;
}

// ---------------- LOGIN ----------------
export const login = async (req: NextApiRequest, res: NextApiResponse) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "Email/username and password are required." });
  }

  try {
    const connection = await pool.getConnection();

    // 1. Find user by email OR username
    const [userRows] = await connection.execute<UserResult[]>(
      "SELECT * FROM Users WHERE email = ? OR username = ?",
      [identifier, identifier]
    );
    const user = userRows[0];
    if (!user) {
      connection.release();
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 2. Compare password
    const isMatch = await comparePassword(password, user.hashed_password);
    if (!isMatch) {
      connection.release();
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 3. Role & permissions
    const [roleRows] = await connection.execute<RoleResult[]>(
      "SELECT role_name FROM Roles WHERE role_id = ?",
      [user.role_id]
    );
    const roleName = roleRows[0]?.role_name || "No Role";

    const [permissionsRows] = await connection.execute<PermissionResult[]>(
      `SELECT p.permission_name
       FROM RolePermissions rp
       JOIN Permissions p ON rp.permission_id = p.permission_id
       WHERE rp.role_id = ?`,
      [user.role_id]
    );
    const permissions = permissionsRows.map((row) => row.permission_name);

    // 4. Create token
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

    // 5. Send token + user info
    res.status(200).json({
      message: "Login successful.",
      token,
      username: user.username,
      role: roleName,
      permissions,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------- GET CURRENT USER (from token) ----------------
export const getCurrentUser = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing." });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const username = decoded.username;

    const connection = await pool.getConnection();
    const [rows] = await connection.execute<UserResult[]>(
      "SELECT user_id, username, email, first_name, last_name, phone_number, address, city, province, postal_code, role_id FROM Users WHERE username = ?",
      [username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------- UPDATE USER ----------------
export const updateUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username } = req.query;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ message: "Username is required." });
  }

  const {
    first_name,
    last_name,
    phone_number,
    address,
    city,
    province,
    postal_code,
    password,
  } = req.body;

  try {
    const connection = await pool.getConnection();

    let updateQuery = `UPDATE Users SET first_name=?, last_name=?, phone_number=?, address=?, city=?, province=?, postal_code=?`;
    const params: any[] = [
      first_name,
      last_name,
      phone_number,
      address,
      city,
      province,
      postal_code,
    ];

    if (password) {
      const hashed = await hashPassword(password);
      updateQuery += `, hashed_password=?`;
      params.push(hashed);
    }

    updateQuery += ` WHERE username=?`;
    params.push(username);

    const [result] = await connection.execute<ResultSetHeader>(
      updateQuery,
      params
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

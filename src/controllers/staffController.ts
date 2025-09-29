import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/utils/db";
import { comparePassword, hashPassword } from "@/utils/passwordUtils";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { logChange } from "@/utils/logChange"; // ✅ import logger

interface StaffPasswordRow extends RowDataPacket {
  hashed_password: string;
  staff_id: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secure_jwt_secret";

interface StaffResult extends RowDataPacket {
  staff_id: number;
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

// -------- LOGIN --------
export async function loginStaff(identifier: string, password: string) {
  const connection = await pool.getConnection();
  try {
    const [staffRows] = await connection.execute<StaffResult[]>(
      "SELECT * FROM staff WHERE email = ? OR username = ?",
      [identifier, identifier]
    );

    const staff = staffRows[0];
    if (!staff) throw new Error("Invalid credentials");

    const isMatch = await comparePassword(password, staff.hashed_password);
    if (!isMatch) throw new Error("Invalid credentials");

    const [roleRows] = await connection.execute<RoleResult[]>(
      "SELECT role_name FROM roles WHERE role_id = ?",
      [staff.role_id]
    );
    const roleName = roleRows[0]?.role_name || "No Role";

    const [permRows] = await connection.execute<PermissionResult[]>(
      `SELECT p.permission_name
       FROM rolepermissions rp
       JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE rp.role_id = ?`,
      [staff.role_id]
    );
    const permissions = permRows.map((row) => row.permission_name);

    const token = jwt.sign(
      {
        staff_id: staff.staff_id,
        email: staff.email,
        username: staff.username,
        role_id: staff.role_id,
        role_name: roleName,
        first_name: staff.first_name,
        last_name: staff.last_name,
        permissions,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      message: "Login successful",
      token,
      staff_id: staff.staff_id,
      username: staff.username,
      first_name: staff.first_name,
      last_name: staff.last_name,
      role: roleName,
      permissions,
    };
  } finally {
    connection.release();
  }
}

// ---------------- GET CURRENT STAFF ----------------
export const getCurrentStaff = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Authorization header missing." });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token missing." });

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const username = decoded.username as string;

    const connection = await pool.getConnection();
    const [rows] = await connection.execute<StaffResult[]>(
      `SELECT staff_id, user_id, username, email, first_name, last_name,
              phone_number, address, city, province, postal_code, role_id
       FROM staff WHERE username = ?`,
      [username]
    );
    connection.release();

    if (rows.length === 0) return res.status(404).json({ message: "Staff not found." });

    res.status(200).json(rows[0]);
  } catch (error: unknown) {
    console.error("Get current staff error:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// ---------------- UPDATE STAFF ----------------
export const updateStaff = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const staff_id = Number(req.query.id);
    if (isNaN(staff_id)) return res.status(400).json({ message: "Invalid staff_id" });

    const fieldsToUpdate: Partial<StaffResult & { password?: string }> = { ...req.body };
    delete fieldsToUpdate.staff_id;

    const allowedFields = new Set([
      "username", "email", "first_name", "last_name", "phone_number",
      "address", "city", "province", "postal_code", "role_id", "hashed_password", "password"
    ]);

    for (const key of Object.keys(fieldsToUpdate)) {
      const value = fieldsToUpdate[key as keyof typeof fieldsToUpdate];
      if (!allowedFields.has(key) || value === undefined) {
        delete fieldsToUpdate[key as keyof typeof fieldsToUpdate];
        continue;
      }
      if (key === "role_id" && value !== null) {
        fieldsToUpdate[key as "role_id"] = Number(value);
      }
    }

    if (fieldsToUpdate.password) {
      fieldsToUpdate.hashed_password = await hashPassword(fieldsToUpdate.password);
      delete fieldsToUpdate.password;
    }

    const keys = Object.keys(fieldsToUpdate);
    if (keys.length === 0) return res.status(400).json({ message: "No fields provided to update." });

    const values = keys.map((key) => fieldsToUpdate[key as keyof typeof fieldsToUpdate]);
    const setString = keys.map((key) => `${key} = ?`).join(", ");

    const connection = await pool.getConnection();

    try {
      const [beforeRows] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM staff WHERE staff_id = ?",
        [staff_id]
      );
      const before = beforeRows[0];

      const updateQuery = `UPDATE staff SET ${setString} WHERE staff_id = ?`;
      values.push(staff_id);
      const [result] = await connection.execute<ResultSetHeader>(updateQuery, values);

      if ((result as ResultSetHeader).affectedRows === 0) {
        return res.status(404).json({ message: `Staff with staff_id "${staff_id}" not found.` });
      }

      const [afterRows] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM staff WHERE staff_id = ?",
        [staff_id]
      );
      const after = afterRows[0];

      const firstName = req.headers['x-first-name'] as string;
      const lastName = req.headers['x-last-name'] as string;
      const changed_by = firstName || lastName ? `${firstName ?? ''} ${lastName ?? ''}`.trim() : "Unknown";

      // ✅ Log update
      await logChange({
        entity_type: "staff",
        entity_id: staff_id,
        action: "update",
        changed_by,
        changes: { old: before, new: after },
      });

      return res.status(200).json({ message: "Staff updated successfully." });
    } finally {
      connection.release();
    }
  } catch (err: unknown) {
    console.error("Update staff error:", err);
    if (err instanceof Error) {
      return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------- CREATE STAFF ----------------
export const createStaff = async (req: NextApiRequest, res: NextApiResponse) => {
  const { first_name, last_name, email, username, phone_number, address, city, province, postal_code, password, role_id } = req.body;

  if (!first_name || !last_name || !email || !username || !password || !role_id) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const connection = await pool.getConnection();

    const [existingRows] = await connection.execute<RowDataPacket[]>(
      "SELECT staff_id FROM staff WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existingRows.length > 0) {
      connection.release();
      return res.status(409).json({ message: "Username or email already exists." });
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO staff
        (first_name, last_name, email, username, phone_number, address, city, province, postal_code, hashed_password, role_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, username, phone_number || null, address || null, city || null, province || null, postal_code || null, hashedPassword, role_id]
    );

    connection.release();

    const fName = req.headers['x-first-name'] as string;
    const lName = req.headers['x-last-name'] as string;
    const changed_by = fName || lName ? `${fName ?? ''} ${lName ?? ''}`.trim() : "Unknown";

    // ✅ Log create
    await logChange({
      entity_type: "staff",
      entity_id: result.insertId,
      action: "create",
      changed_by,
      changes: { old: null, new: { first_name, last_name, email, username, role_id } },
    });

    res.status(201).json({ message: "Staff created successfully.", staff_id: result.insertId });
  } catch (error: unknown) {
    console.error("Create staff error:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// ---------------- DELETE STAFF ----------------
export const deleteStaff = async (req: NextApiRequest, res: NextApiResponse) => {
  const staff_id = (req.query?.id || req.query?.staff_id) as string;
  if (!staff_id) return res.status(400).json({ message: "staff_id is required." });

  try {
    const connection = await pool.getConnection();

    const [beforeRows] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM staff WHERE staff_id = ?",
      [Number(staff_id)]
    );
    const before = beforeRows[0];

    const [result] = await connection.execute<ResultSetHeader>(
      "DELETE FROM staff WHERE staff_id = ?",
      [Number(staff_id)]
    );

    connection.release();

    if (result.affectedRows === 0) return res.status(404).json({ message: "Staff not found." });

    const fName = req.headers['x-first-name'] as string;
    const lName = req.headers['x-last-name'] as string;
    const changed_by = fName || lName ? `${fName ?? ''} ${lName ?? ''}`.trim() : "Unknown";

    // ✅ Log delete
    await logChange({
      entity_type: "staff",
      entity_id: Number(staff_id),
      action: "delete",
      changed_by,
      changes: { old: before, new: null },
    });

    return res.status(200).json({ message: "Staff deleted successfully." });
  } catch (error: unknown) {
    console.error("Delete staff error:", error);
    if (error instanceof Error) {
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ---------------- GET ALL STAFF ----------------
export const getAllStaff = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT 
          s.staff_id,
          s.first_name AS firstName,
          s.last_name AS lastName,
          s.email,
          s.username,
          s.phone_number AS phoneNumber,
          s.address,
          s.city,
          s.province,
          s.postal_code AS postalCode,
          s.role_id AS roleId,
          r.role_name AS roleName
       FROM staff s
       LEFT JOIN roles r ON s.role_id = r.role_id`
    );

    connection.release();
    res.status(200).json(rows);
  } catch (error: unknown) {
    console.error("Get all staff error:", error);
    if (error instanceof Error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// ✅ GET staff by staff_id
export const getStaffByID = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const staff_id = req.query.id;

    if (!staff_id || Array.isArray(staff_id)) {
      return res.status(400).json({ message: "staff_id is required and must be a single value." });
    }

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT s.staff_id, s.first_name, s.last_name, s.email, s.username, s.phone_number, s.address, s.city, s.province, s.postal_code,
                r.role_id, r.role_name
         FROM staff s
         LEFT JOIN roles r ON s.role_id = r.role_id
         WHERE s.staff_id = ?`,
        [Number(staff_id)]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: `Staff with id ${staff_id} not found.` });
      }

      res.status(200).json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (err: unknown) {
    console.error("Get staff by ID error:", err);
    if (err instanceof Error) {
      res.status(500).json({ message: "Internal Server Error", error: err.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

// ✅ Verify Staff Password
export const verifyStaffPassword = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const idRaw = (req.query?.id ?? req.query?.staff_id) as string | string[] | undefined;
    const idStr = Array.isArray(idRaw) ? idRaw[0] : idRaw;
    const staff_id = Number(idStr);

    if (!idStr || Number.isNaN(staff_id)) {
      return res.status(400).json({ message: "Invalid or missing staff_id." });
    }

    const current_password = (req.body?.current_password ?? req.body?.password) as string | undefined;
    if (!current_password) {
      return res.status(400).json({ message: "current_password is required." });
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute<StaffPasswordRow[]>(
        "SELECT staff_id, hashed_password FROM staff WHERE staff_id = ? LIMIT 1",
        [staff_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Staff not found." });
      }

      const { hashed_password } = rows[0];
      const ok = await comparePassword(current_password, hashed_password);
      if (!ok) {
        return res.status(401).json({ message: "Incorrect current password." });
      }

      return res.status(200).json({ message: "Verified" });
    } finally {
      connection.release();
    }
  } catch (err: unknown) {
    console.error("verifyStaffPassword error:", err);
    if (err instanceof Error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
      });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

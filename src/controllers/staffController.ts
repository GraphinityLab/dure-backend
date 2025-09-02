// controllers/staffController.ts
import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Staff interface (after merging users + staff)
interface Staff extends RowDataPacket {
    staff_id?: number;
    first_name: string;
    last_name: string;
    phone_number?: string;
    email: string;
    username: string;
    hashed_password: string;
    role_id: number;
    position?: string; // alias for role_name
    address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
}

// ✅ GET all staff members
export const getStaff = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const [rows] = await pool.execute<Staff[]>(
            `SELECT 
                s.staff_id,
                s.first_name,
                s.last_name,
                s.phone_number,
                s.email,
                s.username,
                s.role_id,
                r.role_name AS position,
                s.address,
                s.city,
                s.province,
                s.postal_code
            FROM staff s
            JOIN roles r ON s.role_id = r.role_id`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ✅ GET staff member by ID
export const getStaffById = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ message: 'Staff ID is required.' });

    try {
        const [rows] = await pool.execute<Staff[]>(
            `SELECT 
                s.staff_id,
                s.first_name,
                s.last_name,
                s.phone_number,
                s.email,
                s.username,
                s.role_id,
                r.role_name AS position,
                s.address,
                s.city,
                s.province,
                s.postal_code
            FROM staff s
            JOIN roles r ON s.role_id = r.role_id
            WHERE s.staff_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching staff member:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ✅ CREATE staff member
export const createStaff = async (req: NextApiRequest, res: NextApiResponse) => {
    const {
        first_name, last_name, phone_number,
        email, username, hashed_password,
        role_id, address, city, province, postal_code
    } = req.body;

    if (!first_name || !last_name || !email || !username || !hashed_password || !role_id) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO staff 
                (first_name, last_name, phone_number, email, username, hashed_password, role_id, address, city, province, postal_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, phone_number, email, username, hashed_password, role_id, address, city, province, postal_code]
        );

        res.status(201).json({ staff_id: result.insertId, message: 'Staff member created successfully.' });
    } catch (error) {
        console.error('Error creating staff member:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ✅ UPDATE staff member
export const updateStaff = async (req: NextApiRequest, res: NextApiResponse) => {
    const { staff_id, first_name, last_name, phone_number, email, username, hashed_password, role_id, address, city, province, postal_code } = req.body;

    if (!staff_id) return res.status(400).json({ message: 'Staff ID is required.' });

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (first_name) { updateFields.push("first_name = ?"); updateValues.push(first_name); }
    if (last_name) { updateFields.push("last_name = ?"); updateValues.push(last_name); }
    if (phone_number) { updateFields.push("phone_number = ?"); updateValues.push(phone_number); }
    if (email) { updateFields.push("email = ?"); updateValues.push(email); }
    if (username) { updateFields.push("username = ?"); updateValues.push(username); }
    if (hashed_password) { updateFields.push("hashed_password = ?"); updateValues.push(hashed_password); }
    if (role_id) { updateFields.push("role_id = ?"); updateValues.push(role_id); }
    if (address) { updateFields.push("address = ?"); updateValues.push(address); }
    if (city) { updateFields.push("city = ?"); updateValues.push(city); }
    if (province) { updateFields.push("province = ?"); updateValues.push(province); }
    if (postal_code) { updateFields.push("postal_code = ?"); updateValues.push(postal_code); }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'At least one field required for update.' });
    }

    try {
        const sql = `UPDATE staff SET ${updateFields.join(', ')} WHERE staff_id = ?`;
        updateValues.push(staff_id);

        const [result] = await pool.execute<ResultSetHeader>(sql, updateValues);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        res.status(200).json({ message: 'Staff member updated successfully.' });
    } catch (error) {
        console.error('Error updating staff member:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ✅ DELETE staff member
export const deleteStaff = async (req: NextApiRequest, res: NextApiResponse) => {
    const { staff_id } = req.body;
    if (!staff_id) return res.status(400).json({ message: 'Staff ID is required.' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // First, delete related appointments
        await connection.execute<ResultSetHeader>(
            'DELETE FROM appointments WHERE staff_id = ?',
            [staff_id]
        );

        // Then, delete staff member
        const [result] = await connection.execute<ResultSetHeader>(
            'DELETE FROM staff WHERE staff_id = ?',
            [staff_id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Staff member deleted successfully.' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting staff member:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        connection.release();
    }
};

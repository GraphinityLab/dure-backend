// controllers/rolePermissionsController.ts
import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Define the shape of a Role
interface Role {
    role_id: number;
    role_name: string;
}

// Define the shape of a Permission
interface Permission {
    permission_id: number;
    permission_name: string;
}

// GET all roles
export const getRoles = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Roles');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// POST a new role
export const createRole = async (req: NextApiRequest, res: NextApiResponse) => {
    const { role_name } = req.body;

    if (!role_name) {
        return res.status(400).json({ message: 'Role name is required.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO Roles (role_name) VALUES (?)',
            [role_name]
        );
        res.status(201).json({ message: 'Role created successfully.', role_id: result.insertId });
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// DELETE a role
export const deleteRole = async (req: NextApiRequest, res: NextApiResponse) => {
    const role_id = req.body?.role_id || req.query?.role_id;

    if (!role_id) {
        return res.status(400).json({ message: 'Role ID is required.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'DELETE FROM Roles WHERE role_id = ?',
            [role_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Role not found.' });
        }
        res.status(200).json({ message: 'Role deleted successfully.' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



// GET all permissions
export const getPermissions = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM Permissions');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// POST a new permission
export const createPermission = async (req: NextApiRequest, res: NextApiResponse) => {
    const { permission_name } = req.body;

    if (!permission_name) {
        return res.status(400).json({ message: 'Permission name is required.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO Permissions (permission_name) VALUES (?)',
            [permission_name]
        );
        res.status(201).json({ message: 'Permission created successfully.', permission_id: result.insertId });
    } catch (error) {
        console.error('Error creating permission:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// DELETE a permission
export const deletePermission = async (req: NextApiRequest, res: NextApiResponse) => {
    const { permission_id } = req.body;

    if (!permission_id) {
        return res.status(400).json({ message: 'Permission ID is required.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'DELETE FROM Permissions WHERE permission_id = ?',
            [permission_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Permission not found.' });
        }
        res.status(200).json({ message: 'Permission deleted successfully.' });
    } catch (error) {
        console.error('Error deleting permission:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


// GET permissions for a specific role
export const getPermissionsByRole = async (req: NextApiRequest, res: NextApiResponse) => {
    const { role_id } = req.query;

    if (!role_id) {
        return res.status(400).json({ message: 'Role ID is required.' });
    }

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(`
            SELECT 
                p.permission_id, 
                p.permission_name, 
                p.permission_description 
            FROM Permissions p
            JOIN RolePermissions rp ON p.permission_id = rp.permission_id
            WHERE rp.role_id = ?
        `, [role_id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching permissions by role:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// POST to add a permission to a role
export const addPermissionToRole = async (req: NextApiRequest, res: NextApiResponse) => {
    const { role_id, permission_id } = req.body;

    if (!role_id || !permission_id) {
        return res.status(400).json({ message: 'Role ID and Permission ID are required.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO RolePermissions (role_id, permission_id) VALUES (?, ?)',
            [role_id, permission_id]
        );
        res.status(201).json({ message: 'Permission added to role successfully.', id: result.insertId });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'This permission is already assigned to this role.' });
        }
        console.error('Error adding permission to role:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// DELETE a permission from a role
export const removePermissionFromRole = async (req: NextApiRequest, res: NextApiResponse) => {
    const { role_id, permission_id } = req.body;

    if (!role_id || !permission_id) {
        return res.status(400).json({ message: 'Role ID and Permission ID are required.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'DELETE FROM RolePermissions WHERE role_id = ? AND permission_id = ?',
            [role_id, permission_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Permission not found for this role.' });
        }
        res.status(200).json({ message: 'Permission removed from role successfully.' });
    } catch (error) {
        console.error('Error removing permission from role:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

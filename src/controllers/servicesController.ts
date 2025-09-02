import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Define the shape of the Service data based on the new schema.
interface Service extends RowDataPacket {
    service_id?: number;
    name: string;
    duration_minutes: number;
    price: number;
    description: string;
    category: string;
}

// ✅ GET all services
export const getServices = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const [rows] = await pool.execute<Service[]>('SELECT * FROM Services');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ✅ GET a single service by ID
export const getServiceById = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ message: 'Service ID is required.' });
    }

    try {
        const [rows] = await pool.execute<Service[]>(
            'SELECT * FROM Services WHERE service_id = ?',
            [id]
        );
        const service = rows[0];
        if (!service) {
            return res.status(404).json({ message: 'Service not found.' });
        }
        res.status(200).json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ✅ POST create a new service
export const createService = async (req: NextApiRequest, res: NextApiResponse) => {
    const { name, duration_minutes, price, description, category } = req.body;

    if (!name || !duration_minutes || !price || !description || !category) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO Services (name, duration_minutes, price, description, category) VALUES (?, ?, ?, ?, ?)',
            [name, duration_minutes, price, description, category]
        );

        res.status(201).json({
            message: 'Service created successfully.',
            service_id: result.insertId,
        });
    } catch (error: any) {
        console.error('Error creating service:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// ✅ PUT update a service
export const updateService = async (req: NextApiRequest, res: NextApiResponse) => {
    const { service_id, name, duration_minutes, price, description, category } = req.body;

    if (!service_id) {
        return res.status(400).json({ message: 'Service ID is required for update.' });
    }

    if (!name || !duration_minutes || !price || !description || !category) {
        return res.status(400).json({ message: 'All fields are required for update.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'UPDATE Services SET name = ?, duration_minutes = ?, price = ?, description = ?, category = ? WHERE service_id = ?',
            [name, duration_minutes, price, description, category, service_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found.' });
        }

        res.status(200).json({ message: 'Service updated successfully.' });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// ✅ DELETE a service
// DELETE a service
export const deleteService = async (req: NextApiRequest, res: NextApiResponse) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'Service ID is required.' });
    }

    try {
        const [result] = await pool.execute<ResultSetHeader>(
            'DELETE FROM Services WHERE service_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Service not found.' });
        }

        res.status(200).json({ message: 'Service deleted successfully.' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/utils/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { logChange } from '@/utils/logChange';

// Define the shape of the Service data
interface Service extends RowDataPacket {
  service_id?: number;
  name: string;
  duration_minutes: number;
  price: number;
  description: string;
  category: string;
}

// 🔹 Helper: derive changed_by from headers
const getChangedBy = (req: NextApiRequest): string | null => {
  const first = req.headers['x-first-name'] as string | undefined;
  const last = req.headers['x-last-name'] as string | undefined;
  return first && last ? `${first} ${last}` : null;
};

// ✅ GET all services
export const getServices = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const [rows] = await pool.execute<Service[]>('SELECT * FROM Services');
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
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
    return res.status(200).json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ CREATE a new service
export const createService = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name, duration_minutes, price, description, category } = req.body;
  const changed_by = getChangedBy(req);

  if (!name || !duration_minutes || !price || !description || !category) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Services (name, duration_minutes, price, description, category) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, duration_minutes, price, description, category]
    );

    const service_id = result.insertId;

    // 🔹 Log creation
    await logChange({
      entity_type: 'service',
      entity_id: service_id,
      action: 'create',
      changed_by,
      changes: { new: { name, duration_minutes, price, description, category } },
    });

    return res.status(201).json({
      message: 'Service created successfully.',
      service_id,
    });
  } catch (error: any) {
    console.error('Error creating service:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// ✅ UPDATE a service
export const updateService = async (req: NextApiRequest, res: NextApiResponse) => {
  const { service_id, name, duration_minutes, price, description, category } = req.body;
  const changed_by = getChangedBy(req);

  if (!service_id) {
    return res.status(400).json({ message: 'Service ID is required for update.' });
  }

  if (!name || !duration_minutes || !price || !description || !category) {
    return res.status(400).json({ message: 'All fields are required for update.' });
  }

  try {
    // 🔹 Fetch old data for logging
    const [oldRows] = await pool.execute<Service[]>(
      'SELECT * FROM Services WHERE service_id = ?',
      [service_id]
    );
    const oldService = oldRows[0];

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE Services 
       SET name = ?, duration_minutes = ?, price = ?, description = ?, category = ? 
       WHERE service_id = ?`,
      [name, duration_minutes, price, description, category, service_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    // 🔹 Log update
    await logChange({
      entity_type: 'service',
      entity_id: Number(service_id),
      action: 'update',
      changed_by,
      changes: {
        old: oldService,
        new: { service_id, name, duration_minutes, price, description, category },
      },
    });

    return res.status(200).json({ message: 'Service updated successfully.' });
  } catch (error) {
    console.error('Error updating service:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ✅ DELETE a service
export const deleteService = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  const changed_by = getChangedBy(req);

  if (!id) {
    return res.status(400).json({ message: 'Service ID is required.' });
  }

  try {
    // 🔹 Fetch old data for logging
    const [oldRows] = await pool.execute<Service[]>(
      'SELECT * FROM Services WHERE service_id = ?',
      [id]
    );
    const oldService = oldRows[0];

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM Services WHERE service_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    // 🔹 Log deletion
    await logChange({
      entity_type: 'service',
      entity_id: Number(id),
      action: 'delete',
      changed_by,
      changes: { old: oldService, new: null },
    });

    return res.status(200).json({ message: 'Service deleted successfully.' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

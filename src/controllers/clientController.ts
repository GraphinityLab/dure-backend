import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/utils/db";
import { ResultSetHeader } from "mysql2";

// Interface for the client data
interface Client {
  client_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

/**
 * Helper: Build changed_by from headers
 */
function getChangedBy(req: NextApiRequest): string {
  const first = req.headers["x-first-name"] as string | undefined;
  const last = req.headers["x-last-name"] as string | undefined;
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return "System";
}

/**
 * Log changes into ChangeLogs
 */
async function logChange({
  entity_type,
  entity_id,
  action,
  changed_by,
  changes,
}: {
  entity_type: string;
  entity_id: number;
  action: string;
  changed_by: string;
  changes?: any;
}) {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO ChangeLogs (entity_type, entity_id, action, changed_by, changes)
     VALUES (?, ?, ?, ?, ?)`,
    [entity_type, entity_id, action, changed_by, JSON.stringify(changes ?? {})]
  );
}

/**
 * @desc Create a new client
 */
export const createClient = async (req: NextApiRequest, res: NextApiResponse) => {
  const { first_name, last_name, email, phone_number, address, city, postal_code } = req.body;

  if (!first_name || !last_name || !email || !phone_number) {
    return res
      .status(400)
      .json({ message: "Missing required fields: first_name, last_name, email, phone_number" });
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Clients (first_name, last_name, email, phone_number, address, city, postal_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone_number, address, city, postal_code]
    );

    const client_id = result.insertId;
    const changed_by = getChangedBy(req);

    // Log creation
    await logChange({
      entity_type: "client",
      entity_id: client_id,
      action: "create",
      changed_by,
      changes: { new: { first_name, last_name, email, phone_number, address, city, postal_code } },
    });

    return res.status(201).json({
      client_id,
      first_name,
      last_name,
      email,
      phone_number,
      address,
      city,
      postal_code,
    });
  } catch (err) {
    console.error("Error creating client:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Get all clients
 */
export const getAllClients = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM Clients");
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching all clients:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Get a single client by ID
 */
export const getClientById = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  try {
    const [rows] = await pool.execute("SELECT * FROM Clients WHERE client_id = ?", [id]);
    const client = (rows as any)[0];
    if (!client) return res.status(404).json({ message: "Client not found" });
    return res.status(200).json(client);
  } catch (err) {
    console.error("Error fetching client by ID:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Update a client
 */
export const updateClient = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  const { first_name, last_name, email, phone_number, address, city, postal_code } = req.body;

  if (!first_name || !last_name || !email || !phone_number) {
    return res
      .status(400)
      .json({ message: "Missing required fields: first_name, last_name, email, phone_number" });
  }

  try {
    // Fetch old data for logging
    const [oldRows] = await pool.execute("SELECT * FROM Clients WHERE client_id = ?", [id]);
    const oldData = (oldRows as any)[0];

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE Clients 
       SET first_name = ?, last_name = ?, email = ?, phone_number = ?, address = ?, city = ?, postal_code = ?
       WHERE client_id = ?`,
      [first_name, last_name, email, phone_number, address, city, postal_code, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const changed_by = getChangedBy(req);

    // Log update
    await logChange({
      entity_type: "client",
      entity_id: Number(id),
      action: "update",
      changed_by,
      changes: {
        old: oldData,
        new: { first_name, last_name, email, phone_number, address, city, postal_code },
      },
    });

    return res.status(200).json({
      client_id: id,
      first_name,
      last_name,
      email,
      phone_number,
      address,
      city,
      postal_code,
    });
  } catch (err) {
    console.error("Error updating client:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @desc Delete a client
 */
export const deleteClient = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  try {
    // Fetch old data for logging
    const [oldRows] = await pool.execute("SELECT * FROM Clients WHERE client_id = ?", [id]);
    const oldData = (oldRows as any)[0];

    const [result] = await pool.execute<ResultSetHeader>(
      "DELETE FROM Clients WHERE client_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Client not found" });
    }

    const changed_by = getChangedBy(req);

    // Log deletion
    await logChange({
      entity_type: "client",
      entity_id: Number(id),
      action: "delete",
      changed_by,
      changes: { old: oldData, new: null },
    });

    return res.status(200).json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("Error deleting client:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

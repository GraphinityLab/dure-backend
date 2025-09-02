import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/utils/db";

// Interface for the client data, ensuring type safety.
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
 * @desc Create a new client
 * @param req The NextApiRequest object containing the new client's data in the body.
 * @param res The NextApiResponse object to send the response.
 */
export const createClient = async (req: NextApiRequest, res: NextApiResponse) => {
 const { first_name, last_name, email, phone_number, address, city, postal_code } = req.body;

 if (!first_name || !last_name || !email || !phone_number) {
  return res.status(400).json({ message: "Missing required fields: first_name, last_name, email, phone_number" });
 }

 const db = pool; // Use the imported pool instance
 const query = "INSERT INTO Clients (first_name, last_name, email, phone_number, address, city, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?)";
 try {
  const [result] = await db.execute(query, [first_name, last_name, email, phone_number, address, city, postal_code]);
  return res.status(201).json({ client_id: (result as any).insertId, first_name, last_name, email, phone_number, address, city, postal_code });
 } catch (err) {
  console.error("Error creating client:", err);
  return res.status(500).json({ message: "Internal Server Error" });
 }
};

/**
 * @desc Get all clients
 * @param req The NextApiRequest object.
 * @param res The NextApiResponse object to send the response.
 */
export const getAllClients = async (req: NextApiRequest, res: NextApiResponse) => {
 const db = pool; // Use the imported pool instance
 const query = "SELECT * FROM Clients";
 try {
  const [rows] = await db.execute(query);
  return res.status(200).json(rows);
 } catch (err) {
  console.error("Error fetching all clients:", err);
  return res.status(500).json({ message: "Internal Server Error" });
 }
};

/**
 * @desc Get a single client by ID
 * @param req The NextApiRequest object with the client ID in the query.
 * @param res The NextApiResponse object to send the response.
 */
export const getClientById = async (req: NextApiRequest, res: NextApiResponse) => {
 const { id } = req.query;

 const db = pool; // Use the imported pool instance
 const query = "SELECT * FROM Clients WHERE client_id = ?";
 try {
  const [rows] = await db.execute(query, [id]);
  const client = (rows as any)[0];
  if (!client) {
   return res.status(404).json({ message: "Client not found" });
  }
  return res.status(200).json(client);
 } catch (err) {
  console.error("Error fetching client by ID:", err);
  return res.status(500).json({ message: "Internal Server Error" });
 }
};

/**
 * @desc Update a client
 * @param req The NextApiRequest object with the client ID in the query and updated data in the body.
 * @param res The NextApiResponse object to send the response.
 */
export const updateClient = async (req: NextApiRequest, res: NextApiResponse) => {
 const { id } = req.query;
 const { first_name, last_name, email, phone_number, address, city, postal_code } = req.body;

 if (!first_name || !last_name || !email || !phone_number) {
  return res.status(400).json({ message: "Missing required fields: first_name, last_name, email, phone_number" });
 }

 const db = pool; // Use the imported pool instance
 const query = "UPDATE Clients SET first_name = ?, last_name = ?, email = ?, phone_number = ?, address = ?, city = ?, postal_code = ? WHERE client_id = ?";
 try {
  const [result] = await db.execute(query, [first_name, last_name, email, phone_number, address, city, postal_code, id]);
  if ((result as any).affectedRows === 0) {
   return res.status(404).json({ message: "Client not found" });
  }
  return res.status(200).json({ client_id: id, first_name, last_name, email, phone_number, address, city, postal_code });
 } catch (err) {
  console.error("Error updating client:", err);
  return res.status(500).json({ message: "Internal Server Error" });
 }
};

/**
 * @desc Delete a client
 * @param req The NextApiRequest object with the client ID in the query.
 * @param res The NextApiResponse object to send the response.
 */
export const deleteClient = async (req: NextApiRequest, res: NextApiResponse) => {
 const { id } = req.query;

 const db = pool; // Use the imported pool instance
 const query = "DELETE FROM Clients WHERE client_id = ?";
 try {
  const [result] = await db.execute(query, [id]);
  if ((result as any).affectedRows === 0) {
   return res.status(404).json({ message: "Client not found" });
  }
  return res.status(200).json({ message: "Client deleted successfully" });
 } catch (err) {
  console.error("Error deleting client:", err);
  return res.status(500).json({ message: "Internal Server Error" });
 }
};

import pool from "./db";
import bcrypt from "bcryptjs";

// Mock staff data
const staffSeedData = [
  {
    email: "admin@example.com",
    username: "admin",
    password: "admin123",
    role_id: 1, // Assuming role_id 1 = Admin
    first_name: "System",
    last_name: "Administrator",
    address: "123 Main St",
    city: "Toronto",
    province: "ON",
    postal_code: "M1A1A1",
  },
  {
    email: "jane.doe@example.com",
    username: "jane",
    password: "password123",
    role_id: 2, // Assuming role_id 2 = Staff
    first_name: "Jane",
    last_name: "Doe",
    address: "456 Elm St",
    city: "Vancouver",
    province: "BC",
    postal_code: "V5K0A1",
  },
  {
    email: "john.smith@example.com",
    username: "john",
    password: "password123",
    role_id: 2,
    first_name: "John",
    last_name: "Smith",
    address: "789 Oak St",
    city: "Calgary",
    province: "AB",
    postal_code: "T2A2B2",
  },
];

async function seedStaff() {
  const connection = await pool.getConnection();
  try {
    for (const staff of staffSeedData) {
      const hashedPassword = await bcrypt.hash(staff.password, 10);

      await connection.execute(
        `INSERT INTO staff 
         (email, username, hashed_password, role_id, first_name, last_name, address, city, province, postal_code) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          staff.email,
          staff.username,
          hashedPassword,
          staff.role_id,
          staff.first_name,
          staff.last_name,
          staff.address,
          staff.city,
          staff.province,
          staff.postal_code,
        ]
      );

      console.log(`✅ Inserted staff: ${staff.username}`);
    }
  } catch (error) {
    console.error("❌ Error seeding staff:", error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seedStaff();

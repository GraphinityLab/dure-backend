// utils/passwordUtils.ts
import bcrypt from 'bcryptjs';

const saltRounds = 10; // The cost factor for hashing

/**
 * Hashes a plain text password.
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password with a hashed password.
 * @param password - The plain text password.
 * @param hash - The hashed password from the database.
 * @returns A promise that resolves to true if passwords match, false otherwise.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};
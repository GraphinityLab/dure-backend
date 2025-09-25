import pool from "@/utils/db";
import { ResultSetHeader } from "mysql2";

interface LogChangeProps {
  entity_type: "staff" | "appointment" | "service" | "client" | "role";
  entity_id: number;
  action: "create" | "update" | "delete";
  changed_by: string | null;
  changes?: any;
}

// ✅ Fields that should never appear raw in logs
const SENSITIVE_KEYS = ["hashed_password", "password"];

function sanitize(obj: any) {
  if (!obj || typeof obj !== "object") return obj;

  const clone: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.includes(key)) {
      clone[key] = "***hidden***"; // mask sensitive field
    } else {
      clone[key] = obj[key];
    }
  }
  return clone;
}

export async function logChange({
  entity_type,
  entity_id,
  action,
  changed_by,
  changes,
}: LogChangeProps) {
  const timestamp = new Date();

  const safeChanges =
    changes && typeof changes === "object"
      ? {
          old: sanitize(changes.old),
          new: sanitize(changes.new),
        }
      : changes;

  await pool.execute<ResultSetHeader>(
    `INSERT INTO ChangeLogs (entity_type, entity_id, action, changed_by, changes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entity_type,
      entity_id,
      action,
      changed_by ?? "Unknown",
      JSON.stringify(safeChanges ?? {}),
      timestamp,
    ]
  );
}

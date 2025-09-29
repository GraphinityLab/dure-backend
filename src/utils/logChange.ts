import pool from "@/utils/db";
import { ResultSetHeader } from "mysql2";

interface LogChangeProps {
  entity_type: "staff" | "appointment" | "service" | "client" | "role";
  entity_id: number;
  action: "create" | "update" | "delete";
  changed_by: string | null;
  changes?: unknown;
}

// ✅ Fields that should never appear raw in logs
const SENSITIVE_KEYS = ["hashed_password", "password"];

// ✅ sanitize handles both arrays and objects
function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  const clone: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.includes(key)) {
      clone[key] = "***hidden***"; // mask sensitive field
    } else {
      clone[key] = sanitize((obj as Record<string, unknown>)[key]);
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
        old: sanitize((changes as { old?: unknown }).old),
        new: sanitize((changes as { new?: unknown }).new),
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

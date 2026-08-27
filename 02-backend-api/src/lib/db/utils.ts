export interface RowSet {
  text: string;
  params: unknown[];
}

export interface ColumnDef {
  /** Database column name (snake_case). */
  col: string;
  /** Entity field name (camelCase). */
  camel: string;
  /** Optional value serializer before binding (e.g. JSON.stringify). */
  serialize?: (value: unknown) => unknown;
}

/**
 * Builds a parameterized UPDATE ... RETURNING * statement from a partial
 * patch, mapping camelCase entity fields to snake_case columns.
 * Returns null when there is nothing to update.
 */
export function buildUpdate(
  table: string,
  id: string,
  patch: Record<string, unknown>,
  columns: readonly ColumnDef[],
): RowSet | null {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const def of columns) {
    const value = patch[def.camel];
    if (value !== undefined) {
      params.push(def.serialize ? def.serialize(value) : value);
      sets.push(`${def.col} = $${params.length}`);
    }
  }
  if (sets.length === 0) return null;
  params.push(id);
  return {
    text: `UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params,
  };
}

/** Normalizes a timestamp cell to an ISO string. */
export function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value ?? "");
}

/** Parses a numeric cell (pg returns NUMERIC as string) to a JS number. */
export function toNumber(value: unknown): number {
  return Number(value ?? 0);
}
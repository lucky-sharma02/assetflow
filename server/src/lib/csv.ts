import { stringify } from "csv-stringify/sync";

export interface CsvColumn<T> {
  key: keyof T;
  header: string;
}

// csv-stringify handles quoting/escaping (commas, quotes, newlines within
// a field value) correctly -- don't hand-roll this with a join(","), it
// will silently corrupt the file on the first value containing a comma.
export function toCSV<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((c) => row[c.key] ?? ""));
  return stringify([header, ...body]);
}

export function csvFilename(base: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${base}-${date}.csv`;
}

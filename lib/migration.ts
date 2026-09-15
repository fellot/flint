import type { WineWrite } from '@/types/database';
import { newWineInput } from '@/lib/wine-data';

export type ImportedWine = WineWrite & { id: string; cellar_id: string };
export function prepareImport(value: unknown, cellarId: string): ImportedWine[] {
  if (!Array.isArray(value)) throw new Error(`Cellar ${cellarId}: expected an array.`);
  const ids = new Set<string>();
  return value.map((wine, index) => {
    if (!wine || typeof wine.id !== 'string' || !wine.id.trim()) throw new Error(`Cellar ${cellarId}, row ${index + 1}: missing ID.`);
    if (ids.has(wine.id)) throw new Error(`Cellar ${cellarId}: duplicate ID ${wine.id}.`);
    ids.add(wine.id);
    try { return { ...newWineInput(wine), id: wine.id, cellar_id: cellarId }; }
    catch (error) { throw new Error(`Cellar ${cellarId}, wine ${wine.id}: ${error instanceof Error ? error.message : error}`); }
  });
}

export function importSql(rows: ImportedWine[]) {
  if (!rows.length) return 'begin;\ncommit;\n';
  const columns = Object.keys(rows[0]) as (keyof ImportedWine)[];
  const quote = (value: unknown) => value == null ? 'NULL' : typeof value === 'number' || typeof value === 'boolean' ? String(value) : "'" + String(value).replace(/'/g, "''") + "'";
  return `-- Generated from the legacy wine files. Existing rows are left untouched.\nbegin;\nset local standard_conforming_strings = on;\ninsert into public.wines (${columns.join(', ')}) values\n` + rows.map(row => '(' + columns.map(column => quote(row[column])).join(', ') + ')').join(',\n') + '\non conflict (cellar_id, id) do nothing;\ncommit;\n';
}

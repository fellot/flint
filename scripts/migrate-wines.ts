import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { prepareImport, importSql, type ImportedWine } from '../lib/migration';
import type { Database } from '../types/database';

async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(['--apply', '--sql', '--data-dir']);
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error(`Unknown argument: ${args[i]}`);
    if (args[i] !== '--apply' && (!args[++i] || args[i].startsWith('--'))) throw new Error('Missing argument value.');
  }
  const option = (name: string) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
  if (args.includes('--apply') && args.includes('--sql')) throw new Error('Choose --apply or --sql, not both.');
  const dataDir = path.resolve(option('--data-dir') || 'data');
  const rows: ImportedWine[] = [];
  for (const [cellarId, file] of [['1', 'wines.json'], ['2', 'wines2.json'], ['3', 'wines3.json']]) {
    const imported = prepareImport(JSON.parse(await readFile(path.join(dataDir, file), 'utf8')), cellarId);
    rows.push(...imported);
    console.log(`Cellar ${cellarId}: ${imported.length} records validated (${file}).`);
  }
  const sqlPath = option('--sql');
  if (sqlPath) {
    await writeFile(path.resolve(sqlPath), importSql(rows), { flag: 'wx' });
    console.log(`Wrote ${rows.length} records to ${path.resolve(sqlPath)}. Run this file in the Supabase SQL editor after the schema migration.`);
    return;
  }
  if (!args.includes('--apply')) {
    console.log(`Dry run complete: ${rows.length} records. Use --sql <new-file.sql> to export SQL, or --apply to import into Supabase.`);
    return;
  }
  // Load only for a live import; no credentials are needed to validate/export SQL.
  if (existsSync('.env.local')) process.loadEnvFile('.env.local');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) for --apply.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: cellars, error: cellarError } = await client.from('cellars').select('id');
  if (cellarError) throw cellarError;
  if (!['1', '2', '3'].every(id => cellars.some(cellar => cellar.id === id))) throw new Error('Run the schema SQL before importing.');
  // A single statement is atomic. ignoreDuplicates makes re-runs safe after edits in the app.
  const { error } = await client.from('wines').upsert(rows, { onConflict: 'cellar_id,id', ignoreDuplicates: true });
  if (error) throw error;
  console.log(`Import complete: ${rows.length} source records processed; existing IDs were left untouched.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });

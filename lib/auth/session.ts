import 'server-only';
import { cookies } from 'next/headers';
import { ApiError } from '@/lib/api-error';
import { createClient } from '@/lib/supabase/server';
import type { Cellar } from '@/types/database';

export async function requireUser() {
  let supabase;
  try { supabase = createClient(); } catch { throw new ApiError(503, 'Sign-in is not configured yet.'); }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ApiError(401, 'Please sign in to continue.');
  return { supabase, user };
}

export function selectCellar(cellars: Cellar[], requested?: string | null, preferred?: string) {
  if (requested !== undefined && requested !== null) {
    const cellar = cellars.find(c => c.id === requested);
    if (!cellar) throw new ApiError(403, 'You do not have access to this cellar.');
    return cellar;
  }
  const cellar = cellars.find(c => c.id === preferred) || cellars[0];
  if (!cellar) throw new ApiError(403, 'Your account has not been assigned a cellar. Please contact the cellar owner.');
  return cellar;
}

export async function getSessionContext() {
  const { supabase, user } = await requireUser();
  // RLS returns only cellars assigned to this authenticated user.
  const { data, error } = await supabase.from('cellars').select('*').order('id');
  if (error) throw error;
  return { supabase, user, cellars: data };
}

export async function requireCellar(requested?: string | null) {
  const context = await getSessionContext();
  const cellar = selectCellar(context.cellars, requested, cookies().get('data_source')?.value);
  return { ...context, cellar };
}

export function setCellarCookie(id: string) {
  cookies().set('data_source', id, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365,
  });
}

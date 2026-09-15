import { requestOrigin } from '@/lib/auth/request';
import { NextResponse } from 'next/server';
import { WineValidationError } from '@/lib/wine-data';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function apiError(error: unknown) {
  if (error instanceof WineValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'private, no-store' } });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  console.error('Request failed:', error);
  return NextResponse.json({ error: 'Unable to complete the request. Please try again.' }, { status: 500 });
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  if (origin !== requestOrigin(request)) throw new ApiError(403, 'Request origin is not allowed.');
}

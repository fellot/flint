import { redirect } from 'next/navigation';
import { safeRedirect } from '@/lib/auth/redirect';

export default function LegacyPinPage({ searchParams }: { searchParams: { redirect?: string } }) {
  redirect(`/login?redirect=${encodeURIComponent(safeRedirect(searchParams.redirect))}`);
}

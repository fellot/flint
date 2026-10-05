import { requireUser } from '@/lib/auth/session';
import { createAccountPreferencesHandler } from '@/lib/account-preferences-endpoint';

export const dynamic = 'force-dynamic';
export const PUT = createAccountPreferencesHandler(requireUser);

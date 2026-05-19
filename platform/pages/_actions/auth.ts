"use server";

import { signOut as authSignOut } from "@/platform/lib/auth";

// Layout-wide sign-out — used by the user-menu dropdown in the authed
// nav. Delegates to lib/auth's signOut(), which clears the Supabase session
// cookie via createSupabaseServerClient + redirects to "/".
//
// The legacy app/(authed)/dashboard/sign-out.action.ts predates the nav menu;
// it's still wired to the dashboard's standalone "Sign out" button and is
// safe to remove once that button goes away.
export async function signOutAction(): Promise<void> {
  await authSignOut();
}

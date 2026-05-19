"use server";

import { signOut as authSignOut } from "@/platform/lib/auth";

// Server action used by the dashboard sign-out form.
// Wraps lib/auth/signOut so the redirect happens server-side.
export async function signOutAction() {
  await authSignOut();
}

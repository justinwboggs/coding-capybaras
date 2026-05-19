import { z } from "zod";

// Used by the magic-link sign-in form on both client (RHF resolver) and
// server (server-action revalidation).
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export type SignInInput = z.infer<typeof signInSchema>;

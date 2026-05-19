import { z } from "zod";

// Pro-tier priority-support submission. Server action also re-checks
// canAccess(userId, 'support.priority') — never trust the client.
export const supportRequestSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Add a short subject (3+ characters)")
    .max(200, "Keep the subject under 200 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Add a few details — at least a sentence")
    .max(5000),
  /**
   * Optional URL the user was on when they hit "Support" — useful context
   * for triage. Sent from the client; the action just sanitizes length.
   */
  pageUrl: z.string().trim().max(500).optional().or(z.literal("")),
});
export type SupportRequestInput = z.infer<typeof supportRequestSchema>;

import { z } from "zod";

// Public Business-inquiry contact form. Used by both the client resolver
// and the server action — the server never trusts the client.
export const businessInquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  whatBuilding: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least a sentence")
    .max(2000),
  teamSize: z.enum(["1-5", "6-20", "21-100", "100+"], {
    errorMap: () => ({ message: "Pick a team size" }),
  }),
});
export type BusinessInquiryInput = z.infer<typeof businessInquirySchema>;

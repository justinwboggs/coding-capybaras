"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/platform/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/components/ui/form";
import { Input } from "@/platform/components/ui/input";
import { Textarea } from "@/platform/components/ui/textarea";
import {
  businessInquirySchema,
  type BusinessInquiryInput,
} from "@/platform/lib/validation/business";

import { submitBusinessInquiryAction } from "./actions";

const TEAM_SIZES = [
  { value: "1-5", label: "1–5" },
  { value: "6-20", label: "6–20" },
  { value: "21-100", label: "21–100" },
  { value: "100+", label: "100+" },
] as const;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<BusinessInquiryInput>({
    resolver: zodResolver(businessInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      whatBuilding: "",
      teamSize: "1-5",
    },
  });

  async function onSubmit(values: BusinessInquiryInput) {
    const result = await submitBusinessInquiryAction(values);
    if ("error" in result) {
      toast.error("Couldn't submit", { description: result.error });
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-6 text-sm">
        <p className="font-semibold">Thanks — we&apos;ll be in touch soon.</p>
        <p className="text-muted-foreground">
          {/* COPY_TODO: optional follow-up line on the contact confirmation. */}
          COPY_TODO: optional follow-up line.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company (optional)</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="whatBuilding"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What are you building?</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teamSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anticipated team size</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {TEAM_SIZES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Sending…" : "Send inquiry"}
        </Button>
      </form>
    </Form>
  );
}

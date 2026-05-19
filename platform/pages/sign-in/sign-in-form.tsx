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
import { createSupabaseBrowserClient } from "@/platform/lib/supabase/client";
import { signInSchema, type SignInInput } from "@/platform/lib/validation/auth";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function SignInForm({ next }: { next?: string }) {
  const supabase = createSupabaseBrowserClient();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Carry ?next= through the magic-link / OAuth round-trip so the user lands
  // back where they started (e.g. /pricing). /auth/callback validates it.
  const callbackUrl = next
    ? `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}`
    : `${APP_URL}/auth/callback`;

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: SignInInput) {
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      toast.error("Couldn't send the link", { description: error.message });
      return;
    }

    toast.success("Check your email", {
      description: `We sent a magic link to ${values.email}.`,
    });
    form.reset();
  }

  async function onGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed", { description: error.message });
    }
    // On success the browser is redirected by Supabase; no need to clear loading.
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...field}
                  />
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
            {form.formState.isSubmitting
              ? "Sending magic link…"
              : "Send magic link"}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
      </Button>
    </div>
  );
}

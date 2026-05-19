"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { submitSupportRequestAction } from "@/platform/pages/_actions/support";
import { Button } from "@/platform/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/platform/components/ui/dialog";
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
  supportRequestSchema,
  type SupportRequestInput,
} from "@/platform/lib/validation/support";

type FormValues = Omit<SupportRequestInput, "pageUrl">;

const formSchema = supportRequestSchema.omit({ pageUrl: true });

export function SupportButton({ isPro }: { isPro: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function handleClick() {
    if (!isPro) {
      router.push("/pricing");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        // Non-Pro: muted appearance, native tooltip via title attr (avoids
        // adding @radix-ui/react-tooltip for one tooltip).
        title={isPro ? "Open priority support" : "Upgrade to Pro for priority support"}
        className={
          isPro
            ? "text-sm text-muted-foreground transition-colors hover:text-foreground"
            : "cursor-pointer text-sm text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        }
      >
        Support
      </button>

      {isPro && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Priority support</DialogTitle>
              <DialogDescription>
                We&apos;ll route this straight to the team. Pro tier — answered
                first.
              </DialogDescription>
            </DialogHeader>
            <SupportForm
              pageUrl={pathname}
              onSubmitted={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function SupportForm({
  pageUrl,
  onSubmitted,
}: {
  pageUrl: string;
  onSubmitted: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", description: "" },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await submitSupportRequestAction({ ...values, pageUrl });
      if ("error" in result) {
        toast.error("Couldn't send", { description: result.error });
        return;
      }
      toast.success("Support request sent", {
        description: "We'll reply by email shortly.",
      });
      form.reset();
      onSubmitted();
    });
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
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input
                  placeholder="What can we help with?"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="What were you trying to do? What happened?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

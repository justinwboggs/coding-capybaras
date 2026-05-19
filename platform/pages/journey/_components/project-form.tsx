"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/components/ui/form";
import { Input } from "@/platform/components/ui/input";
import { Label } from "@/platform/components/ui/label";
import { Textarea } from "@/platform/components/ui/textarea";
import {
  projectStageRequiredSchema,
  type ProjectStageInput,
} from "@/platform/lib/validation/journey";

import { saveStageAction } from "../actions";

import { StageFormFooter } from "./stage-form-footer";

const CATEGORIES = [
  { value: "saas", label: "SaaS" },
  { value: "marketplace", label: "Marketplace" },
  { value: "content", label: "Content" },
  { value: "tool", label: "Tool" },
  { value: "other", label: "Other" },
] as const;

export function ProjectForm({ initial }: { initial: ProjectStageInput }) {
  const [saving, startSaving] = useTransition();

  const form = useForm<ProjectStageInput>({
    resolver: zodResolver(projectStageRequiredSchema),
    defaultValues: {
      name: initial.name ?? "",
      what: initial.what ?? "",
      audience: initial.audience ?? "",
      category: initial.category ?? "",
    },
  });

  function onSaveOnly() {
    startSaving(async () => {
      const result = await saveStageAction({
        stage: "project",
        data: form.getValues(),
        intent: "save",
      });
      if (result && "error" in result) {
        toast.error("Couldn't save", { description: result.error });
        return;
      }
      toast.success("Progress saved");
    });
  }

  async function onContinue(values: ProjectStageInput) {
    const result = await saveStageAction({
      stage: "project",
      data: values,
      intent: "continue",
    });
    if (result && "error" in result) {
      toast.error("Couldn't continue", { description: result.error });
    }
    // success path is a server-side redirect — the toast wouldn't have time to show
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What are you building?</CardTitle>
        <CardDescription>
          The name flows into branding automatically — we&apos;ll show it in
          the header and metadata across the site. You can rename later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onContinue)}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Project name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Sarah's Calendar, Acme Tasks, My App"
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
              name="what"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    What are you building?{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="A one-paragraph pitch. What does it do, what problem does it solve?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Who is it for?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Optional. Specifics help — &ldquo;solo founders who code with AI&rdquo; beats &ldquo;developers&rdquo;."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((opt) => (
                      <Label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent has-[input:checked]:border-primary has-[input:checked]:bg-accent"
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          checked={field.value === opt.value}
                          onChange={() => field.onChange(opt.value)}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        {opt.label}
                      </Label>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <StageFormFooter
              onSaveOnly={onSaveOnly}
              saving={saving}
              submitting={form.formState.isSubmitting}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

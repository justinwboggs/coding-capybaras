"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/platform/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";
import { Input } from "@/platform/components/ui/input";
import { Label } from "@/platform/components/ui/label";
import { Textarea } from "@/platform/components/ui/textarea";
import {
  emailTemplatesFormSchema,
  type EmailTemplatesFormInput,
} from "@/platform/lib/validation/config";

import { saveEmailTemplatesAction } from "../actions";

interface TemplateProps {
  key: string;
  label: string;
  description: string;
  variables: string[];
  subject: string;
  body: string;
}

export function EmailTemplatesForm({
  templates,
}: {
  templates: TemplateProps[];
}) {
  const form = useForm<EmailTemplatesFormInput>({
    resolver: zodResolver(emailTemplatesFormSchema),
    defaultValues: {
      templates: templates.map((t) => ({
        key: t.key,
        subject: t.subject,
        body: t.body,
      })),
    },
  });
  const { fields } = useFieldArray({
    control: form.control,
    name: "templates",
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: EmailTemplatesFormInput) {
    const result = await saveEmailTemplatesAction(values);
    if ("error" in result) {
      toast.error("Couldn't save templates", { description: result.error });
      return;
    }
    toast.success("Email templates saved", {
      description: "New sends will use the updated copy.",
    });
    form.reset(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Templates</CardTitle>
        <CardDescription>
          Subject and body for each transactional email. Plain text with{" "}
          <code>{"{{variable}}"}</code> substitution — a rich editor is V2.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {fields.map((field, i) => {
            const meta = templates[i];
            const tErrors = errors.templates?.[i];
            return (
              <div key={field.id} className="space-y-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">{meta.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {meta.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Variables:{" "}
                    {meta.variables.map((v) => (
                      <code
                        key={v}
                        className="mr-1 rounded bg-muted px-1 py-0.5"
                      >
                        {v}
                      </code>
                    ))}
                  </p>
                </div>

                {/* key has no input — register it hidden so it's in the payload */}
                <input type="hidden" {...register(`templates.${i}.key`)} />

                <div className="space-y-2">
                  <Label htmlFor={`tpl-${i}-subject`}>Subject</Label>
                  <Input
                    id={`tpl-${i}-subject`}
                    {...register(`templates.${i}.subject`)}
                  />
                  {tErrors?.subject && (
                    <p className="text-sm font-medium text-destructive">
                      {tErrors.subject.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tpl-${i}-body`}>Body</Label>
                  <Textarea
                    id={`tpl-${i}-body`}
                    rows={8}
                    className="font-mono text-xs"
                    {...register(`templates.${i}.body`)}
                  />
                  {tErrors?.body && (
                    <p className="text-sm font-medium text-destructive">
                      {tErrors.body.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save email templates"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

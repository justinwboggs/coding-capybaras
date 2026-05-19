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
import { Form, FormField } from "@/platform/components/ui/form";
import { Label } from "@/platform/components/ui/label";
import { ENV_TEMPLATE_SUPABASE } from "@/platform/lib/journey/env-templates";
import {
  foundationStageRequiredSchema,
  type FoundationStageInput,
} from "@/platform/lib/validation/journey";

import { saveStageAction } from "../actions";

import { CopyableCodeBlock } from "./copyable-code-block";
import { EnvDownloadButton } from "./env-download-button";
import { SecurityCallout, SecurityIntro } from "./security-bits";
import { StageFormFooter } from "./stage-form-footer";

interface FoundationFormProps {
  initial: {
    attestations?: FoundationStageInput;
  };
}

// Stage 2 — Foundation (Supabase). Pure instructions + self-attestation.
// We never collect the user's Supabase keys; they go into the user's local
// .env.local only. journey.data.foundation persists only the attestation
// booleans + {confirmed, confirmed_at}. See SECURITY_REDESIGN.md.
export function FoundationForm({ initial }: FoundationFormProps) {
  const [saving, startSaving] = useTransition();
  const atts = initial.attestations ?? {};

  const form = useForm<FoundationStageInput>({
    resolver: zodResolver(foundationStageRequiredSchema),
    defaultValues: {
      createdProject: atts.createdProject ?? false,
      addedEnvVars: atts.addedEnvVars ?? false,
      verifiedGitignore: atts.verifiedGitignore ?? false,
    },
  });

  const v = form.watch();
  const allChecked = Boolean(
    v.createdProject && v.addedEnvVars && v.verifiedGitignore,
  );

  function onSaveOnly() {
    startSaving(async () => {
      const result = await saveStageAction({
        stage: "foundation",
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

  async function onContinue(values: FoundationStageInput) {
    const result = await saveStageAction({
      stage: "foundation",
      data: values,
      intent: "continue",
    });
    if (result && "error" in result) {
      toast.error("Couldn't continue", { description: result.error });
    }
  }

  return (
    <div className="space-y-4">
      <SecurityIntro />

      <Card>
        <CardHeader>
          <CardTitle>Connect Supabase</CardTitle>
          <CardDescription>
            Supabase gives your app a database (where your users and content
            live) and authentication (sign-in). The free tier is plenty to
            start, and you don&apos;t need a credit card to sign up.
          </CardDescription>
          <a
            href="https://supabase.com/docs/guides/getting-started"
            target="_blank"
            rel="noreferrer"
            className="block w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Watch a 2-minute setup walkthrough →
          </a>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Need a starter <code>.env.local</code> file? Download a template
              with every variable name ready — just fill in your values.
            </span>
            <EnvDownloadButton variant="outline" />
          </div>

          <SecurityCallout />

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onContinue)}
              className="space-y-6"
              noValidate
            >
              <section className="space-y-2">
                <h3 className="font-semibold">
                  1. Create your Supabase project
                </h3>
                <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>
                    Open{" "}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      supabase.com/dashboard
                    </a>{" "}
                    in a new tab. Sign up if you don&apos;t have an account
                    yet, or sign in if you do.
                  </li>
                  <li>
                    Click <strong>New project</strong>. Give it any name — you
                    can change it later. For &ldquo;region,&rdquo; pick one
                    close to where your users will be (closer = faster app).
                  </li>
                  <li>
                    Set a database password.{" "}
                    <strong>Save it somewhere safe right now</strong> — a
                    password manager, a note in your phone, anywhere
                    you&apos;ll find it. You&apos;ll need it again in Step 2.
                  </li>
                  <li>
                    Wait ~2 minutes while Supabase sets up your project. Come
                    back to this page when it&apos;s ready to continue.
                  </li>
                </ol>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">
                  2. Add your four Supabase values to your local{" "}
                  <code>.env.local</code> file
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your <code>.env.local</code> file lives in your project
                  folder — the same folder that has <code>package.json</code>.
                  Open it in your code editor (Cursor or VS Code) and paste
                  these four lines at the bottom:
                </p>
                <CopyableCodeBlock code={ENV_TEMPLATE_SUPABASE} />
                <p className="text-sm text-muted-foreground">
                  Now go to your Supabase project and replace each placeholder
                  with its real value:
                </p>
                <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>
                    In Supabase, click <strong>Project Settings</strong> (gear
                    icon, bottom-left) → <strong>API</strong>. You&apos;ll
                    find three values here:
                    <ul className="ml-5 mt-1 list-disc space-y-1">
                      <li>
                        <strong>Project URL</strong> → paste into{" "}
                        <code>NEXT_PUBLIC_SUPABASE_URL</code>
                        {/* COPY_TODO: review tone — inline example. */}
                        <div className="mt-0.5 text-xs">
                          <em>yours will look like</em>{" "}
                          <code>https://abcdefghijklmnopqrst.supabase.co</code>
                        </div>
                      </li>
                      <li>
                        <strong>Publishable key</strong> → paste into{" "}
                        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                        {/* COPY_TODO: review tone — inline example. */}
                        <div className="mt-0.5 text-xs">
                          <em>yours starts with</em>{" "}
                          <code>sb_publishable_</code>{" "}
                          <em>and runs about 50 characters</em>
                        </div>
                      </li>
                      <li>
                        <strong>Secret key</strong> → paste into{" "}
                        <code>SUPABASE_SERVICE_ROLE_KEY</code> (this one&apos;s
                        the most sensitive — keep it safe)
                        {/* COPY_TODO: review tone — inline example. */}
                        <div className="mt-0.5 text-xs">
                          <em>yours starts with</em> <code>sb_secret_</code>{" "}
                          <em>and is a similar length</em>
                        </div>
                      </li>
                    </ul>
                  </li>
                  <li>
                    For <code>DATABASE_URL</code>, go to{" "}
                    <strong>Project Settings → Database</strong>, scroll to{" "}
                    <strong>Connection string</strong>, and select the{" "}
                    <strong>Transaction pooler</strong> tab. Copy the string,
                    then replace <code>[PASSWORD]</code> in it with the
                    database password you saved in Step 1.
                    {/* COPY_TODO: review tone — inline example. */}
                    <div className="mt-1 text-xs">
                      <em>yours will look like</em>{" "}
                      <code className="break-all">
                        postgresql://postgres.abcdefghijklmnopqrst:YourPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres
                      </code>
                    </div>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Save the file. (<strong>Cmd+S</strong> on Mac,{" "}
                  <strong>Ctrl+S</strong> on Windows.)
                </p>
              </section>

              <section className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-4">
                <h3 className="font-semibold">
                  3. A 30-second check to confirm your secrets are safe
                </h3>
                <p className="text-sm">
                  Good news: your boilerplate is already set up to keep{" "}
                  <code>.env.local</code> off of GitHub. This step is just a
                  quick check to confirm it&apos;s working — should take about
                  30 seconds.
                </p>
                <ol className="ml-5 list-decimal space-y-2 text-sm">
                  <li>
                    Open your code editor (Cursor or VS Code). Make sure your
                    project folder is the one that&apos;s open.
                  </li>
                  <li>
                    Open the Terminal panel inside your editor. Two ways —
                    pick whichever is easier:
                    <ul className="ml-5 mt-1 list-disc space-y-1">
                      <li>
                        From the top menu:{" "}
                        <strong>Terminal → New Terminal</strong>
                      </li>
                      <li>
                        Keyboard shortcut:{" "}
                        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-xs">
                          Ctrl+`
                        </kbd>{" "}
                        (the backtick key, just above Tab — same on Mac and
                        Windows)
                      </li>
                    </ul>
                    A panel opens at the bottom of your editor with a command
                    prompt.
                  </li>
                  <li>
                    Type this command exactly, then press{" "}
                    <strong>Enter</strong>:
                    <div className="mt-2">
                      <CopyableCodeBlock code="git status" />
                    </div>
                  </li>
                  <li>
                    Look at the output. You should <strong>NOT</strong> see{" "}
                    <code>.env.local</code> anywhere in it. If it&apos;s
                    missing, your protection is working. ✅
                  </li>
                </ol>
                <p className="text-sm">
                  <strong>
                    If you DO see <code>.env.local</code> in the output
                  </strong>
                  , that means it&apos;s not yet protected. Click Support in
                  the top-right and we&apos;ll help you fix it — it&apos;s a
                  small fix, but worth doing right away before going further.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>What&apos;s happening behind the scenes:</strong>{" "}
                  your boilerplate includes a file called{" "}
                  <code>.gitignore</code> that tells Git which files to skip
                  when uploading to GitHub. <code>.env.local</code> is already
                  on that skip list, which is why the check above should pass.
                </p>
              </section>

              <Attestations form={form} />

              <StageFormFooter
                onSaveOnly={onSaveOnly}
                saving={saving}
                submitting={form.formState.isSubmitting}
                continueDisabled={!allChecked}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function Attestations({
  form,
}: {
  form: ReturnType<typeof useForm<FoundationStageInput>>;
}) {
  return (
    <section className="space-y-3 rounded-md border bg-muted/40 p-4">
      <Label className="text-sm font-semibold">Confirm before continuing</Label>
      <div className="space-y-2">
        <FormField
          control={form.control}
          name="createdProject"
          render={({ field }) => (
            <AttestationBox
              checked={Boolean(field.value)}
              onChange={field.onChange}
            >
              I&apos;ve created my Supabase project
            </AttestationBox>
          )}
        />
        <FormField
          control={form.control}
          name="addedEnvVars"
          render={({ field }) => (
            <AttestationBox
              checked={Boolean(field.value)}
              onChange={field.onChange}
            >
              I&apos;ve added my four Supabase values to my local{" "}
              <code>.env.local</code> file
            </AttestationBox>
          )}
        />
        <FormField
          control={form.control}
          name="verifiedGitignore"
          render={({ field }) => (
            <AttestationBox
              checked={Boolean(field.value)}
              onChange={field.onChange}
            >
              I&apos;ve confirmed my <code>.env.local</code> is protected (via
              the <code>git status</code> check)
            </AttestationBox>
          )}
        />
      </div>
    </section>
  );
}

function AttestationBox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Label className="flex cursor-pointer items-start gap-3 rounded-md border bg-background p-3 transition-colors has-[input:checked]:border-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
      <span className="text-sm font-normal leading-snug">{children}</span>
    </Label>
  );
}

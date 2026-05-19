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
import { ENV_TEMPLATE_RESEND } from "@/platform/lib/journey/env-templates";
import {
  emailStageRequiredSchema,
  type EmailStageInput,
} from "@/platform/lib/validation/journey";

import { saveStageAction } from "../actions";

import { CopyableCodeBlock } from "./copyable-code-block";
import { SecurityCallout } from "./security-bits";
import { StageFormFooter } from "./stage-form-footer";

interface EmailFormProps {
  initial: {
    attestations?: EmailStageInput;
  };
}

// COPY_TODO: review tone — illustrative completed .env.local content.
// Values are redacted/realistic-shaped examples; not real secrets.
const COMPLETED_ENV_EXAMPLE = `# .env.local

# ─── App ──────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ─── Supabase ─────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_abc123def456ghi789jkl012mno345pqr
SUPABASE_SERVICE_ROLE_KEY=sb_secret_abc123def456ghi789jkl012mno345pqr
DATABASE_URL=postgresql://postgres.abcdefghijklmnopqrst:YourPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# ─── Stripe ───────────────────────────────────────────────────────
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_51HxVabc123def456ghi789jkl012mno345pqr678stu901vwx234yz
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51HxVabc123def456ghi789jkl012mno345pqr678stu901vwx234yz
STRIPE_WEBHOOK_SECRET=whsec_abc123def456ghi789jkl012mno345pq

# ─── Resend ───────────────────────────────────────────────────────
RESEND_API_KEY=re_abc123def456ghi789jkl012mno345pqr
EMAIL_FROM=Acme Tasks <onboarding@resend.dev>`;

// Stage 4 — Email (Resend). Instructions + 2 attestations. Resend API key
// stays on the user's machine — only the user's two confirmations land
// in journey.data.email.attestations.
export function EmailForm({ initial }: EmailFormProps) {
  const [saving, startSaving] = useTransition();
  const atts = initial.attestations ?? {};

  const form = useForm<EmailStageInput>({
    resolver: zodResolver(emailStageRequiredSchema),
    defaultValues: {
      createdAccount: atts.createdAccount ?? false,
      addedEnvVars: atts.addedEnvVars ?? false,
    },
  });

  const v = form.watch();
  const allChecked = Boolean(v.createdAccount && v.addedEnvVars);

  function onSaveOnly() {
    startSaving(async () => {
      const result = await saveStageAction({
        stage: "email",
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

  async function onContinue(values: EmailStageInput) {
    const result = await saveStageAction({
      stage: "email",
      data: values,
      intent: "continue",
    });
    if (result && "error" in result) {
      toast.error("Couldn't continue", { description: result.error });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Connect Resend</CardTitle>
          <CardDescription>
            Resend handles sending transactional emails — welcome emails,
            password resets, payment receipts. The free tier gives you 100
            emails per day, plenty for V1.
          </CardDescription>
          <a
            href="https://resend.com/docs/dashboard/api-keys/introduction"
            target="_blank"
            rel="noreferrer"
            className="block w-fit text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Watch a 2-minute setup walkthrough →
          </a>
        </CardHeader>
        <CardContent className="space-y-6">
          <SecurityCallout />

          <p className="text-sm text-muted-foreground">
            Same routine as Stage 2: your Resend API key goes into your local{" "}
            <code>.env.local</code>, never into this site.
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onContinue)}
              className="space-y-6"
              noValidate
            >
              <section className="space-y-2">
                <h3 className="font-semibold">1. Create your Resend account</h3>
                <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>
                    Open{" "}
                    <a
                      href="https://resend.com"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      resend.com
                    </a>{" "}
                    in a new tab and sign up. Use the email address
                    you&apos;ll be testing with — you&apos;ll see why in the
                    heads-up note below.
                  </li>
                </ol>
                <div className="rounded-md border border-amber-500/40 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-semibold">
                    Heads up about who Resend can email
                  </p>
                  <p className="mt-1">
                    On the free plan, sending from{" "}
                    <code>onboarding@resend.dev</code> only delivers to{" "}
                    <strong>the email you signed up to Resend with</strong>.
                    Great for testing yourself; not yet for reaching real
                    customers.
                  </p>
                  <p className="mt-2 font-semibold">
                    Now (recommended for early days):
                  </p>
                  <p className="mt-1">
                    Email new customers yourself from your own inbox when
                    they sign up or pay. Higher-touch, better feedback, zero
                    deliverability surprises. The code is still wired up —
                    it just won&apos;t reach anyone but you until you finish
                    the next paragraph.
                  </p>
                  <p className="mt-2 font-semibold">
                    Later (when you&apos;re ready):
                  </p>
                  <p className="mt-1">
                    Register a domain (Stage 6 has registrar links), verify
                    it inside Resend (5 minutes), then change{" "}
                    <code>EMAIL_FROM</code> to{" "}
                    <code>hello@yourdomain.com</code>. After that, every
                    welcome / receipt / cancellation email this app generates
                    delivers automatically.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold">
                  2. Add your two Resend values to your local{" "}
                  <code>.env.local</code> file
                </h3>
                <p className="text-sm text-muted-foreground">
                  Open <code>.env.local</code> in your editor (same file you
                  edited in Stages 2 and 3). Paste these two lines at the
                  bottom:
                </p>
                <CopyableCodeBlock code={ENV_TEMPLATE_RESEND} />
                <p className="text-sm text-muted-foreground">
                  Now go to your Resend dashboard and replace each placeholder
                  with its real value:
                </p>
                <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>
                    In Resend, click <strong>API Keys</strong> in the left
                    sidebar → <strong>Create API Key</strong>. Give it any
                    name. Copy the key — it starts with <code>re_</code> —
                    and paste it into <code>RESEND_API_KEY</code>.{" "}
                    <strong>Resend only shows this key once</strong>, so
                    paste it into your <code>.env.local</code> immediately.
                    {/* COPY_TODO: review tone — inline example. */}
                    <div className="mt-0.5 text-xs">
                      <em>yours will look like</em>{" "}
                      <code>re_abc123def456ghi789jkl012mno345pqr</code>{" "}
                      <em>(about 35–50 characters total)</em>
                    </div>
                  </li>
                  <li>
                    For <code>EMAIL_FROM</code>: replace{" "}
                    <code>Your App Name</code> with your app&apos;s name (the
                    same one from Stage 1). Leave the rest as{" "}
                    <code>&lt;onboarding@resend.dev&gt;</code> for now — see
                    the heads-up note in Step 1.
                    {/* COPY_TODO: review tone — inline example. */}
                    <div className="mt-0.5 text-xs">
                      <em>your finished value will look like</em>{" "}
                      <code>Acme Tasks &lt;onboarding@resend.dev&gt;</code>
                    </div>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Save the file (<strong>Cmd+S</strong> on Mac,{" "}
                  <strong>Ctrl+S</strong> on Windows).
                </p>
              </section>

              {/* COPY_TODO: review tone — completed file verification block. */}
              <section className="space-y-2 rounded-md border border-emerald-500/30 bg-emerald-50/40 p-4 dark:bg-emerald-950/20">
                <h3 className="font-semibold">
                  What your completed <code>.env.local</code> should look like
                </h3>
                <p className="text-sm text-muted-foreground">
                  Once you&apos;ve finished Stages 2 through 4, your{" "}
                  <code>.env.local</code> should have all your real values
                  filled in. Here&apos;s an example with redacted-but-realistic
                  values — yours will have your actual keys:
                </p>
                <CopyableCodeBlock code={COMPLETED_ENV_EXAMPLE} />
                <p className="text-sm text-muted-foreground">
                  If yours looks roughly like this — same variable names,
                  similar value shapes — you&apos;re set up correctly. If
                  anything&apos;s missing or looks very different, check back
                  through Stages 2, 3, and 4.
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
  form: ReturnType<typeof useForm<EmailStageInput>>;
}) {
  return (
    <section className="space-y-3 rounded-md border bg-muted/40 p-4">
      <Label className="text-sm font-semibold">Confirm before continuing</Label>
      <div className="space-y-2">
        <FormField
          control={form.control}
          name="createdAccount"
          render={({ field }) => (
            <AttestationBox
              checked={Boolean(field.value)}
              onChange={field.onChange}
            >
              I&apos;ve created my Resend account
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
              I&apos;ve added my two Resend values to my local{" "}
              <code>.env.local</code> file
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

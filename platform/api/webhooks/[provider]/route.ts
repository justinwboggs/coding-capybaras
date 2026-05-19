import { NextResponse, type NextRequest } from "next/server";

import {
  getProvider,
  getWebhookSecret,
  handleNormalizedEvent,
  type ProviderName,
} from "@/platform/lib/payments";

// Force the Node runtime — Stripe's `constructEvent` uses Node crypto
// for HMAC verification. Edge runtime would silently break signature checks.
export const runtime = "nodejs";

// Single endpoint covering every provider. The provider is in the URL,
// the per-provider secret comes from env, and event normalization is the
// provider's responsibility (see /lib/payments/<provider>.ts).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerParam } = await params;

  // Validate the path param against the registered set.
  if (providerParam !== "stripe" && providerParam !== "bcpartners") {
    return NextResponse.json({ error: "unknown_provider" }, { status: 404 });
  }
  const providerName = providerParam as ProviderName;

  const provider = getProvider(providerName);

  // Provider-specific signature header. Stripe uses 'stripe-signature';
  // future providers can branch here if their conventions differ.
  const signatureHeader =
    providerName === "stripe" ? "stripe-signature" : "x-webhook-signature";
  const signature = request.headers.get(signatureHeader);
  if (!signature) {
    return NextResponse.json(
      { error: "missing_signature" },
      { status: 400 },
    );
  }

  // Raw text body — required for HMAC verification. Do NOT parse as JSON
  // before verifying or the signature won't match.
  const rawBody = await request.text();

  let secret: string;
  try {
    secret = getWebhookSecret(providerName);
  } catch {
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 500 },
    );
  }

  // Verify + parse in one call. Throws on signature mismatch or unhandled
  // event types we received but don't care about.
  let event;
  try {
    event = provider.parseAndVerifyWebhook(rawBody, signature, secret);
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === "UNHANDLED_EVENT") {
      // Signed real event we don't subscribe to. Acknowledge so the
      // provider stops retrying.
      return NextResponse.json({ received: true, handled: false });
    }
    return NextResponse.json(
      { error: "invalid_signature", message: e.message },
      { status: 400 },
    );
  }

  // Dispatch to the provider-agnostic handler.
  try {
    const result = await handleNormalizedEvent(event);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason },
        { status: result.retry ? 500 : 400 },
      );
    }
    return NextResponse.json({ received: true, action: result.action });
  } catch (err) {
    // Real failure — return 500 so the provider retries. Sentry hookup
    // comes later in the build plan; for now console.error is enough to
    // surface in `vercel logs` / local dev.
    console.error(`[webhook:${providerName}] handler error`, err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }
}

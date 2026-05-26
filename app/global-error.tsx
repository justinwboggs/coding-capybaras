"use client";

import { useEffect } from "react";

// Error boundary for the root layout itself. Fires only when RootLayout
// errors (config read fails catastrophically, branding load throws, etc.)
// — at which point the layout's chrome is unavailable and we have to
// render our own <html> + <body>.
//
// No shared UI imports here. The failed layout's components might also
// be broken, so this page stays deliberately minimal and self-contained.
// Inline styles, no Tailwind classes (Tailwind needs the layout's
// globals.css, which might be the thing that failed to load).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
    // TODO(sentry): captureException(error, { level: "fatal" }).
  }, [error]);

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#fafafa",
          color: "#0a0a0a",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            padding: "2rem",
            margin: "1rem",
            border: "1px solid #e5e5e5",
            borderRadius: "0.5rem",
            background: "#ffffff",
          }}
        >
          <h1
            style={{
              margin: "0 0 0.75rem",
              fontSize: "1.5rem",
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            Something went very wrong
          </h1>
          <p
            style={{
              margin: "0 0 1.5rem",
              fontSize: "0.875rem",
              lineHeight: 1.55,
              color: "#525252",
            }}
          >
            The site failed to load. Reload to try again. If the problem
            continues, this is on our end{supportEmail ? " — please get in touch" : ""}.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                cursor: "pointer",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "0.375rem",
                border: "1px solid #0a0a0a",
                background: "#0a0a0a",
                color: "#fafafa",
              }}
            >
              Reload
            </button>
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  borderRadius: "0.375rem",
                  border: "1px solid #e5e5e5",
                  background: "#ffffff",
                  color: "#0a0a0a",
                  textDecoration: "none",
                }}
              >
                Contact us
              </a>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

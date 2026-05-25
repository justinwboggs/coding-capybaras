import { type Route } from "next";
import Link from "next/link";

import {
  ADMIN_AUDIT_PAGE_SIZE,
  listAuditEntries,
} from "@/platform/lib/admin/queries";

export const metadata = { title: "Audit log — Admin" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    resource?: string;
  }>;
}

export default async function AdminAuditLogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const resource = sp.resource?.trim();

  const { rows, total, pageSize } = await listAuditEntries({
    page,
    resourceType: resource,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Every admin action, webhook outcome, and significant state change
          lands here. Ordered newest first.
        </p>
        {resource && (
          <Link
            href={"/admin/audit-log" as Route}
            className="text-xs underline underline-offset-2"
          >
            Clear filter ({resource})
          </Link>
        )}
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-left font-medium">When</th>
              <th className="px-4 py-2 text-left font-medium">Action</th>
              <th className="px-4 py-2 text-left font-medium">Resource</th>
              <th className="px-4 py-2 text-left font-medium">Actor</th>
              <th className="px-4 py-2 text-left font-medium">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No audit entries.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-muted-foreground">
                    {row.createdAt
                      .toISOString()
                      .replace("T", " ")
                      .slice(0, 19)}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-2 text-xs">
                    <Link
                      href={
                        `/admin/audit-log?resource=${encodeURIComponent(row.resourceType)}` as Route
                      }
                      className="underline-offset-2 hover:underline"
                    >
                      {row.resourceType}
                    </Link>
                    {row.resourceId && (
                      <span className="ml-1 text-muted-foreground">
                        ({row.resourceId.slice(0, 8)}…)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {row.userId ? (
                      <Link
                        href={`/admin/users/${row.userId}` as Route}
                        className="font-mono underline-offset-2 hover:underline"
                      >
                        {row.userId.slice(0, 8)}…
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">system</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    <pre className="max-w-md overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10px]">
                      {row.metadata
                        ? JSON.stringify(row.metadata, null, 0)
                        : "—"}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          {total === 0
            ? "0 entries"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(
                page * pageSize,
                total,
              )} of ${total.toLocaleString()}`}
        </div>
        <div className="flex items-center gap-2">
          <PageLink
            label="← Prev"
            page={page - 1}
            disabled={page <= 1}
            resource={resource}
          />
          <span className="text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <PageLink
            label="Next →"
            page={page + 1}
            disabled={page >= totalPages}
            resource={resource}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {ADMIN_AUDIT_PAGE_SIZE} entries per page. Click a resource type to
        filter. Click an actor id to jump to that user.
      </p>
    </div>
  );
}

function PageLink({
  label,
  page,
  disabled,
  resource,
}: {
  label: string;
  page: number;
  disabled: boolean;
  resource: string | undefined;
}) {
  if (disabled) {
    return (
      <span className="rounded-md border px-3 py-1 text-xs text-muted-foreground opacity-50">
        {label}
      </span>
    );
  }
  const params = new URLSearchParams();
  if (resource) params.set("resource", resource);
  if (page > 1) params.set("page", String(page));
  const href = params.toString()
    ? `/admin/audit-log?${params.toString()}`
    : "/admin/audit-log";
  return (
    <Link
      href={href as Route}
      className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-accent"
    >
      {label}
    </Link>
  );
}

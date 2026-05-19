import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/platform/components/ui/card";

import { ContactForm } from "./contact-form";

export const metadata = {
  // COPY_TODO: contact page title + description.
  title: "Contact",
  description: "COPY_TODO: short description for the contact page.",
};

export default function BusinessContactPage() {
  return (
    <section className="container max-w-2xl py-20">
      <div className="mb-8 space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {/* COPY_TODO: contact page headline. */}
          COPY_TODO: contact headline
        </h1>
        <p className="text-muted-foreground">
          {/* COPY_TODO: short subheadline for the contact page. */}
          COPY_TODO: short paragraph framing the contact form.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact us</CardTitle>
          <CardDescription>
            All fields except company are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Looking at the self-serve plans instead?{" "}
        <Link href="/pricing" className="underline underline-offset-4">
          See pricing
        </Link>
        .
      </p>
    </section>
  );
}

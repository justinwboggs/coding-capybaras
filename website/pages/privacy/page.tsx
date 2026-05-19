export const metadata = {
  // COPY_TODO: page title — include your business name.
  title: "Privacy Policy",
};

// Privacy Policy template. Long-form legal content provided as a starting
// point — not legal advice. Items wrapped in [COPY_TODO: …] are placeholders
// you need to fill in (effective date, business name, contact email,
// mailing address) before public launch. Review with a lawyer before relying
// on this template for a live business.

export default function PrivacyPage() {
  return (
    <article className="container max-w-3xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:pt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:text-foreground/90">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        {/* COPY_TODO: effective date. */}
        <p className="text-sm text-muted-foreground">
          Last updated: [COPY_TODO: effective date]
        </p>
      </header>

      <p>
        This Privacy Policy describes how [COPY_TODO: business name]
        (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects,
        uses, and shares information about you when you visit [COPY_TODO:
        site domain] (the &ldquo;Site&rdquo;) or use our services
        (collectively, the &ldquo;Services&rdquo;).
      </p>

      <p>
        By using our Services, you agree to the collection and use of
        information in accordance with this policy. If you do not agree with
        our practices, please do not use our Services.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>Account Information</h3>
      <p>
        When you create an account, we collect your email address. We use
        Supabase, a third-party authentication and database provider, to
        manage user accounts and authentication. Your email address is
        stored in our database and is used to identify you, send
        service-related communications, and provide customer support.
      </p>

      <h3>Payment Information</h3>
      <p>
        If you purchase a paid plan, payments are processed by Stripe, our
        third-party payment processor. We do not collect or store your full
        credit card numbers, bank account details, or other sensitive
        payment credentials on our servers. Stripe handles all payment
        processing in accordance with their own privacy policy and security
        standards. We do receive limited transaction information from
        Stripe, including the last four digits of your payment card, your
        billing address, and transaction amounts and dates, which we use to
        manage your subscription and provide receipts.
      </p>

      <h3>Usage and Service Data</h3>
      <p>
        We collect information about how you use our Services, including
        pages and features you access, date and time of your visits,
        actions you take within the Service, and approximate geographic
        location based on IP address. This data helps us understand how the
        Service is used and improve the user experience.
      </p>

      <h3>Communications</h3>
      <p>
        If you contact us through our contact form, email, or other support
        channels, we will receive your name, email address, and the
        contents of your message. We use this information to respond to
        your inquiries and provide support.
      </p>

      <h3>Technical Information</h3>
      <p>
        Like most websites, we automatically collect certain technical
        information when you visit our Site, including your IP address,
        browser type, operating system, referring URLs, and pages viewed.
      </p>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, operate, and maintain our Services</li>
        <li>Process payments and manage your subscription</li>
        <li>Authenticate users and prevent fraud</li>
        <li>
          Send service-related communications (account notifications,
          security alerts, billing receipts)
        </li>
        <li>Respond to customer support requests</li>
        <li>Improve our Services through analysis of usage patterns</li>
        <li>Detect, prevent, and address technical issues or abuse</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>3. Third-Party Service Providers</h2>
      <p>
        We rely on the following third-party service providers to operate
        our Services. Each provider processes data in accordance with their
        own privacy practices:
      </p>
      <ul>
        <li>
          Supabase — Database hosting, authentication, and user account
          management
        </li>
        <li>Stripe — Payment processing</li>
        <li>Resend — Transactional email delivery</li>
        <li>Vercel — Application hosting and deployment</li>
      </ul>
      <p>
        We do not sell, rent, or trade your personal information to third
        parties for their marketing purposes.
      </p>

      <h2>4. Cookies and Similar Technologies</h2>
      <p>
        We use cookies and similar tracking technologies only for essential
        service functionality, including authentication and session
        management (so you stay logged in), security (preventing CSRF
        attacks and similar threats), and preferences (remembering your
        settings).
      </p>
      <p>
        We do not use third-party advertising cookies. If we implement
        analytics in the future, we will update this policy and provide
        notice.
      </p>
      <p>
        You can control cookies through your browser settings. However,
        disabling essential cookies may affect the functionality of our
        Services.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain your personal information for as long as your account is
        active or as needed to provide you the Services. If you delete your
        account or request that we delete your data, we will delete or
        anonymize your personal information within 30 days, except where we
        are required to retain it for legal, regulatory, or legitimate
        business purposes (such as financial records or fraud prevention).
      </p>

      <h2>6. Your Rights and Choices</h2>
      <p>
        Depending on your location, you may have certain rights regarding
        your personal information:
      </p>
      <ul>
        <li>
          <strong>Access</strong> — You can request a copy of the personal
          information we hold about you
        </li>
        <li>
          <strong>Correction</strong> — You can request that we correct
          inaccurate or incomplete information
        </li>
        <li>
          <strong>Deletion</strong> — You can request that we delete your
          personal information
        </li>
        <li>
          <strong>Portability</strong> — You can request a copy of your
          data in a portable format
        </li>
        <li>
          <strong>Objection</strong> — You can object to certain types of
          processing
        </li>
      </ul>
      <p>
        To exercise any of these rights, please contact us at the email
        address listed in Section 11. We will respond to your request
        within the timeframes required by applicable law.
      </p>
      <p>
        If you are a California resident, you have additional rights under
        the California Consumer Privacy Act (CCPA), including the right to
        know what categories of personal information we collect and the
        right to opt out of the sale of personal information. We do not
        sell personal information.
      </p>
      <p>
        If you are in the European Economic Area or United Kingdom, you
        have rights under the General Data Protection Regulation (GDPR).
        The legal basis for our processing is typically your consent, the
        performance of our contract with you, or our legitimate interests.
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        Our Services are not directed to children under the age of 13. We
        do not knowingly collect personal information from children under
        13. If you are a parent or guardian and believe your child has
        provided us with personal information, please contact us and we
        will delete it promptly.
      </p>

      <h2>8. International Data Transfers</h2>
      <p>
        We are based in the United States, and the third-party services we
        use may be located in various countries. By using our Services, you
        consent to the transfer of your information to the United States
        and other jurisdictions, which may have different data protection
        laws than your country of residence.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement reasonable technical and organizational measures
        designed to protect your personal information from unauthorized
        access, disclosure, alteration, or destruction. However, no method
        of transmission over the internet or electronic storage is
        completely secure, and we cannot guarantee absolute security.
      </p>

      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If we make
        material changes, we will notify you by email or by posting a
        notice on our Site before the changes take effect. Your continued
        use of the Services after the effective date of any update
        constitutes your acceptance of the revised policy.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have questions, concerns, or requests regarding this Privacy
        Policy or our data practices, please contact us:
      </p>
      {/* COPY_TODO: contact email + business mailing address. */}
      <ul>
        <li>
          <strong>Email:</strong> [COPY_TODO: privacy contact email]
        </li>
        <li>
          <strong>Mailing Address:</strong> [COPY_TODO: business mailing
          address]
        </li>
      </ul>
    </article>
  );
}

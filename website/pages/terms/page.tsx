import { getBranding } from "@/platform/lib/config";

export const metadata = {
  // COPY_TODO: page title — include your business name.
  title: "Terms of Service",
};

// Terms of Service template. Long-form legal content provided as a starting
// point — not legal advice. Items wrapped in [COPY_TODO: …] are placeholders
// you need to fill in (effective date, business name, contact email,
// mailing address, governing state, arbitration body) before public launch.
// Review with a lawyer before relying on this template for a live business.

export default async function TermsPage() {
  const { legalEntityName } = await getBranding();
  // Section 11 (Limitation of Liability) is uppercase block text by drafting
  // convention; uppercase the legalEntityName to match the surrounding style.
  const legalEntityNameUpper = legalEntityName.toUpperCase();
  return (
    <article className="container max-w-3xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:pt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:leading-relaxed [&_p]:text-foreground/90 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:text-foreground/90">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Terms of Service
        </h1>
        {/* COPY_TODO: effective date. */}
        <p className="text-sm text-muted-foreground">
          Last updated: [COPY_TODO: effective date]
        </p>
      </header>

      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to
        and use of [COPY_TODO: site domain] (the &ldquo;Site&rdquo;) and any
        associated services (collectively, the &ldquo;Services&rdquo;)
        offered by {legalEntityName} (&ldquo;we,&rdquo;
        &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
      </p>

      <p>
        Please read these Terms carefully. By accessing or using our
        Services, you agree to be bound by these Terms. If you do not
        agree, do not use our Services.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old (or the age of majority in your
        jurisdiction, whichever is greater) to use our Services. By using
        our Services, you represent and warrant that you meet this
        requirement and that you have the legal capacity to enter into
        these Terms.
      </p>

      <h2>2. The Services</h2>
      <p>
        {legalEntityName} provides [COPY_TODO: one or two
        sentences describing what your Services do and who they are for].
      </p>
      <p>
        We reserve the right to modify, suspend, or discontinue any part
        of the Services at any time, with or without notice. We are not
        liable to you or any third party for any modification, suspension,
        or discontinuation.
      </p>

      <h2>3. Account Registration</h2>
      <p>
        To access certain features, you must create an account. You agree
        to provide accurate, current, and complete information during
        registration, maintain the security of your account credentials,
        promptly notify us of any unauthorized access or use of your
        account, and accept responsibility for all activities that occur
        under your account.
      </p>
      <p>
        You may not create an account on behalf of another person without
        their permission, or use someone else&apos;s account.
      </p>

      <h2>4. License to Use the Services</h2>
      <p>
        Subject to your compliance with these Terms, we grant you a
        non-exclusive, non-transferable, revocable license to access and
        use the Services for your own personal or business purposes.
      </p>
      <p>You may not:</p>
      <ul>
        <li>
          Reproduce, redistribute, or resell the Services in original or
          modified form
        </li>
        <li>
          Sublicense, rent, or lease access to the Services to third
          parties
        </li>
        <li>
          Remove or alter any copyright, trademark, or other proprietary
          notices
        </li>
        <li>
          Use the Services in violation of any applicable law or
          regulation
        </li>
      </ul>

      <h2>5. Paid Plans and Payment Terms</h2>

      <h3>Subscription and Billing</h3>
      <p>
        {/* COPY_TODO: describe your paid plans — subscription cadence,
        one-time payment, or whatever billing model applies. */}
        [COPY_TODO: describe your paid plans, billing cadence, and renewal
        behavior.]
      </p>

      <h3>Payment Processing</h3>
      <p>
        All payments are processed through Stripe. By making a purchase,
        you agree to Stripe&apos;s terms and acknowledge that we do not
        store your full payment card information.
      </p>

      <h3>Pricing and Taxes</h3>
      <p>
        All prices are listed in U.S. Dollars unless otherwise stated. You
        are responsible for all applicable taxes, duties, and similar
        charges. We may change our pricing at any time, but changes will
        not affect existing purchases.
      </p>

      <h3>Refunds</h3>
      <p>
        {/* COPY_TODO: describe your refund policy. */}
        [COPY_TODO: describe your refund policy.]
      </p>

      <h2>6. User Content</h2>
      <p>
        If you submit content through our Services (such as support
        messages, feedback, or contact form submissions), you grant us a
        non-exclusive, royalty-free, worldwide license to use, reproduce,
        and display that content for the purpose of operating and
        improving the Services. You retain ownership of your content.
      </p>
      <p>
        You represent that you have all necessary rights to submit any
        content you provide and that your content does not violate any
        third-party rights or applicable laws.
      </p>

      <h2>7. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Use the Services for any illegal, fraudulent, or unauthorized
          purpose
        </li>
        <li>Interfere with or disrupt the Services or servers</li>
        <li>
          Attempt to gain unauthorized access to any part of the Services
        </li>
        <li>
          Use automated means (bots, scrapers, crawlers) to access the
          Services in a manner that overloads our infrastructure
        </li>
        <li>
          Reverse engineer, decompile, or disassemble any part of the
          Services (except as expressly permitted by law)
        </li>
        <li>
          Use the Services to send spam, malware, or other harmful content
        </li>
        <li>
          Harass, abuse, or threaten others through any feature of the
          Services
        </li>
        <li>Violate the privacy or intellectual property rights of others</li>
      </ul>
      <p>
        We reserve the right to investigate and take appropriate action
        against any violation, including suspending or terminating your
        account.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        The Services, including their code, documentation, design, logos,
        trademarks, and all related materials, are owned by {legalEntityName}
        {" "}and are protected by intellectual property laws.
        Except for the limited license granted in Section 4, no rights are
        granted to you by implication, estoppel, or otherwise.
      </p>
      <p>
        The &ldquo;{legalEntityName}&rdquo; name and logo are trademarks
        of {legalEntityName}. You may not use them without our prior
        written permission.
      </p>

      <h2>9. Third-Party Services and Links</h2>
      <p>
        Our Services may include integrations with or links to third-party
        services (such as Supabase, Stripe, Resend, and others). We are
        not responsible for the content, terms, or practices of these
        third-party services. Your use of any third-party service is
        governed by that provider&apos;s own terms and policies.
      </p>

      <h2>10. Disclaimers of Warranty</h2>
      <p>
        THE SERVICES, INCLUDING THE BOILERPLATE, ARE PROVIDED &ldquo;AS
        IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTIES OF
        ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT
        PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED
        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
        NON-INFRINGEMENT, AND COURSE OF PERFORMANCE.
      </p>
      <p>
        WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED,
        ERROR-FREE, SECURE, OR THAT DEFECTS WILL BE CORRECTED. YOU USE THE
        SERVICES AT YOUR OWN RISK.
      </p>
      <p>
        WE PROVIDE GUIDANCE AND TOOLS TO HELP YOU BUILD AND LAUNCH
        SOFTWARE PRODUCTS, BUT WE DO NOT GUARANTEE THE SUCCESS OF ANY
        APPLICATION OR BUSINESS YOU BUILD USING OUR SERVICES. RESULTS WILL
        VARY BASED ON FACTORS OUTSIDE OUR CONTROL.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL{" "}
        {legalEntityNameUpper}, ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS,
        OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOST
        PROFITS, LOST DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF OR
        IN CONNECTION WITH THESE TERMS OR YOUR USE OF THE SERVICES,
        REGARDLESS OF THE LEGAL THEORY (CONTRACT, TORT, OR OTHERWISE) AND
        EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
      </p>
      <p>
        OUR TOTAL CUMULATIVE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR
        RELATED TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE
        AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM,
        OR ONE HUNDRED U.S. DOLLARS ($100), WHICHEVER IS GREATER.
      </p>
      <p>
        SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN
        WARRANTIES OR THE LIMITATION OR EXCLUSION OF LIABILITY FOR CERTAIN
        DAMAGES. IN SUCH JURISDICTIONS, OUR LIABILITY WILL BE LIMITED TO
        THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless {legalEntityName}
        {" "}and its officers, directors, employees, and agents from any
        claims, damages, losses, liabilities, costs, and expenses
        (including reasonable attorneys&apos; fees) arising out of or
        related to your use of the Services, your violation of these
        Terms, your violation of any third-party rights including
        intellectual property or privacy rights, and any content you
        submit through the Services.
      </p>

      <h2>13. Termination</h2>
      <p>
        We may suspend or terminate your access to the Services at any
        time, with or without notice, for any reason, including if we
        believe you have violated these Terms. Upon termination, your
        right to use the Services will immediately cease.
      </p>
      <p>
        You may stop using the Services at any time. If you wish to
        delete your account, you may do so through your account settings
        or by contacting us.
      </p>
      <p>
        Sections that by their nature should survive termination
        (including Sections 8, 10, 11, 12, and 15) will survive.
      </p>

      <h2>14. Governing Law and Dispute Resolution</h2>
      {/* COPY_TODO: governing state. */}
      <p>
        These Terms are governed by the laws of the State of [COPY_TODO:
        state, e.g., California], United States, without regard to its
        conflict of laws principles.
      </p>
      {/* COPY_TODO: arbitration body. */}
      <p>
        Any disputes arising out of or related to these Terms or the
        Services shall be resolved through binding arbitration administered
        by [COPY_TODO: arbitration body, e.g., the American Arbitration
        Association] under its Commercial Arbitration Rules, except that
        either party may seek injunctive or other equitable relief in a
        court of competent jurisdiction.
      </p>
      <p>
        You agree that any claim or cause of action arising out of these
        Terms or the Services must be filed within one (1) year after the
        claim or cause of action arose, or be forever barred.
      </p>

      <h2>15. General Provisions</h2>
      <p>
        <strong>Entire Agreement</strong> — These Terms, together with our
        Privacy Policy, constitute the entire agreement between you and
        {" "}{legalEntityName} regarding the Services.
      </p>
      <p>
        <strong>Severability</strong> — If any provision of these Terms is
        held to be invalid or unenforceable, the remaining provisions will
        continue in full force and effect.
      </p>
      <p>
        <strong>Waiver</strong> — Our failure to enforce any right or
        provision of these Terms will not be deemed a waiver of that right
        or provision.
      </p>
      <p>
        <strong>Assignment</strong> — You may not assign these Terms
        without our prior written consent. We may assign these Terms
        freely.
      </p>
      <p>
        <strong>No Agency</strong> — Nothing in these Terms creates any
        agency, partnership, joint venture, or employment relationship
        between you and us.
      </p>

      <h2>16. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. If we make material
        changes, we will notify you by email or by posting a notice on
        our Site before the changes take effect. Your continued use of
        the Services after the effective date of any update constitutes
        your acceptance of the revised Terms.
      </p>

      <h2>17. Contact Us</h2>
      <p>If you have questions about these Terms, please contact us:</p>
      {/* COPY_TODO: contact email + business mailing address. */}
      <ul>
        <li>
          <strong>Email:</strong> [COPY_TODO: contact email]
        </li>
        <li>
          <strong>Mailing Address:</strong> [COPY_TODO: business mailing
          address]
        </li>
      </ul>
    </article>
  );
}

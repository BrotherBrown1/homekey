import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that apply when you use ${BRAND.name} to find home buyer grants and assistance programs.`,
  alternates: { canonical: `${BRAND.siteUrl}/terms` },
};

export default function TermsPage() {
  const contact = (
    <a href={`mailto:${BRAND.realtor.email}`} className="underline underline-offset-4">
      {BRAND.realtor.email}
    </a>
  );
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      intro={`By using ${BRAND.name} you agree to these terms. Please read them, they describe what the service is and, just as importantly, what it is not.`}
    >
      <LegalSection title="What the service is">
        <p>
          {BRAND.name} is a free informational tool that helps home buyers discover federal,
          state, county, and city down-payment, closing-cost, and other home buyer assistance
          programs they may qualify for, and optionally connects them with a licensed real
          estate professional for help applying.
        </p>
        <p>
          The service is operated by {BRAND.realtor.name}, a licensed real estate salesperson
          in {BRAND.realtor.licenseState} (License #{BRAND.realtor.licenseNumber}) with{" "}
          {BRAND.realtor.brokerage}.
        </p>
      </LegalSection>

      <LegalSection title="What the service is not">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Not a lender.</strong> {BRAND.name} does not originate, fund, broker, or
            service loans. Nothing on this site is an offer or commitment to lend.
          </li>
          <li>
            <strong>Not a government agency.</strong> {BRAND.name} is not affiliated with,
            endorsed by, or acting on behalf of any federal, state, or local government or
            housing authority. Program names and sponsors are referenced for identification only.
          </li>
          <li>
            <strong>Not a guarantee.</strong> A match on this site means your answers appear to
            fit a program&apos;s published criteria. It is not a determination of eligibility, an
            approval, a reservation of funds, or a guarantee that any grant or loan will be
            awarded. Program administrators make all final decisions.
          </li>
          <li>
            <strong>Not legal, tax, or financial advice.</strong> Information here is general.
            Consult a qualified professional about your own situation.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Accuracy of information">
        <p>
          Assistance programs change often. Funding windows open and close, income limits and
          purchase-price caps are revised, and programs launch, pause, and end. We work to keep
          our database current, but we do not warrant that any program description, dollar
          amount, or eligibility rule is complete, accurate, or up to date at the moment you view
          it. Always confirm details with the official program administrator before relying on
          them or making a financial decision.
        </p>
      </LegalSection>

      <LegalSection title="Your responsibilities">
        <ul className="list-disc space-y-2 pl-6">
          <li>You must be at least 18 years old to use the service.</li>
          <li>You agree to provide accurate information about yourself.</li>
          <li>
            You will not use the service for any unlawful purpose, attempt to interfere with its
            operation, or scrape, copy, or resell the program database.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Consent to be contacted">
        <p>
          When you provide your name, email address, or phone number, you agree that{" "}
          {BRAND.name}, {BRAND.realtor.name}, and {BRAND.realtor.brokerage} may contact you by
          email, phone call, or text message (including using automated technology) about your
          grant matches and your home purchase. Consent is not a condition of purchasing any
          property or service. You may opt out at any time by replying STOP to a text,
          using the unsubscribe link in an email, or emailing {contact}. Message and data rates
          may apply.
        </p>
      </LegalSection>

      <LegalSection title="Working with a grant specialist">
        <p>
          Help applying for a program is offered by {BRAND.realtor.name} in their capacity as a
          licensed real estate salesperson. Using {BRAND.name} does not by itself create an
          agency relationship or obligate you to buy or sell property through any particular
          agent or brokerage. Any representation will be documented in a separate written
          agreement as required by {BRAND.realtor.licenseState} law.
        </p>
      </LegalSection>

      <LegalSection title="Third-party links">
        <p>
          The site links to government and program websites we do not control. We are not
          responsible for their content, availability, or privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The {BRAND.name} name, site design, text, and compiled program database are owned by
          the operator and protected by applicable law. You may use the site for your own
          personal, non-commercial home search.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer of warranties">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF ACCURACY, MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, {BRAND.name.toUpperCase()}, ITS OPERATOR, AND{" "}
          {BRAND.realtor.brokerage.toUpperCase()} WILL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF FUNDS,
          FINANCING, OR PROPERTY, ARISING FROM YOUR USE OF OR RELIANCE ON THE SERVICE. THE
          SERVICE IS FREE, AND OUR TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED ONE HUNDRED
          DOLLARS ($100).
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of the State of {BRAND.legal.governingState},
          without regard to conflict-of-law rules. Any dispute will be brought in the state or
          federal courts located in {BRAND.legal.governingState}.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may revise these terms from time to time. The date at the top shows when they were
          last updated. Continued use of the service after a change means you accept the revised
          terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Email {contact}. See also our{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}

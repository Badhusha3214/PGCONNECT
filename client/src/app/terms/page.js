import { pageMetadata } from "../../lib/site";
import LegalPage from "../components/LegalPage";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms that govern using PGCON to find, book and list PG accommodation.",
  path: "/terms",
});

const SECTIONS = [
  {
    heading: "1. Acceptance of Terms",
    body: [
      "By creating an account or using PGCON, you agree to these Terms of Service. If you do not agree, please do not use the platform.",
    ],
  },
  {
    heading: "2. Eligibility",
    body: [
      "You must be at least 18 years old to create an account. Property owners must have the legal right to list and manage the properties they submit.",
    ],
  },
  {
    heading: "3. Accounts",
    body: [
      "You're responsible for keeping your account credentials secure and for all activity under your account. Provide accurate information when registering — inaccurate listings or profiles may be suspended.",
    ],
  },
  {
    heading: "4. Listings & Verification",
    body: [
      "All property listings go through an admin verification step before appearing publicly. PGCON may reject or unlist a property that doesn't meet our standards, contains inaccurate information, or is reported by users.",
    ],
  },
  {
    heading: "5. Bookings & Payments",
    body: [
      "Rent payments made through PGCON are processed via Razorpay. A platform fee is deducted from each rent payment before the remainder is paid out to the property owner. Fee amounts are shown before you confirm a payment.",
    ],
  },
  {
    heading: "6. Prohibited Conduct",
    body: [
      "You may not post false or misleading listings, harass other users, attempt to bypass the platform's payment or verification systems, or use PGCON for any unlawful purpose.",
    ],
  },
  {
    heading: "7. Limitation of Liability",
    body: [
      "PGCON facilitates connections between tenants and property owners but is not a party to the tenancy agreement itself. We verify listings to the best of our ability but do not guarantee the accuracy of every detail submitted by owners. Use your judgement and visit a property before committing.",
    ],
  },
  {
    heading: "8. Termination",
    body: [
      "We may suspend or terminate accounts that violate these terms. You may close your account at any time by contacting support.",
    ],
  },
  {
    heading: "9. Changes to These Terms",
    body: [
      "We may update these terms from time to time. Continued use of PGCON after changes take effect constitutes acceptance of the revised terms.",
    ],
  },
  {
    heading: "10. Contact",
    body: [
      "Questions about these terms? Reach out via our Contact page.",
    ],
  },
];

export default function TermsOfServicePage() {
  return <LegalPage title="Terms of Service" updated="July 2026" sections={SECTIONS} />;
}

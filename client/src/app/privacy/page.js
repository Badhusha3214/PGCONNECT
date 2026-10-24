import { pageMetadata } from "../../lib/site";
import LegalPage from "../components/LegalPage";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How PGCON collects, uses and protects your personal information.",
  path: "/privacy",
});

const SECTIONS = [
  {
    heading: "1. Information We Collect",
    body: [
      "When you create an account, we collect your name, email address, phone number, and role (student or property owner). Students may also provide their university and move-in preferences; owners provide property details, manager contact information, and photos.",
      "When you make or receive a payment through PGCON, our payment processor (Razorpay) collects and processes the necessary billing details. We do not store your full card or bank details on our servers.",
    ],
  },
  {
    heading: "2. How We Use Your Information",
    body: [
      "We use your information to operate the marketplace: showing your listings or bookings, connecting tenants with owners, processing rent payments and payouts, verifying property listings, and sending you account and transaction notifications.",
      "We may use aggregated, non-identifying data to improve search relevance and platform features.",
    ],
  },
  {
    heading: "3. Sharing of Information",
    body: [
      "Contact details you submit through an inquiry or booking are shared with the relevant property owner or manager so they can respond to you.",
      "We do not sell your personal information. We share data with service providers (such as Supabase for authentication/database hosting, Cloudflare for file storage, and Razorpay for payments) only as needed to run the platform.",
    ],
  },
  {
    heading: "4. Cookies",
    body: [
      "We use essential cookies to keep you signed in and remember your preferences. See our Cookie Policy for details.",
    ],
  },
  {
    heading: "5. Data Security",
    body: [
      "We use industry-standard practices — including encrypted connections and role-based access control — to protect your data. No online platform can guarantee absolute security, but we work to keep your information safe.",
    ],
  },
  {
    heading: "6. Your Rights",
    body: [
      "You can review and update your profile information at any time from your account settings. To request deletion of your account or data, contact us using the details on our Contact page.",
    ],
  },
  {
    heading: "7. Changes to This Policy",
    body: [
      "We may update this policy as the platform evolves. Material changes will be reflected by an updated \"Last updated\" date on this page.",
    ],
  },
  {
    heading: "8. Contact Us",
    body: [
      "Questions about this policy? Reach out via our Contact page and we'll get back to you.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy Policy" updated="July 2026" sections={SECTIONS} />;
}

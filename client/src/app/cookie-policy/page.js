import { pageMetadata } from "../../lib/site";
import LegalPage from "../components/LegalPage";

export const metadata = pageMetadata({
  title: "Cookie Policy",
  description: "Which cookies PG Connect uses and how you can control them.",
  path: "/cookie-policy",
});

const SECTIONS = [
  {
    heading: "What Are Cookies",
    body: [
      "Cookies are small text files stored on your device that help websites remember information about your visit, like whether you're signed in.",
    ],
  },
  {
    heading: "How We Use Cookies",
    body: [
      "PG Connect uses essential cookies to keep you signed in between visits and to remember basic preferences, such as filters you've applied while browsing listings.",
    ],
  },
  {
    heading: "Types of Cookies We Use",
    body: [
      "Essential cookies: required for core functionality like authentication — these can't be turned off if you want to use the platform.",
      "Functional cookies: remember preferences like your last search filters, to save you time on return visits.",
    ],
  },
  {
    heading: "Managing Cookies",
    body: [
      "Most browsers let you block or delete cookies through their settings. Blocking essential cookies may prevent you from staying signed in or using parts of the site that require an account.",
    ],
  },
  {
    heading: "Changes to This Policy",
    body: [
      "We may update this policy as the platform evolves. Material changes will be reflected by an updated \"Last updated\" date on this page.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Questions about our use of cookies? Reach out via our Contact page.",
    ],
  },
];

export default function CookiePolicyPage() {
  return <LegalPage title="Cookie Policy" updated="July 2026" sections={SECTIONS} />;
}

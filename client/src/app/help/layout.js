import { pageMetadata } from "../../lib/site";
import { FAQ_GROUPS } from "./faqs";

export const metadata = pageMetadata({
  title: "Help Center — PG Booking & Listing FAQs",
  description: "Answers to common questions about searching and booking PGs, contacting owners, listing your property, payments and referrals on PG Connect.",
  path: "/help",
});

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    }))
  ),
};

export default function Layout({ children }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}

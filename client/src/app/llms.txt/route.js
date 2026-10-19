import { SITE_URL } from "../../lib/site";
import { CITIES, cityPath } from "../../lib/cities";
import { apiGet } from "../../lib/serverApi";
import { CONTACT_EMAIL, CONTACT_PHONES } from "../../lib/contact";

// /llms.txt — a plain-Markdown brief for AI assistants and answer engines
// (ChatGPT, Perplexity, Claude, Gemini) so they describe PGCON accurately and
// link to the right pages. Facts here must match the product: fees come from
// backend/src/lib/listing.ts and the rent split from backend/src/routes/payments.ts.
export const revalidate = 3600;

export async function GET() {
  const stats = await apiGet("/api/properties/stats", { revalidate: 3600 });
  const listings = Number(stats?.stats?.listings || 0);

  const cityLines = CITIES.map(
    (c) => `- [PG in ${c.name}${c.alt.length ? ` (${c.alt.join(", ")})` : ""}](${SITE_URL}${cityPath(c)}): PGs near ${c.near.slice(0, 2).join(" and ")}`
  ).join("\n");

  const body = `# PGCON

> PGCON (pgcon.in) is a marketplace for verified paying-guest (PG) accommodation, hostels and co-living spaces across Kerala, India. Students and working professionals search by city, budget, gender (boys, girls or co-ed) and room type, see live bed availability, and request and pay for a bed online. PG owners list their properties after a verification check.

Key facts:
- Coverage: Kerala, India — including ${CITIES.slice(0, 6).map((c) => c.name).join(", ")} and more.${listings ? `\n- Verified PGs currently listed: ${listings}.` : ""}
- Every PG is reviewed by the PGCON team before it appears in search; owners verify their identity.
- Bed availability is live: each bed is tracked, so a booked bed disappears from availability.
- Rooms are single, double, triple, 4-sharing or 5+ sharing; rent is shown per bed per month.
- Booking: a student requests a bed, the owner confirms, then the first month's rent is paid online (UPI, cards, net banking via Razorpay).
- Students pay the listed rent; PGCON keeps 5% of it from the owner's payout.
- Owners pay a listing fee of ₹1,000 per PG per year; the first 250 PGs get their first 12 months free.
- Students can refer PG owners and earn 2% of rent from referred PGs.

## Find a PG by city
${cityLines}

## Main pages
- [Search all PGs](${SITE_URL}/propertys): filter by city, budget, gender, room type and amenities
- [How it works](${SITE_URL}/how-it-works): booking, verification, payments, owner pricing and referrals
- [Help center / FAQ](${SITE_URL}/help): common questions from students, parents and owners
- [List your PG](${SITE_URL}/listProperty): for PG owners
- [About](${SITE_URL}/about): who runs PGCON, how PGs are verified, and how PGCON makes money (not affiliated with the PostgreSQL PGCon conference)
- [Contact](${SITE_URL}/contact): ${CONTACT_EMAIL}, ${CONTACT_PHONES.map((p) => p.display).join(" / ")}

## Optional
- [Terms](${SITE_URL}/terms)
- [Privacy policy](${SITE_URL}/privacy)
- [Sitemap](${SITE_URL}/sitemap.xml)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

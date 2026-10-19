"use client";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import IntroLoader from "./home/IntroLoader";
import Hero from "./home/Hero";
// Hidden until built (planned after 350 live PGs; see "PG Connect" note in Obsidian):
// import Features from "./home/Features";
import FeaturedPGs from "./home/FeaturedPGs";
import Referral from "./home/Referral";
import { CityMarquee, Collections, HowItWorks, BrowseByCity, ForParents, ForOwners, Testimonials, Faq, FinalCta } from "./home/Sections";
import { toPg, citiesFrom } from "./home/data";

const DEFAULT_CITIES = ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kottayam"];

// Landing page — "Landing page · 1440" design, reproduced section for section.
// Listings, cities, city photos, reviews and the student's referral link are
// live data (fetched in page.js / Referral.js).
export default function HomeClient({ initialProperties = [], stats = null, reviews = [] }) {
  const pgs = initialProperties.map(toPg);
  const live = citiesFrom(stats, pgs);
  const cities = live.length ? live : DEFAULT_CITIES;

  return (
    <div className="intro-on min-h-screen" style={{ background: "#F5F3EE", overflowX: "clip" }}>
      <div className="progress" aria-hidden="true" />
      <IntroLoader />
      <Navbar />
      <main id="main-content">
        <Hero cities={cities} />
        <CityMarquee cities={cities} />
        <div className="rule-draw max-w-[1232px] mx-auto" aria-hidden="true" style={{ height: 7, borderTop: "2px solid #C99A2E", borderBottom: "1px solid #C99A2E", opacity: 0.7 }} />
        <Collections />
        <HowItWorks />
        {/* Bed picker, commute rings, vibe tags, day-in-the-life: not built yet. */}
        {/* <Features /> */}
        <FeaturedPGs pgs={pgs} cities={cities} />
        <BrowseByCity cities={cities} pgs={pgs} />
        <ForParents />
        <Referral />
        <ForOwners />
        <Testimonials reviews={reviews} />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

// City landing pages (/pg-in/<slug>). Each city carries real local context —
// areas people search for and the campuses/IT parks they move for — so every
// page has unique content rather than a find-and-replace template.
// `name` must match how the Worker normalises cities (backend/src/lib/city.ts).
export const CITIES = [
  {
    slug: "kochi",
    name: "Kochi",
    alt: ["Cochin", "Ernakulam"],
    district: "Ernakulam",
    blurb:
      "Kochi is Kerala's biggest job market and home to Infopark, SmartCity and CUSAT, so PGs here fill up fast with IT professionals and students alike.",
    areas: ["Kakkanad", "Edappally", "Kalamassery", "Vyttila", "Kaloor", "Palarivattom", "Thrikkakara", "Aluva"],
    near: ["Infopark Kakkanad", "SmartCity Kochi", "CUSAT, Kalamassery", "Rajagiri, Kakkanad", "Model Engineering College, Thrikkakara", "Amrita Hospital, Edappally"],
  },
  {
    slug: "thiruvananthapuram",
    name: "Thiruvananthapuram",
    alt: ["Trivandrum"],
    district: "Thiruvananthapuram",
    blurb:
      "Thiruvananthapuram brings together Technopark, the College of Engineering and the Medical College, with steady demand for PGs around Kazhakkoottam, Sreekaryam and Pattom.",
    areas: ["Kazhakkoottam", "Sreekaryam", "Pattom", "Ulloor", "Kesavadasapuram", "Medical College", "Peroorkada", "Kowdiar"],
    near: ["Technopark, Kazhakkoottam", "College of Engineering Trivandrum", "Government Medical College", "University of Kerala, Kariavattom", "Mar Baselios College of Engineering"],
  },
  {
    slug: "kozhikode",
    name: "Kozhikode",
    alt: ["Calicut"],
    district: "Kozhikode",
    blurb:
      "Kozhikode is the education hub of north Kerala — NIT Calicut, IIM Kozhikode and the Medical College draw students from across India every year.",
    areas: ["Chathamangalam", "Kunnamangalam", "Medical College", "Mavoor Road", "Chevayur", "Nadakkavu", "Eranhipalam"],
    near: ["NIT Calicut, Chathamangalam", "IIM Kozhikode, Kunnamangalam", "Government Medical College Kozhikode", "Government Cyberpark", "University of Calicut"],
  },
  {
    slug: "thrissur",
    name: "Thrissur",
    alt: ["Trichur"],
    district: "Thrissur",
    blurb:
      "Thrissur has a large student population around the Government Engineering College, Kerala Agricultural University and the Medical College, plus IT jobs at Infopark Koratty.",
    areas: ["Ayyanthole", "Punkunnam", "Mannuthy", "Ollur", "Kuriachira", "Mulankunnathukavu", "Chembukkavu"],
    near: ["Government Engineering College Thrissur", "Kerala Agricultural University, Mannuthy", "Government Medical College Thrissur", "St. Thomas College", "Infopark Koratty"],
  },
  {
    slug: "kottayam",
    name: "Kottayam",
    alt: [],
    district: "Kottayam",
    blurb:
      "Kottayam is a university town — Mahatma Gandhi University, the Medical College and CMS College keep PGs around Gandhinagar and Athirampuzha in demand.",
    areas: ["Gandhinagar", "Athirampuzha", "Nagampadam", "Kanjikuzhy", "Baker Junction", "Kumaranalloor", "Changanassery"],
    near: ["Mahatma Gandhi University, Athirampuzha", "Government Medical College Kottayam", "CMS College", "IIIT Kottayam", "Rajiv Gandhi Institute of Technology, Pampady"],
  },
  {
    slug: "kollam",
    name: "Kollam",
    alt: ["Quilon"],
    district: "Kollam",
    blurb:
      "Kollam's engineering and arts colleges, led by TKM College of Engineering, make Karicode and Kadappakada popular areas for student PGs.",
    areas: ["Karicode", "Kadappakada", "Kottiyam", "Chinnakada", "Polayathode"],
    near: ["TKM College of Engineering, Karicode", "Fatima Mata National College", "TKM Institute of Technology"],
  },
  {
    slug: "kannur",
    name: "Kannur",
    alt: ["Cannanore"],
    district: "Kannur",
    blurb:
      "Kannur students head for Kannur University, the Government Engineering College and Pariyaram Medical College, with PGs spread from Thana to Taliparamba.",
    areas: ["Thana", "Thavakkara", "Thalap", "Thottada", "Taliparamba"],
    near: ["Kannur University", "Government College of Engineering Kannur", "Pariyaram Medical College"],
  },
  {
    slug: "palakkad",
    name: "Palakkad",
    alt: ["Palghat"],
    district: "Palakkad",
    blurb:
      "Palakkad is home to IIT Palakkad and the NSS College of Engineering, with a growing need for PGs around Kanjikode and Olavakkode.",
    areas: ["Kanjikode", "Olavakkode", "Chandranagar", "Sekharipuram", "Kalmandapam"],
    near: ["IIT Palakkad, Kanjikode", "NSS College of Engineering", "Government Victoria College"],
  },
  {
    slug: "alappuzha",
    name: "Alappuzha",
    alt: ["Alleppey"],
    district: "Alappuzha",
    blurb:
      "Alappuzha's Medical College at Vandanam and its arts and science colleges bring students to PGs across Kalavoor, Thathampally and Mullakkal.",
    areas: ["Vandanam", "Kalavoor", "Thathampally", "Mullakkal"],
    near: ["Government T.D. Medical College, Vandanam", "S.D. College"],
  },
  {
    slug: "malappuram",
    name: "Malappuram",
    alt: [],
    district: "Malappuram",
    blurb:
      "Malappuram's students go to the University of Calicut at Thenhipalam and the medical colleges at Manjeri and Perinthalmanna.",
    areas: ["Thenhipalam", "Manjeri", "Perinthalmanna", "Kottakkal"],
    near: ["University of Calicut, Thenhipalam", "Government Medical College Manjeri", "MES Medical College, Perinthalmanna"],
  },
];

export const cityBySlug = (slug) => CITIES.find((c) => c.slug === slug);

// "Kochi" / "Cochin" / "ernakulam" → the city entry, for linking from listings.
export const cityByName = (name) => {
  const key = String(name || "").trim().toLowerCase();
  return CITIES.find((c) => c.name.toLowerCase() === key || c.alt.some((a) => a.toLowerCase() === key));
};

export const cityPath = (city) => `/pg-in/${city.slug}`;

// City page link for a listing's city, falling back to the search page.
export const cityHref = (name) => {
  const city = cityByName(name);
  return city ? cityPath(city) : `/propertys?location=${encodeURIComponent(name || "")}`;
};

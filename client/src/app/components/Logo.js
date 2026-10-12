import Link from "next/link";

// Brand mark from the design: a forest-green tile with two beds, one lit.
export function LogoMark({ size = 38 }) {
  const bed = Math.round(size * 0.24);
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        background: "var(--pg-forest)",
        gridTemplateColumns: `repeat(2, ${bed}px)`,
        gap: Math.round(size * 0.1),
        placeContent: "center",
      }}
    >
      <span style={{ width: bed, height: Math.round(bed * 1.45), borderRadius: 3, background: "rgba(255,255,255,.28)" }} />
      <span style={{ width: bed, height: Math.round(bed * 1.45), borderRadius: 3, background: "var(--pg-lamp)", boxShadow: "0 0 10px var(--pg-lamp)" }} />
    </span>
  );
}

export default function Logo({ size = 38, href = "/", className = "" }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 no-underline text-[var(--pg-ink)] shrink-0 ${className}`}>
      <LogoMark size={size} />
      <span className="display font-extrabold tracking-[-0.02em]" style={{ fontSize: Math.round(size * 0.55) }}>PG Connect</span>
    </Link>
  );
}

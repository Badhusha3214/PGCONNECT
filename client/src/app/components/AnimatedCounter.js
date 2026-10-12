"use client";
import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";

export default function AnimatedCounter({ value, duration = 1.4, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const isNumeric = /[0-9]/.test(String(value));
  const numeric = parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
  const prefix = isNumeric ? String(value).match(/^[^0-9]*/)?.[0] || "" : "";
  const suffix = isNumeric ? String(value).match(/[^0-9]*$/)?.[0] || "" : "";
  const hasComma = /,/.test(String(value));
  // Start at the final value so server HTML (and crawlers / no-JS users) get
  // the real number; the count-up only replays once it scrolls into view.
  const [display, setDisplay] = useState(
    isNumeric ? (hasComma ? Math.round(numeric).toLocaleString("en-IN") : String(Math.round(numeric))) : String(value)
  );

  useEffect(() => {
    if (!isInView || !isNumeric) return;
    const controls = animate(0, numeric, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        const rounded = Math.round(v);
        setDisplay(hasComma ? rounded.toLocaleString("en-IN") : String(rounded));
      },
    });
    return () => controls.stop();
  }, [isInView, isNumeric, numeric, duration, hasComma]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}

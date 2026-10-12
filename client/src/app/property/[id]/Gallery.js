"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Gallery({ images, name }) {
  const [active, setActive] = useState(0);

  return (
    <div className="bg-[var(--pg-bg)]">
      <div className="relative h-[320px] w-full overflow-hidden sm:h-[420px]">
        {/* initial={false}: the first image renders visible (no fade-in from 0), so it can be the LCP element */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={images[active]}
            src={images[active]}
            alt={name}
            fetchPriority={active === 0 ? "high" : "auto"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-5">
          {images.slice(0, 10).map((image, index) => (
            <motion.button
              key={`${image}-${index}`}
              onClick={() => setActive(index)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="h-20 w-full overflow-hidden rounded-xl border-2 cursor-pointer"
              style={{ borderColor: active === index ? "var(--pg-primary)" : "transparent" }}
            >
              <img src={image} alt={`${name} image ${index + 1}`} loading="lazy" className="h-full w-full object-cover" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Serializable banner data passed down from the homepage's server-side
// getActiveBanners() call (src/lib/banners-repository.ts) — must stay a
// plain data shape, never a function, since this is a Client Component.
// The old static data's three-part lead/highlight/tail headline is
// collapsed into a single `title` string here, matching the Banner model
// (prisma/schema.prisma) exactly. There is no reliable way to infer which
// substring of admin-entered free text should get the old highlight-color
// treatment, so `title` renders as one plain heading with no colored span —
// the smallest safe adaptation of the previous visual treatment. The old
// data's `trustPoints` and `contentWidthClass` have no equivalent field on
// Banner and are not reconstructed.
export type HeroBanner = {
  id: string;
  image: string;
  imageAlt: string;
  category: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

const AUTOPLAY_MS = 3000;
const SWIPE_THRESHOLD = 60;

export default function Hero({ banners }: { banners: HeroBanner[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > index || (index === banners.length - 1 && next === 0) ? 1 : -1);
      setIndex(((next % banners.length) + banners.length) % banners.length);
    },
    [index, banners.length],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, banners.length]);

  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `Slide ${index + 1} of ${banners.length}`;
    }
  }, [index, banners.length]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      next();
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      prev();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  // No active banners (none configured, all deactivated, or the public
  // read failed) — render nothing rather than crash or fall back to any
  // hardcoded promotional content. The rest of the homepage still renders.
  if (banners.length === 0) {
    return null;
  }

  const slide = banners[Math.min(index, banners.length - 1)];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      className="group relative h-[600px] w-full overflow-hidden bg-navy sm:h-[600px] md:h-[640px] lg:h-[700px] xl:h-[760px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
    >
      <div ref={liveRegionRef} className="sr-only" role="status" aria-live="polite" />

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={slide.id}
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          drag={banners.length > 1 ? "x" : false}
          dragElastic={0.1}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${banners.length}`}
          className="absolute inset-0 touch-pan-y select-none"
        >
          <Image
            src={slide.image}
            alt={slide.imageAlt}
            fill
            priority={index === 0}
            draggable={false}
            quality={90}
            sizes="100vw"
            className="object-cover"
          />

          {/* Desktop: left-to-right gradient so text sits on a readable dark field while the image stays vibrant on the right */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-navy/95 via-navy/55 to-navy/10 sm:block" />
          {/* Mobile: bottom-anchored gradient so stacked text stays legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/50 to-navy/10 sm:hidden" />

          <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-10 sm:justify-center sm:px-10 sm:pb-0 lg:px-16 xl:px-24">
            <div className="max-w-xl">
              <span className="inline-flex items-center rounded-full border border-sky/40 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky backdrop-blur-sm">
                {slide.category}
              </span>

              <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] text-white drop-shadow-sm sm:text-4xl lg:text-5xl xl:text-6xl">
                {slide.title}
              </h2>

              <p className="mt-4 max-w-[580px] text-sm leading-relaxed text-white/85 sm:text-base lg:text-lg">
                {slide.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={slide.primaryCtaHref}
                  className="group/cta inline-flex items-center gap-2 rounded-lg bg-royal px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-royal-700/30 transition-colors hover:bg-royal-600 sm:text-base"
                >
                  {slide.primaryCtaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href={slide.secondaryCtaHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:text-base"
                >
                  {slide.secondaryCtaLabel}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/50 focus-visible:opacity-100 group-hover:opacity-100 sm:flex sm:left-5 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/50 focus-visible:opacity-100 group-hover:opacity-100 sm:flex sm:right-5 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2 sm:bottom-6">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full bg-white/50 shadow-sm transition-all duration-300 hover:bg-white/80",
                  i === index ? "w-8 bg-white" : "w-1.5",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

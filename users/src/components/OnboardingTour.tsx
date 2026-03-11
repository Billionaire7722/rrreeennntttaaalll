"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronRight, X, PartyPopper } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Step {
  targetId: string | null; // null = full-screen step (completion)
  titleKey: string;
  descKey: string;
}

const STEPS: Step[] = [
  {
    targetId: "tour-map",
    titleKey: "tour_step1_title",
    descKey: "tour_step1_desc",
  },
  {
    targetId: "tour-marker",
    titleKey: "tour_step2_title",
    descKey: "tour_step2_desc",
  },
  {
    targetId: "tour-search",
    titleKey: "tour_step3_title",
    descKey: "tour_step3_desc",
  },
  {
    targetId: "tour-filter",
    titleKey: "tour_step4_title",
    descKey: "tour_step4_desc",
  },
  {
    targetId: "tour-add-btn",
    titleKey: "tour_step5_title",
    descKey: "tour_step5_desc",
  },
  {
    targetId: null,
    titleKey: "tour_done_title",
    descKey: "tour_done_desc",
  },
];

const FALLBACK: Record<string, string> = {
  tour_step1_title: "Discover Rentals on the Map",
  tour_step1_desc: "This map shows all rental properties currently available.",
  tour_step2_title: "Property Markers",
  tour_step2_desc: "Each marker represents a rental listing. Tap a marker to view details.",
  tour_step3_title: "Search Bar",
  tour_step3_desc: "Use the search bar to find rentals by location or keyword.",
  tour_step4_title: "Filters",
  tour_step4_desc: "Use filters to narrow down listings based on price, type, or other criteria.",
  tour_step5_title: "Post a New Listing",
  tour_step5_desc: "Click here to post a new rental listing.",
  tour_done_title: "You're all set! 🎉",
  tour_done_desc: "You're ready to start exploring and posting rentals!",
  tour_skip: "Skip tour",
  tour_next: "Next",
  tour_finish: "Get Started",
};

const PAD = 12; // spotlight padding in px

export default function OnboardingTour({ userId, authLoading }: { userId?: string, authLoading?: boolean }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: 1024, h: 768 });
  const [visible, setVisible] = useState(false);

  const tk = (key: string) => {
    try { return t(key as any) !== key ? t(key as any) : FALLBACK[key] ?? key; }
    catch { return FALLBACK[key] ?? key; }
  };

  // Sync window size
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if tour should show
  useEffect(() => {
    if (authLoading || !userId) return; // Only show for logged-in users

    const key = `hasSeenOnboarding_${userId}`;
    const seen = localStorage.getItem(key);
    if (!seen) setVisible(true);
  }, [userId, authLoading]);

  const markDone = useCallback(() => {
    if (userId) {
      const key = `hasSeenOnboarding_${userId}`;
      localStorage.setItem(key, "1");
    }
    setVisible(false);
  }, [userId]);

  // Measure the highlighted element
  useEffect(() => {
    if (!visible) return;
    const currentStep = STEPS[step];
    if (!currentStep.targetId) { setRect(null); return; }

    const measure = () => {
      let el: Element | null = document.getElementById(currentStep.targetId!);

      // Step 2: markers are Leaflet elements — grab the first visible marker icon
      if (!el && currentStep.targetId === "tour-marker") {
        el = document.querySelector(".leaflet-marker-icon");
        // fallback: highlight the whole map
        if (!el) el = document.getElementById("tour-map");
      }

      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step, visible]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const spotlight = rect
    ? {
        x: rect.left - PAD,
        y: rect.top - PAD,
        w: rect.width + PAD * 2,
        h: rect.height + PAD * 2,
      }
    : null;

  const W = windowSize.w;
  const H = windowSize.h;

  // Decide whether the tooltip should go above or below the highlighted rect
  // For very large targets (> 60% of screen height), center the tooltip
  const isLargeTarget = spotlight && spotlight.h > H * 0.6;
  const tooltipBelow = spotlight ? (spotlight.y + spotlight.h < H * 0.65) : true;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" aria-modal="true" role="dialog">
      {/* SVG cutout overlay */}
      {spotlight ? (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: "normal" }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.w}
                height={spotlight.h}
                rx={10}
                ry={10}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.68)"
            mask="url(#spotlight-mask)"
          />
          {/* Glowing border around the spotlight */}
          <rect
            x={spotlight.x}
            y={spotlight.y}
            width={spotlight.w}
            height={spotlight.h}
            rx={10}
            ry={10}
            fill="none"
            stroke="#14b8a6"
            strokeWidth={2.5}
            strokeDasharray="6 3"
            opacity={0.9}
          />
        </svg>
      ) : (
        /* Full-screen dim for the completion step */
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Background dim overlay (non-clickable to prevent accidental dismissal) */}
      <div className="absolute inset-0" />

      {/* Skip button top-right */}
      {!isLast && (
        <button
          onClick={markDone}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-full text-white text-sm font-medium transition-colors"
        >
          <X size={14} />
          {tk("tour_skip")}
        </button>
      )}

      {/* Step counter dots — top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-5 bg-teal-400" : i < step ? "w-1.5 bg-teal-300/60" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Tooltip card */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 w-[min(340px,90vw)] md:w-[340px] pointer-events-auto"
        style={
          isLast || isLargeTarget || !spotlight
            ? { top: "50%", transform: "translate(-50%, -50%)" }
            : tooltipBelow
            ? { top: Math.max(20, Math.min(spotlight.y + spotlight.h + 20, H - 350)) }
            : { bottom: Math.max(20, Math.min(H - spotlight.y + 20, H - 350)) }
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          {/* Card header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-4">
            {isLast && (
              <div className="flex justify-center mb-2">
                <PartyPopper size={32} className="text-white" />
              </div>
            )}
            <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-100 mb-0.5">
              {!isLast ? `Step ${step + 1} of ${STEPS.length - 1}` : "All done!"}
            </p>
            <h3 className="text-white font-bold text-[17px] leading-snug">
              {tk(current.titleKey)}
            </h3>
          </div>

          {/* Card body */}
          <div className="px-5 py-4 overflow-y-auto min-h-0">
            <p className="text-gray-600 text-sm leading-relaxed">
              {tk(current.descKey)}
            </p>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              {!isLast ? (
                <>
                  <button
                    onClick={markDone}
                    className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                  >
                    {tk("tour_skip")}
                  </button>
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors active:scale-95"
                  >
                    {tk("tour_next")}
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={markDone}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3 rounded-xl transition-colors active:scale-95"
                >
                  {tk("tour_finish")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

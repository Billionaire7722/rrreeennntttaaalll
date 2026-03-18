"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, PartyPopper, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Step {
  targetId: string | null;
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
  tour_done_title: "You're all set!",
  tour_done_desc: "You're ready to start exploring and posting rentals!",
  tour_skip: "Skip tour",
  tour_next: "Next",
  tour_finish: "Get Started",
};

const PAD = 12;
const TOP_CHROME_OFFSET = 72;
const BOTTOM_CHROME_OFFSET = 140;
const MIN_CARD_HEIGHT = 280;
const MAX_CARD_HEIGHT = 420;
const MOBILE_SIDE_PADDING = 12;
const DESKTOP_SIDE_PADDING = 20;

function getViewportSize() {
  if (typeof window === "undefined") return { w: 1024, h: 768 };

  const viewport = window.visualViewport;
  return {
    w: Math.round(viewport?.width || window.innerWidth || 1024),
    h: Math.round(viewport?.height || window.innerHeight || 768),
  };
}

export default function OnboardingTour({ userId, authLoading }: { userId?: string; authLoading?: boolean }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState(() => getViewportSize());
  const [visible, setVisible] = useState(false);

  const tk = (key: string) => {
    try {
      return t(key as never) !== key ? t(key as never) : FALLBACK[key] ?? key;
    } catch {
      return FALLBACK[key] ?? key;
    }
  };

  useEffect(() => {
    const handleResize = () => setWindowSize(getViewportSize());

    handleResize();
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (authLoading || !userId) return;

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

  useEffect(() => {
    if (!visible) return;

    const currentStep = STEPS[step];
    if (!currentStep.targetId) {
      setRect(null);
      return;
    }

    const measure = () => {
      const targetId = currentStep.targetId;
      if (!targetId) {
        setRect(null);
        return;
      }

      let element: Element | null = document.getElementById(targetId);

      if (!element && targetId === "tour-marker") {
        element = document.querySelector(".leaflet-marker-icon");
        if (!element) element = document.getElementById("tour-map");
      }

      setRect(element ? element.getBoundingClientRect() : null);
    };

    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [step, visible]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const viewportWidth = windowSize.w;
  const viewportHeight = windowSize.h;
  const horizontalPadding = viewportWidth < 640 ? MOBILE_SIDE_PADDING : DESKTOP_SIDE_PADDING;
  const cardWidth = Math.min(380, viewportWidth - horizontalPadding * 2);
  const viewportTop = Math.max(20, TOP_CHROME_OFFSET);
  const viewportBottom = Math.max(viewportTop + MIN_CARD_HEIGHT, viewportHeight - BOTTOM_CHROME_OFFSET);
  const estimatedCardHeight = Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_HEIGHT, viewportHeight * 0.52));

  const spotlight = rect
    ? (() => {
        const unclampedX = rect.left - PAD;
        const unclampedY = rect.top - PAD;
        const unclampedW = rect.width + PAD * 2;
        const unclampedH = rect.height + PAD * 2;
        const x = Math.max(8, unclampedX);
        const y = Math.max(8, unclampedY);

        return {
          x,
          y,
          w: Math.min(unclampedW, Math.max(48, viewportWidth - x - 8)),
          h: Math.min(unclampedH, Math.max(48, viewportHeight - y - 8)),
        };
      })()
    : null;

  const isLargeTarget = Boolean(spotlight && spotlight.h > viewportHeight * 0.6);
  const tooltipBelow = spotlight ? spotlight.y + spotlight.h < viewportHeight * 0.65 : true;
  const clampTop = (value: number) => Math.max(viewportTop, Math.min(value, viewportBottom - estimatedCardHeight));
  const cardTop =
    isLast || isLargeTarget || !spotlight
      ? clampTop((viewportHeight - estimatedCardHeight) / 2)
      : tooltipBelow
        ? clampTop(spotlight.y + spotlight.h + 20)
        : clampTop(spotlight.y - estimatedCardHeight - 20);
  const cardMaxHeight = Math.max(MIN_CARD_HEIGHT, viewportBottom - cardTop);

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-modal="true"
      role="dialog"
    >
      {spotlight ? (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ mixBlendMode: "normal" }}>
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={spotlight.x} y={spotlight.y} width={spotlight.w} height={spotlight.h} rx={10} ry={10} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#spotlight-mask)" />
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
        <div className="absolute inset-0 bg-black/70" />
      )}

      <div className="absolute inset-0" />

      {!isLast ? (
        <button
          onClick={markDone}
          className="absolute right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/30 sm:right-4"
          style={{ top: "max(12px, calc(env(safe-area-inset-top, 0px) + 12px))" }}
        >
          <X size={14} />
          {tk("tour_skip")}
        </button>
      ) : null}

      <div
        className="absolute left-1/2 z-10 flex -translate-x-1/2 gap-1.5"
        style={{ top: "max(14px, calc(env(safe-area-inset-top, 0px) + 14px))" }}
      >
        {STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === step ? "w-5 bg-teal-400" : index < step ? "w-1.5 bg-teal-300/60" : "w-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>

      <div
        className="pointer-events-auto absolute left-1/2 z-10 -translate-x-1/2"
        style={{
          top: cardTop,
          width: cardWidth,
          maxHeight: cardMaxHeight,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-full max-h-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-4">
            {isLast ? (
              <div className="mb-2 flex justify-center">
                <PartyPopper size={32} className="text-white" />
              </div>
            ) : null}
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-teal-100">
              {!isLast ? `Step ${step + 1} of ${STEPS.length - 1}` : "All done!"}
            </p>
            <h3 className="text-[17px] font-bold leading-snug text-white">{tk(current.titleKey)}</h3>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <p className="text-sm leading-relaxed text-gray-600">{tk(current.descKey)}</p>
          </div>

          <div className="border-t border-gray-100 bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              {!isLast ? (
                <>
                  <button onClick={markDone} className="text-sm text-gray-400 transition-colors hover:text-gray-600">
                    {tk("tour_skip")}
                  </button>
                  <button
                    onClick={() => setStep((value) => value + 1)}
                    className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 active:scale-95"
                  >
                    {tk("tour_next")}
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={markDone}
                  className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-700 active:scale-95"
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

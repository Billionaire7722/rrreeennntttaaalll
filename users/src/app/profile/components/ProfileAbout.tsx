"use client";

import { Info, PencilLine } from "lucide-react";

interface ProfileAboutProps {
  bio: string;
  onEdit: () => void;
  t: (key: string) => string;
}

export default function ProfileAbout({ bio, onEdit, t }: ProfileAboutProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            {t("bio") || "About"}
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {t("bio") || "About"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <PencilLine className="h-3.5 w-3.5" />
          {t("edit_profile")}
        </button>
      </div>

      {bio ? (
        <p className="max-w-2xl break-words whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-[15px]">
          {bio}
        </p>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <Info className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900">
                {t("no_bio_yet") || "Tell renters a bit about you"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t("bio_placeholder") || "Add a short intro so your profile feels personal and trustworthy."}
              </p>
              <button
                type="button"
                onClick={onEdit}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <PencilLine className="h-4 w-4" />
                {t("edit_profile")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

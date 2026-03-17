"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Users, Briefcase, Target, Building2, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const productItems = [0, 1, 2, 3, 4].map((index) => t(`about.product.items.${index}`));

  return (
    <div className="h-full overflow-y-auto bg-slate-100 pb-28 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:h-20">
          <button
            onClick={() => router.back()}
            className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:border-teal-500 hover:bg-teal-50"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>

          <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{t("about.header")}</h2>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="absolute right-0 top-0 -z-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-slate-50" />
          <div className="relative z-10">
            <span className="mb-4 inline-block rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
              {t("about.header")}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl">{t("about.title")}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">{t("about.intro")}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 transition-shadow duration-300 hover:shadow-md">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{t("about.founder.title")}</h2>
            <div className="space-y-4">
              <p className="leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-900">{t("about.founder.nameLabel")}:</span> {t("about.founder.name")}.
              </p>
              <p className="border-l-4 border-slate-100 pl-4 italic leading-relaxed text-slate-600">
                &ldquo;{t("about.founder.description")}&rdquo;
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 transition-shadow duration-300 hover:shadow-md">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Briefcase size={24} />
            </div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{t("about.hiring.title")}</h2>
            <div className="space-y-4 leading-relaxed text-slate-600">
              <p>{t("about.hiring.descriptionPrimary")}</p>
              <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium">{t("about.hiring.descriptionSecondary")}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 transition-shadow duration-300 hover:shadow-md">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Building2 size={24} />
            </div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{t("about.product.title")}</h2>
            <ul className="space-y-3">
              {productItems.map((item, index) => (
                <li key={index} className="flex gap-3 leading-relaxed text-slate-600">
                  <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8 transition-shadow duration-300 hover:shadow-md">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Target size={24} />
            </div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">{t("about.mission.title")}</h2>
            <div className="space-y-4 leading-relaxed text-slate-600">
              <p>{t("about.mission.descriptionPrimary")}</p>
              <p className="border-t border-slate-50 pt-4 font-medium text-slate-800">{t("about.mission.descriptionSecondary")}</p>
            </div>
          </section>
        </div>

        <section className="relative mt-8 overflow-hidden rounded-3xl bg-slate-900 p-8 text-slate-100 md:p-12">
          <div className="absolute bottom-0 right-0 -mb-48 -mr-48 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-3 font-bold text-blue-400">
                <Mail size={20} />
                <span className="text-xs uppercase tracking-widest">{t("about.contact.title")}</span>
              </div>
              <h2 className="mb-4 text-2xl font-bold md:text-3xl">{t("about.contact.title")}</h2>
              <p className="text-lg leading-relaxed text-slate-400">{t("about.contact.description")}</p>
            </div>

            <div className="flex flex-col gap-4">
              <a
                href="mailto:vuongtrungkien77forwork@gmail.com"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 active:scale-[0.98]"
              >
                <Mail size={18} />
                <span>vuongtrungkien77forwork@gmail.com</span>
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
              >
                {t("about.contact.homeButton")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

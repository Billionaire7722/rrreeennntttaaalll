"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { ChevronLeft, Shield, Eye, Database, Users, Lock, History, Scale, ExternalLink, Mail, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="h-full overflow-y-auto bg-slate-100 pb-28 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-6">
          <Link href="/register" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800">
            <ChevronLeft size={16} />
            <span>{t("common.goBack")}</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="mb-2 flex items-center gap-3 text-blue-600">
            <Shield size={32} />
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t("legal.privacy.title")}</h1>
          </div>
          <p className="mb-4 text-sm font-medium text-slate-500">{t("legal.privacy.updated")}</p>
          <div className="space-y-4 text-lg leading-7 text-slate-700">
            <p className="font-semibold">{t("legal.privacy.welcome")}</p>
            <p>{t("legal.privacy.intro")}</p>
            <p>{t("legal.privacy.agreement")}</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {Array.from({ length: 10 }, (_, index) => index).map((index) => {
            const title = t(`legal.privacy.sections.${index}.title`);
            const content = t(`legal.privacy.sections.${index}.content`);
            let Icon = FileText;
            if (index === 0) Icon = Eye;
            if (index === 1) Icon = Database;
            if (index === 2) Icon = Users;
            if (index === 3) Icon = Lock;
            if (index === 4) Icon = History;
            if (index === 5) Icon = Scale;
            if (index === 6) Icon = ExternalLink;
            if (index === 9) Icon = Mail;

            return (
              <section key={index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
                  <Icon size={20} className="text-blue-500" />
                  <h2>{title}</h2>
                </div>
                <div className="whitespace-pre-wrap leading-7 text-slate-700">
                  {content.split("\n").map((line, lineIndex) => (
                    <p key={lineIndex} className={lineIndex > 0 && line.trim() !== "" ? "mt-2" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-slate-500">
          <p>{t("legal.footerCopyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </div>
  );
}

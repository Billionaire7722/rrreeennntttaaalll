"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, AlertCircle, CheckCircle2, MessageSquare, Subtitles } from "lucide-react";
import api from "@/api/axios";
import { useLanguage } from "@/context/LanguageContext";

export default function SupportTicketPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      await api.post("/support/tickets", { subject, message });
      setStatus("success");
      setSubject("");
      setMessage("");
      setTimeout(() => router.push("/profile/help-support"), 3000);
    } catch (error) {
      console.error("Failed to submit ticket:", error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4 sm:h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:border-teal-500 hover:bg-teal-50"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{t("help.ticket.title")}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-teal-500/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl" />

          <div className="relative z-10 p-8 sm:p-10">
            {status === "success" ? (
              <div className="animate-in zoom-in py-10 text-center duration-500">
                <div className="inline-flex rounded-full bg-teal-100 p-5 text-teal-600">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <div className="mt-6 space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">{t("help.ticket.submittedTitle")}</h2>
                  <p className="font-medium leading-relaxed text-slate-600">{t("help.ticket.successMessage")}</p>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-400">{t("help.ticket.redirectingBack")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {status === "error" ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-600 animate-in slide-in-from-top-4 duration-300">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-bold">{t("help.ticket.errorMessage")}</p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <label className="ml-1 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900">
                    <Subtitles className="h-4 w-4 text-slate-400" />
                    {t("help.ticket.subjectLabel")}
                  </label>
                  <input
                    required
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder={t("help.ticket.subjectPlaceholder")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div className="space-y-3">
                  <label className="ml-1 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    {t("help.ticket.messageLabel")}
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t("help.ticket.messagePlaceholder")}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-6 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 text-lg font-black text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t("help.ticket.submittingButton")}
                    </>
                  ) : (
                    <>
                      {t("help.ticket.submitButton")}
                      <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

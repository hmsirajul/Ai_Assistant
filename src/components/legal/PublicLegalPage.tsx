import React from "react";
import { ArrowLeft, FileText, Mail, ShieldCheck } from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";
import {
  LEGAL_META,
  PRIVACY_POLICY_CONTENT,
  TERMS_OF_SERVICE_CONTENT
} from "../../data/legalContent";
import { navigateToPath } from "../../lib/navigation";

interface PublicLegalPageProps {
  page: "privacy" | "terms";
}

export const PublicLegalPage: React.FC<PublicLegalPageProps> = ({ page }) => {
  const docData = page === "privacy" ? PRIVACY_POLICY_CONTENT : TERMS_OF_SERVICE_CONTENT;
  const isPrivacy = page === "privacy";

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: "/" | "/privacy" | "/terms") => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigateToPath(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d14] text-slate-900 dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-150">
      {/* Public Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#121520]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a
            href="/"
            onClick={e => handleLinkClick(e, "/")}
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF] rounded-lg px-1 py-0.5"
          >
            <DiptiKLogo size="xs" showText={false} />
            <span className="font-display text-base font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>DiptiK AI</span>
              <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[#FF1E8A]/15 to-[#0072FF]/20 text-[#0072FF] dark:text-[#00E5FF] border border-[#0072FF]/35 leading-none">
                3
              </span>
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav
              aria-label="Legal documents"
              className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08]"
            >
              <a
                href="/privacy"
                onClick={e => handleLinkClick(e, "/privacy")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isPrivacy
                    ? "bg-white dark:bg-[#0b0d14] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                onClick={e => handleLinkClick(e, "/terms")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  !isPrivacy
                    ? "bg-white dark:bg-[#0b0d14] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Terms of Service
              </a>
            </nav>

            <a
              href="/"
              onClick={e => handleLinkClick(e, "/")}
              className="px-3.5 py-2 rounded-xl btn-diptik-primary text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to App</span>
              <span className="sm:hidden">App</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Title & Summary Banner */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none space-y-4 text-left relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-20 dark:opacity-25 blur-3xl bg-gradient-to-br from-[#FF1E8A] via-[#8A2BE2] to-[#0072FF]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0072FF] dark:text-[#00E5FF]">
              {isPrivacy ? <ShieldCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              <span>{LEGAL_META.appName}</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-[#94a3b8] tabular-nums">
              Last updated: {docData.lastUpdated}
            </span>
          </div>

          <div className="relative z-10 space-y-2">
            <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {docData.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#94a3b8] leading-relaxed max-w-3xl">
              {docData.subtitle}
            </p>
          </div>

          <div className="relative z-10 p-4 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-white/[0.06] text-xs sm:text-sm text-slate-700 dark:text-[#cbd5e1] leading-relaxed">
            {docData.summary}
          </div>
        </section>

        {/* Responsive Grid: Section Index + Legal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          <aside className="lg:col-span-4 lg:sticky lg:top-24 p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
              On this page
            </h2>
            <nav aria-label="Document sections" className="space-y-1">
              {docData.sections.map(section => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-[#cbd5e1] hover:text-[#0072FF] dark:hover:text-[#00E5FF] hover:bg-slate-100/80 dark:hover:bg-white/[0.05] transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="lg:col-span-8 space-y-4">
            {docData.sections.map(section => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-3"
              >
                <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                {section.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-sm text-slate-600 dark:text-[#cbd5e1] leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-2 pt-1">
                    {section.bullets.map((bullet, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-[#cbd5e1] leading-relaxed"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#0072FF] dark:bg-[#00E5FF] mt-2 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121520]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-[#94a3b8]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© {new Date().getFullYear()} {LEGAL_META.appName}</span>
            <span aria-hidden="true">·</span>
            <a
              href={`mailto:${LEGAL_META.contactEmail}`}
              className="inline-flex items-center gap-1 hover:text-[#0072FF] dark:hover:text-[#00E5FF] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{LEGAL_META.contactEmail}</span>
            </a>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <a
              href="/"
              onClick={e => handleLinkClick(e, "/")}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Home
            </a>
            <a
              href="/privacy"
              onClick={e => handleLinkClick(e, "/privacy")}
              className={`transition-colors ${
                isPrivacy
                  ? "text-[#0072FF] dark:text-[#00E5FF] font-semibold"
                  : "hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              onClick={e => handleLinkClick(e, "/terms")}
              className={`transition-colors ${
                !isPrivacy
                  ? "text-[#0072FF] dark:text-[#00E5FF] font-semibold"
                  : "hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

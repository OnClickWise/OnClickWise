"use client";

import { Twitter, Linkedin, Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("HomePage.Footer");
  
  return (
    <footer className="border-t bg-background/40 backdrop-blur-xl dark:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo + Description */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center cursor-pointer">
              <Logo width={200} height={60} className="h-12 w-auto opacity-90" />
            </Link>

            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide mb-4">
              {t("services")}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-blue-500 transition cursor-pointer">{t("leadCapture")}</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-blue-500 transition cursor-pointer">{t("clientManagement")}</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-blue-500 transition cursor-pointer">{t("automation")}</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-blue-500 transition cursor-pointer">{t("reportsAnalytics")}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide mb-4">
              {t("company")}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#about" onClick={(e) => { e.preventDefault(); const about = document.getElementById("about") || document.getElementById("home"); about?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-blue-500 transition cursor-pointer">{t("aboutUs")}</a></li>
              <li><a href="mailto:careers@onclickwise.com" className="hover:text-blue-500 transition cursor-pointer">{t("careers")}</a></li>
              <li><a href="#blog" onClick={(e) => { e.preventDefault(); }} className="hover:text-blue-500 transition cursor-pointer">{t("blog")}</a></li>
              <li><a href="mailto:contact@onclickwise.com" className="hover:text-blue-500 transition cursor-pointer">{t("contact")}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide mb-4">
              {t("legal")}
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="/privacy-policy" className="hover:text-blue-500 transition cursor-pointer">{t("privacyPolicy")}</a></li>
              <li><a href="/terms" className="hover:text-blue-500 transition cursor-pointer">{t("termsConditions")}</a></li>
              <li><a href="/security" className="hover:text-blue-500 transition cursor-pointer">{t("security")}</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-10" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-sm text-muted-foreground">
            {t("copyright", { year: new Date().getFullYear() })}
          </span>

          <div className="flex items-center space-x-6">
            <FooterIcon href="https://twitter.com/onclickwise" target="_blank" icon={<Twitter size={20} />} />
            <FooterIcon href="https://www.linkedin.com/company/onclickwise/" target="_blank" icon={<Linkedin size={20} />} />
            <FooterIcon href="https://facebook.com/onclickwise" target="_blank" icon={<Facebook size={20} />} />
            <FooterIcon href="https://instagram.com/onclickwise" target="_blank" icon={<Instagram size={20} />} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterIcon({ href, icon, target }: { href: string; icon: React.ReactNode; target?: string }) {
  const t = useTranslations("HomePage.Footer");
  
  return (
    <a
      href={href}
      target={target || "_self"}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="text-muted-foreground hover:text-blue-500 transition cursor-pointer"
      aria-label={t("socialLink")}
    >
      {icon}
    </a>
  );
}

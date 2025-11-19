"use client";

import { Github, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background/40 backdrop-blur-xl dark:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo + Description */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center">
              <Logo width={200} height={60} className="h-12 w-auto opacity-90" />
            </Link>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Centralize your operations, accelerate your workflow and grow
              with a modern platform built for performance.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide mb-4">
              Services
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a className="hover:text-blue-500 transition">Lead Capture</a></li>
              <li><a className="hover:text-blue-500 transition">Client Management</a></li>
              <li><a className="hover:text-blue-500 transition">Automation</a></li>
              <li><a className="hover:text-blue-500 transition">Reports & Analytics</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide mb-4">
              Company
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a className="hover:text-blue-500 transition">About Us</a></li>
              <li><a className="hover:text-blue-500 transition">Careers</a></li>
              <li><a className="hover:text-blue-500 transition">Blog</a></li>
              <li><a className="hover:text-blue-500 transition">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground/90 uppercase tracking-wide mb-4">
              Legal
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a className="hover:text-blue-500 transition">Privacy Policy</a></li>
              <li><a className="hover:text-blue-500 transition">Terms & Conditions</a></li>
              <li><a className="hover:text-blue-500 transition">Security</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-10" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} OnClickWise. All rights reserved.
          </span>

          <div className="flex items-center space-x-6">
            <FooterIcon href="#" icon={<Github size={20} />} />
            <FooterIcon href="#" icon={<Twitter size={20} />} />
            <FooterIcon href="#" icon={<Linkedin size={20} />} />
            <FooterIcon href="#" icon={<Facebook size={20} />} />
            <FooterIcon href="#" icon={<Instagram size={20} />} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-muted-foreground hover:text-blue-500 transition"
      aria-label="Social Link"
    >
      {icon}
    </a>
  );
}

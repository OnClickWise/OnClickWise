"use client";

import React from "react";
import { Github, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-t from-gray-50 to-white dark:from-gray-900 dark:to-black border-t border-gray-200 dark:border-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo + Description */}
          <div>
            <a href="/" className="flex items-center space-x-2 mb-4">
              <Logo width={220} height={70} className="h-14 w-auto" />
            </a>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Centralize your business operations in one platform. From leads to clients, all in one place.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">
              Services
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Lead Capture
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Client Management
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Automation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Reports & Analytics
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-500 dark:hover:text-yellow-400 transition">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-8" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} OnClickWise. All rights reserved.
          </span>

          {/* Social Links */}
          <div className="flex space-x-5 mt-4 sm:mt-0">
            <a href="#" className="text-gray-500 hover:text-blue-500 dark:hover:text-yellow-400 transition" aria-label="Github">
              <Github size={20} />
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-500 dark:hover:text-yellow-400 transition" aria-label="Twitter">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-500 dark:hover:text-yellow-400 transition" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-500 dark:hover:text-yellow-400 transition" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-500 dark:hover:text-yellow-400 transition" aria-label="Instagram">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

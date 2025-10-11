"use client";

import { motion } from "framer-motion";
import { Building2, CheckCircle2, HelpCircle, Mail, Phone } from "lucide-react";
import React from "react";

type OrgData = {
  name: string;
  activity: string;
  services: string[];
  units: string[];
};

const org: OrgData = {
  name: "Acme Corp",
  activity: "Innovative SaaS solutions for modern businesses",
  services: ["Cloud Hosting", "AI Automation", "Consulting"],
  units: ["New York", "London", "São Paulo"],
};

const faqs = [
  {
    question: "How do I get started?",
    answer: "Simply sign up and explore our products or services with a free trial.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time without penalties.",
  },
  {
    question: "Do you provide customer support?",
    answer: "Of course! We provide 24/7 support for all plans.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="relative py-20 text-center bg-gradient-to-r from-blue-600 to-yellow-400 text-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto space-y-6 px-4"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow-lg">
            Welcome to {org.name}
          </h1>
          <p className="text-lg md:text-xl">{org.activity}</p>
          <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow hover:scale-105 transition-transform">
            Get Started
          </button>
        </motion.div>
      </section>

      {/* Services / Features */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {org.services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl border bg-card shadow hover:shadow-lg transition"
            >
              <CheckCircle2 className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold">{service}</h3>
              <p className="text-muted-foreground mt-2">
                Professional {service.toLowerCase()} tailored to your business.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border bg-card shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-semibold">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Contact Us
        </h2>
        <form className="max-w-2xl mx-auto space-y-6 bg-card p-8 rounded-2xl shadow">
          <div>
            <label className="block mb-2 font-medium">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full p-3 rounded-xl border bg-background"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full p-3 pl-10 rounded-xl border bg-background"
                required
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium">WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="tel"
                placeholder="+55 11 91234-5678"
                className="w-full p-3 pl-10 rounded-xl border bg-background"
                required
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium">Interest</label>
            <select className="w-full p-3 rounded-xl border bg-background">
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium">Unit</label>
            <select className="w-full p-3 rounded-xl border bg-background">
              {org.units.map((unit, i) => (
                <option key={i} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Send Message
          </button>
        </form>
      </section>
    </div>
  );
}

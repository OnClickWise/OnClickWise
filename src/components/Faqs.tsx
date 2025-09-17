"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Sparkles } from "lucide-react";

const faqs = [
  {
    question: "What is OnclickWise?",
    answer:
      "OnclickWise is a cutting-edge SaaS platform that centralizes your business operations, from leads to sales and team management.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes! We use modern encryption and security protocols to ensure that your business data is always safe.",
  },
  {
    question: "Can I integrate with other tools?",
    answer:
      "Absolutely. OnclickWise integrates with popular CRMs, email marketing tools, and project management platforms.",
  },
  {
    question: "Do you offer customer support?",
    answer:
      "Yes, our support team is available 24/7 to help you with onboarding, troubleshooting, and best practices.",
  },
];

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black overflow-hidden">
      <div className="container mx-auto px-6 lg:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-blue-500 to-yellow-400 text-black font-semibold rounded-full shadow-lg mb-6 mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-4 h-4 text-black" />
            Frequently Asked Questions
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Everything you need to know about <span className="text-blue-600">OnclickWise</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <a
              href="#"
              className="inline-block mt-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold shadow-md hover:scale-105 transition-transform"
            >
              Contact Support
            </a>
          </motion.div>
        </div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <button
                className="w-full flex justify-between items-center p-6 text-left"
                onClick={() => toggleFaq(index)}
              >
                <span className="text-lg md:text-xl font-semibold">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {openIndex === index ? (
                    <Minus className="w-6 h-6 text-blue-500" />
                  ) : (
                    <Plus className="w-6 h-6 text-blue-500" />
                  )}
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="px-6 pb-6 text-gray-700 dark:text-gray-300"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

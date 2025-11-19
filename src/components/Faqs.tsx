"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

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
    <section className="relative py-24 bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-16">

        {/* HEADER */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-block px-5 py-1.5 mb-6 text-sm font-medium
            bg-blue-600/10 text-blue-700 dark:text-blue-300
            rounded-full border border-blue-600/20 dark:border-blue-700/30"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            FAQs
          </motion.div>

          <motion.h2
            className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Everything you need to know about{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
              OnclickWise
            </span>
          </motion.h2>

          <motion.a
            href="#"
            className="inline-block mt-4 px-7 py-3.5 rounded-full font-semibold text-white
            bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20
            hover:scale-[1.03] transition-transform"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Contact Support
          </motion.a>
        </div>

        {/* FAQ ITEMS */}
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="rounded-2xl border border-gray-200/70 dark:border-gray-800
              bg-white dark:bg-gray-900 
              shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* BUTTON */}
              <button
                className="w-full flex justify-between items-center p-6 text-left"
                onClick={() => toggleFaq(index)}
              >
                <span className="text-lg md:text-xl font-semibold">
                  {faq.question}
                </span>

                <motion.div
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {openIndex === index ? (
                    <Minus className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Plus className="w-6 h-6 text-blue-600" />
                  )}
                </motion.div>
              </button>

              {/* ANSWER */}
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="px-6 pb-6 text-gray-700 dark:text-gray-300 leading-relaxed"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* BACKGROUND BLOB SUAVE – mesmo estilo do Hero e Services */}
      <motion.div
        className="absolute -bottom-24 -left-32 w-[420px] h-[420px]
        bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, 14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </section>
  );
}
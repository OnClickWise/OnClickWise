"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Faqs() {
  const t = useTranslations("HomePage.Faqs");
  
  const faqs = [
    {
      question: t("whatIs.question"),
      answer: t("whatIs.answer"),
    },
    {
      question: t("dataSecure.question"),
      answer: t("dataSecure.answer"),
    },
    {
      question: t("integrations.question"),
      answer: t("integrations.answer"),
    },
    {
      question: t("support.question"),
      answer: t("support.answer"),
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-16">

        {/* HEADER */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-2 sm:px-0">
          <motion.div
            className="inline-block px-3 sm:px-4 md:px-5 py-1 sm:py-1.5 mb-4 sm:mb-6 text-xs sm:text-sm font-medium
            bg-blue-600/10 text-blue-700 dark:text-blue-300
            rounded-full border border-blue-600/20 dark:border-blue-700/30"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t("tag")}
          </motion.div>

          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight px-2 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {t("title")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
              {t("titleHighlight")}
            </span>
          </motion.h2>

          <motion.a
            href="mailto:support@onclickwise.com"
            className="inline-block mt-3 sm:mt-4 px-5 sm:px-6 md:px-7 py-2.5 sm:py-3 md:py-3.5 rounded-full font-semibold text-sm sm:text-base text-white
            bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20
            hover:scale-[1.03] transition-transform cursor-pointer min-h-[44px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {t("contactSupport")}
          </motion.a>
        </div>

        {/* FAQ ITEMS */}
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 px-2 sm:px-0">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="rounded-xl sm:rounded-2xl border border-gray-200/70 dark:border-gray-800
              bg-white dark:bg-gray-900 
              shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* BUTTON */}
              <button
                className="w-full flex justify-between items-center p-4 sm:p-5 md:p-6 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-2 sm:gap-4"
                onClick={() => toggleFaq(index)}
              >
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold flex-1 min-w-0 pr-2">
                  {faq.question}
                </span>

                <motion.div
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="cursor-pointer flex-shrink-0"
                >
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  ) : (
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
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
                    className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed"
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
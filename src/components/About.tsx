"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function About() {
  const t = useTranslations("HomePage.About");
  const text = t("description");
  const words = text.split(" ");

  return (
    <section id="about" className="relative py-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 text-center max-w-4xl">

        {/* TÍTULO — clean, elegante e consistente com o Hero */}
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold mb-10 
          text-gray-900 dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t("title")}
        </motion.h2>

        {/* TEXTO PRINCIPAL — animações suaves, leve e elegante */}
        <motion.p
          className="text-lg md:text-xl leading-relaxed 
          text-gray-600 dark:text-gray-300 tracking-wide"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.018 },
            },
          }}
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-2"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
                delay: i * 0.01,
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.p>

        {/* FRASE FINAL — estilo do Hero */}
        <motion.div
          className="mt-14 text-2xl font-semibold 
          text-blue-600 dark:text-blue-400"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t("footer")}
        </motion.div>
      </div>

    </section>
  );
}

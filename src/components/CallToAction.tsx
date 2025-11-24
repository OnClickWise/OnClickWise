"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function CallToAction() {
  const t = useTranslations("HomePage.CallToAction");
  const router = useRouter();
  
  return (
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-background border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        
        {/* Fade-in suave */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-0"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
            {t("title")}
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
            {t("description")}
          </p>

          <motion.button
            onClick={() => router.push("/register")}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 
                       text-white font-semibold text-sm sm:text-base md:text-lg shadow-lg 
                       transition-colors cursor-pointer min-h-[44px] w-full sm:w-auto"
          >
            {t("getStartedFree")}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

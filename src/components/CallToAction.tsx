"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function CallToAction() {
  const t = useTranslations("HomePage.CallToAction");
  const router = useRouter();
  
  return (
    <section className="relative py-24 bg-background border-t border-white/5">
      <div className="container mx-auto px-6 text-center">
        
        {/* Fade-in suave */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
            {t("title")}
          </h2>

          <p className="text-muted-foreground text-lg">
            {t("description")}
          </p>

          <motion.button
            onClick={() => router.push("/register")}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 
                       text-white font-semibold text-lg shadow-lg 
                       transition-colors cursor-pointer"
          >
            {t("getStartedFree")}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

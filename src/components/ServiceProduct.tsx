"use client";

import { motion } from "framer-motion";
import {
  Users,
  LineChart,
  Mail,
  Workflow,
  CalendarCheck,
  Briefcase,
  Rocket,
  BarChart3,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function ServiceProduct() {
  const t = useTranslations("HomePage.ServiceProduct");
  const router = useRouter();

  const services = [
    { name: t("leadsCapture.name"), icon: Rocket, description: t("leadsCapture.description") },
    { name: t("leadManagement.name"), icon: Briefcase, description: t("leadManagement.description") },
    { name: t("clientManagement.name"), icon: Users, description: t("clientManagement.description") },
    { name: t("marketingManagement.name"), icon: Mail, description: t("marketingManagement.description") },
    { name: t("analyticsReporting.name"), icon: BarChart3, description: t("analyticsReporting.description") },
    { name: t("integration.name"), icon: Workflow, description: t("integration.description") },
    { name: t("automation.name"), icon: CalendarCheck, description: t("automation.description") },
    { name: t("teamManagement.name"), icon: Users, description: t("teamManagement.description") },
    { name: t("taskManagement.name"), icon: LineChart, description: t("taskManagement.description") },
  ];

  return (
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20 items-start">

        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="px-2 sm:px-0"
        >
          {/* Badge — minimalista */}
          <div className="inline-block px-3 sm:px-4 md:px-5 py-1 sm:py-1.5 mb-4 sm:mb-6 md:mb-7 text-xs sm:text-sm font-medium
            bg-gray-100 dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            rounded-full border border-gray-300 dark:border-gray-700">
            {t("tag")}
          </div>

          {/* Título — alinhado ao Hero */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 md:mb-8 leading-tight">
            {t("title")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              {t("titleHighlight")}
            </span>{" "}
            <span className="block sm:inline">{t("titleEnd")}</span>
          </h2>

          {/* Texto — suave */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 md:mb-12 max-w-xl leading-relaxed">
            {t("description")}
          </p>

          {/* Botão — premium minimalista */}
          <motion.button
            onClick={() => router.push("/register")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block px-5 sm:px-6 md:px-7 py-2.5 sm:py-3 md:py-3.5 rounded-full font-semibold text-sm sm:text-base text-white
            bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 cursor-pointer min-h-[44px]"
          >
            {t("getStartedToday")}
          </motion.button>
        </motion.div>

        {/* RIGHT SIDE LIST */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-h-[400px] sm:max-h-[500px] md:max-h-[620px] overflow-y-auto pr-2 sm:pr-4"
        >

          {/* Gradiente superior */}
          <div className="absolute top-0 left-0 right-0 h-16 
            bg-gradient-to-b from-white dark:from-gray-950 to-transparent
            z-10 pointer-events-none" />

          <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-7 relative z-20">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={i}
                  className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 
                  dark:border-gray-800 hover:shadow-xl transition shadow-gray-200/40 dark:shadow-black/20
                  flex gap-3 sm:gap-4 items-start"

                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center rounded-lg sm:rounded-xl flex-shrink-0
                    bg-blue-600/10 dark:bg-blue-500/10 
                    text-blue-600 dark:text-blue-400">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-1.5">{service.name}</h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Gradiente inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-16 
            bg-gradient-to-t from-white dark:from-gray-950 to-transparent
            z-10 pointer-events-none" />
        </motion.div>
      </div>

    </section>
  );
}

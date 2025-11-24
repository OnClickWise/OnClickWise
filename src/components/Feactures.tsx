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
  ClipboardCheck 
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function Feature() {
  const t = useTranslations("HomePage.Features");
  
  const features = [
    {
      title: t("leadsCapture.title"),
      description: t("leadsCapture.description"),
      icon: Rocket,
    },
    {
      title: t("leadsManagement.title"),
      description: t("leadsManagement.description"),
      icon: Briefcase,
    },
    {
      title: t("clientManagement.title"),
      description: t("clientManagement.description"),
      icon: Users,
    },
    {
      title: t("salesPipeline.title"),
      description: t("salesPipeline.description"),
      icon: LineChart,
    },
    {
      title: t("analyticsReporting.title"),
      description: t("analyticsReporting.description"),
      icon: BarChart3,
    },
    {
      title: t("emailMarketing.title"),
      description: t("emailMarketing.description"),
      icon: Mail,
    },
    {
      title: t("taskManagement.title"),
      description: t("taskManagement.description"),
      icon: CalendarCheck,
    },
    {
      title: t("teamCollaboration.title"),
      description: t("teamCollaboration.description"),
      icon: ClipboardCheck,
    },
    {
      title: t("automationWorkflows.title"),
      description: t("automationWorkflows.description"),
      icon: Workflow,
    },
  ];

  return (
    <section id="features" className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl text-center">

        {/* TAG — mais premium, mais suave */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block px-3 sm:px-4 py-1 mb-4 sm:mb-6 text-xs sm:text-sm font-medium 
          rounded-full
          bg-blue-100/60 dark:bg-blue-900/40 
          text-blue-600 dark:text-blue-300"
        >
          {t("tag")}
        </motion.div>

        {/* TITLE — clean e consistente com o Hero */}
        <motion.h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight sm:leading-snug px-2 sm:px-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {t("title")}
        </motion.h2>

        {/* SUBTEXT */}
        <motion.p
          className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 md:mb-16 max-w-3xl mx-auto px-2 sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {t("subtitle")}
        </motion.p>

        {/* FEATURE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl 
                bg-white dark:bg-gray-800/60
                border border-gray-200 dark:border-gray-700
                hover:shadow-lg dark:hover:shadow-black/20 
                transition"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 
                rounded-lg sm:rounded-xl 
                bg-blue-600/10 dark:bg-blue-400/10 
                text-blue-600 dark:text-blue-300 
                mb-4 sm:mb-5 md:mb-6 mx-auto">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" size={28} />
                </div>

                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

    </section>
  );
}

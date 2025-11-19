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
    <section id="features" className="relative py-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-6xl text-center">

        {/* TAG — mais premium, mais suave */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1 mb-6 text-sm font-medium 
          rounded-full
          bg-blue-100/60 dark:bg-blue-900/40 
          text-blue-600 dark:text-blue-300"
        >
          {t("tag")}
        </motion.div>

        {/* TITLE — clean e consistente com o Hero */}
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold mb-6 leading-snug"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {t("title")}
        </motion.h2>

        {/* SUBTEXT */}
        <motion.p
          className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {t("subtitle")}
        </motion.p>

        {/* FEATURE GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                className="p-6 rounded-2xl 
                bg-white dark:bg-gray-800/60
                border border-gray-200 dark:border-gray-700
                hover:shadow-lg dark:hover:shadow-black/20 
                transition"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="flex items-center justify-center w-14 h-14 
                rounded-xl 
                bg-blue-600/10 dark:bg-blue-400/10 
                text-blue-600 dark:text-blue-300 
                mb-6 mx-auto">
                  <Icon size={28} />
                </div>

                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">
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

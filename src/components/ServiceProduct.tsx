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
    <section className="relative py-28 bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Badge — minimalista */}
          <div className="inline-block px-5 py-1.5 mb-7 text-sm font-medium
            bg-gray-100 dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            rounded-full border border-gray-300 dark:border-gray-700">
            {t("tag")}
          </div>

          {/* Título — alinhado ao Hero */}
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
            {t("title")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              {t("titleHighlight")}
            </span>{" "}
            {t("titleEnd")}
          </h2>

          {/* Texto — suave */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-xl leading-relaxed">
            {t("description")}
          </p>

          {/* Botão — premium minimalista */}
          <motion.button
            onClick={() => router.push("/register")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block px-7 py-3.5 rounded-full font-semibold text-white
            bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 cursor-pointer"
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
          className="relative max-h-[620px] overflow-y-auto pr-4"
        >

          {/* Gradiente superior */}
          <div className="absolute top-0 left-0 right-0 h-16 
            bg-gradient-to-b from-white dark:from-gray-950 to-transparent
            z-10 pointer-events-none" />

          <div className="space-y-7 relative z-20">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={i}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 
                  dark:border-gray-800 hover:shadow-xl transition shadow-gray-200/40 dark:shadow-black/20
                  flex gap-4 items-start"

                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl 
                    bg-blue-600/10 dark:bg-blue-500/10 
                    text-blue-600 dark:text-blue-400">
                    <Icon size={24} />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-1.5">{service.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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

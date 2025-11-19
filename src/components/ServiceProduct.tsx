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

const services = [
  { name: "Leads Capture", icon: Rocket, description: "Capture leads from various sources seamlessly." },
  { name: "Lead Management", icon: Briefcase, description: "Organize and track your leads efficiently." },
  { name: "Client Management", icon: Users, description: "Centralize clients with a simple and smart interface." },
  { name: "Marketing Management", icon: Mail, description: "Plan and execute multi-channel marketing campaigns." },
  { name: "Analytics & Reporting", icon: BarChart3, description: "Turn insights into smarter decisions." },
  { name: "Integration", icon: Workflow, description: "Connect with your favorite tools instantly." },
  { name: "Automation", icon: CalendarCheck, description: "Automate tasks and scale your operations effortlessly." },
  { name: "Team Management", icon: Users, description: "Manage your team with clarity and efficiency." },
  { name: "Task Management", icon: LineChart, description: "Track and organize work with precision." },
];

export default function ServiceProduct() {
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
            Services & Products
          </div>

          {/* Título — alinhado ao Hero */}
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
            Powerful tools to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              grow your business
            </span>{" "}
            effortlessly.
          </h2>

          {/* Texto — suave */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-xl leading-relaxed">
            A complete and elegant CRM platform designed to simplify your workflow.
            Automate actions, manage customers, analyze performance and boost results —
            all in one intelligent ecosystem.
          </p>

          {/* Botão — premium minimalista */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block px-7 py-3.5 rounded-full font-semibold text-white
            bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20"
          >
            Get Started Today
          </motion.a>
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

      {/* Blob minimalista — igual ao Hero */}
      <motion.div
        className="absolute -bottom-28 -left-28 w-[420px] h-[420px]
        bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </section>
  );
}

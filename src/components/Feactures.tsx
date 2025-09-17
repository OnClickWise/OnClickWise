"use client"

import { motion } from "framer-motion"
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
} from "lucide-react"

export default function Feature() {
  const features = [
    {
      title: "Leads Capture",
      description: "Automatically capture leads from multiple channels.",
      icon: Rocket,
    },
    {
      title: "Leads Management",
      description: "Manage all your leads in one place with organized pipelines.",
      icon: Briefcase,
    },
    {
      title: "Client Management",
      description: "Centralize customer information for personalized service.",
      icon: Users,
    },
    {
      title: "Sales Pipeline",
      description: "Track every stage of your sales process with clear dashboards.",
      icon: LineChart,
    },
    {
      title: "Analytics and Reporting",
      description: "Measure results and identify opportunities with insights and reports.",
      icon: BarChart3,
    },
    {
      title: "Email Marketing Integration",
      description: "Automate personalized campaigns through email integration.",
      icon: Mail,
    },
    {
      title: "Task and Activity Management",
      description: "Easily organize tasks, meetings, and follow-ups.",
      icon: CalendarCheck,
    },
    {
      title: "Team Collaboration",
      description: "Boost teamwork with centralized communication and shared goals.",
      icon: ClipboardCheck,
    },
    {
      title: "Automation and Workflows",
      description: "Save time by automating repetitive tasks and workflows.",
      icon: Workflow,
    },
  ]

  return (
    <section className="relative py-24 bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-6xl text-center">
        {/* TAG */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block px-4 py-1 mb-6 text-sm font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 rounded-full"
        >
          Features
        </motion.div>

        {/* TITLE */}
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold mb-6 leading-snug"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Where <span className="text-blue-600">power management</span>{" "}
          meets <span className="text-purple-600">simplicity</span> and{" "}
          <span className="text-yellow-500">organization</span>
        </motion.h2>

        {/* SUBTEXT */}
        <motion.p
          className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-16 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          OnclickWise is designed to transform the way you manage your business, 
          combining cutting-edge technology with an intuitive user experience.
        </motion.p>

        {/* FEATURE GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={i}
                className="p-6 rounded-2xl shadow-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white mb-6 mx-auto">
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* DECORATIONS */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </section>
  )
}

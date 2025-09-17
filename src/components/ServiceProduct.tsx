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
  BarChart3 
} from "lucide-react"

const services = [
  {name: "Leads Capture", icon: Rocket, description: "Capture leads from various sources seamlessly."},
  {name: "Lead Management", icon: Briefcase, description: "Organize and manage your leads effectively."},
  {name: "Client Management", icon: Users, description: "Manage and centralize your clients for personalized service."},
  {name: "Marketing Management", icon: Mail, description: "Plan and execute marketing campaigns with ease."},
  {name: "Analytics & Reporting", icon: BarChart3, description: "Gain insights with comprehensive analytics."},
  {name: "Integration", icon: Workflow, description: "Integrate with popular tools and platforms effortlessly."},
  {name: "Automation", icon: CalendarCheck, description: "Automate repetitive tasks to save time and focus on growth."},
  {name: "Team Management", icon: Users, description: "Collaborate and manage your team effectively."},
  {name: "Task Management", icon: LineChart, description: "Organize and track tasks with precision."},
]

export default function ServiceProduct() {
  return (
    <section className="relative py-24 bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-block px-4 py-1 mb-6 text-sm font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400 rounded-full">
            Services & Products
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-snug">
            The <span className="text-purple-600">best Services</span> &{" "}
            <span className="text-blue-600">Products</span> in one place. <br />
            <span className="text-yellow-500">Make it simple.</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-xl">
            Our CRM software offers a comprehensive suite of features designed 
            to streamline your sales, marketing, and customer support processes. 
            From lead capture and management to advanced analytics and reporting, 
            our platform provides everything you need to enhance customer relationships 
            and drive business growth.
          </p>

          <motion.a
            href="#"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-md font-semibold"
          >
            Get Started Today
          </motion.a>
        </motion.div>

        {/* RIGHT SIDE SCROLLABLE LIST */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-h-[600px] overflow-y-auto pr-4"
        >
          {/* Top Gradient */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 dark:from-black to-transparent z-10 pointer-events-none" />
          
          {/* Services List */}
          <div className="space-y-6 relative z-20">
            {services.map((service, i) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={i}
                  className="p-6 rounded-2xl shadow-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition flex gap-4 items-start"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white flex-shrink-0">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{service.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 dark:from-black to-transparent z-10 pointer-events-none" />
        </motion.div>
      </div>
    </section>
  )
}

"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

type PricingPlan = {
  title: string;
  description: string;
  price: string;
  period: string;
  features: string[];
};

const plans: PricingPlan[] = [
  {
    title: "Starter",
    description: "Basic tools for individuals and small projects.",
    price: "$29",
    period: "/month",
    features: [
      "Lead capture for personal use",
      "Manage 1 project",
      "Email support for 1 month",
      "Basic analytics",
      "Access to basic integrations",
    ],
  },
  {
    title: "Business",
    description: "For small teams aiming to grow efficiently.",
    price: "$59",
    period: "/month",
    features: [
      "Lead capture & management",
      "Team size: up to 5",
      "Premium email support for 6 months",
      "Advanced analytics",
      "Integration with popular tools",
    ],
  },
  {
    title: "Company",
    description: "Complete solution for multiple teams and departments.",
    price: "$99",
    period: "/month",
    features: [
      "Full CRM & marketing management",
      "Team size: up to 10",
      "Priority support for 12 months",
      "Automation & workflow tools",
      "Advanced integrations & reporting",
    ],
  },
  {
    title: "Enterprise",
    description: "All-inclusive plan for large organizations and extended support.",
    price: "$499",
    period: "/month",
    features: [
      "Dedicated infrastructure & SLA",
      "Unlimited users & teams",
      "24/7 Premium support",
      "Advanced automation and analytics",
      "Full access to all integrations and premium features",
    ],
  },
];

export default function Pricing() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black overflow-hidden">
      <div className="container mx-auto px-6 lg:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Flexible Plans for <span className="text-blue-500">Your Business</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Choose the plan that suits your needs — from basic tools to full-featured premium solutions.
          </motion.p>
        </div>

        {/* Pricing Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="flex flex-col justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div>
                <h3 className="mb-4 text-2xl font-bold text-blue-500">{plan.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>

                {/* Price */}
                <div className="flex justify-center items-baseline my-8">
                  <span className="mr-2 text-5xl font-extrabold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="mb-8 space-y-4 text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <motion.a
                href="#"
                className="w-full text-center text-white bg-gradient-to-r from-blue-500 to-purple-500 font-semibold rounded-xl px-5 py-3 shadow-md hover:scale-105 transition-transform"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

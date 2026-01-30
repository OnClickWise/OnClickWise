"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ReactNode, useRef } from "react"

interface Props {
  children: ReactNode
  offset?: number
}

export function ParallaxSection({ children, offset = 80 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1])

  return (
    <motion.section
      ref={ref}
      style={{ y, opacity }}
      className="will-change-transform"
    >
      {children}
    </motion.section>
  )
}

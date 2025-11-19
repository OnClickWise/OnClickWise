"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useMotionValue, animate } from "framer-motion"
import Image from "next/image"
import { Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

export function LogoTicker() {
  const t = useTranslations("HomePage.LogoTicker");
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)
  const animationRef = useRef<any>(null)
  const dragStartX = useRef<number>(0)
  
  const logos = [
    { name: "Cofee", image: "/cofee1.png" },
    { name: "MigWise", image: "/migwise.png" },
    { name: "Omniverse", image: "/omin.png" },
    { name: "Space", image: "/xlogo-trsp.png" },
  ]

  // Duplica os logos MUITAS vezes para garantir loop infinito em qualquer direção
  // Com 8 cópias, temos 32 logos no total, garantindo que sempre haja conteúdo visível
  const duplicatedLogos = [...logos, ...logos, ...logos, ...logos, ...logos, ...logos, ...logos, ...logos]
  
  // Calcula a largura total de um conjunto de logos (4 logos)
  const logoWidth = 160 // w-40
  const gap = 64 // gap-16
  const singleSetWidth = (logoWidth + gap) * logos.length
  const animationDistance = singleSetWidth // Distância para animar (um conjunto completo)
  const animationDuration = 20000 // 20 segundos em ms
  
  // Função para normalizar a posição (loop infinito)
  const normalizePosition = (position: number) => {
    // Se está muito à esquerda (negativo), normaliza para o range válido [0, -animationDistance]
    if (position < -animationDistance) {
      const cycles = Math.floor(Math.abs(position) / animationDistance)
      return position + (cycles * animationDistance)
    }
    // Se está à direita (positivo), normaliza para o range válido
    if (position > 0) {
      const cycles = Math.floor(position / animationDistance)
      return position - (cycles * animationDistance)
    }
    return position
  }
  
  // Função para iniciar/retomar animação
  const startAnimation = useCallback(() => {
    if (isPaused || isDragging) {
      return
    }
    
    const currentX = x.get()
    const normalizedX = normalizePosition(currentX)
    const targetX = normalizedX - animationDistance
    
    // Para a animação anterior se existir
    if (animationRef.current) {
      animationRef.current.stop()
    }
    
    // Calcula a duração baseada na distância restante
    const remainingDistance = Math.abs(targetX - normalizedX)
    const duration = remainingDistance > 0 ? (animationDuration * remainingDistance) / animationDistance : animationDuration
    
    animationRef.current = animate(x, targetX, {
      duration: duration / 1000, // converte para segundos
      ease: "linear",
      onComplete: () => {
        // Normaliza e continua a animação infinitamente
        if (!isPaused && !isDragging) {
          const finalX = x.get()
          const normalized = normalizePosition(finalX)
          x.set(normalized === -animationDistance ? 0 : normalized)
          // Continua a animação
          setTimeout(() => {
            if (!isPaused && !isDragging) {
              startAnimation()
            }
          }, 10)
        }
      }
    })
  }, [isPaused, isDragging, x, animationDistance, animationDuration])
  
  // Pausar animação
  const pauseAnimation = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop()
      animationRef.current = null
    }
  }, [])
  
  // Controla animação baseado no estado de pausa e drag
  useEffect(() => {
    if (!isPaused && !isDragging) {
      const timer = setTimeout(() => {
        startAnimation()
      }, 100)
      return () => {
        clearTimeout(timer)
        pauseAnimation()
      }
    } else {
      pauseAnimation()
    }
  }, [isPaused, isDragging, startAnimation, pauseAnimation])

  // Listener global para detectar quando soltamos o mouse/touch fora do elemento
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        setIsPaused(false) // Também remove a pausa para retomar a animação
        // Normaliza antes de retomar a animação
        const currentX = x.get()
        const normalizedX = normalizePosition(currentX)
        x.set(normalizedX)
        // Atualiza dragStartX para o próximo drag começar da posição atual
        dragStartX.current = normalizedX
      }
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false)
        setIsPaused(false) // Também remove a pausa para retomar a animação
        // Normaliza antes de retomar a animação
        const currentX = x.get()
        const normalizedX = normalizePosition(currentX)
        x.set(normalizedX)
        // Atualiza dragStartX para o próximo drag começar da posição atual
        dragStartX.current = normalizedX
      }
    }

    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, x])

  return (
    <section className="relative py-16 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-6 text-center">

        {/* TAG */}
        <div className="inline-flex items-center gap-2 py-2 px-5 bg-gradient-to-r from-blue-500 to-yellow-400 text-black font-semibold rounded-full shadow-lg mb-10">
          <Sparkles className="w-4 h-4 text-black" />
          {t("tag")}
        </div>

        {/* TÍTULO */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-12">
          {t("title")} <span className="text-blue-600">{t("titleHighlight")}</span>
        </h2>

        {/* CARROSSEL */}
        <div 
          className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            if (!isDragging) {
              setIsPaused(false)
            }
          }}
        >
          {/* Gradiente esquerdo - fade out */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none
            bg-gradient-to-r from-gray-50 dark:from-gray-900 to-transparent"
          />
          
          {/* Gradiente direito - fade out */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none
            bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent"
          />
          
          <motion.div
            className="flex gap-16"
            drag="x"
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => {
              // Armazena a posição inicial do drag
              dragStartX.current = x.get()
              setIsDragging(true)
              setIsPaused(true)
              pauseAnimation()
            }}
            onDrag={(event, info) => {
              // Usa a posição inicial + o offset para manter continuidade entre múltiplos arrastos
              const newX = dragStartX.current + info.offset.x
              const normalizedX = normalizePosition(newX)
              x.set(normalizedX)
            }}
            onDragEnd={(event, info) => {
              setIsDragging(false)
              // Normaliza antes de retomar a animação
              const currentX = x.get()
              const normalizedX = normalizePosition(currentX)
              x.set(normalizedX)
              // Atualiza dragStartX para o próximo drag começar da posição atual
              dragStartX.current = normalizedX
            }}
            style={{
              width: "max-content",
              x: x
            }}
            dragConstraints={false}
          >
            {duplicatedLogos.map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="flex items-center justify-center flex-shrink-0 w-40 h-24 bg-white dark:bg-gray-800 shadow-md rounded-xl p-4"
              >
                <Image
                  src={logo.image}
                  alt={logo.name}
                  width={120}
                  height={60}
                  className="object-contain pointer-events-none select-none"
                  unoptimized
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

    </section>
  )
}

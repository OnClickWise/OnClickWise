"use client"

import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  variant?: 'full' | 'icon'
}

export function Logo({ className = '', width, height, variant = 'full' }: LogoProps) {
  // Se for apenas o ícone, retorna só o favicon
  if (variant === 'icon') {
    return (
      <Image
        src="/logo-favicon.png"
        alt="OnClickWise"
        width={width || 40}
        height={height || 40}
        className={className}
        priority
      />
    )
  }

  // Logo completa
  return (
    <Image
      src="/logo.png"
      alt="OnClickWise"
      width={width ||200}
      height={height || 60}
      className={className}
      priority
    />
  )
}


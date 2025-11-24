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

  // Logo completa - muda baseado no tema (light/dark)
  // Se height for 0, calcula altura proporcional (assumindo proporção ~3.33:1 baseada em 200x60)
  const defaultWidth = width || 200;
  const defaultHeight = height || 60;
  const calculatedHeight = height === 0 ? Math.round(defaultWidth / (200 / 60)) : defaultHeight;
  const imageStyle = height === 0 ? { height: 'auto' } : undefined;
  
  return (
    <>
      <Image
        src="/light-logo.png"
        alt="OnClickWise"
        width={defaultWidth}
        height={calculatedHeight}
        style={imageStyle}
        className={`${className} block dark:hidden`}
        priority
      />
      <Image
        src="/darck-logo.png"
        alt="OnClickWise"
        width={defaultWidth}
        height={calculatedHeight}
        style={imageStyle}
        className={`${className} hidden dark:block`}
        priority
      />
    </>
  )
}


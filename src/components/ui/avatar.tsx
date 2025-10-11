"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full text-muted-foreground font-medium",
        className
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  )
}

// Componente UserAvatar com fallback automático
interface UserAvatarProps {
  src?: string
  name?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

function UserAvatar({ src, name = "User", className, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "size-6",
    md: "size-8", 
    lg: "size-12",
    xl: "size-16"
  }
  
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg", 
    xl: "text-xl"
  }

  const fallbackText = name ? name.charAt(0).toUpperCase() : "?"

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className={textSizeClasses[size]}>
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  )
}

// Componente OrganizationAvatar com fallback automático
interface OrganizationAvatarProps {
  src?: string
  name?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

function OrganizationAvatar({ src, name = "Organization", className, size = "md" }: OrganizationAvatarProps) {
  const sizeClasses = {
    sm: "size-6",
    md: "size-8",
    lg: "size-12", 
    xl: "size-16"
  }
  
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-xl"
  }

  const fallbackText = name ? name.charAt(0).toUpperCase() : "?"

  return (
    <Avatar className={cn(sizeClasses[size], "rounded-lg", className)}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className={cn(textSizeClasses[size], "rounded-lg bg-primary text-primary-foreground")}>
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar, OrganizationAvatar }

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

  // Generate consistent avatar with same colors as generateAvatar function
  const generateConsistentAvatar = (name: string) => {
    if (!name) return '';
    
    const firstLetter = name.charAt(0).toUpperCase();
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    const colorIndex = name.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${backgroundColor}"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${firstLetter}</text>
      </svg>
    `)}`;
  };

  return (
    <Avatar className={cn(sizeClasses[size], "rounded-full", className)}>
      <AvatarImage src={src || undefined} alt={name} className="rounded-full" />
      <AvatarFallback 
        className={cn(textSizeClasses[size], "bg-transparent")}
        style={{ 
          backgroundImage: `url(${generateConsistentAvatar(name)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
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

  // Generate consistent organization logo with same colors as generateOrgLogo function
  const generateConsistentOrgLogo = (name: string) => {
    if (!name) return '';
    
    const firstLetter = name.charAt(0).toUpperCase();
    const colors = [
      '#3B82F6', '#1E40AF', '#2563EB', '#1D4ED8', '#1E3A8A',
      '#3730A3', '#4C1D95', '#581C87', '#6B21A8', '#7C2D12'
    ];
    
    const colorIndex = name.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="${backgroundColor}"/>
        <text x="16" y="22" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${firstLetter}</text>
      </svg>
    `)}`;
  };

  return (
    <Avatar className={cn(sizeClasses[size], "rounded-full", className)}>
      <AvatarImage src={src || undefined} alt={name} className="rounded-full" />
      <AvatarFallback 
        className={cn(textSizeClasses[size], "rounded-full bg-transparent")}
        style={{ 
          backgroundImage: `url(${generateConsistentOrgLogo(name)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
      </AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback, UserAvatar, OrganizationAvatar }

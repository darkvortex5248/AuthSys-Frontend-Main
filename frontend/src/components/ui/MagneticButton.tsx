'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const magneticButtonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
    "cursor-pointer select-none text-sm font-semibold tracking-wide whitespace-nowrap",
    "rounded-[12px] border border-transparent bg-clip-padding",
    "transition-[background-color,box-shadow] duration-200 ease-out",
    "outline-none",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:ring-[3px] focus-visible:ring-ring/20",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-primary-foreground",
          "shadow-md shadow-primary/15",
          "hover:brightness-105 hover:shadow-md hover:shadow-primary/20",
        ].join(" "),
        outline: [
          "border border-border/60 bg-background/80 text-foreground backdrop-blur-sm",
          "shadow-sm hover:bg-muted/80",
        ].join(" "),
        ghost: [
          "bg-transparent text-muted-foreground",
          "hover:bg-muted/80 hover:text-foreground",
        ].join(" "),
        glow: [
          "bg-primary text-primary-foreground",
          "shadow-lg shadow-primary/45",
          "hover:shadow-xl hover:shadow-primary/55 hover:brightness-105",
        ].join(" "),
      },
      size: {
        sm: "h-7 px-3 gap-1.5 rounded-[12px]",
        default: "h-8 px-4 gap-2 rounded-[12px]",
        lg: "h-9 px-6 gap-2.5 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

interface Props {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'glow'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
}

export default function MagneticButton({
  children,
  className = '',
  onClick,
  variant = 'primary',
  size = 'default',
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={cn(magneticButtonVariants({ variant, size }), className)}
    >
      {children}
    </button>
  )
}

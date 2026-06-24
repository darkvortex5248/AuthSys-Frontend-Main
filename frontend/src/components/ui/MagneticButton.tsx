'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'glow'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  strength?: number
}

export default function MagneticButton({
  children,
  className = '',
  onClick,
  variant = 'primary',
  size = 'default',
  disabled = false,
  strength = 0.15,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const rafRef = useRef<number | null>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    const el = ref.current
    if (!el) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      setPos({ x: x * strength, y: y * strength })
    })
  }, [disabled, strength])

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setIsHovered(true)
  }, [disabled])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setPos({ x: 0, y: 0 })
  }, [])

  const baseStyle: React.CSSProperties = {
    transform: `translate(${pos.x}px, ${pos.y}px) scale(${isHovered ? 1.04 : 1})`,
    transition: isHovered
      ? 'transform 0.08s ease-out, box-shadow 0.2s ease'
      : 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
  }

  const variantClasses = {
    primary: [
      'bg-primary text-primary-foreground',
      'shadow-md shadow-primary/25',
      'hover:shadow-lg hover:shadow-primary/35',
    ].join(' '),
    outline: [
      'border border-border/70 bg-background/80 text-foreground backdrop-blur-sm',
      'shadow-sm hover:shadow-md hover:border-border',
    ].join(' '),
    ghost: [
      'text-foreground',
      'hover:bg-muted/70',
    ].join(' '),
    glow: [
      'bg-primary text-primary-foreground',
      'shadow-lg shadow-primary/40',
      'hover:shadow-xl hover:shadow-primary/55',
    ].join(' '),
  }

  const sizeClasses = {
    sm: 'h-7 px-3 text-sm gap-1.5 rounded-[12px]',
    default: 'h-8 px-4 text-sm gap-2 rounded-[12px]',
    lg: 'h-9 px-6 text-base gap-2.5 rounded-[12px]',
  }

  return (
    <button
      ref={ref}
      type="button"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      style={baseStyle}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden',
        'font-semibold tracking-wide whitespace-nowrap select-none',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:pointer-events-none disabled:opacity-40',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:bg-gradient-to-r before:from-transparent before:via-white/12 before:to-transparent',
        'before:transition-transform before:duration-500',
        'hover:before:translate-x-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  )
}

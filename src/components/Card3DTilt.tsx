'use client'

import { useRef, useCallback } from 'react'

interface Card3DTiltProps {
  children: React.ReactNode
  className?: string
  maxTilt?: number
  perspective?: number
}

export default function Card3DTilt({
  children,
  className = '',
  maxTilt = 8,
  perspective = 800,
}: Card3DTiltProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const rotateX = (y - 0.5) * -maxTilt
      const rotateY = (x - 0.5) * maxTilt
      el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      el.style.transition = 'transform 0.08s ease-out'
    },
    [maxTilt, perspective]
  )

  const handleMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`
    el.style.transition = 'transform 0.4s ease-out'
  }, [perspective])

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}

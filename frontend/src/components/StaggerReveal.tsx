'use client'

import { useEffect, useRef, useState } from 'react'

interface StaggerRevealProps {
  children: React.ReactNode
  baseDelay?: number
  className?: string
}

export default function StaggerReveal({
  children,
  baseDelay = 30,
  className = '',
}: StaggerRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || !ref.current) return

    const items = ref.current.querySelectorAll<HTMLElement>('[data-stagger]')
    items.forEach((item, i) => {
      // Use GPU-accelerated properties for smooth 60 FPS animations
      item.style.opacity = '0'
      item.style.transform = 'translateY(20px)'
      item.style.willChange = 'transform, opacity'
      item.style.animation = `stagger-fade-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${i * baseDelay}ms both`
    })
  }, [isVisible, baseDelay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

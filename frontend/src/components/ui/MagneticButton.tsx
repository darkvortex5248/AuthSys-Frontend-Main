'use client'

import { useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'primary' | 'outline'
}

export default function MagneticButton({ 
  children, 
  className = '',
  onClick,
  variant = 'primary'
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setPos({ x: x * 0.15, y: y * 0.15 })
  }

  const handleMouseEnter = () => setIsHovered(true)

  const handleMouseLeave = () => {
    setIsHovered(false)
    setPos({ x: 0, y: 0 })
  }

  const baseStyle = {
    transform: `translate(${pos.x}px, ${pos.y}px) scale(${isHovered ? 1.03 : 1})`,
    transition: isHovered
      ? 'transform 0.1s ease-out, background 0.2s ease, box-shadow 0.2s ease'
      : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease',
  }

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={baseStyle}
      className={className}
    >
      {children}
    </button>
  )
}

'use client'

import { useCallback, useRef } from 'react'

export function useScrollAnimation() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    // Disconnect any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { 
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px'
      }
    )

    observerRef.current = observer

    // Observe all children with data-animate
    const elements = node.querySelectorAll('[data-animate]')
    elements.forEach((el) => observer.observe(el))

    // Safety fallback: reveal elements in initial viewport after a brief delay
    const timer = setTimeout(() => {
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('animate-in')
        }
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return callbackRef
}

